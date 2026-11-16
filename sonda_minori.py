#!/usr/bin/env python3
"""Prova (16/11/2026): cosa da' FotMob matchDetails dai server GitHub per partite di campionati minori salvate vuote in partite/."""
import json, gzip, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
out = {}
for mid in ["4723409", "4813261", "4723410"]:
    try:
        r = urllib.request.urlopen(urllib.request.Request("https://www.fotmob.com/api/data/matchDetails?matchId=" + mid, headers=UA), timeout=40)
        b = r.read()
        try: b = gzip.decompress(b)
        except Exception: pass
        j = json.loads(b); c = j.get("content") or {}
        lu = c.get("lineup") or {}
        out[mid] = {"code": r.status, "keys": list(c.keys()), "lineupType": lu.get("lineupType"), "home11": len((lu.get("homeTeam") or {}).get("starters") or []),
                    "playerStats": len(c.get("playerStats") or {}), "events": len((((c.get("matchFacts") or {}).get("events") or {}).get("events")) or [])}
    except Exception as e:
        out[mid] = {"err": str(e), "code": getattr(e, "code", None)}
json.dump(out, open("diag_minori.json", "w"), indent=1)
print(json.dumps(out, indent=1))
