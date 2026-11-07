#!/usr/bin/env python3
"""Infortunati, squalificati e assenti di TUTTI i giocatori dell'app (giocatori.json + calc_extra.json + stats.json).
Regola fissa: docs/regole/giocatori-dati.md, sezione "Infortunati: controllo a tappeto da piu' fonti".

Fonti, tutte incrociate per ogni giocatore:
  1) FotMob playerData.injuryInformation (infortunio dichiarato) + recentMatches (ultima distinta col club);
  2) FotMob matchDetails della prossima partita della squadra: `unavailable` (infortunati/squalificati) e formazione
     probabile/ufficiale (chi c'e' e' disponibile);
  3) LiveScore lineups: elenco `IS` (Injured/Suspended, motivo + rientro previsto) della prossima partita o dell'ultima giocata,
     e `Ps` (distinta) delle ultime partite: chi e' in distinta dopo un infortunio e' rientrato;
  4) assenza: fuori dalla distinta del club in 3 partite di fila (e da 14 giorni) o in 2 ma da almeno 3 settimane anche se nessuna fonte lo dichiara.
  PitchAPI ed ESPN non pubblicano infortuni del calcio (verificato con sonda: endpoint 404 / elenchi sempre vuoti).

Uscite:
  - infortuni.json (repository, pubblico): SOLO quanto deciso con dati FotMob;
  - KV Cloudflare `idx:inj` (servito dal worker /r?k=idx:inj): decisione completa con LiveScore (dati di terzi: mai nel repository).
  Formato: {updated_at, p: {id giocatore app: {k: inj|sus|abs, r: motivo inglese, ed: rientro ISO|null, e: rientro testo, s: data notizia, n: partite saltate}}}
Un giocatore torna disponibile da solo al giro successivo appena compare in una distinta o in una formazione, o quando passa la data di rientro."""
import json, os, re, sys, time, unicodedata
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "tools"))
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
OUT, KV_KEY, REPORT = "infortuni.json", "idx:inj", "report/infortuni_stato.json"
MAX_MIN = float(os.environ.get("MAX_MIN", "40"))
LS = "https://prod-cdn-public-api.livescore.com/v1/api/app/"
KV_ON = bool(os.environ.get("CLOUDFLARE_API_TOKEN") and os.environ.get("CF_ACCOUNT") and os.environ.get("CF_NAMESPACE"))
T0 = time.time()
NOW = datetime.now(timezone.utc)
TODAY = NOW.strftime("%Y-%m-%d")
MESI_EN = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]


def late():
    return (time.time() - T0) / 60 > MAX_MIN


def get(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.loads(r.read().decode("utf8", "replace"))
        except Exception as e:
            if "404" in str(e):
                return None
            time.sleep(1 + i)
    return None


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z ]+", " ", s.replace("-", " ")).split()


def iso(v):
    m = re.match(r"(\d{4}-\d{2}-\d{2})", str(v or ""))
    return m.group(1) if m else None


def add(d, n):
    return (datetime.fromisoformat(d) + timedelta(days=n)).strftime("%Y-%m-%d")


def ret_text(txt, base):
    """Rientro previsto in inglese ("Late November 2026", "About 1-2 weeks", "Doubtful", "Back in training") -> (ed ISO|None, dubbio)."""
    t = str(txt or "").strip().lower().replace("_", " ")
    if not t:
        return None, False
    if "doubt" in t or "back in training" in t or "game time decision" in t:
        return None, True
    rel = [("few days", 4), ("about a week", 7), ("1 2 weeks", 14), ("1-2 weeks", 14), ("2 3 weeks", 21), ("2-3 weeks", 21), ("few weeks", 21), ("a month", 30)]
    for k, n in rel:
        if k in t:
            return add(base, n), False
    if "season" in t:
        y = int(base[:4]) + (1 if int(base[5:7]) >= 7 else 0)
        return f"{y}-06-30", False
    m = re.search(r"(early|mid|late)?[\s-]*(" + "|".join(MESI_EN) + r")(?:\s+(\d{4}))?", t)
    if m:
        mi = MESI_EN.index(m.group(2)) + 1
        y = int(m.group(3)) if m.group(3) else int(base[:4]) + (1 if mi < int(base[5:7]) - 1 else 0)
        last = (datetime(y + (mi == 12), mi % 12 + 1, 1) - timedelta(days=1)).day
        day = {"early": 10, "mid": 20}.get(m.group(1) or "", last)
        return f"{y}-{mi:02d}-{day:02d}", False
    return None, False


# ---------------------------------------------------------------- giocatori dell'app
def load_players():
    """-> fm -> {ids:set(id app), n: nome}"""
    P = {}
    def put(fm, i, n):
        if not fm or not i:
            return
        e = P.setdefault(int(fm), {"ids": set(), "n": n})
        e["ids"].add(i)
    g = json.load(open("giocatori.json"))
    for p in g.get("players", []):
        put(p.get("f"), p.get("i"), p.get("n"))
    try:
        ce = json.load(open("calc_extra.json"))
        for p in ce.get("players", []):
            put(p.get("f") or p.get("fm"), p.get("i"), p.get("n"))
    except Exception:
        pass
    try:
        car = json.load(open("carriere.json"))
        st = json.load(open("stats.json"))
        ix = {c: k for k, c in enumerate(st["cols"])}
        for r in st["players"]:
            c = car.get(r[ix["id"]]) or {}
            put(c.get("fm"), r[ix["id"]], r[ix["n"]])
    except Exception:
        pass
    al = g.get("al") or {}
    back = {}
    for a, b in al.items():
        back.setdefault(b, []).append(a)
    for e in P.values():
        for i in list(e["ids"]):
            e["ids"].update(back.get(i, []))
    return P


# ---------------------------------------------------------------- FotMob
def fm_player(fm):
    j = get("https://www.fotmob.com/api/data/playerData?id=%d" % fm)
    if not isinstance(j, dict):
        return None
    pt = j.get("primaryTeam") or {}
    tid = pt.get("teamId")
    squads = []   # date delle partite del club in cui era in distinta (titolare, entrato o in panchina)
    for m in j.get("recentMatches") or []:
        if m.get("teamId") == tid:
            d = iso((m.get("matchDate") or {}).get("utcTime"))
            if d:
                squads.append((d, m.get("id")))
    inj = j.get("injuryInformation")
    out = {"tid": tid, "tn": pt.get("teamName"), "sq": squads, "loan": pt.get("onLoan")}
    if isinstance(inj, dict):
        er = inj.get("expectedReturn") or {}
        key = str(er.get("expectedReturnKey") or "").replace("expected_return_date_", "")
        prm = er.get("expectedReturnDateParam") or ""
        s = iso((inj.get("lastUpdated") or {}).get("utcTime")) or TODAY
        name = inj.get("name")
        name = name.get("fallback") if isinstance(name, dict) else name
        if key in ("early", "mid", "late") and prm:
            txt = f"{key} {prm}"
        else:
            txt = er.get("expectedReturnFallback") or key
        ed, dub = ret_text(txt, s)
        out["inj"] = {"r": name or "Injury", "ed": ed, "e": er.get("expectedReturnFallback") or txt, "s": s, "dub": dub, "src": "fm"}
    elif inj:
        out["inj"] = {"r": str(inj), "ed": None, "e": None, "s": TODAY, "dub": False, "src": "fm"}
    return out


def fm_team(tid):
    j = get("https://www.fotmob.com/api/data/teams?id=%d" % tid)
    fx = (((j or {}).get("fixtures") or {}).get("allFixtures") or {}).get("fixtures") or []
    past, nxt = [], []
    for f in fx:
        st = f.get("status") or {}
        d = iso(st.get("utcTime"))
        if not d:
            continue
        if st.get("finished") and not st.get("cancelled"):
            if d >= add(TODAY, -120):
                past.append((d, f.get("id")))
        elif not st.get("cancelled") and TODAY <= d <= add(TODAY, 6):
            nxt.append((d, f.get("id")))
    inj = {}   # rosa FotMob: "injured" con rientro previsto (seconda conferma FotMob, anche se playerData non lo riporta)
    for g in (((j or {}).get("squad") or {}).get("squad") or []):
        for m in g.get("members") or []:
            if m.get("injured") and m.get("id"):
                inj[int(m["id"])] = str((m.get("injury") or {}).get("expectedReturn") or "")
    return {"past": sorted(past), "next": sorted(nxt)[:1], "inj": inj}


def fm_next_match(mid, tid):
    """-> {unav: {fm: {...}}, lineup: set(fm) se formazione (probabile o ufficiale), d}"""
    j = get("https://www.fotmob.com/api/data/matchDetails?matchId=%s" % mid)
    lu = ((j or {}).get("content") or {}).get("lineup") or {}
    for side in ("homeTeam", "awayTeam"):
        t = lu.get(side) or {}
        if t.get("id") != tid:
            continue
        ids = {p.get("id") for p in (t.get("starters") or []) + (t.get("subs") or []) if isinstance(p, dict)}
        un = {}
        for p in t.get("unavailable") or []:
            u = p.get("unavailability") or {}
            un[p.get("id")] = {"type": u.get("type"), "e": u.get("expectedReturn")}
        return {"unav": un, "lineup": ids - {None}, "type": lu.get("lineupType")}
    return None


# ---------------------------------------------------------------- LiveScore
def ls_day(ymd):
    j = get(LS + f"date/soccer/{ymd}/1?countryCode=GB&locale=en&MD=1") or {}
    out = []
    for s in j.get("Stages", []):
        for x in s.get("Events", []):
            t1, t2 = (x.get("T1") or [{}])[0], (x.get("T2") or [{}])[0]
            i1 = re.search(r"enet/(\d+)\.png", t1.get("Img") or "")
            i2 = re.search(r"enet/(\d+)\.png", t2.get("Img") or "")
            out.append({"eid": x.get("Eid"), "d": f"{ymd[:4]}-{ymd[4:6]}-{ymd[6:]}", "fin": str(x.get("Eps") or "") in ("FT", "AET", "AP", "Pen."),
                        "ns": str(x.get("Eps") or "") == "NS", 1: int(i1.group(1)) if i1 else None, 2: int(i2.group(1)) if i2 else None})
    return out


def ls_lineup(eid):
    j = get(LS + f"lineups/soccer/{eid}?locale=en")
    res = {}
    for t in (j or {}).get("Lu") or []:
        ps = [(" ".join(x for x in (p.get("Fn"), p.get("Ln")) if x), p.get("Pnt")) for p in t.get("Ps") or []]
        isl = [{"n": " ".join(x for x in (p.get("Fn"), p.get("Ln")) if x), "slug": p.get("Pnt"), "r": p.get("Rs"), "rton": p.get("Rton"), "rs": p.get("RtonS"), "rt": p.get("Rt")}
               for p in t.get("IS") or []]
        res[t.get("Tnb")] = {"ps": ps, "is": isl}
    return res


def name_keys(n, slug=None):
    w = norm(n)
    ks = set()
    if w:
        ks.add(" ".join(w))
        ks.add(" ".join(sorted(w)))
        if len(w) >= 2:
            ks.add(w[0][0] + " " + w[-1])
    if slug:
        ks.add(" ".join(norm(slug)))
    return ks


def team_matcher(players):
    """players: [(fm, nome)] della stessa squadra -> funzione nome/slug LiveScore -> fm (solo se univoco)."""
    idx = {}
    for fm, n in players:
        for k in name_keys(n):
            idx.setdefault(k, set()).add(fm)
        w = norm(n)
        if w:
            idx.setdefault("~" + w[-1], set()).add(fm)
    def find(n, slug=None):
        for k in [*name_keys(n, slug)]:
            s = idx.get(k)
            if s and len(s) == 1:
                return next(iter(s))
        w = norm(n)
        if w:
            s = idx.get("~" + w[-1])
            if s and len(s) == 1:
                return next(iter(s))
        return None
    return find


# ---------------------------------------------------------------- decisione
def kind_of(reason, rt=None):
    r = str(reason or "").lower()
    return "sus" if re.search(r"suspen|red card|yellow card|\bban\b", r) else "inj"


def decide(P, F, T, N, L, use_ls):
    """Una voce per giocatore: fuori (inj/sus/abs) o niente. use_ls=False: solo FotMob (file del repository)."""
    out, stat = {}, {"inj": 0, "sus": 0, "abs": 0, "rientrati": 0, "dubbi": 0}
    for fm, info in P.items():
        f = F.get(fm)
        if not f:
            continue
        tid = f.get("tid")
        team = T.get(tid) or {"past": [], "next": []}
        nm = N.get(tid) or {}
        ls = (L.get(tid) or {}) if use_ls else {}
        # ultima distinta col club (FotMob, e LiveScore se attivo)
        last_sq = max([d for d, _ in f["sq"]] + ([d for d in ls.get("sq", {}).get(fm, [])] if use_ls else []), default=None)
        in_next_lineup = fm in (nm.get("lineup") or set()) or (use_ls and fm in (ls.get("next_ps") or set()))
        cands = []
        if f.get("inj"):
            cands.append(dict(f["inj"]))
        if not f.get("inj") and fm in (team.get("inj") or {}):
            e = team["inj"][fm]
            ed, dub = ret_text(e, TODAY)
            cands.append({"r": "Injury", "k": "inj", "ed": ed, "e": e or None, "s": add(last_sq, 1) if last_sq else TODAY, "dub": dub, "src": "fm-squad"})
        u = (nm.get("unav") or {}).get(fm)
        if u:
            ed, dub = ret_text(u.get("e"), TODAY)
            k = "sus" if "susp" in str(u.get("type") or "").lower() or "card" in str(u.get("type") or "").lower() else "inj"
            if k == "sus" and nm.get("d"):
                ed = add(nm["d"], 1)
            cands.append({"r": "Suspension" if k == "sus" else (u.get("type") or "Injury").capitalize(), "k": k, "ed": ed, "e": u.get("e"), "s": TODAY, "dub": dub, "src": "fm-next"})
        if use_ls and fm in (ls.get("is") or {}):
            x = ls["is"][fm]
            ed = None
            if x.get("rton"):
                s = str(x["rton"])
                ed = f"{s[:4]}-{s[4:6]}-{s[6:8]}"
            dub = False
            if not ed:
                ed, dub = ret_text(x.get("rs"), x.get("d") or TODAY)
            k = kind_of(x.get("r"), x.get("rt"))
            if k == "sus" and not ed and ls.get("next_d"):
                ed = add(ls["next_d"], 1)
            cands.append({"r": x.get("r") or "Injury", "k": k, "ed": ed, "e": x.get("rs"), "s": x.get("d") or TODAY, "dub": dub, "src": "ls"})
        # rientrato: in distinta dopo la notizia, o nella formazione della prossima partita
        live = []
        for c in cands:
            c.setdefault("k", kind_of(c.get("r")))
            if in_next_lineup or (last_sq and c.get("s") and last_sq > c["s"]) or (c.get("ed") and c["ed"] <= TODAY):
                stat["rientrati"] += 1
                continue
            live.append(c)
        sure = [c for c in live if not c["dub"]]
        # "In dubbio" / "Back in training" da solo non esclude; ma se dopo la notizia il club ha giocato almeno 2 partite
        # (coperte da formazioni) e lui non e' mai tornato in distinta, e' ancora fuori (caso Alex Scott, ottobre 2026)
        if live and not sure:
            cov_d = set(team.get("cov") or []) | (set(ls.get("cov") or []) if use_ls else set())
            for c in live:
                since = [d for d, _ in team["past"] if d >= (c.get("s") or TODAY) and d in cov_d and (last_sq is None or d > last_sq)]
                if len(since) >= 2:
                    sure.append(dict(c, dub=False, src="dub+abs"))
        if live and not sure:
            stat["dubbi"] += 1
        res = None
        if sure:
            # due fonti che non concordano sul rientro: vale la data piu' lontana (o nessuna data = fuori finche' non rientra)
            dated = [c for c in sure if c["ed"]]
            best = max(dated, key=lambda c: c["ed"]) if dated else sure[0]
            res = {"k": best["k"], "r": best["r"], "ed": best["ed"], "e": best.get("e"), "s": best["s"], "src": sorted({c["src"] for c in sure})}
        if not res and not in_next_lineup:
            # nessuna fonte lo dichiara: fuori dalla distinta del club da almeno 2 partite di fila e da almeno 10 giorni
            cov = set(team.get("cov") or [])
            if use_ls:
                cov |= set(ls.get("cov") or [])
            missed = [d for d, mid in team["past"] if (last_sq is None or d > last_sq) and (d in cov)]
            # fuori da 3 partite di fila (e da 14 giorni) o da 2 ma da almeno 3 settimane: una sola rotazione in coppa non basta
            if team["past"] and ((len(missed) >= 3 and (last_sq is None or last_sq <= add(TODAY, -14))) or (len(missed) >= 2 and last_sq is not None and last_sq <= add(TODAY, -21))):
                if True:
                    res = {"k": "abs", "r": None, "ed": None, "e": None, "s": missed[0], "n": len(missed), "ul": last_sq, "src": ["fm-abs"]}
        if res:
            stat[res["k"]] += 1
            for i in info["ids"]:
                out[i] = res
    return out, stat


def main():
    P = load_players()
    if os.environ.get("ONLY_TEAM"):   # prove locali: solo i giocatori di una squadra (nome come in giocatori.json)
        g = json.load(open("giocatori.json"))["players"]
        keep = {int(p["f"]) for p in g if p.get("f") and p.get("t") == os.environ["ONLY_TEAM"]}
        P = {k: v for k, v in P.items() if k in keep}
    print("giocatori da controllare", len(P), flush=True)
    F = {}
    with ThreadPoolExecutor(8) as ex:
        for fm, r in zip(P, ex.map(lambda fm: None if late() else fm_player(fm), list(P))):
            if r:
                F[fm] = r
    print("FotMob giocatori letti", len(F), "minuti", round((time.time() - T0) / 60, 1), flush=True)
    tids = sorted({f["tid"] for f in F.values() if f.get("tid")})
    T = {}
    with ThreadPoolExecutor(8) as ex:
        for tid, r in zip(tids, ex.map(fm_team, tids)):
            T[tid] = r or {"past": [], "next": []}
    # partite "coperte": ce n'e' traccia nella distinta di almeno un nostro giocatore della squadra (FotMob ha le formazioni)
    seen = {}
    for f in F.values():
        for d, _ in f["sq"]:
            seen.setdefault(f.get("tid"), set()).add(d)
    for tid, t in T.items():
        t["cov"] = sorted(seen.get(tid, set()))
    N = {}
    jobs = [(tid, t["next"][0]) for tid, t in T.items() if t["next"]]
    with ThreadPoolExecutor(8) as ex:
        for (tid, (d, mid)), r in zip(jobs, ex.map(lambda a: fm_next_match(a[1][1], a[0]), jobs)):
            if r:
                r["d"] = d
                N[tid] = r
    print("squadre", len(T), "prossime partite FotMob", len(N), flush=True)

    # LiveScore: eventi da 10 giorni fa a 3 giorni avanti, abbinati alle squadre FotMob dallo stemma enet/<id FotMob>
    L = {}
    lsrep = {"squadre_abbinate": 0, "con_IS": 0}
    try:
        days = [(NOW + timedelta(days=k)).strftime("%Y%m%d") for k in range(-10, 4)]
        with ThreadPoolExecutor(6) as ex:
            evs = [e for day in ex.map(ls_day, days) for e in day]
        by_team = {}
        for e in evs:
            for side in (1, 2):
                if e[side] in T:
                    by_team.setdefault(e[side], []).append((e, side))
        roster = {}
        for fm, f in F.items():
            roster.setdefault(f.get("tid"), []).append((fm, P[fm]["n"]))
        def work(tid):
            if late():
                return tid, None
            lst = sorted(by_team.get(tid, []), key=lambda x: x[0]["d"])
            fin = [x for x in lst if x[0]["fin"]][-3:]
            nxt = [x for x in lst if x[0]["ns"]][:1]
            find = team_matcher(roster.get(tid, []))
            r = {"sq": {}, "is": {}, "cov": [], "next_ps": set(), "next_d": nxt[0][0]["d"] if nxt else None}
            ref = None   # partita di riferimento per l'elenco IS: la prossima se l'elenco c'e' gia', altrimenti l'ultima giocata
            for e, side in fin:
                lu = (ls_lineup(e["eid"]) or {}).get(side)
                if not lu:
                    continue
                if lu["ps"]:
                    r["cov"].append(e["d"])
                for n, slug in lu["ps"]:
                    fm = find(n, slug)
                    if fm:
                        r["sq"].setdefault(fm, []).append(e["d"])
                ref = (e, lu)
            for e, side in nxt:
                lu = (ls_lineup(e["eid"]) or {}).get(side)
                if not lu:
                    continue
                if len(lu["ps"]) >= 11:
                    for n, slug in lu["ps"]:
                        fm = find(n, slug)
                        if fm:
                            r["next_ps"].add(fm)
                if lu["is"]:
                    ref = (e, lu)
            if ref:
                e, lu = ref
                for x in lu["is"]:
                    fm = find(x["n"], x["slug"])
                    if fm:
                        x["d"] = e["d"]
                        r["is"][fm] = x
            return tid, r
        with ThreadPoolExecutor(6) as ex:
            for tid, r in ex.map(work, [t for t in T if t in by_team]):
                if r:
                    L[tid] = r
                    lsrep["squadre_abbinate"] += 1
                    lsrep["con_IS"] += bool(r["is"])
    except Exception as e:
        print("LiveScore non disponibile:", e, flush=True)
    print("LiveScore", lsrep, "minuti", round((time.time() - T0) / 60, 1), flush=True)

    upd = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    fm_only, st_fm = decide(P, F, T, N, L, use_ls=False)
    full, st_full = decide(P, F, T, N, L, use_ls=True)
    # se il giro e' stato interrotto dal tempo, chi non e' stato riletto mantiene la voce precedente (mai sparire per un errore di rete)
    if len(F) < len(P) * 0.9:
        try:
            old = json.load(open(OUT)).get("p", {})
            done = {i for fm in F for i in P[fm]["ids"]}
            for i, v in old.items():
                if i not in done and i not in fm_only and isinstance(v, dict) and v.get("k"):
                    fm_only[i] = v
        except Exception:
            pass
    json.dump({"updated_at": upd, "p": fm_only}, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    kv_ok = False
    if KV_ON and L:
        from rose_livescore import kv_put
        kv_ok = bool(kv_put([(KV_KEY, {"updated_at": upd, "p": full})]))
    os.makedirs("report", exist_ok=True)
    json.dump({"updated_at": upd, "giocatori": len(P), "letti_fotmob": len(F), "squadre": len(T), "prossime_fotmob": len(N),
               "livescore": lsrep, "solo_fotmob": st_fm, "completo": st_full, "kv_scritto": kv_ok,
               "minuti": round((time.time() - T0) / 60, 1)}, open(REPORT, "w"), ensure_ascii=False, indent=1)
    print("solo FotMob", st_fm, "| completo", st_full, "| KV", kv_ok, flush=True)


if __name__ == "__main__":
    main()
