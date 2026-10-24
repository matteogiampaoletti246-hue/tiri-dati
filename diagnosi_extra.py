#!/usr/bin/env python3
"""Diagnosi: allenatore (foto/nazionalita), arbitro delle partite future, mappa dei tiri. Scrive diag_extra.json."""
import json, sys, time, urllib.parse
from update_data import api, find_league, WANTED, PAUSE, KEY
from update_angoli import season_of


def cut(o, n=1800):
    return json.dumps(o, ensure_ascii=False)[:n]


def main():
    if not KEY:
        sys.exit("Manca PITCHAPI_KEY")
    out = {}
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    key, cc, rx, ex = WANTED[0]
    lg = find_league(leagues, cc, rx, ex)[0]
    q = urllib.parse.quote(season_of(lg), safe="")
    ms = (api(f"/v1/leagues/{lg['id']}/matches?season={q}") or {}).get("matches", [])
    fin = [m for m in ms if m.get("status") == "finished"][-1:]
    fut = [m for m in ms if m.get("status") != "finished"][:6]
    out["partita_finita"] = cut(fin[0] if fin else None)
    if fin:
        mid = fin[0]["id"]
        lu = api(f"/v1/matches/{mid}/lineups"); time.sleep(PAUSE)
        out["coach_raw"] = cut({s: (lu or {}).get(s, {}).get("coach") for s in ("home", "away")})
        out["starter_raw"] = cut(((lu or {}).get("home") or {}).get("starters", [None])[:1])
        pl = api(f"/v1/matches/{mid}/players"); time.sleep(PAUSE)
        lst = pl.get("players") if isinstance(pl, dict) else pl
        out["player_raw"] = cut(((lst or [{}])[0].get("player")))
        for p in ("/shots", "/shotmap", "/shot-map", "/xg", "/shots/map", "/heatmap"):
            try:
                r = api(f"/v1/matches/{mid}{p}")
                out["sonda" + p] = cut(r, 700) if r is not None else "non esiste"
            except Exception as e:
                out["sonda" + p] = "errore " + str(e)[:80]
            time.sleep(PAUSE)
    out["future_arbitri"] = []
    for m in fut:
        try:
            det = api(f"/v1/matches/{m['id']}") or {}
        except Exception as e:
            det = {"errore": str(e)[:80]}
        out["future_arbitri"].append({"partita": m["home_team"]["name"] + " - " + m["away_team"]["name"], "data": m.get("date"), "referee_lista": m.get("referee"), "referee_dettaglio": det.get("referee")})
        time.sleep(PAUSE)
    json.dump(out, open("diag_extra.json", "w"), ensure_ascii=False, indent=1)
    print("scritto diag_extra.json")


if __name__ == "__main__":
    main()
