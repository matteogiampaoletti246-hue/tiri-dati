# Sonda: quali campi immagine danno LiveScore, diretta.it ed ESPN per i giocatori. Stampa solo chiavi e un esempio di campo immagine.
import json, re, sys, os, urllib.request, datetime
sys.path.insert(0, os.getcwd())
import giocatori_diretta as D
UA = {"User-Agent": "Mozilla/5.0"}
def g(u, h=UA):
    try: return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=25))
    except Exception as e: print("ERR", u[:80], e); return None
img = lambda d: {k: v for k, v in d.items() if isinstance(v, (str, dict, list)) and re.search(r"img|image|photo|pic|head|ph$|logo", k, re.I)}
# LiveScore
B = "https://prod-cdn-public-api.livescore.com/v1/api/app/"
ymd = datetime.datetime.utcnow().strftime("%Y%m%d")
day = g(B + "date/soccer/" + ymd + "/1?countryCode=GB&locale=en&MD=1") or {}
n = 0
for st in day.get("Stages", []):
    for x in st.get("Events", []):
        ln = g(B + "lineups/soccer/" + str(x["Eid"]) + "?locale=en")
        if not ln or not ln.get("Lu"): continue
        p = (ln["Lu"][0].get("Ps") or [{}])[0]
        print("LS Ps keys", sorted(p.keys()), "img", img(p)); n += 1
        if n >= 2: break
    if n >= 2: break
# LiveScore pagina giocatore? (Pid)
# diretta: lineup GraphQL di una partita di ieri
ts = int((datetime.datetime.utcnow() - datetime.timedelta(days=1)).replace(hour=15, minute=0, second=0).timestamp())
segs = D.day_segments(ts) or {}
k = 0
for t0, cands in segs.items():
    for c in cands:
        mid = c.get("AA")
        if not mid: continue
        lj = D.get(D.GQL + "dlie2&eventId=" + mid, D.GQL_H, js=True)
        eps = (((lj or {}).get("data") or {}).get("findEventById") or {}).get("eventParticipants") or []
        for ep in eps:
            pl = ((ep.get("lineup") or {}).get("players") or [])
            if pl:
                p = pl[0]
                print("DL player keys", sorted(p.keys()), "img", json.dumps(img(p))[:400]); k += 1; break
        if k >= 2: break
    if k >= 2: break
# ESPN roster
r = g("https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/teams")
tid = (((r or {}).get("sports") or [{}])[0].get("leagues") or [{}])[0].get("teams", [{}])[0].get("team", {}).get("id")
ro = g(f"https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/teams/{tid}/roster") or {}
ath = ro.get("athletes") or []
a0 = ath[0] if ath else {}
print("ESPN athlete keys", sorted(a0.keys()), "img", json.dumps(img(a0))[:300], "con foto", sum(1 for a in ath if (a.get("headshot") or {}).get("href")), "/", len(ath))
