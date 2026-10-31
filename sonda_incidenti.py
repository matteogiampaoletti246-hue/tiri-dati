#!/usr/bin/env python3
"""Sonda: codici IT degli incidenti LiveScore (gol, assist, cartellini, cambi) su partite finite. Scrive sonda_incidenti.json."""
import json, time, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1"}
B = "https://prod-cdn-public-api.livescore.com/v1/api/app/"
def get(u):
    try:
        return json.loads(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read().decode())
    except Exception as e:
        return {"err": str(e)[:100]}
out = {"codici": {}, "esempi": []}
sc = get(B + "date/soccer/20260516/1?countryCode=GB&locale=en&MD=1")
evs = [x for s in sc.get("Stages", []) for x in s.get("Events", []) if x.get("Eps") == "FT"][:10]
out["n_ft"] = len(evs)
out["evento_ft"] = evs[0] if evs else None
for x in evs:
    inc = get(B + f"incidents/soccer/{x['Eid']}?locale=en")
    ln = get(B + f"lineups/soccer/{x['Eid']}?locale=en")
    out["esempi"].append({"Eid": x["Eid"], "T1": [t.get("Nm") for t in x.get("T1", [])], "T2": [t.get("Nm") for t in x.get("T2", [])], "Tr": [x.get("Tr1"), x.get("Tr2")], "inc": inc.get("Incs"), "subs_lineup": (ln.get("Subs") or [])[:1], "lu0": ((ln.get("Lu") or [{}])[0]) })
    time.sleep(0.5)
json.dump(out, open("sonda_incidenti.json", "w"), ensure_ascii=False)
