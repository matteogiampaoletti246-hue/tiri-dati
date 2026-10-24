#!/usr/bin/env python3
"""Zone classifica (Champions/Europa/Conference/retrocessione, fasi coppe) da ESPN -> zone.json"""
import json, urllib.request
CODES = {"serie-a": "ita.1", "premier-league": "eng.1", "la-liga": "esp.1", "bundesliga": "ger.1", "ligue-1": "fra.1",
         "uefa.champions": "uefa.champions", "uefa.europa": "uefa.europa", "uefa.europa.conf": "uefa.europa.conf"}
out, raw = {}, {}
for k, c in CODES.items():
    try:
        req = urllib.request.Request("https://site.api.espn.com/apis/v2/sports/soccer/%s/standings" % c, headers={"User-Agent": "Mozilla/5.0"})
        j = json.load(urllib.request.urlopen(req, timeout=30))
    except Exception as e:
        print("ERR", k, e); continue
    gs = j.get("children") or [j]
    z = {}
    for g in gs:
        for e in (g.get("standings") or {}).get("entries", []):
            rk = next((s["value"] for s in e.get("stats", []) if s.get("name") == "rank"), None)
            n = e.get("note")
            if rk is not None and n:
                z[int(rk)] = [n.get("description"), n.get("color")]
    out[k] = {str(r): v for r, v in sorted(z.items())}
    print(k, len(gs), "gruppi", out[k])
json.dump(out, open("zone.json", "w"), ensure_ascii=False, indent=0)
