#!/usr/bin/env python3
"""Diagnosi LIVE 3: prova la fonte alternativa ESPN (pubblica, senza chiave) durante una partita. Scrive diag_live2.json."""
import json, time, urllib.request
from datetime import datetime, timezone

BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer"
LEGHE = ["ita.1", "eng.1", "esp.1", "ger.1", "fra.1", "uefa.champions", "uefa.europa"]

def get(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"_errore": str(e)[:200]}

def short(x, n=1500):
    return json.dumps(x, ensure_ascii=False, default=str)[:n]

def main():
    d = {"adesso_utc": datetime.now(timezone.utc).isoformat(), "leghe": {}}
    live = []
    for lg in LEGHE:
        sb = get(f"{BASE}/{lg}/scoreboard")
        if "_errore" in sb:
            d["leghe"][lg] = sb; continue
        evs = sb.get("events", [])
        d["leghe"][lg] = [{"id": e.get("id"), "nome": e.get("name"), "stato": (e.get("status") or {}).get("type", {}).get("state"),
                           "descr": (e.get("status") or {}).get("type", {}).get("description"), "clock": (e.get("status") or {}).get("displayClock")} for e in evs]
        for e in evs:
            if (e.get("status") or {}).get("type", {}).get("state") == "in":
                live.append((lg, e["id"], e.get("name")))
    d["live"] = live
    d["analisi"] = []
    for lg, eid, nome in live[:2]:
        s = get(f"{BASE}/{lg}/summary?event={eid}")
        a = {"match": nome, "chiavi": list(s.keys())}
        a["gameInfo"] = short(s.get("gameInfo"), 1500)
        a["header_stato"] = short(((s.get("header") or {}).get("competitions") or [{}])[0].get("status"), 500)
        a["keyEvents_n"] = len(s.get("keyEvents", []) or [])
        a["keyEvents_esempio"] = short((s.get("keyEvents") or [])[:4], 1500)
        a["commentary_n"] = len(s.get("commentary", []) or [])
        bs = (s.get("boxscore") or {}).get("teams", [])
        a["team_stats"] = [[x.get("name"), x.get("displayValue")] for t in bs for x in (t.get("statistics") or [])][:60]
        ro = s.get("rosters") or []
        a["rosters_n"] = len(ro)
        if ro:
            r0 = ro[0]
            a["roster_chiavi"] = list(r0.keys())
            a["formazione"] = r0.get("formation")
            pl = (r0.get("roster") or [])
            a["roster_n"] = len(pl)
            if pl:
                a["giocatore_esempio"] = short(pl[0], 1800)
        a["momentum_o_win_prob"] = short(s.get("winprobability") or s.get("plays"), 300)
        a["altre_chiavi_utili"] = {k: short(s.get(k), 200) for k in ("officials", "venue", "odds", "standings") if k in s}
        d["analisi"].append(a)
        time.sleep(30)
        s2 = get(f"{BASE}/{lg}/summary?event={eid}")
        a["dopo_30s"] = {"keyEvents_n": len(s2.get("keyEvents", []) or []), "stato": short(((s2.get("header") or {}).get("competitions") or [{}])[0].get("status"), 300)}
    json.dump(d, open("diag_live2.json", "w"), ensure_ascii=False, indent=1, default=str)
    print("Scritto diag_live2.json | partite live trovate:", len(live))

if __name__ == "__main__":
    main()
