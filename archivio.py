#!/usr/bin/env python3
"""Archivio storico competizioni FotMob (dal 2010). Riprendibile: salta quanto già scaricato.
Per ogni (lega, stagione): arch/{lid}/{stagione}.json = tabella+zone+partite ; {stagione}_s.json = statistiche squadre/giocatori."""
import json, os, sys, time, gzip, urllib.request, urllib.parse
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
BUDGET = float(os.environ.get("BUDGET_MIN", "320")) * 60
T0 = time.time()
def get(url, tries=3):
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
            try: r = gzip.decompress(r)
            except Exception: pass
            return json.loads(r)
        except Exception as e:
            time.sleep(1.5 * (i + 1))
    return None
def dump(p, o):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    json.dump(o, open(p, "w"), ensure_ascii=False, separators=(",", ":"))
def compact_fix(m):
    s = m.get("status", {})
    return [m.get("id"), m.get("round"), m["home"]["id"], m["away"]["id"], s.get("utcTime"), s.get("scoreStr"), int(bool(s.get("finished"))), int(bool(s.get("started"))), int(bool(s.get("cancelled")))]
INDEX = os.environ.get("INDEX", "arch/index.json")
ONLY = [x for x in os.environ.get("ONLY_IDS", "").split(",") if x]

# Primi 20 campionati per ranking (+ tutte le competizioni internazionali): storico completo dal 2010.
# Gli altri: calendario e classifica dal 2010, statistiche e dettaglio partite solo dal 2020.
TOP20 = {47,87,55,54,53,57,61,48,86,146,71,40,64,268,112,130,230,38,59,135}
def storico_ridotto(lid, c, sk):
    return int(lid) not in TOP20 and c != "INT" and int(str(sk)[:4]) < 2020
MINYEAR = int(os.environ.get("MINYEAR", "2010"))
# ordine di priorità: top campionati e paesi principali prima, poi il resto
PRIO = ["ITA", "ENG", "ESP", "GER", "FRA", "POR", "NED", "TUR", "BEL", "SCO", "BRA", "ARG", "USA", "MEX", "COL", "CHI", "URU", "AUT", "SUI", "GRE", "RUS", "UKR", "DEN", "SWE", "NOR", "POL", "CZE", "CRO", "SRB", "ROU"]
# campionati gia' aggiunti all'app (src/data/leagues.js, extra: true): hanno la precedenza su tutto
ADDED = {57, 71, 61, 40, 64, 38, 59, 135}
def run():
    sel = json.load(open("selezione.json"))
    # prima i campionati gia' presenti nell'app (ADDED), poi il resto
    leghe = sorted(sel["internazionali"] + sorted(sel["nazionali"], key=lambda L: (PRIO.index(L["c"]) if L["c"] in PRIO else 99, 0)), key=lambda L: 0 if L["id"] in ADDED else 1)
    if ONLY: leghe = [L for L in leghe if str(L["id"]) in ONLY]
    idx = json.load(open(INDEX)) if os.path.exists(INDEX) else {}
    # le statistiche v1 erano della stagione sbagliata: si rifanno tutte (una volta sola per indice)
    if not os.path.exists(INDEX + ".sv2"):
        for v in idx.values():
            if isinstance(v, dict): v.pop("done", None)
        open(INDEX + ".sv2", "w").write("1")
    for L in leghe:
        lid = str(L["id"])
        if time.time() - T0 > BUDGET: print("budget finito"); break
        e = idx.get(lid, {"n": L["n"], "c": L["c"], "cn": L["cn"], "s": []})
        if e.get("done"): continue
        base = get(f"https://www.fotmob.com/api/data/leagues?id={lid}&ccode3={L['c'] if L['c']!='INT' else 'INT'}")
        if not base: continue
        seasons = base.get("allAvailableSeasons") or [x for x in [base.get("details", {}).get("selectedSeason")] if x]
        seasons = [s for s in seasons if str(s)[:4].isdigit() and int(str(s)[:4]) >= MINYEAR]
        det = base.get("details", {})
        e.update(color=det.get("leagueColor"), type=det.get("type"), tabs=[t for t in base.get("tabs", [])][:8])
        for s in seasons:
            if time.time() - T0 > BUDGET: break
            sk = str(s).replace("/", "-")
            p = f"arch/{lid}/{sk}.json"
            ps = f"arch/{lid}/{sk}_s.json"
            def s_ok():
                try: return os.path.exists(ps) and json.load(open(ps)).get("v") == 2
                except Exception: return False
            have_main, have_s = os.path.exists(p), s_ok()
            ridotto = storico_ridotto(lid, L["c"], sk)
            if ridotto: have_s = True
            if have_main and have_s:
                if sk not in e["s"]: e["s"].append(sk)
                continue
            d = get(f"https://www.fotmob.com/api/data/leagues?id={lid}&season={urllib.parse.quote(str(s))}&ccode3={L['c']}") or None
            if not d: continue
            tb = d.get("table") or []
            tdata = tb[0].get("data", {}) if tb else {}
            tab = tdata.get("table", {}) if isinstance(tdata, dict) else {}
            teams = {}
            for m in d.get("fixtures", {}).get("allMatches", []):
                for k in ("home", "away"):
                    teams[m[k]["id"]] = m[k].get("shortName") or m[k].get("name")
            rows = tab.get("all", []) if isinstance(tab, dict) else []
            for r in rows: teams[r.get("id")] = r.get("shortName") or r.get("name")
            out = {"table": {k: tab.get(k) for k in ("all", "home", "away", "form")} if tab else None, "legend": tdata.get("legend") if isinstance(tdata, dict) else None,
                   "teams": teams, "fix": [compact_fix(m) for m in d.get("fixtures", {}).get("allMatches", [])]}
            if not have_main: dump(p, out)
            # statistiche stagionali
            st = {"players": {}, "teams": {}}
            for lk in (d.get("stats", {}) or {}).get("seasonStatLinks", []) or []:
                pass
            links = (d.get("stats", {}) or {}).get("seasonStatLinks") or []
            # il link giusto e' quello con il nome della stagione richiesta (prima c'era sempre il primo = stagione attuale)
            lk = [x for x in links if str(x.get("Name")) == str(s)] or [x for x in links if str(x.get("Name")).replace("/", "-") == sk]
            tid = lk[0].get("TournamentId") if lk else None
            if tid and not ridotto:
                ref = base.get("stats", {})
                for kind in ("players", "teams"):
                    for it in ref.get(kind, []) or []:
                        nm = (it.get("fetchAllUrl") or "").split("/")[-1]
                        if not nm: continue
                        sj = get(f"https://data.fotmob.com/stats/{lid}/season/{tid}/{nm}")
                        if not sj: continue
                        lst = []
                        for tl in sj.get("TopLists", []):
                            for r in tl.get("StatList", []):
                                lst.append([r.get("ParticiantId") or r.get("ParticipantId"), r.get("ParticipantName"), r.get("TeamId"), r.get("StatValue"), r.get("MinutesPlayed"), r.get("MatchesPlayed"), r.get("Positions")])
                        st[kind][nm.replace(".json", "")] = lst
                        time.sleep(0.15)
                st["v"] = 2
                dump(ps, st)
            if sk not in e["s"]: e["s"].append(sk)
            time.sleep(0.3)
        else:
            e["done"] = True
        idx[lid] = e
        dump(INDEX, idx)
    dump(INDEX, idx)
    ok = all(idx.get(str(L["id"]), {}).get("done") for L in leghe)
    if INDEX == "arch/index.json":
        open("arch/.complete", "w").write("1") if ok else (os.path.exists("arch/.complete") and os.remove("arch/.complete"))
run()
# v2
