"""Sonda: dove LiveScore, PitchAPI ed ESPN danno infortunati / indisponibili. Stampa SOLO struttura, stati HTTP e conteggi
(niente risposte grezze nel repository). Caso di prova: Ipswich (Lukic fuori dal 10/10, FotMob non lo segna)."""
import json, os, re, time, urllib.request, urllib.error
from datetime import datetime, timezone

OUT = []
def P(*a):
    s = " ".join(str(x) for x in a); print(s); OUT.append(s)

UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,text/html,*/*"}
def raw(url, h=None, js=True):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=h or UA), timeout=40) as r:
            b = r.read().decode("utf8", "replace")
            return r.status, (json.loads(b) if js else b)
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:
        return 0, str(e)[:80]

def tree(o, d=0):
    if d > 3: return "…"
    if isinstance(o, dict): return "{" + ", ".join(f"{k}:{tree(v, d+1)}" for k, v in list(o.items())[:25]) + "}"
    if isinstance(o, list): return f"[{len(o)}×{tree(o[0], d+1) if o else ''}]"
    return "num" if isinstance(o, (int, float)) else type(o).__name__

KW = re.compile(r"inj|miss|abs|unav|sidel|susp|doubt|out", re.I)
def keyhits(o, path="", acc=None):
    acc = acc if acc is not None else []
    if isinstance(o, dict):
        for k, v in o.items():
            if KW.search(str(k)) and len(acc) < 25:
                acc.append(f"{path}.{k}:{tree(v)[:200]}")
            keyhits(v, f"{path}.{k}", acc)
    elif isinstance(o, list):
        for v in o[:40]:
            keyhits(v, path + "[]", acc)
    return acc

def has(o, name):
    return name.lower() in json.dumps(o, ensure_ascii=False).lower()

# ---------------- LiveScore
B = "https://prod-cdn-public-api.livescore.com/v1/api/app/"
P("== LIVESCORE")
evs = {}
for ymd in ("20261031", "20261108"):
    s, j = raw(B + f"date/soccer/{ymd}/1?countryCode=GB&locale=en&MD=1")
    for st in (j or {}).get("Stages", []) if isinstance(j, dict) else []:
        for x in st.get("Events", []):
            n = (x.get("T1") or [{}])[0].get("Nm", "") + " v " + (x.get("T2") or [{}])[0].get("Nm", "")
            if "Ipswich" in n:
                evs[ymd] = (x.get("Eid"), n, x)
P("eventi Ipswich", {k: v[1] for k, v in evs.items()})
for ymd, (eid, n, x) in evs.items():
    P("-- evento", ymd, n, "chiavi evento:", tree(x)[:600])
    for ep in ("lineups", "scoreboard", "incidents", "info", "statistics", "h2h", "missing", "injuries", "sidelined", "prematch"):
        s, j = raw(B + f"{ep}/soccer/{eid}?locale=en")
        P(f"  {ep}", s, (tree(j)[:700] if isinstance(j, (dict, list)) else ""))
        if isinstance(j, (dict, list)):
            for h in keyhits(j): P("     KEY", h)
            P("     Lukic nella risposta:", has(j, "Luki"))
# pagina web della squadra e della partita (dati __NEXT_DATA__)
s, j = raw("https://prod-cdn-search-api.livescore.com/api/v2/search/soccer/team?query=Ipswich&limit=5")
tid = None
if isinstance(j, dict):
    for t in j.get("Teams") or j.get("teams") or []:
        tid = tid or t.get("ID") or t.get("id")
P("team id LS", tid, "risposta search:", tree(j)[:300] if isinstance(j, dict) else s)
for path in ([f"https://www.livescore.com/en/football/team/ipswich-town/{tid}/squad/", f"https://www.livescore.com/en/football/team/x/{tid}/overview/"] if tid else []) + \
            [f"https://www.livescore.com/en/football/england/premier-league/ipswich-town-vs-afc-bournemouth/{evs.get('20261108', ('',))[0]}/lineups/"]:
    s, h = raw(path, js=False)
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', h or "", re.S) if isinstance(h, str) else None
    P("web", path.split("livescore.com")[1], s, "next_data" if m else "-", ("Lukic:" + str("Luki" in (h or ""))) if isinstance(h, str) else "")
    if m:
        try:
            nd = json.loads(m.group(1))
            for hk in keyhits(nd): P("     KEY", hk)
        except Exception as e:
            P("     nd err", e)
    if isinstance(h, str):
        for w in ("injur", "Injur", "Missing", "missing", "Suspend", "Doubt", "Sidelined", "Unavailable"):
            if w in h: P("     parola", w, h.count(w))

# ---------------- PitchAPI
P("== PITCHAPI")
BASE = "https://api.pitchapi.com"
try:
    from update_data import BASE as B2
    BASE = B2
except Exception:
    pass
KEY = os.environ.get("PITCHAPI_KEY", "")
PH = {"X-API-KEY": KEY, "User-Agent": "tiri-dati/1.0"}
P("BASE", BASE, "chiave", bool(KEY))
s, lg = raw(BASE + "/v1/leagues", PH)
L = ((lg or {}).get("data") or {}).get("leagues", []) if isinstance(lg, dict) else []
EPL = next((l for l in L if l.get("name") == "Premier League"), None)
P("leghe", len(L), "EPL", bool(EPL))
for p in ("/v1/injuries", "/v1/sidelined", "/v1/players/injuries", "/v1/injuries?league=%s" % (EPL or {}).get("id"),
          "/v1/leagues/%s/injuries" % (EPL or {}).get("id"), "/v1/leagues/%s/sidelined" % (EPL or {}).get("id"), "/v1/leagues/%s/teams" % (EPL or {}).get("id")):
    s, j = raw(BASE + p, PH)
    P(p, s, tree((j or {}).get("data", j))[:500] if isinstance(j, dict) else "")
    if isinstance(j, dict):
        for h in keyhits(j): P("     KEY", h)
if EPL:
    s, j = raw(BASE + f"/v1/leagues/{EPL['id']}/matches?season=2026%2F2027", PH)
    M = ((j or {}).get("data") or {}).get("matches", []) if isinstance(j, dict) else []
    nxt = next((m for m in M if "Ipswich" in json.dumps(m) and str(m.get("date") or m.get("kickoff") or m.get("start") or "")[:10] >= "2026-11-08"), None)
    last = [m for m in M if "Ipswich" in json.dumps(m) and str(m.get("date") or m.get("kickoff") or m.get("start") or "")[:10] <= "2026-11-01"]
    P("partite EPL", len(M), "chiavi:", tree(M[0])[:400] if M else "")
    tm = None
    for m in [nxt] + last[-1:]:
        if not m: continue
        for ep in ("", "/lineups", "/players", "/missing", "/injuries", "/sidelined", "/preview"):
            s, jj = raw(BASE + f"/v1/matches/{m['id']}{ep}", PH)
            P(" match", ep or "/", s, tree((jj or {}).get("data", jj))[:500] if isinstance(jj, dict) else "")
            if isinstance(jj, dict):
                for h in keyhits(jj): P("     KEY", h)
                P("     Lukic:", has(jj, "Luki"))
        for k in ("home_team", "homeTeam", "home"):
            v = m.get(k)
            if isinstance(v, dict) and "Ipswich" in json.dumps(v): tm = v.get("id")
        for k in ("away_team", "awayTeam", "away"):
            v = m.get(k)
            if isinstance(v, dict) and "Ipswich" in json.dumps(v): tm = v.get("id")
    if tm:
        for ep in ("", "/players", "/squad", "/injuries", "/sidelined"):
            s, jj = raw(BASE + f"/v1/teams/{tm}{ep}", PH)
            P(" team", ep or "/", s, tree((jj or {}).get("data", jj))[:500] if isinstance(jj, dict) else "")
            if isinstance(jj, dict):
                for h in keyhits(jj): P("     KEY", h)
                P("     Lukic:", has(jj, "Luki"))

# ---------------- ESPN
P("== ESPN")
for u in ("https://site.web.api.espn.com/apis/common/v3/sports/soccer/eng.1/athletes/222300",
          "https://site.web.api.espn.com/apis/common/v3/sports/soccer/eng.1/athletes/222300/overview",
          "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/373/injuries",
          "https://sports.core.api.espn.com/v2/sports/soccer/leagues/eng.1/athletes/222300/injuries"):
    s, j = raw(u)
    P(u.split(".com")[1], s, tree(j)[:400] if isinstance(j, (dict, list)) else "")
    if isinstance(j, (dict, list)):
        for h in keyhits(j): P("     KEY", h)

P("fine", datetime.now(timezone.utc).isoformat())
open("sonda_infortuni.txt", "w").write("\n".join(OUT))
