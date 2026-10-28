#!/usr/bin/env python3
"""Rose dei campionati minori (extra) da FotMob -> rose.json
{nome squadra nell'app: {"id": id FotMob, "co": allenatore, "p": [[id, nome, ruolo(GK/DEF/MID/ATT), maglia, paese, eta, altezza, voto, gol, assist, infortunato], ...]}}
Lanciare ogni giorno: e' leggero (una chiamata per squadra)."""
import json, os, re, time, unicodedata, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*", "Accept-Language": "en-US,en;q=0.9"}
LEAGUES = {"eredivisie": 57, "super-lig": 71, "liga-portugal": 61, "pro-league": 40, "scottish-premiership": 64,
           "aut-bundesliga": 38, "nor-eliteserien": 59, "gre-super-league-1": 135}
# campionati maggiori: qui servono solo gli allenatori (la rosa completa arriva dagli altri file)
COACH_ONLY = {"serie-a": 55, "premier-league": 47, "la-liga": 87, "bundesliga": 54, "ligue-1": 53}
GRP = {"keepers": "GK", "defenders": "DEF", "midfielders": "MID", "attackers": "ATT"}
OUT = "rose.json"


def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.load(r)
        except Exception as e:
            print("  errore", url[-48:], str(e)[:80]); time.sleep(2 + i * 2)
    return None


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\b(fc|ac|as|sc|sk|fk|cf|cd|sv|kv|rsc|rc|ssc)\b", " ", re.sub(r"[^a-z0-9]+", " ", s)).strip()


def find_teams(o, out):
    if isinstance(o, dict):
        if isinstance(o.get("id"), int) and "name" in o and ("pageUrl" in o or "shortName" in o):
            out[o["id"]] = o["name"]
        for v in o.values():
            find_teams(v, out)
    elif isinstance(o, list):
        for v in o:
            find_teams(v, out)


def num(v):
    try:
        return float(v)
    except Exception:
        return None


def main():
    old = json.load(open(OUT)) if os.path.exists(OUT) else {}
    data = json.load(open("data.json")).get("leagues", {})
    names = {}   # campionato -> nomi delle squadre come li usa l'app
    for lg, L in data.items():
        for n in list((L.get("teams") or {})) + list((L.get("logos") or {})):
            names.setdefault(lg, set()).add(n)
    try:
        for m in json.load(open("partite.json")).get("matches") or []:
            names.setdefault(m.get("lg"), set()).update([m.get("h"), m.get("a")])
    except Exception:
        pass
    res = dict(old)
    for lg, lid in {**LEAGUES, **COACH_ONLY}.items():
        j = get("https://www.fotmob.com/api/data/leagues?id=%d&ccode3=ITA" % lid)
        teams = {}
        find_teams((j or {}).get("table") or j or {}, teams)
        mine = {norm(n): n for n in names.get(lg, set()) if n}
        print(lg, len(teams), "squadre")
        for tid, tname in teams.items():
            t = get("https://www.fotmob.com/api/data/teams?id=%d&ccode3=ITA" % tid)
            sq = ((t or {}).get("squad") or {}).get("squad")
            if not sq:
                continue
            key = mine.get(norm(tname))
            if not key:
                key = next((v for k, v in mine.items() if k and (k in norm(tname) or norm(tname) in k)), tname)
            rows, co = [], None
            for g in sq:
                t0 = g.get("title")
                if t0 == "coach":
                    co = (g.get("members") or [{}])[0].get("name")
                    continue
                if t0 not in GRP:
                    continue
                for m in g.get("members") or []:
                    rows.append([m.get("id"), m.get("name"), GRP[t0], m.get("shirtNumber"), m.get("cname"), m.get("age"), num(m.get("height")),
                                 num(m.get("rating")), m.get("goals") or 0, m.get("assists") or 0, 1 if m.get("injury") else 0])
            res[key] = {"id": tid, "co": co, "lg": lg, "p": [] if lg in COACH_ONLY else rows}
            time.sleep(0.3)
    json.dump(res, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print("scritto", len(res), "squadre")


if __name__ == "__main__":
    main()
