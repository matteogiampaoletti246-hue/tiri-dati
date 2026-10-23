#!/usr/bin/env python3
"""Diagnosi LIVE 2: stati delle partite in corso e contenuto delle statistiche. Scrive diag_live2.json."""
import json, sys, time, urllib.parse
from datetime import datetime, timezone, timedelta
from update_data import api, find_league, WANTED, PAUSE, KEY
from update_angoli import season_of

def parse_t(m):
    t = datetime.fromisoformat(str(m.get("time_utc") or m.get("date")).replace("Z", "+00:00"))
    return t if t.tzinfo else t.replace(tzinfo=timezone.utc)

def stat_keys(s):
    out = {}
    for per in (s or {}).get("periods") or []:
        keys = []
        for g in per.get("groups", []):
            for i in g.get("items", []):
                keys.append(g.get("title", "?") + " | " + str(i.get("key")) + " | " + str(i.get("title")) + " | " + str(i.get("home")) + " - " + str(i.get("away")))
        out[str(per.get("period"))] = keys
    return out

def pl_keys(lst):
    ks = {}
    for x in (lst.get("players") if isinstance(lst, dict) else lst) or []:
        for g in x.get("stats") or []:
            for k, e in (g.get("stats") or {}).items():
                if isinstance(e, dict):
                    ks[e.get("key") or k] = e.get("title")
    return ks

def main():
    if not KEY:
        sys.exit("Manca PITCHAPI_KEY")
    d = {"adesso_utc": datetime.now(timezone.utc).isoformat()}
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    now = datetime.now(timezone.utc)
    cand, ult, stati_up, fut = [], None, {}, []
    prov = {}
    for key, cc, rx, ex in WANTED:
        found = find_league(leagues, cc, rx, ex)
        if not found:
            continue
        lg = found[0]; s = season_of(lg)
        if not s:
            continue
        q = urllib.parse.quote(s, safe="")
        if not prov:
            for st in ("live", "inprogress", "in_progress", "ongoing", "started"):
                try:
                    r = api(f"/v1/leagues/{lg['id']}/matches?season={q}&status={st}")
                    prov[st] = {"n": len((r or {}).get("matches", [])) if r else None, "statuses": sorted({str(m.get('status')) for m in (r or {}).get('matches', [])})[:5]}
                except Exception as e:
                    prov[st] = "errore " + str(e)[:120]
                time.sleep(PAUSE)
        for m in (api(f"/v1/leagues/{lg['id']}/matches?season={q}&status=upcoming") or {}).get("matches", []):
            stati_up[str(m.get("status"))] = stati_up.get(str(m.get("status")), 0) + 1
            if len(fut) < 12:
                fut.append(m)
            try:
                t = parse_t(m)
            except Exception:
                continue
            if t <= now + timedelta(minutes=2) and t > now - timedelta(hours=4):
                cand.append({"lega": key, "id": m["id"], "match": m["home_team"]["name"] + " - " + m["away_team"]["name"], "status": m.get("status"), "inizio": t.isoformat(), "oggetto": m})
        for m in (api(f"/v1/leagues/{lg['id']}/matches?season={q}") or {}).get("matches", []):
            if m.get("status") == "finished":
                try:
                    t = parse_t(m)
                except Exception:
                    continue
                if not ult or t > ult[0]:
                    ult = (t, m)
        time.sleep(PAUSE)
    d["prove_status"] = prov
    d["stati_upcoming"] = stati_up
    d["partite_gia_iniziate"] = cand
    tgt = cand[:2]
    if ult:
        d["ultima_finita"] = {"id": ult[1]["id"], "match": ult[1]["home_team"]["name"] + " - " + ult[1]["away_team"]["name"]}
    d["arbitro_future"] = []
    for m in sorted(fut, key=lambda x: str(x.get("time_utc") or x.get("date")))[:10]:
        det = api(f"/v1/matches/{m['id']}"); time.sleep(PAUSE)
        d["arbitro_future"].append({"match": m["home_team"]["name"] + " - " + m["away_team"]["name"], "inizio": m.get("time_utc"), "referee": (det or {}).get("referee"), "stadium": (det or {}).get("stadium")})
    d["analisi_live"] = []
    for c in tgt:
        mid = c["id"]; e = {"match": c["match"]}
        e["partita"] = api(f"/v1/matches/{mid}"); time.sleep(PAUSE)
        ev = api(f"/v1/matches/{mid}/events"); time.sleep(PAUSE)
        e["eventi_n"] = len((ev or {}).get("events", [])); e["eventi_ultimi"] = ((ev or {}).get("events") or [])[-3:]
        st = api(f"/v1/matches/{mid}/stats"); time.sleep(PAUSE)
        e["stats"] = stat_keys(st)
        lu = api(f"/v1/matches/{mid}/lineups"); time.sleep(PAUSE)
        e["formazioni_confermate"] = {k: (lu or {}).get(k, {}).get("confirmed") for k in ("home", "away")}
        pl = api(f"/v1/matches/{mid}/players"); time.sleep(PAUSE)
        e["giocatori_n"] = len((pl or {}).get("players", pl) or []) if pl else 0
        time.sleep(30)
        e["dopo_30s"] = {"partita": api(f"/v1/matches/{mid}"), "stats": stat_keys(api(f"/v1/matches/{mid}/stats"))}
        e["momentum"] = api(f"/v1/matches/{mid}/momentum"); time.sleep(PAUSE)
        sh = api(f"/v1/matches/{mid}/shots"); time.sleep(PAUSE)
        e["shots_chiavi"] = list(sh.keys()) if isinstance(sh, dict) else None
        e["shots_esempio"] = json.dumps(sh, default=str)[:1500] if sh else None
        d["analisi_live"].append(e)
    if ult:
        mid = ult[1]["id"]
        s = api(f"/v1/matches/{mid}/stats"); time.sleep(PAUSE)
        d["chiavi_stats_finita"] = stat_keys(s)
        p = api(f"/v1/matches/{mid}/players"); time.sleep(PAUSE)
        d["chiavi_giocatore_finita"] = pl_keys(p)
        ev = api(f"/v1/matches/{mid}/events"); time.sleep(PAUSE)
        d["tipi_evento"] = sorted({str(x.get("event_type")) for x in (ev or {}).get("events", [])})
        d["esempio_sostituzione"] = next((x for x in (ev or {}).get("events", []) if x.get("event_type") == "substitution"), None)
        h = api(f"/v1/matches/{mid}/players/halves"); time.sleep(PAUSE)
        d["halves_esiste"] = h is not None
    json.dump(d, open("diag_live2.json", "w"), ensure_ascii=False, indent=1, default=str)
    print("Scritto diag_live2.json | già iniziate:", len(cand), "| prove:", prov)

if __name__ == "__main__":
    main()
