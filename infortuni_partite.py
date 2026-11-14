#!/usr/bin/env python3
"""Infortunati / squalificati / non convocati PER PARTITA, per tutte le partite dei prossimi giorni (club e nazionali), anche per i giocatori che
non sono nel nostro database. Regola fissa: docs/regole/partite-formazioni.md, sezione "Infortunati: tutte le partite, nazionali con i non convocati".

Fonte: FotMob (dati pubblici, vanno nel repository come infortuni.json).
  Club: matchDetails `unavailable` della partita + rosa FotMob con il flag "injured" (se non sono in distinta).
  Nazionali: "pool" = chi ha giocato (titolare o panchina) nelle ultime partite della nazionale negli ultimi 2 anni; chi manca dai convocati di questo
  turno (distinta della partita, distinta dell'ultima partita del turno, rosa FotMob) e' fuori: se FotMob dice che e' infortunato/squalificato
  (matchDetails `unavailable` o scheda giocatore) -> k inj/sus con il motivo e il rientro, altrimenti k nc ("Non convocato").
Uscita: infortuni_partite.json {updated_at, t: {id FotMob squadra: {d: data partita, p: [{f: id FotMob, n: nome, k: inj|sus|nc, r: motivo inglese|null, ed, e}]}}}
e report/infortuni_partite_stato.json (diagnostica: quanti convocati, quanti nel pool, ecc.)."""
import json, os, sys, time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import infortuni as I

OUT, REPORT = "infortuni_partite.json", "report/infortuni_partite_stato.json"
DAYS = int(os.environ.get("DAYS", "4"))
MAX_MIN = float(os.environ.get("MAX_MIN", "40"))
ONLY = [int(x) for x in os.environ.get("ONLY_TEAMS", "").split(",") if x.strip()]
T0 = time.time()
TODAY = I.TODAY
NAT_LEAGUES = {114, 9806, 9807, 9808, 9809}
POOL_YEARS_DAYS = 730
MAX_PAST = 14
MAX_LIST = 16
get = I.get
late = lambda: (time.time() - T0) / 60 > MAX_MIN


def fixtures_of(tid):
    j = get("https://www.fotmob.com/api/data/teams?id=%d" % tid) or {}
    fx = ((j.get("fixtures") or {}).get("allFixtures") or {}).get("fixtures") or []
    members = []
    for g in ((j.get("squad") or {}).get("squad") or []):
        if g.get("title") == "coach":
            continue
        for m in g.get("members") or []:
            if m.get("id"):
                members.append(m)
    d = j.get("details") or {}
    return {"fx": fx, "members": members, "nat": bool(d.get("isNationalTeam")), "name": d.get("name")}


def lineup_of(mid, tid):
    """-> {ids: {fm: nome}, un: {fm: {n, type, e}}, ty} della squadra tid nella partita mid"""
    j = get("https://www.fotmob.com/api/data/matchDetails?matchId=%s" % mid)
    lu = ((j or {}).get("content") or {}).get("lineup") or {}
    for side in ("homeTeam", "awayTeam"):
        t = lu.get(side) or {}
        if t.get("id") != tid:
            continue
        ids = {}
        for p in (t.get("starters") or []) + (t.get("subs") or []):
            if isinstance(p, dict) and p.get("id"):
                n = p.get("name")
                ids[int(p["id"])] = n.get("fullName") if isinstance(n, dict) else n
        un = {}
        for p in t.get("unavailable") or []:
            u = p.get("unavailability") or {}
            if p.get("id"):
                n = p.get("name")
                un[int(p["id"])] = {"n": n.get("fullName") if isinstance(n, dict) else n, "type": str(u.get("type") or ""), "e": u.get("expectedReturn")}
        return {"ids": ids, "un": un, "ty": lu.get("lineupType")}
    return None


def unav_entry(fm, u, base=TODAY):
    sus = "susp" in (u.get("type") or "").lower() or "card" in (u.get("type") or "").lower()
    ed, _ = I.ret_text(u.get("e"), base)
    return {"f": fm, "n": u.get("n"), "k": "sus" if sus else "inj", "r": None if sus else (u.get("type") or "Injury"), "ed": ed, "e": u.get("e") if isinstance(u.get("e"), str) else None}


def matches():
    out, seen = [], set()
    for k in range(DAYS + 1):
        day = (NOW_D + timedelta(days=k)).strftime("%Y-%m-%d")
        try:
            rows = json.load(open("giorni/%s.json" % day)).get("m", [])
        except Exception:
            continue
        for r in rows:
            if r[8] in ("n", "l") and r[0] not in seen and r[3] and r[4]:
                seen.add(r[0])
                out.append({"mid": r[0], "lg": r[1], "d": str(r[2])[:10], "h": int(r[3]), "a": int(r[4])})
    return out


NOW_D = datetime.now(timezone.utc)


def main():
    ms = matches()
    if ONLY:
        ms = [m for m in ms if m["h"] in ONLY or m["a"] in ONLY]
    teams = {}
    for m in ms:
        for tid in (m["h"], m["a"]):
            e = teams.setdefault(tid, {"m": m})
            if m["d"] < e["m"]["d"]:
                e["m"] = m
    print("partite", len(ms), "squadre", len(teams), flush=True)
    tids = list(teams)
    with ThreadPoolExecutor(8) as ex:
        for tid, r in zip(tids, ex.map(lambda t: None if late() else fixtures_of(t), tids)):
            teams[tid]["T"] = r
    # lineup + unavailable della partita
    with ThreadPoolExecutor(8) as ex:
        for tid, r in zip(tids, ex.map(lambda t: None if late() else lineup_of(teams[t]["m"]["mid"], t), tids)):
            teams[tid]["N"] = r
    res, rep = {}, {"squadre": len(teams), "nazionali": 0, "club": 0, "dettaglio_nazionali": {}}
    past_jobs = []
    for tid, e in teams.items():
        T = e.get("T")
        if not T:
            continue
        isnat = T["nat"] or e["m"]["lg"] in NAT_LEAGUES
        e["nat"] = isnat
        if not isnat:
            rep["club"] += 1
            continue
        rep["nazionali"] += 1
        past = []
        for f in T["fx"]:
            st = f.get("status") or {}
            d = I.iso(st.get("utcTime"))
            if d and st.get("finished") and not st.get("cancelled") and d >= I.add(TODAY, -POOL_YEARS_DAYS):
                past.append((d, f.get("id")))
        e["past"] = sorted(past)[-MAX_PAST:]
        for d, mid in e["past"]:
            past_jobs.append((tid, d, mid))
    with ThreadPoolExecutor(8) as ex:
        outs = list(ex.map(lambda a: None if late() else lineup_of(a[2], a[0]), past_jobs))
    for (tid, d, mid), r in zip(past_jobs, outs):
        if r:
            teams[tid].setdefault("hist", []).append((d, r["ids"]))
    # giocatori mancanti dei convocati: scheda giocatore per il motivo
    need = {}
    for tid, e in teams.items():
        if not e.get("nat") or not e.get("hist"):
            continue
        hist = sorted(e["hist"], key=lambda x: x[0])
        cnt, lastd, name = {}, {}, {}
        for d, ids in hist:
            for fm, n in ids.items():
                cnt[fm] = cnt.get(fm, 0) + 1
                lastd[fm] = d
                name[fm] = n or name.get(fm)
        recent = set()
        for d, ids in hist[-6:]:
            recent |= set(ids)
        pool = {fm for fm in cnt if fm in recent or cnt[fm] >= 3}
        N = e.get("N") or {"ids": {}, "un": {}}
        call = set(N["ids"])
        src = "partita" if len(call) >= 18 else None
        # distinta dell'ultima partita del turno (stessa convocazione), se recente
        last_d, last_ids = hist[-1]
        if last_d >= I.add(TODAY, -6) and len(last_ids) >= 18:
            call |= set(last_ids)
            src = (src + "+ultima") if src else "ultima"
        mem = {int(m["id"]) for m in e["T"]["members"]}
        # rosa FotMob della nazionale = convocati del turno (verificato: 23-28 giocatori, come la distinta): vale quando ha una dimensione da convocazione
        if 14 <= len(mem) <= 32:
            call |= mem
            src = (src + "+rosa") if src else "rosa"
        e["info"] = {"pool": len(pool), "call": len(call), "rosa": len(mem), "src": src}
        e["pool"], e["call"], e["name"], e["cnt"] = pool, call, name, cnt
        if src:
            for fm in pool - call:
                need[fm] = e["name"].get(fm)
    print("giocatori non convocati da leggere", len(need), flush=True)
    F = {}
    with ThreadPoolExecutor(8) as ex:
        keys = list(need)
        for fm, r in zip(keys, ex.map(lambda f: None if late() else I.fm_player(f), keys)):
            if r:
                F[fm] = r
    for tid, e in teams.items():
        T = e.get("T")
        if not T:
            continue
        N = e.get("N") or {"ids": {}, "un": {}}
        lst, seen = [], set()
        for fm, u in N["un"].items():
            lst.append(unav_entry(fm, u))
            seen.add(fm)
        if e.get("nat"):
            if e.get("pool") is not None and e["info"]["src"]:
                miss = sorted(e["pool"] - e["call"] - seen, key=lambda f: -e["cnt"].get(f, 0))
                for fm in miss:
                    f = F.get(fm) or {}
                    inj = f.get("inj")
                    n = e["name"].get(fm)
                    if inj and (not inj.get("ed") or inj["ed"] >= TODAY):
                        sus = I.kind_of(inj.get("r")) == "sus"
                        lst.append({"f": fm, "n": n, "k": "sus" if sus else "inj", "r": None if sus else inj.get("r"), "ed": inj.get("ed"), "e": inj.get("e")})
                    else:
                        lst.append({"f": fm, "n": n, "k": "nc", "r": None, "ed": None, "e": None})
            rep["dettaglio_nazionali"][T.get("name") or str(tid)] = e.get("info")
        else:
            lineup_ids = set(N["ids"])
            for m in T["members"]:
                fm = int(m["id"])
                if m.get("injured") and fm not in seen and fm not in lineup_ids:
                    ij = m.get("injury") or {}
                    r = ij.get("name") if isinstance(ij, dict) else None
                    r = r.get("fallback") if isinstance(r, dict) else r
                    ed, _ = I.ret_text(str(ij.get("expectedReturn") or "") if isinstance(ij, dict) else "", TODAY)
                    n = m.get("name")
                    lst.append({"f": fm, "n": n.get("fullName") if isinstance(n, dict) else n, "k": "inj", "r": r or "Injury", "ed": ed, "e": None})
                    seen.add(fm)
        order = {"inj": 0, "sus": 1, "nc": 2}
        lst = sorted(lst, key=lambda x: order[x["k"]])[:MAX_LIST]
        if lst:
            res[str(tid)] = {"d": e["m"]["d"], "p": lst}
    upd = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    json.dump({"updated_at": upd, "t": res}, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    os.makedirs("report", exist_ok=True)
    rep.update({"updated_at": upd, "partite": len(ms), "squadre_con_elenco": len(res), "minuti": round((time.time() - T0) / 60, 1)})
    json.dump(rep, open(REPORT, "w"), ensure_ascii=False, indent=1)
    print(json.dumps(rep, ensure_ascii=False)[:1500], flush=True)


if __name__ == "__main__":
    main()
