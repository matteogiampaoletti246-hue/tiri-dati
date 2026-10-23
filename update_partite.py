#!/usr/bin/env python3
"""Partite dei top 5 campionati per la home dell'app -> partite.json
Contiene: partite dei prossimi giorni (orario, squadre, stemmi), classifiche (totale/casa/trasferta)
calcolate dai risultati e formazioni (probabili o ufficiali) delle partite dei prossimi 3 giorni.
Va nella stessa cartella di update_data.py (ne riusa le funzioni)."""
import json, os, sys, time, urllib.parse
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from update_data import api, find_league, WANTED, SEASON_START, PAUSE, KEY

ROME = ZoneInfo("Europe/Rome")
TOP5 = ["serie-a", "premier-league", "la-liga", "bundesliga", "ligue-1"]
DAYS = 8            # giorni di calendario mostrati
LINEUP_DAYS = 3     # formazioni solo per le partite dei prossimi N giorni
WINDOW_H = 3        # modalita' --formazioni: si aggiornano le partite che iniziano entro N ore
PHOTO_RETRY_DAYS = 7
FOTO_FILE, OUT_FILE = "foto.json", "partite.json"


def season_of(lg):
    return next((s for s in lg.get("seasons", []) if str(s).startswith(SEASON_START)), None)


def rome_day(iso):
    d = datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(ROME).strftime("%Y-%m-%d")


def tid(t):
    return t.get("id") or t["name"]


def table(matches, mode):
    rows = {}
    for m in matches:
        sh, sa = m.get("score_home"), m.get("score_away")
        if sh is None or sa is None or m.get("status") not in (None, "finished", "ft", "ended", "completed"):
            continue
        for side, gf, ga in (("home_team", sh, sa), ("away_team", sa, sh)):
            if (mode == "casa" and side != "home_team") or (mode == "trasf" and side != "away_team"):
                continue
            t = m[side]
            r = rows.setdefault(tid(t), {"n": t["name"], "l": t.get("image_url"), "g": 0, "gd": 0, "p": 0, "gf": 0})
            r["g"] += 1; r["gd"] += gf - ga; r["gf"] += gf
            r["p"] += 3 if gf > ga else (1 if gf == ga else 0)
    out = sorted(rows.values(), key=lambda r: (-r["p"], -r["gd"], -r["gf"], r["n"]))
    return [[r["n"], r["l"], r["g"], r["gd"], r["p"]] for r in out]


def side_lineup(s):
    if not s:
        return None
    def pl(x):
        return [x.get("name"), x.get("shirt_number"), x.get("pitch_x"), x.get("pitch_y"), 1 if x.get("is_captain") else 0, x.get("player_id")]
    return {"f": s.get("formation"), "c": bool(s.get("confirmed")), "co": (s.get("coach") or {}).get("name"),
            "s": [pl(x) for x in (s.get("starters") or [])], "b": [[x.get("name"), x.get("shirt_number"), x.get("player_id")] for x in (s.get("subs") or [])]}


def load(path, default):
    try:
        return json.load(open(path))
    except Exception:
        return default


def fetch_lineup(mid):
    try:
        j = api(f"/v1/matches/{mid}/lineups")
        time.sleep(PAUSE)
    except Exception as ex:
        print("formazione non letta per", mid, ex)
        return None
    if not j:
        return None
    h, a = side_lineup(j.get("home")), side_lineup(j.get("away"))
    return {"h": h, "a": a} if (h or a) else None


def all_confirmed(l):
    return bool(l) and all((l.get(s) is None) or l[s].get("c") for s in ("h", "a"))


def merge_lineup(old, new):
    """tiene la formazione ufficiale gia' salvata se la nuova non lo e'."""
    if not new:
        return old
    out = {}
    for s in ("h", "a"):
        o, n = (old or {}).get(s), new.get(s)
        out[s] = o if (o and o.get("c") and not (n and n.get("c"))) else (n or o)
    return out


def update_photos(lin_map, foto):
    """foto dei giocatori delle formazioni: una chiamata per giocatore, poi in cache (foto.json)."""
    today = datetime.now(timezone.utc).date()
    todo = set()
    for l in lin_map.values():
        for s in ("h", "a"):
            for pl in ((l.get(s) or {}).get("s") or []):
                pid = pl[5] if len(pl) > 5 else None
                if not pid:
                    continue
                e = foto.get(pid)
                if e is None:
                    todo.add(pid)
                elif not e.get("u") and (today - datetime.fromisoformat(e["d"]).date()).days >= PHOTO_RETRY_DAYS:
                    todo.add(pid)
    n = 0
    for pid in sorted(todo):
        try:
            d = api(f"/v1/players/{pid}") or {}
            time.sleep(PAUSE)
        except Exception as ex:
            print("foto non letta per", pid, ex)
            continue
        foto[pid] = {"u": d.get("image_url") or "", "d": today.isoformat()}
        n += 1
    print(f"Foto: {n} giocatori controllati, {sum(1 for v in foto.values() if v.get('u'))} con foto in archivio")


def photo_map(foto):
    return {k: v["u"] for k, v in foto.items() if v.get("u")}


def only_lineups():
    """Aggiorna solo le formazioni delle partite che iniziano entro WINDOW_H ore (e non sono gia' ufficiali)."""
    out = load(OUT_FILE, None)
    if not out or not out.get("matches"):
        print("partite.json non c'e' ancora: lancia prima 'Aggiorna partite'.")
        return
    foto = load(FOTO_FILE, {})
    now = datetime.now(timezone.utc)
    lin = out.setdefault("lin", {})
    n = 0
    for m in out["matches"]:
        if not m.get("t"):
            continue
        k = datetime.fromisoformat(m["t"].replace("Z", "+00:00"))
        if not (now - timedelta(hours=1) <= k <= now + timedelta(hours=WINDOW_H)):
            continue
        if all_confirmed(lin.get(m["id"])):
            continue
        new = fetch_lineup(m["id"])
        merged = merge_lineup(lin.get(m["id"]), new)
        if merged != lin.get(m["id"]):
            lin[m["id"]] = merged; n += 1
    print(f"Formazioni aggiornate: {n}")
    if not n:
        return
    update_photos({k: v for k, v in lin.items()}, foto)
    out["updated_at"] = now.isoformat(timespec="seconds")
    json.dump(foto, open(FOTO_FILE, "w"), ensure_ascii=False, separators=(",", ":"))
    json.dump(out, open(OUT_FILE, "w"), ensure_ascii=False, separators=(",", ":"))


def main():
    if not KEY:
        sys.exit("Manca la variabile PITCHAPI_KEY (segreto del repository).")
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    now = datetime.now(timezone.utc)
    today = now.astimezone(ROME).date()
    last = today + timedelta(days=DAYS)
    out = {"updated_at": now.isoformat(timespec="seconds"), "matches": [], "tab": {}, "lin": {}}
    shown = False
    for key, cc, rx, ex in WANTED:
        if key not in TOP5:
            continue
        lgs = find_league(leagues, cc, rx, ex)
        if not lgs:
            print("✘ campionato non trovato:", key); continue
        lg = lgs[0]
        season = season_of(lg)
        if not season:
            print("✘ senza stagione:", key); continue
        q = urllib.parse.quote(season, safe="")
        played = (api(f"/v1/leagues/{lg['id']}/matches?season={q}") or {}).get("matches", [])
        future = (api(f"/v1/leagues/{lg['id']}/matches?season={q}&status=upcoming") or {}).get("matches", [])
        if not shown and played:
            shown = True
            print("Esempio partita giocata (campi):", {k: played[0].get(k) for k in ("date", "time_utc", "status", "score_home", "score_away")})
        allm = {m["id"]: m for m in played + future}.values()
        out["tab"][key] = {mode: table(list(allm), mode) for mode in ("tot", "casa", "trasf")}
        n = 0
        for m in future:
            iso = m.get("time_utc") or m.get("date")
            if not iso:
                continue
            d = rome_day(iso)
            if not (str(today) <= d <= str(last)):
                continue
            out["matches"].append({"id": m["id"], "d": d, "t": m.get("time_utc"), "lg": key,
                                   "h": m["home_team"]["name"], "a": m["away_team"]["name"],
                                   "hl": m["home_team"].get("image_url"), "al": m["away_team"].get("image_url")})
            n += 1
        print(f"✔ {key}: {lg['name']} - classifica {len(out['tab'][key]['tot'])} squadre, {n} partite nei prossimi {DAYS} giorni")
    # formazioni: solo i prossimi giorni
    lim = today + timedelta(days=LINEUP_DAYS)
    got = 0
    old = load(OUT_FILE, {}).get("lin", {})
    for m in out["matches"]:
        if m["d"] > str(lim):
            continue
        if all_confirmed(old.get(m["id"])):
            out["lin"][m["id"]] = old[m["id"]]; got += 1
            continue
        merged = merge_lineup(old.get(m["id"]), fetch_lineup(m["id"]))
        if merged:
            out["lin"][m["id"]] = merged; got += 1
    foto = load(FOTO_FILE, {})
    update_photos(out["lin"], foto)
    json.dump(foto, open(FOTO_FILE, "w"), ensure_ascii=False, separators=(",", ":"))
    out["matches"].sort(key=lambda x: (x["d"], x["t"] or ""))
    json.dump(out, open(OUT_FILE, "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"Scritto partite.json - partite: {len(out['matches'])}, formazioni: {got}")


if __name__ == "__main__":
    if not KEY:
        sys.exit("Manca la variabile PITCHAPI_KEY (segreto del repository).")
    if "--formazioni" in sys.argv:
        only_lineups()
    else:
        main()
