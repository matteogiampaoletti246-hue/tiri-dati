#!/usr/bin/env python3
import json, gzip, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
def get(i):
    r = urllib.request.urlopen(urllib.request.Request("https://www.fotmob.com/api/data/matchDetails?matchId=%s" % i, headers=UA), timeout=40).read()
    try: r = gzip.decompress(r)
    except Exception: pass
    return json.loads(r)
json.dump({"full": get(3448908), "minor": get(3471586)}, open("diag_partita_raw.json", "w"), ensure_ascii=False, separators=(",", ":"))
