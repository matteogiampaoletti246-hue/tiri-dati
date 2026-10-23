#!/usr/bin/env python3
"""Diagnosi: quali statistiche per giocatore e per squadra fornisce PitchAPI. Scrive diag.json (poche chiamate)."""
import json, sys, time, urllib.parse
from update_data import api, find_league, WANTED, PAUSE, KEY
from update_angoli import season_of


def keys_of(groups):
    out = {}
    for g in groups or []:
        for k, e in (g.get("stats") or {}).items():
            if isinstance(e, dict):
                out[e.get("key") or k] = {"titolo": e.get("title") or e.get("label"), "valore": (e.get("stat") or {}).get("value")}
    return out


def main():
    if not KEY:
        sys.exit("Manca PITCHAPI_KEY")
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    key, cc, rx, ex = WANTED[0]
    lg = find_league(leagues, cc, rx, ex)[0]
    q = urllib.parse.quote(season_of(lg), safe="")
    played = (api(f"/v1/leagues/{lg['id']}/matches?season={q}") or {}).get("matches", [])
    played = [m for m in played if m.get("status") == "finished"][-3:]
    d = {"lega": lg["name"], "partite": []}
    for m in played:
        mid = m["id"]
        e = {"id": mid, "match": m["home_team"]["name"] + " - " + m["away_team"]["name"]}
        pl = api(f"/v1/matches/{mid}/players"); time.sleep(PAUSE)
        lst = pl.get("players") if isinstance(pl, dict) else pl
        e["n_giocatori"] = len(lst or [])
        allk = {}
        for x in lst or []:
            for k, v in keys_of(x.get("stats")).items():
                allk.setdefault(k, v)
        e["chiavi_giocatore"] = allk
        e["campi_giocatore"] = sorted((lst or [{}])[0].keys())
        h = api(f"/v1/matches/{mid}/players/halves"); time.sleep(PAUSE)
        e["halves_campi"] = sorted((((h or {}).get("players") or [{}])[0]).keys()) if h else None
        s = api(f"/v1/matches/{mid}/stats"); time.sleep(PAUSE)
        it = {}
        for per in (s or {}).get("periods") or []:
            if str(per.get("period")) == "All":
                for g in per.get("groups", []):
                    for i in g.get("items", []):
                        it[i.get("key")] = i.get("title")
        e["chiavi_squadra"] = it
        sond = {}
        for path in ("", "/events", "/timeline", "/incidents", "/cards", "/summary"):
            try:
                r = api(f"/v1/matches/{mid}{path}"); time.sleep(PAUSE)
            except Exception as ex:
                sond[path or "/"] = "errore " + str(ex)[:80]; continue
            if r is None:
                sond[path or "/"] = "non esiste"; continue
            txt = json.dumps(r, ensure_ascii=False)
            i = txt.lower().find("yellow")
            sond[path or "/"] = {"tipo": type(r).__name__, "campi": sorted(r.keys()) if isinstance(r, dict) else None,
                                 "lunghezza": len(txt), "intorno_a_yellow": txt[max(0, i - 200):i + 300] if i >= 0 else None}
        e["sonde"] = sond
        d["partite"].append(e)
    json.dump(d, open("diag.json", "w"), ensure_ascii=False, indent=1)
    print("Scritto diag.json:", {p["match"]: len(p["chiavi_giocatore"]) for p in d["partite"]})


if __name__ == "__main__":
    main()
