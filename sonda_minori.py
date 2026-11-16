#!/usr/bin/env python3
"""Prova (16/11/2026): partite.compact su una partita per ogni competizione che in partite/ era tutta vuota."""
import json, gzip, urllib.request, time
from partite import compact
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
res = []
for lid, name, cn, mid in [x for x in json.load(open("sonda_minori_ids.json")) if x[0] in ("173","151","164","186","198","219","278","9490","10200","10609")]:
    try:
        b = urllib.request.urlopen(urllib.request.Request("https://www.fotmob.com/api/data/matchDetails?matchId=" + mid, headers=UA), timeout=40).read()
        try: b = gzip.decompress(b)
        except Exception: pass
        j = json.loads(b)
        cp = compact(j)
        P = cp.get("p") or {}
        res.append([lid, name, cn, mid, sorted(cp.keys()), cp.get("lu"), len(P), sum((v.get("minutes_played") or 0) for v in P.values()), sum(v.get("goals", 0) for v in P.values()), j.get("header", {}).get("status", {}).get("scoreStr")])
    except Exception as e:
        res.append([lid, name, cn, mid, "ERR " + repr(e)])
    time.sleep(0.3)
for r in res: print(json.dumps(r, ensure_ascii=False))
