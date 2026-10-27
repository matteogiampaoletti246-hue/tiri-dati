#!/usr/bin/env python3
"""Sonda: quanto è disponibile e quanto pesa il dettaglio partita (matchDetails) per partite vecchie e di campionati minori."""
import json, gzip, os, time, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
def get(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
        try: r = gzip.decompress(r)
        except Exception: pass
        return json.loads(r), len(r)
    except Exception as e:
        return None, str(e)[:80]
ix = json.load(open("arch/index.json"))
def lid_of(name, c=None):
    for k, v in ix.items():
        if v["n"] == name and (c is None or v["c"] == c): return k
pick = []
serieA = lid_of("Serie A", "ITA")
for s in ("2011-2012", "2015-2016", "2019-2020", "2023-2024"):
    pick.append((serieA, s))
pick.append((lid_of("Primera A", "COL"), "2021 - Apertura"))
for c in ("BLR", "ARM", "CAN"):
    k = lid_of("Premier League", c)
    if k: pick.append((k, ix[k]["s"][min(6, len(ix[k]["s"]) - 1)]))
out = []
for lid, s in pick:
    p = "arch/%s/%s.json" % (lid, s.replace("/", "-"))
    if not os.path.exists(p): continue
    fx = [m for m in json.load(open(p))["fix"] if m[6]]
    for m in (fx[len(fx) // 3], fx[-1]):
        j, n = get("https://www.fotmob.com/api/data/matchDetails?matchId=%s" % m[0])
        row = {"lega": ix[lid]["n"] + " " + ix[lid]["c"], "stagione": s, "id": m[0], "ok": j is not None, "bytes": n}
        if j:
            c = j.get("content") or {}
            row["content"] = {k: (len(json.dumps(v)) if v else 0) for k, v in c.items()}
            st = c.get("stats") or {}
            per = st.get("Periods") or {}
            allp = (per.get("All") or {}).get("stats") or []
            row["n_stat_groups"] = len(allp)
            row["n_stat_items"] = sum(len(g.get("stats") or []) for g in allp)
            row["stat_titles"] = [x.get("title") for g in allp[:1] for x in (g.get("stats") or [])][:6]
            lu = c.get("lineup") or {}
            row["lineup_players_home"] = len((lu.get("homeTeam") or {}).get("starters") or []) if isinstance(lu, dict) else 0
            row["n_playerStats"] = len(c.get("playerStats") or {})
            row["n_shots"] = len((c.get("shotmap") or {}).get("shots") or [])
            row["n_events"] = len(((c.get("matchFacts") or {}).get("events") or {}).get("events") or [])
            row["general_keys"] = list((j.get("general") or {}).keys())[:12]
            row["gz_all"] = len(gzip.compress(json.dumps(j, separators=(",", ":")).encode()))
        out.append(row)
        time.sleep(0.5)
json.dump(out, open("diag_partita.json", "w"), ensure_ascii=False, indent=1)
