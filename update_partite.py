#!/usr/bin/env python3
"""Partite dei top 5 campionati per la home dell'app -> partite.json
Contiene: partite dei prossimi giorni (orario, squadre, stemmi), classifiche (totale/casa/trasferta)
calcolate dai risultati e formazioni (probabili o ufficiali) delle partite dei prossimi 3 giorni.
Va nella stessa cartella di update_data.py (ne riusa le funzioni)."""
import json, sys, time, urllib.parse
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from update_data import api, find_league, WANTED, SEASON_START, PAUSE, KEY

ROME = ZoneInfo("Europe/Rome")
TOP5 = ["serie-a", "premier-league", "la-liga", "bundesliga", "ligue-1"]
DAYS = 8            # giorni di calendario mostrati
LINEUP_DAYS = 3     # formazioni solo per le partite dei prossimi N giorni


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
        return [x.get("name"), x.get("shirt_number"), x.get("pitch_x"), x.get("pitch_y"), 1 if x.get("is_captain") else 0]
    return {"f": s.get("formation"), "c": bool(s.get("confirmed")), "co": (s.get("coach") or {}).get("name"),
            "s": [pl(x) for x in (s.get("starters") or [])], "b": [[x.get("name"), x.get("shirt_number")] for x in (s.get("subs") or [])]}


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
    for m in out["matches"]:
        if m["d"] > str(lim):
            continue
        try:
            j = api(f"/v1/matches/{m['id']}/lineups")
            time.sleep(PAUSE)
        except Exception as ex:
            print("formazione non letta per", m["id"], ex); continue
        if not j:
            continue
        h, a = side_lineup(j.get("home")), side_lineup(j.get("away"))
        if h or a:
            out["lin"][m["id"]] = {"h": h, "a": a}; got += 1
    out["matches"].sort(key=lambda x: (x["d"], x["t"] or ""))
    json.dump(out, open("partite.json", "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"Scritto partite.json - partite: {len(out['matches'])}, formazioni: {got}")


if __name__ == "__main__":
    main()
