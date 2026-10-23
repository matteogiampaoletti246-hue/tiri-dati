#!/usr/bin/env python3
"""Diagnosi LIVE: cosa fornisce PitchAPI durante le partite in corso. Scrive diag_live.json."""
import json, sys, time, urllib.request, urllib.error, urllib.parse
from datetime import datetime, timezone, timedelta
from update_data import api, find_league, WANTED, PAUSE, KEY, BASE
from update_angoli import season_of

def raw(path):
    req = urllib.request.Request(BASE + path, headers={"X-API-KEY": KEY, "User-Agent": "tiri-dati/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, {k: v for k, v in r.headers.items() if any(t in k.lower() for t in ("limit", "remaining", "reset", "retry", "quota", "cache", "age", "date"))}, r.read().decode()[:400]
    except urllib.error.HTTPError as e:
        return e.code, {}, e.read().decode()[:200]
    except Exception as ex:
        return None, {}, str(ex)[:200]

def shape(x, depth=0):
    if isinstance(x, dict):
        return {k: (shape(v, depth + 1) if depth < 2 else type(v).__name__) for k, v in list(x.items())[:40]}
    if isinstance(x, list):
        return [len(x), shape(x[0], depth + 1) if x else None]
    return x if isinstance(x, (int, float, bool)) or x is None else str(x)[:60]

def main():
    if not KEY:
        sys.exit("Manca PITCHAPI_KEY")
    d = {"adesso_utc": datetime.now(timezone.utc).isoformat()}
    st, hd, body = raw("/v1/leagues")
    d["intestazioni_quota"] = {"status": st, "headers": hd}
    sond = {}
    for p in ("/v1/matches/live", "/v1/live", "/v1/livescores", "/v1/matches?status=live", "/v1/matches/today", "/v1/live/matches"):
        st, hd, body = raw(p)
        sond[p] = {"status": st, "inizio": body[:300]}
        time.sleep(PAUSE)
    d["endpoint_live"] = sond
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    now = datetime.now(timezone.utc)
    stati, cand, recenti = {}, [], []
    for key, cc, rx, ex in WANTED:
        found = find_league(leagues, cc, rx, ex)
        if not found:
            continue
        lg = found[0]
        s = season_of(lg)
        if not s:
            continue
        q = urllib.parse.quote(s, safe="")
        for m in (api(f"/v1/leagues/{lg['id']}/matches?season={q}") or {}).get("matches", []):
            stati[str(m.get("status"))] = stati.get(str(m.get("status")), 0) + 1
            try:
                t = datetime.fromisoformat(str(m.get("time_utc") or m.get("date")).replace("Z", "+00:00"))
                if t.tzinfo is None: t = t.replace(tzinfo=timezone.utc)
            except Exception:
                continue
            info = {"lega": key, "id": m["id"], "match": m["home_team"]["name"] + " - " + m["away_team"]["name"], "status": m.get("status"),
                    "inizio": t.isoformat(), "score": [m.get("score_home"), m.get("score_away")], "campi": sorted(m.keys())}
            if m.get("status") not in ("finished", "scheduled", "upcoming", "postponed", "cancelled") and now - timedelta(hours=3) < t < now + timedelta(minutes=5):
                cand.append(info)
            elif m.get("status") == "finished":
                recenti.append((t, info))
        time.sleep(PAUSE)
    d["conteggio_stati"] = stati
    d["in_corso"] = cand
    recenti.sort(key=lambda x: x[0])
    d["ultima_finita"] = recenti[-1][1] if recenti else None
    target = cand[:2] or ([recenti[-1][1]] if recenti else [])
    d["analisi"] = []
    for info in target:
        mid = info["id"]; e = {"match": info["match"], "status": info["status"], "tipo": "LIVE" if cand else "FINITA (nessuna live ora)"}
        for name, path in (("partita", f"/v1/matches/{mid}"), ("eventi", f"/v1/matches/{mid}/events"), ("stats", f"/v1/matches/{mid}/stats"),
                           ("formazioni", f"/v1/matches/{mid}/lineups"), ("giocatori", f"/v1/matches/{mid}/players")):
            try:
                r = api(path)
            except Exception as ex:
                e[name] = "errore " + str(ex)[:100]; continue
            time.sleep(PAUSE)
            e[name] = {"struttura": shape(r)}
            if name == "eventi":
                ev = r.get("events") if isinstance(r, dict) else r
                e[name]["numero"] = len(ev or [])
                e[name]["esempi"] = (ev or [])[:4]
                e[name]["tipi"] = sorted({str(x.get("event_type")) for x in ev or []})
            if name == "partita":
                e[name]["completo"] = r
        if cand:
            time.sleep(25)
            a, b = api(f"/v1/matches/{mid}"), api(f"/v1/matches/{mid}/stats")
            e["dopo_25s"] = {"partita": a, "stats_len": len(json.dumps(b))}
        d["analisi"].append(e)
    json.dump(d, open("diag_live.json", "w"), ensure_ascii=False, indent=1, default=str)
    print("Scritto diag_live.json. Stati:", stati, "| live ora:", len(cand))

if __name__ == "__main__":
    main()
