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
def run():
    sel = json.load(open("selezione.json"))
    leghe = sel["internazionali"] + sel["nazionali"]
    idx = json.load(open("arch/index.json")) if os.path.exists("arch/index.json") else {}
    for L in leghe:
        lid = str(L["id"])
        if time.time() - T0 > BUDGET: print("budget finito"); break
        e = idx.get(lid, {"n": L["n"], "c": L["c"], "cn": L["cn"], "s": []})
        if e.get("done"): continue
        base = get(f"https://www.fotmob.com/api/data/leagues?id={lid}&ccode3={L['c'] if L['c']!='INT' else 'INT'}")
        if not base: continue
        seasons = base.get("allAvailableSeasons") or [x for x in [base.get("details", {}).get("selectedSeason")] if x]
        seasons = [s for s in seasons if str(s)[:4].isdigit() and int(str(s)[:4]) >= 2010]
        det = base.get("details", {})
        e.update(color=det.get("leagueColor"), type=det.get("type"), tabs=[t for t in base.get("tabs", [])][:8])
        for s in seasons:
            if time.time() - T0 > BUDGET: break
            sk = str(s).replace("/", "-")
            p = f"arch/{lid}/{sk}.json"
            if os.path.exists(p): continue
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
            dump(p, out)
            # statistiche stagionali
            st = {"players": {}, "teams": {}}
            for lk in (d.get("stats", {}) or {}).get("seasonStatLinks", []) or []:
                pass
            links = (d.get("stats", {}) or {}).get("seasonStatLinks") or []
            tid = links[0].get("TournamentId") if links else None
            if tid:
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
                dump(f"arch/{lid}/{sk}_s.json", st)
            if sk not in e["s"]: e["s"].append(sk)
            time.sleep(0.3)
        else:
            e["done"] = True
        idx[lid] = e
        dump("arch/index.json", idx)
    dump("arch/index.json", idx)
run()
