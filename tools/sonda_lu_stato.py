# Sonda: quali campi dice LiveScore sullo stato delle formazioni (probabili/ufficiali). Stampa solo chiavi e valori brevi, niente nomi.
import json, urllib.request, datetime
B = "https://prod-cdn-public-api.livescore.com/v1/api/app/"
def g(u):
    try:
        return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=20))
    except Exception as e:
        return None
def short(v):
    if isinstance(v, (dict, list)): return type(v).__name__ + str(len(v))
    return v
now = datetime.datetime.utcnow()
seen = 0
for dd in (0, 1):
    ymd = (now + datetime.timedelta(days=dd)).strftime("%Y%m%d")
    day = g(B + "date/soccer/" + ymd + "/1?countryCode=GB&locale=en&MD=1") or {}
    for st in day.get("Stages", []):
        for x in st.get("Events", []):
            ln = g(B + "lineups/soccer/" + str(x["Eid"]) + "?locale=en")
            if not ln or not ln.get("Lu"): continue
            print("EV", x.get("Eps"), x.get("Esd"), st.get("Snm"), {k: short(v) for k, v in ln.items()})
            for t in ln["Lu"]:
                print("  T", {k: short(v) for k, v in t.items() if k != "Ps"}, "Pskeys", sorted({k for p in t.get("Ps", []) for k in p}))
            seen += 1
            if seen >= 40: raise SystemExit
