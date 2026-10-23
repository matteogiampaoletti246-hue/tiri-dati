#!/usr/bin/env python3
"""Diagnosi LIVE 3: prova la fonte alternativa ESPN (pubblica, senza chiave) durante una partita. Scrive diag_live2.json."""
import json, time, urllib.request, urllib.error
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


SOFA = "https://api.sofascore.com/api/v1"
HDR = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
       "Accept": "application/json", "Referer": "https://www.sofascore.com/", "Origin": "https://www.sofascore.com"}

def sget(path):
    try:
        req = urllib.request.Request(SOFA + path, headers=HDR)
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, {"_errore": str(e)[:100]}
    except Exception as e:
        return 0, {"_errore": str(e)[:150]}

def prova_sofascore(d):
    out = {}
    st, j = sget("/sport/football/events/live")
    out["live_status"] = st
    evs = j.get("events", []) if isinstance(j, dict) else []
    out["live_n"] = len(evs)
    pick = None
    for e in evs:
        n = (e.get("homeTeam", {}).get("name", "") + " - " + e.get("awayTeam", {}).get("name", ""))
        if "Torino" in n or "Monza" in n:
            pick = e
    pick = pick or (evs[0] if evs else None)
    if not pick:
        out["errore"] = short(j, 300); d["sofascore"] = out; return
    eid = pick["id"]
    out["partita"] = pick.get("homeTeam", {}).get("name") + " - " + pick.get("awayTeam", {}).get("name")
    out["status"] = short(pick.get("status"), 200)
    for nome, path in (("statistiche", f"/event/{eid}/statistics"), ("momentum", f"/event/{eid}/graph"), ("formazioni", f"/event/{eid}/lineups"),
                       ("incidenti", f"/event/{eid}/incidents"), ("dettaglio", f"/event/{eid}"), ("tiri", f"/event/{eid}/shotmap")):
        st, j = sget(path)
        time.sleep(1)
        o = {"http": st}
        if st == 200:
            if nome == "statistiche":
                o["periodi"] = [p.get("period") for p in j.get("statistics", [])]
                o["gruppi"] = [g.get("groupName") for g in (j.get("statistics") or [{}])[0].get("groups", [])]
                o["voci"] = [[i.get("name"), i.get("home"), i.get("away")] for g in (j.get("statistics") or [{}])[0].get("groups", []) for i in g.get("statisticsItems", [])][:70]
            elif nome == "momentum":
                o["chiavi"] = list(j.keys()); o["punti_n"] = len(j.get("graphPoints", [])); o["esempio"] = short(j.get("graphPoints", [])[:5], 300)
            elif nome == "formazioni":
                o["chiavi"] = list(j.keys()); h = j.get("home", {}); o["formazione"] = h.get("formation")
                pl = h.get("players", []); o["giocatori_n"] = len(pl)
                if pl: o["giocatore_esempio"] = short(pl[0], 1500)
            elif nome == "incidenti":
                o["n"] = len(j.get("incidents", [])); o["esempio"] = short(j.get("incidents", [])[:4], 1200)
            elif nome == "dettaglio":
                ev = j.get("event", {}); o["arbitro"] = short(ev.get("referee"), 200); o["stadio"] = short(ev.get("venue"), 300); o["meteo"] = short(ev.get("weather") or ev.get("weatherCondition"), 200)
            else:
                o["chiavi"] = list(j.keys()); o["n"] = len(j.get("shotmap", []))
        else:
            o["errore"] = short(j, 200)
        out[nome] = o
    d["sofascore"] = out

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
        a["gameInfo_completo"] = short(s.get("gameInfo"), 3000)
        a["player_stat_nomi"] = sorted({st.get("name") for r in ro for p in (r.get("roster") or []) for st in (p.get("stats") or [])})
        a["roster_flag_esempio"] = [[p.get("athlete", {}).get("displayName"), p.get("starter"), p.get("subbedIn"), p.get("subbedOut"), (p.get("position") or {}).get("abbreviation"), p.get("formationPlace")] for r in ro for p in (r.get("roster") or [])][:40]
        ke = s.get("keyEvents", []) or []
        tipi = {}
        for e in ke:
            t = (e.get("type") or {}).get("type")
            tipi.setdefault(t, e)
        a["keyEvents_tipi"] = {k: short(v, 900) for k, v in tipi.items()}
        a["commentary_esempio"] = short((s.get("commentary") or [])[:3], 1200)
        a["momentum_o_win_prob"] = short(s.get("winprobability") or s.get("plays"), 300)
        a["altre_chiavi_utili"] = {k: short(s.get(k), 200) for k in ("officials", "venue", "odds", "standings") if k in s}
        d["analisi"].append(a)
        time.sleep(30)
        s2 = get(f"{BASE}/{lg}/summary?event={eid}")
        a["dopo_30s"] = {"keyEvents_n": len(s2.get("keyEvents", []) or []), "stato": short(((s2.get("header") or {}).get("competitions") or [{}])[0].get("status"), 300)}
    try:
        prova_sofascore(d)
    except Exception as e:
        d["sofascore"] = {"errore_script": str(e)[:200]}
    json.dump(d, open("diag_live2.json", "w"), ensure_ascii=False, indent=1, default=str)
    print("Scritto diag_live2.json | partite live trovate:", len(live))

if __name__ == "__main__":
    main()

