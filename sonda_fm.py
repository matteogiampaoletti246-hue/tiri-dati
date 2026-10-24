#!/usr/bin/env python3
import json, urllib.request, datetime
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40) as r:
        return json.loads(r.read().decode("utf-8", "replace"))
out = {}
for delta in (0, -1):
    d = (datetime.date.today() + datetime.timedelta(days=delta)).strftime("%Y%m%d")
    j = get("https://www.fotmob.com/api/data/matches?date=%s&timezone=Europe%%2FRome&ccode3=ITA" % d)
    ms = []
    for l in j.get("leagues") or []:
        if (l.get("primaryId") or l.get("id")) in (47, 55, 87, 54, 53):
            ms += l.get("matches") or []
    live = [m for m in ms if (m.get("status") or {}).get("started") and not (m["status"].get("finished"))]
    fin = [m for m in ms if (m.get("status") or {}).get("finished")]
    pick = (live or fin or [None])[0]
    if pick:
        k = "live" if live else "fin"
        if k in out: continue
        out[k] = get("https://www.fotmob.com/api/data/matchDetails?matchId=%s" % pick["id"])
        out[k + "_status"] = pick.get("status")
        out[k + "_name"] = pick.get("home", {}).get("name", "") + "-" + pick.get("away", {}).get("name", "")
json.dump(out, open("sonda_fm.json", "w"))
