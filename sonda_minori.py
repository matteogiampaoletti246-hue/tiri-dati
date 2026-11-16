#!/usr/bin/env python3
"""Prova (16/11/2026): ricostruzione di minuti/gol/cartellini da formazioni ed eventi FotMob (partite.derive_players)."""
import json, gzip, urllib.request
from partite import compact
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
out = {}
for mid in ["4723409", "4813261"]:
    b = urllib.request.urlopen(urllib.request.Request("https://www.fotmob.com/api/data/matchDetails?matchId=" + mid, headers=UA), timeout=40).read()
    try: b = gzip.decompress(b)
    except Exception: pass
    j = json.loads(b); c = j["content"]
    names = {}
    for side in ("homeTeam", "awayTeam"):
        t = c["lineup"].get(side) or {}
        for x in (t.get("starters") or []) + (t.get("subs") or []): names[str(x.get("id"))] = x.get("name")
    subs = [[e.get("time"), [(s or {}).get("name") for s in e.get("swap") or []]] for e in c["matchFacts"]["events"]["events"] if e.get("type") == "Substitution"]
    goals = [[e.get("time"), (e.get("player") or {}).get("name"), e.get("assistStr"), e.get("assistPlayerId")] for e in c["matchFacts"]["events"]["events"] if e.get("type") == "Goal"]
    cp = compact(j)
    out[mid] = {"lu": cp.get("lu"), "subs": subs, "goals": goals, "p": {names.get(k, k): v for k, v in (cp.get("p") or {}).items()}}
print(json.dumps(out, indent=1, ensure_ascii=False))
