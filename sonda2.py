#!/usr/bin/env python3
"""Sonda 2: struttura delle risposte FotMob/ESPN per costruire l'archivio. Scrive sonda2.json."""
import json, gzip, urllib.request, time
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*", "Accept-Language": "en-US,en;q=0.9"}
OUT = {}

def raw(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40)
        b = r.read()
        if b[:2] == b"\x1f\x8b":
            b = gzip.decompress(b)
        return json.loads(b)
    except Exception as e:
        return {"__err": str(e)[:200]}

def shape(o, d=0, maxd=3):
    if isinstance(o, dict):
        if d >= maxd: return "{...%d}" % len(o)
        return {k: shape(v, d + 1, maxd) for k, v in list(o.items())[:30]}
    if isinstance(o, list):
        return [shape(o[0], d + 1, maxd), "len=%d" % len(o)] if o else []
    return o if not isinstance(o, str) else o[:80]

def main():
    for name, url in [("allLeagues_a", "https://www.fotmob.com/api/data/allLeagues?locale=en&country=ITA"), ("allLeagues_b", "https://www.fotmob.com/api/allLeagues?locale=en"), ("allLeagues_c", "https://www.fotmob.com/api/data/allLeagues?locale=en"), ("allLeagues_d", "https://www.fotmob.com/api/leagues?locale=en")]:
        j = raw(url); OUT[name] = shape(j, 0, 3) if "__err" not in j else j
    L = raw("https://www.fotmob.com/api/data/leagues?id=47&season=2015%2F2016&ccode3=ITA")
    OUT["league_keys"] = list(L.keys())
    OUT["details"] = shape(L.get("details"), 0, 2)
    OUT["table"] = shape(L.get("table"), 0, 6)
    OUT["fixtures_first"] = (L.get("fixtures") or {}).get("allMatches", [None])[0]
    OUT["fixtures_keys"] = list((L.get("fixtures") or {}).keys())
    OUT["stats"] = shape(L.get("stats"), 0, 3)
    OUT["stats_players_first3"] = ((L.get("stats") or {}).get("players") or [])[:3]
    OUT["stats_teams_first3"] = ((L.get("stats") or {}).get("teams") or [])[:3]
    OUT["seasonStatLinks"] = ((L.get("stats") or {}).get("seasonStatLinks") or [])[:3]
    OUT["playoff"] = shape(L.get("playoff"), 0, 3)
    OUT["overview_keys"] = list((L.get("overview") or {}).keys())
    # un file statistica (giocatori e squadre)
    pl = ((L.get("stats") or {}).get("players") or [])
    tm = ((L.get("stats") or {}).get("teams") or [])
    for tag, lst in (("player", pl[:2]), ("team", tm[:2])):
        for it in lst:
            u = it.get("fetchAllUrl") or it.get("fetchAll") or it.get("url")
            if u:
                j = raw(u); OUT["stat_" + tag + "_" + str(it.get("name"))] = shape(j, 0, 4)
                OUT["stat_" + tag + "_sample"] = json.dumps(j)[:1500]
            time.sleep(0.3)
    # tutti i nomi delle statistiche disponibili (stagione 2015/16 vs 2025/26)
    L2 = raw("https://www.fotmob.com/api/data/leagues?id=47&ccode3=ITA")
    OUT["stats_names_2526"] = {"players": [x.get("header") or x.get("name") for x in (L2.get("stats") or {}).get("players") or []], "teams": [x.get("header") or x.get("name") for x in (L2.get("stats") or {}).get("teams") or []]}
    OUT["stats_names_1516"] = {"players": [x.get("header") or x.get("name") for x in pl], "teams": [x.get("header") or x.get("name") for x in tm]}
    # una lega minore e una coppa nazionale
    for nm, i in (("arg", 112), ("fa_cup", 132), ("copa_lib", 42), ("ucl", 42)):
        j = raw("https://www.fotmob.com/api/data/leagues?id=%d&ccode3=ITA" % i)
        OUT["lg_" + nm] = {"nome": (j.get("details") or {}).get("name"), "paese": (j.get("details") or {}).get("country"), "tipo": (j.get("details") or {}).get("type"), "stats_players": len(((j.get("stats") or {}).get("players")) or []), "stats_teams": len(((j.get("stats") or {}).get("teams")) or []), "table_keys": list((j.get("table") or [{}])[0].keys()) if isinstance(j.get("table"), list) and j.get("table") else None, "partite": len((j.get("fixtures") or {}).get("allMatches") or [])}
    # team squad
    T = raw("https://www.fotmob.com/api/data/teams?id=8456&ccode3=ITA")
    OUT["team_keys"] = list(T.keys()); OUT["team_squad_shape"] = shape(T.get("squad"), 0, 4)
    # elenco competizioni: ESPN
    E = raw("https://sports.core.api.espn.com/v2/sports/soccer/leagues?limit=400")
    OUT["espn_items"] = [i.get("$ref", "").split("/leagues/")[-1].split("?")[0] for i in E.get("items", [])]
    json.dump(OUT, open("sonda2.json", "w"), ensure_ascii=False, indent=1)
    print("ok")

if __name__ == "__main__":
    main()
