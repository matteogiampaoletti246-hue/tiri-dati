#!/usr/bin/env python3
"""Partite dei campionati extra (solo Home): finestra -8/+8 giorni -> partite_extra.json.
m = [matchId, fotmobLeagueId, utc, casa, trasferta, idCasa, idTrasf, golC, golT, stato(n|l|f)]"""
import json, gzip, time, datetime, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
LEGHE = [57, 71, 61, 40, 64, 38, 59, 135]
def get(url):
    for k in range(3):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
            try: r = gzip.decompress(r)
            except Exception: pass
            return json.loads(r)
        except Exception:
            time.sleep(2 * (k + 1))
    return None
now = datetime.datetime.now(datetime.timezone.utc)
lo, hi = now - datetime.timedelta(days=9), now + datetime.timedelta(days=9)
out, ok = [], 0
for lid in LEGHE:
    d = get("https://www.fotmob.com/api/data/leagues?id=%s&tab=fixtures" % lid)
    if not d: continue
    allm = ((d.get("fixtures") or {}).get("allMatches")) or []
    if not allm: continue
    ok += 1
    for x in allm:
        s = x.get("status") or {}
        t = s.get("utcTime")
        if not t or s.get("cancelled"): continue
        try: dt = datetime.datetime.fromisoformat(t.replace("Z", "+00:00"))
        except Exception: continue
        if not (lo <= dt <= hi): continue
        h, a = x.get("home") or {}, x.get("away") or {}
        sc = s.get("scoreStr") or ""
        try: gh, ga = [int(v) for v in sc.replace(" ", "").split("-")]
        except Exception: gh = ga = None
        st = "f" if s.get("finished") else ("l" if s.get("started") else "n")
        out.append([str(x.get("id")), lid, t, h.get("name"), a.get("name"), h.get("id"), a.get("id"), gh, ga, st])
print("leghe ok", ok, "partite", len(out))
if ok:
    json.dump({"updated_at": now.isoformat(), "m": out}, open("partite_extra.json", "w"), ensure_ascii=False, separators=(",", ":"))
