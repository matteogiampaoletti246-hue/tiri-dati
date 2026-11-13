#!/usr/bin/env python3
"""Dettaglio storico delle partite (FotMob matchDetails) in forma compatta, per stagione.
partite/{lega}/{stagione}.json = {"done":bool, "m": {matchId: {...}}}. Riprendibile; 3 turni (SHARD/NSHARD) in parallelo su cartelle disgiunte."""
import json, os, sys, time, gzip, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
BUDGET = float(os.environ.get("BUDGET_MIN", "320")) * 60
SHARD = int(os.environ.get("SHARD", "0")); NSHARD = int(os.environ.get("NSHARD", "1"))
CAP_MB = float(os.environ.get("CAP_MB", "200"))   # 130 -> 200: le posizioni dei tiri (sx) aggiungono ~100 MB alle stagioni dal 2019
T0 = time.time()
RECENT_YEAR = time.gmtime().tm_year - 1   # stagioni "2025-2026" e "2026", "2026-2027": possono avere ancora partite da aggiungere
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
    # tiri con posizione (mappe del campo del giocatore): stesso formato del worker (`/sh`) + id del giocatore in coda, senza autogol:
    # [min, minAdded, teamId, playerId, x, y, eventType, murato, inPorta, blockedX, blockedY, goalCrossedY, goalCrossedZ, xG, xGOT, shotType, situation, 0, period, playerId]
    # "sx" c'e' sempre (anche vuota): cosi' la partita non si riscarica.
    sx = []
    for t in ((c.get("shotmap") or {}).get("shots")) or []:
        if t.get("isOwnGoal") or not t.get("playerId") or t.get("x") is None or t.get("y") is None: continue
        r2 = lambda v: round(v, 2) if isinstance(v, (int, float)) else v
        sx.append([t.get("min"), t.get("minAdded"), t.get("teamId"), t["playerId"], r2(t["x"]), r2(t["y"]), t.get("eventType"), 1 if t.get("isBlocked") else 0, 1 if t.get("isOnTarget") else 0,
                   r2(t.get("blockedX")), r2(t.get("blockedY")), r2(t.get("goalCrossedY")), r2(t.get("goalCrossedZ")), r2(t.get("expectedGoals")), r2(t.get("expectedGoalsOnTarget")), t.get("shotType"), t.get("situation"), 0, t.get("period"), t["playerId"]])
    out["sx"] = sx
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
TOP20 = {47,87,55,54,53,57,61,48,86,146,71,40,64,268,112,130,230,38,59,135}
# Partita scaricata troppo presto: FotMob aveva gia' le statistiche dei giocatori ma non ancora minuti e tiri (es. Olympiacos-Real Madrid
# del 4/11/2026: Camavinga senza minuti -> Hit Rate dei falli su 3 partite). Si riscarica (al massimo MAX_RT volte, `rt` nella partita).
MAX_RT = 6
def incompleta(x):
    P = (x or {}).get("p") or {}
    return bool(P) and not any((v or {}).get("minutes_played") for v in P.values())
# Partita scaricata vuota (FotMob mette statistiche e formazioni dopo, spesso per coppe e campionati minori: es. Copa del Rey,
# Liga de Expansion MX del 12/11/2026): nelle 3 settimane dopo la partita si riprova, al massimo MAX_RT volte.
def vuota(x):
    x = x or {}
    return not x.get("s") and not x.get("p") and not x.get("h")
# Partita finita da poco con statistiche di tiro ma shotmap vuota (FotMob a volte la mette dopo): ci si riprova per 3 giorni, al massimo 3 volte.
# Nei campionati dove FotMob non ha mai la shotmap la partita resta com'e' (nessun dato inventato).
def sxvuoto(x):
    x = x or {}
    return x.get("sx") == [] and any(((v or {}).get("total_shots") or 0) > 0 for v in (x.get("p") or {}).values())
def da_poco(m, giorni=21):
    try:
        import datetime
        t = datetime.datetime.fromisoformat(str(m[4]).replace("Z", "+00:00")).timestamp()
        return time.time() - t < giorni * 86400
    except Exception:
        return False
def storico_ridotto(lid, c, sk):
    return int(lid) not in TOP20 and c != "INT" and int(str(sk)[:4]) < 2020
def folder_mb(path):
    n = 0
    for r, _, fs in os.walk(path):
        for f in fs: n += os.path.getsize(os.path.join(r, f))
    return n / 1e6
def run():
    # i segnalini del giro prima non valgono piu': se il lavoro resta, il workflow deve ripartire da solo
    for f in (f"partite/.done{SHARD}", f"partite/.cap{SHARD}"):
        if os.path.exists(f): os.remove(f)
    ix = json.load(open(os.environ.get("INDEX", "arch/index.json")))
    years = range(2026, int(os.environ.get("MINYEAR", "2010")) - 1, -1)
    units = []
    for y in years:
        for lid, v in ix.items():
            for s in v["s"]:
                if s[:4] == str(y) and not storico_ridotto(lid, v.get("c"), s): units.append((lid, s))
    # prima le stagioni in corso e la precedente di tutte le competizioni, tra queste prima quelle dell'app; poi lo storico
    units.sort(key=lambda u: (int(u[1][:4]) < RECENT_YEAR, 0 if int(u[0]) in {42, 73, 10216, 55, 47, 87, 54, 53, 57, 71, 61, 40, 64, 38, 59, 135, 48, 86, 146, 140, 110, 185, 111, 165, 268, 112, 130, 230, 141, 209, 134, 186, 133, 149, 278, 180, 9067} else 1))
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
        # stagione in corso (o appena finita): si ricontrolla sempre. Prima "done" restava vero dopo il primo giro completo e le
        # partite finite dopo non entravano piu' (es. Feyenoord-Fortuna Sittard del 31/10: mancava l'intera giornata).
        recente = int(s[:4]) >= RECENT_YEAR
        bf = int(s[:4]) >= int(os.environ.get("SX_FROM", "2019"))   # tiri con posizione (mappe del giocatore) anche per le stagioni passate: si aggiungono alle partite gia' scaricate, prima le piu' recenti
        nosh = lambda x: bool(x) and not vuota(x) and "sx" not in x
        if cur["done"] and not recente and not (bf and any(nosh(x) for x in cur["m"].values())): continue
        allfx = json.load(open(src))["fix"]
        fx = [m for m in allfx if m[7] and not m[8]]      # solo partite finite (m[6] = iniziata: una partita in corso restava a meta')
        aperta = any(not m[7] and not m[8] for m in allfx)
        todo = [m for m in fx if str(m[0]) not in cur["m"]]
        if recente:
            todo += [m for m in fx if str(m[0]) in cur["m"] and (incompleta(cur["m"][str(m[0])]) or (vuota(cur["m"][str(m[0])]) and da_poco(m)))
                     and (cur["m"][str(m[0])].get("rt") or 0) < MAX_RT]
            todo += [m for m in fx if str(m[0]) in cur["m"] and sxvuoto(cur["m"][str(m[0])]) and da_poco(m, 3)
                     and (cur["m"][str(m[0])].get("rt") or 0) < 3 and m not in todo]
        if bf:
            todo += [m for m in fx if str(m[0]) in cur["m"] and nosh(cur["m"][str(m[0])]) and (cur["m"][str(m[0])].get("rt") or 0) < MAX_RT and m not in todo]
        if cur["done"] and not todo and not aperta: continue
        if not todo:
            if cur["done"] == (not aperta): continue
            cur["done"] = not aperta; dump(p, cur); continue
        # il tetto di spazio vale solo per lo storico: la stagione in corso si aggiorna sempre (a 399 MB il tetto fermava tutto)
        if not recente and os.path.exists("partite") and folder_mb("partite") > CAP_MB * NSHARD: print("tetto di spazio raggiunto"); capped = True; break
        n = 0
        for m in todo:
            if time.time() - T0 > BUDGET: break
            j = get(m[0])
            time.sleep(0.2)
            old = cur["m"].get(str(m[0]))
            if j == "gone":
                if not old: cur["m"][str(m[0])] = {}
                continue
            if not j:
                fails += 1
                if fails >= 25: print("troppi errori di fila: mi fermo"); dump(p, cur); sys.exit(0)
                continue
            fails = 0
            try: new = compact(j)
            except Exception as e: new = {}
            if old is not None and str(m[0]) in cur["m"]:
                # riscaricata: se e' ancora parziale (o ancora vuota) resta quella di prima, col conto dei tentativi
                if vuota(old):
                    if vuota(new): old["rt"] = (old.get("rt") or 0) + 1; continue
                elif not new.get("p") or incompleta(new): old["rt"] = (old.get("rt") or 0) + 1; continue
                elif sxvuoto(old) and not new.get("sx"): old["rt"] = (old.get("rt") or 0) + 1; continue
            cur["m"][str(m[0])] = new
            n += 1
        else:
            cur["done"] = not aperta     # chiusa solo quando il calendario non ha piu' partite da giocare
        dump(p, cur)
        print(lid, s, len(fx), "partite", n, "nuove", flush=True)
    if not capped and time.time() - T0 <= BUDGET:
        open(f"partite/.done{SHARD}", "w").write("1")
    if capped: open(f"partite/.cap{SHARD}", "w").write("1")
os.makedirs("partite", exist_ok=True)
run()
