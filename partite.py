#!/usr/bin/env python3
"""Dettaglio storico delle partite (FotMob matchDetails) in forma compatta, per stagione.
partite/{lega}/{stagione}.json = {"done":bool, "m": {matchId: {...}}}. Riprendibile; 3 turni (SHARD/NSHARD) in parallelo su cartelle disgiunte."""
import json, os, sys, time, gzip, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
BUDGET = float(os.environ.get("BUDGET_MIN", "320")) * 60
SHARD = int(os.environ.get("SHARD", "0")); NSHARD = int(os.environ.get("NSHARD", "1"))
CAP_MB = float(os.environ.get("CAP_MB", "130"))
T0 = time.time()
def get(i, tries=3):
    for k in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request("https://www.fotmob.com/api/data/matchDetails?matchId=%s" % i, headers=UA), timeout=40).read()
            try: r = gzip.decompress(r)
            except Exception: pass
            return json.loads(r)
        except Exception as e:
            if getattr(e, "code", 0) in (404, 410): return "gone"
            time.sleep(1.5 * (k + 1))
    return None
def dump(p, o):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with gzip.open(p, "wt", encoding="utf-8", compresslevel=9) as f:
        json.dump(o, f, ensure_ascii=False, separators=(",", ":"))
def load(p):
    with gzip.open(p, "rt", encoding="utf-8") as f: return json.load(f)
def num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None
def compact(j):
    c = j.get("content") or {}; g = j.get("general") or {}
    out = {}
    # statistiche di squadra (periodo "All"): chiave -> [casa, trasferta]
    st = {}
    for grp in ((c.get("stats") or {}).get("Periods") or {}).get("All", {}).get("stats", []) or []:
        for it in grp.get("stats") or []:
            k = it.get("key"); v = it.get("stats")
            if k and isinstance(v, list) and len(v) == 2 and k not in st: st[k] = v
    if st: out["s"] = st
    # eventi (gol, cartellini, cambi...)
    ev = []
    for e in (((c.get("matchFacts") or {}).get("events") or {}).get("events")) or []:
        if e.get("type") in ("Half", "AddedTime"): continue
        x = {k: e[k] for k in ("time", "overloadTime", "type", "isHome", "card", "homeScore", "awayScore", "goalDescription", "assistStr", "nameStr", "eventType", "swap", "VAR") if e.get(k) not in (None, "", [])}
        p = e.get("player") or {}
        if p.get("id"): x["p"] = [p.get("id"), p.get("name")]
        if x: ev.append(x)
    if ev: out["e"] = ev
    # formazioni con voto
    lu = c.get("lineup") or {}
    for side, key in (("homeTeam", "h"), ("awayTeam", "a")):
        t = lu.get(side) if isinstance(lu, dict) else None
        if not isinstance(t, dict): continue
        def pl(x):
            pf = x.get("performance") or {}
            r = [x.get("id"), x.get("name"), x.get("shirtNumber"), x.get("positionId"), pf.get("rating")]
            if x.get("isCaptain"): r.append("C")
            return r
        out[key] = {"id": t.get("id"), "f": t.get("formation"), "r": t.get("rating"), "st": [pl(x) for x in t.get("starters") or []], "sb": [pl(x) for x in t.get("subs") or []]}
        if t.get("coach"): out[key]["co"] = t["coach"].get("name") if isinstance(t["coach"], dict) else t["coach"]
    # statistiche giocatore (solo valori non nulli)
    ps = {}
    for pid, v in (c.get("playerStats") or {}).items():
        d = {}
        for grp in v.get("stats") or []:
            for name, it in (grp.get("stats") or {}).items():
                s = (it or {}).get("stat") or {}
                val = num(s.get("value"))
                if val is None or val == 0: continue
                k = it.get("key")
                if k and k not in d: d[k] = val
                tot = num(s.get("total"))
                if tot and k and (k + "_t") not in d: d[k + "_t"] = tot
        if d: ps[pid] = d
    if ps: out["p"] = ps
    mf = c.get("matchFacts") or {}; ib = mf.get("infoBox") or {}
    meta = {}
    if (ib.get("Referee") or {}).get("text"): meta["ref"] = ib["Referee"]["text"]
    if (ib.get("Stadium") or {}).get("name"): meta["st"] = ib["Stadium"]["name"]
    if ib.get("Attendance"): meta["att"] = ib["Attendance"]
    pm = mf.get("playerOfTheMatch") or {}
    if pm.get("id"): meta["potm"] = pm["id"]
    if meta: out["i"] = meta
    return out

# Primi 20 campionati per ranking (+ tutte le competizioni internazionali): storico completo dal 2010.
# Gli altri: calendario e classifica dal 2010, statistiche e dettaglio partite solo dal 2020.
TOP20 = {47,87,55,54,53,57,61,48,86,146,140,110,71,40,64,268,112,130,230,38}
def storico_ridotto(lid, c, sk):
    return int(lid) not in TOP20 and c != "INT" and int(str(sk)[:4]) < 2020
def folder_mb(path):
    n = 0
    for r, _, fs in os.walk(path):
        for f in fs: n += os.path.getsize(os.path.join(r, f))
    return n / 1e6
def run():
    ix = json.load(open(os.environ.get("INDEX", "arch/index.json")))
    years = range(2026, int(os.environ.get("MINYEAR", "2010")) - 1, -1)
    units = []
    for y in years:
        for lid, v in ix.items():
            for s in v["s"]:
                if s[:4] == str(y) and not storico_ridotto(lid, v.get("c"), s): units.append((lid, s))
    mine = [u for i, u in enumerate(units) if i % NSHARD == SHARD]
    capped = False
    fails = 0
    for lid, s in mine:
        if time.time() - T0 > BUDGET: print("budget finito"); break
        sk = s.replace("/", "-")
        src = f"arch/{lid}/{sk}.json"
        if not os.path.exists(src): continue
        p = f"partite/{lid}/{sk}.json.gz"
        cur = load(p) if os.path.exists(p) else {"done": False, "m": {}}
        if cur["done"]: continue
        if os.path.exists("partite") and folder_mb("partite") > CAP_MB * NSHARD: print("tetto di spazio raggiunto"); capped = True; break
        fx = [m for m in json.load(open(src))["fix"] if m[6] and not m[8]]
        todo = [m for m in fx if str(m[0]) not in cur["m"]]
        n = 0
        for m in todo:
            if time.time() - T0 > BUDGET: break
            j = get(m[0])
            time.sleep(0.2)
            if j == "gone": cur["m"][str(m[0])] = {}; continue
            if not j:
                fails += 1
                if fails >= 25: print("troppi errori di fila: mi fermo"); dump(p, cur); sys.exit(0)
                continue
            fails = 0
            try: cur["m"][str(m[0])] = compact(j)
            except Exception as e: cur["m"][str(m[0])] = {}
            n += 1
        else:
            cur["done"] = True
        dump(p, cur)
        print(lid, s, len(fx), "partite", n, "nuove", flush=True)
    if not capped and time.time() - T0 <= BUDGET:
        open(f"partite/.done{SHARD}", "w").write("1")
    if capped: open(f"partite/.cap{SHARD}", "w").write("1")
os.makedirs("partite", exist_ok=True)
run()
