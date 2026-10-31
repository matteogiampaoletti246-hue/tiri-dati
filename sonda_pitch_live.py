"""Sonda PitchAPI per il live: stato partite, endpoint disponibili, se i dati cambiano a partita in corso. Stampa SOLO struttura (nomi dei campi, tipi, conteggi), niente risposte grezze."""
import json, os, sys, time, datetime, urllib.request, urllib.error
BASE = "https://api.pitchapi.com"
try:
    from update_data import BASE as B2
    BASE = B2
except Exception: pass
KEY = os.environ.get("PITCHAPI_KEY", "")
def raw(path):
    t = time.time()
    try:
        with urllib.request.urlopen(urllib.request.Request(BASE + path, headers={"X-API-KEY": KEY, "User-Agent": "tiri-dati/1.0"}), timeout=40) as r:
            return r.status, json.loads(r.read().decode()), round(time.time() - t, 2)
    except urllib.error.HTTPError as e:
        return e.code, None, round(time.time() - t, 2)
    except Exception as e:
        return 0, None, 0
def tree(o, d=0, name=""):
    if d > 3: return "…"
    if isinstance(o, dict): return "{" + ", ".join(f"{k}:{tree(v, d+1)}" for k, v in list(o.items())[:30]) + "}"
    if isinstance(o, list): return f"[{len(o)}×{tree(o[0], d+1) if o else ''}]"
    return type(o).__name__ if not isinstance(o, (int, float)) else "num"
import builtins
_out = []
_p = builtins.print
def print(*a, **k):
    _p(*a, **k); _out.append(" ".join(str(x) for x in a))
print("BASE", BASE)
today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
for p in (f"/v1/matches?date={today}", f"/v1/matches/live", f"/v1/live", f"/v1/matches?status=live"):
    s, j, t = raw(p); print(p, s, t, tree((j or {}).get("data", j)) if j else "")
s, lg, _ = raw("/v1/leagues"); L = ((lg or {}).get("data") or {}).get("leagues", [])
print("leghe", len(L), "chiavi lega:", tree(L[0]) if L else "")
EPL = next((l for l in L if l.get("name") == "Premier League"), L[0] if L else None)
live = None
if EPL:
    s, j, t = raw(f"/v1/leagues/{EPL['id']}/matches?season=2026%2F2027"); M = ((j or {}).get("data") or {}).get("matches", [])
    print("partite", len(M), "chiavi partita:", tree(M[0]) if M else "")
    from collections import Counter
    print("stati:", Counter(str(m.get("status")) for m in M))
    live = next((m for m in M if str(m.get("status", "")).lower() in ("live", "inplay", "in_play", "1h", "2h", "ht", "in progress")), None)
    if not live and M: live = M[-1]
if live:
    mid = live["id"]; print("partita scelta stato:", live.get("status"))
    for ep in ("", "/players", "/lineups", "/events", "/stats", "/statistics", "/timeline", "/shots", "/commentary", "/odds"):
        s, j, t = raw(f"/v1/matches/{mid}{ep}"); print(ep or "/", s, t, tree((j or {}).get("data", j))[:700] if j else "")
    a = raw(f"/v1/matches/{mid}/players")[1]; time.sleep(60); b = raw(f"/v1/matches/{mid}/players")[1]
    print("players invariati dopo 60s:", a == b)

open("sonda_pitch_live.txt", "w").write("\n".join(_out))
