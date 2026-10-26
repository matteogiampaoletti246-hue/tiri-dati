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
CUPS = ["champions-league", "europa-league"]   # competizioni europee: calendario completo + partite dei prossimi giorni
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


def is_done(m):
    return m.get("score_home") is not None and m.get("score_away") is not None and m.get("status") in (None, "finished", "ft", "ended", "completed")


def forms(matches):
    """ultime 5 partite per squadra: stringa V/P/S dalla piu' vecchia alla piu' recente."""
    seq = {}
    for m in sorted([x for x in matches if is_done(x)], key=lambda x: str(x.get("date", ""))):
        sh, sa = m["score_home"], m["score_away"]
        for side, gf, ga in (("home_team", sh, sa), ("away_team", sa, sh)):
            seq.setdefault(m[side]["name"], []).append("V" if gf > ga else ("P" if gf == ga else "S"))
    return {k: "".join(v[-5:]) for k, v in seq.items()}


def team_results(matches):
    """tutte le partite della stagione per squadra: [data, avversario, 1 se in casa, gol fatti, gol subiti (None se da giocare)]."""
    out = {}
    for m in sorted(matches, key=lambda x: str(x.get("date", ""))):
        done = is_done(m)
        d = str(m.get("date", ""))[:10]
        for side, opp, home in (("home_team", "away_team", 1), ("away_team", "home_team", 0)):
            sh, sa = m.get("score_home"), m.get("score_away")
            gf, ga = (sh, sa) if home else (sa, sh)
            out.setdefault(m[side]["name"], []).append([d, m[opp]["name"], home, gf if done else None, ga if done else None])
    return out


def dominant_color(url):
    """colore principale dello stemma (hex) oppure None."""
    try:
        import io, urllib.request
        from PIL import Image
        raw = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "tiri-dati/1.0"}), timeout=30).read()
        im = Image.open(io.BytesIO(raw)).convert("RGBA").resize((48, 48))
    except Exception as ex:
        print("   colore non letto:", str(ex)[:80])
        return None
    cnt = {}
    for r, g, b, a in im.getdata():
        if a < 140 or max(r, g, b) < 40 or min(r, g, b) > 225 or max(r, g, b) - min(r, g, b) < 45:
            continue
        k = (r >> 4, g >> 4, b >> 4)
        cnt[k] = cnt.get(k, 0) + 1
    if not cnt:
        return None
    r, g, b = max(cnt, key=cnt.get)
    r, g, b = r * 16 + 8, g * 16 + 8, b * 16 + 8
    lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    if lum > 0.55:
        f = 0.55 / lum
        r, g, b = int(r * f), int(g * f), int(b * f)
    return "#%02x%02x%02x" % (r, g, b)


def table(matches, mode, fm=None):
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
    return [[r["n"], r["l"], r["g"], r["gd"], r["p"], (fm or {}).get(r["n"], "")] for r in out]


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
    res_all, logo_of = {}, {}
    for key, cc, rx, ex in WANTED:
        if key not in TOP5 and key not in CUPS:
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
        fm = forms(list(allm))
        if key in TOP5:
            out["tab"][key] = {mode: table(list(allm), mode, fm) for mode in ("tot", "casa", "trasf")}
        res_all[key] = team_results(list(allm))
        for m_ in allm:
            for s_ in ("home_team", "away_team"):
                if m_[s_].get("image_url"):
                    logo_of[m_[s_]["name"]] = m_[s_]["image_url"]
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
        print(f"✔ {key}: {lg['name']} - {n} partite nei prossimi {DAYS} giorni, calendario futuro {len(future)} partite")
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
    # squadre: risultati e calendario di stagione + colore principale dello stemma
    col = load("teams.json", {}).get("col", {})
    for name, url in logo_of.items():
        if name not in col:
            c = dominant_color(url)
            if c:
                col[name] = c
    json.dump({"updated_at": out["updated_at"], "res": res_all, "col": col}, open("teams.json", "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"Scritto teams.json - squadre con colore: {len(col)}/{len(logo_of)}")
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
