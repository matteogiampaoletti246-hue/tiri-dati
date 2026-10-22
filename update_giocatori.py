#!/usr/bin/env python3
"""Giocatori: tiri, tiri in porta e minuti partita per partita (top 5 campionati + squadre di Champions/Europa League).
Scrive giocatori.json (medie di stagione e ultime 5 partite). Va nella stessa cartella di update_data.py e update_angoli.py."""
import json, os, re, sys, time, urllib.parse
from datetime import datetime, timezone
from update_data import api, find_league, WANTED, SEASON_START, PAUSE, KEY
from update_angoli import TOP5, CUPS, EXTRA, SKIP, tid_of, season_of

CACHE_FILE, OUT_FILE = "cache_giocatori.json", "giocatori.json"
MAX_MIN = float(os.environ.get("MAX_MIN", "35"))   # dopo tot minuti si ferma e salva: le partite mancanti si leggono al giro dopo
VER = 1
MIN_HIT = 50     # minuti minimi (50 compreso) perche' una partita conti per l'hit rate
DIAG = os.environ.get("DIAG", "").lower()    # squadra di cui stampare tutte le partite trovate (controllo)
T0 = time.time()


def stat_val(groups, key):
    """Cerca nelle liste di gruppi la statistica con quella chiave (si legge stat.key, non l'etichetta)."""
    for g in groups or []:
        for entry in (g.get("stats") or {}).values():
            if isinstance(entry, dict) and entry.get("key") == key:
                v = (entry.get("stat") or {}).get("value")
                try:
                    return float(v)
                except (TypeError, ValueError):
                    return None
    return None


def as_list(d, *names):
    if isinstance(d, dict):
        for n in names:
            if isinstance(d.get(n), list):
                return d[n]
        return []
    return d or []


def safe(path):
    try:
        return api(path)
    except Exception as ex:
        print("   (non letto)", path, str(ex)[:120])
        return None


def read_match(mid, dbg):
    """Ritorna [[player_id, team_id, minuti, tiri, tiri in porta], ...] oppure None."""
    pl = as_list(safe(f"/v1/matches/{mid}/players"), "players", "data")
    time.sleep(PAUSE)
    if not pl:
        return None, {}
    names = {}
    shots = {}
    for e in pl:
        p = e.get("player") or {}
        if not p.get("id"):
            continue
        names[p["id"]] = (p.get("name"), e.get("team_id"))
        shots[p["id"]] = {"t": e.get("team_id"), "tot": stat_val(e.get("stats"), "total_shots") or 0.0,
                          "min": stat_val(e.get("stats"), "minutes_played")}
    # tiri in porta: si contano dai tiri della partita (in porta e non parati da un difensore)
    sot = {}
    sh = safe(f"/v1/matches/{mid}/shots")
    time.sleep(PAUSE)
    for per in as_list(sh, "periods"):
        for x in per.get("shots", []) or []:
            pid = (x.get("player") or {}).get("id")
            if pid and x.get("is_on_target") and not x.get("is_blocked"):
                sot[pid] = sot.get(pid, 0) + 1
    # minuti: se non ci sono nell'elenco giocatori, si sommano i due tempi
    if any(v["min"] is None for v in shots.values()):
        hv = safe(f"/v1/matches/{mid}/players/halves")
        time.sleep(PAUSE)
        for e in as_list(hv, "players"):
            pid = (e.get("player") or {}).get("id")
            if pid not in shots:
                continue
            tot, found = 0.0, False
            for per in e.get("periods") or []:
                m = stat_val(per.get("stats"), "minutes_played")
                if m is not None:
                    tot += m; found = True
            if found and shots[pid]["min"] is None:
                shots[pid]["min"] = tot
    if dbg:
        print("   Prima partita letta: giocatori", len(shots), "| con minuti", sum(1 for v in shots.values() if v["min"] is not None),
              "| tiri totali", sum(v["tot"] for v in shots.values()), "| tiri in porta contati", sum(sot.values()))
    rows = [[pid, v["t"], v["min"], v["tot"], sot.get(pid, 0)] for pid, v in shots.items()]
    return rows, names


def main():
    if not KEY:
        sys.exit("Manca la variabile PITCHAPI_KEY (segreto del repository).")
    cache = json.load(open(CACHE_FILE)) if os.path.exists(CACHE_FILE) else {"m": {}, "p": {}, "t": {}}
    cm, pnames, tnames = cache["m"], cache["p"], cache["t"]
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    cup_ids, done, recs = set(), set(), {}
    state = {"first": True, "stop": False, "new": 0}
    skipped = []
    fix = {}        # prossime partite per squadra: nome -> [[data, avversario, 1 se in casa, competizione], ...]

    def add_fix(m, comp):
        h, a = m["home_team"]["name"], m["away_team"]["name"]
        d = str(m.get("date", ""))
        if not d:
            return
        fix.setdefault(h, []).append([d, a, 1, comp])
        fix.setdefault(a, []).append([d, h, 0, comp])

    def reg(t):
        tnames[tid_of(t)] = t["name"]

    def read(m, comp):
        mid = m["id"]
        reg(m["home_team"]); reg(m["away_team"])
        rec = cm.get(mid)
        if rec is None or rec.get("v") != VER:
            if (time.time() - T0) / 60 > MAX_MIN:
                state["stop"] = True
                return
            rows, names = read_match(mid, state["first"])
            state["first"] = False
            if rows is None:
                skipped.append(f"{m.get('date','')[:10]} {m['home_team']['name']} - {m['away_team']['name']} [{comp}] (nessun dato giocatori)")
                return
            for pid, (n, _) in names.items():
                if n:
                    pnames[pid] = n
            rec = {"v": VER, "d": str(m.get("date", ""))[:10], "comp": comp, "p": rows}
            cm[mid] = rec
            state["new"] += 1
            if state["new"] % 40 == 0:
                json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)
        recs[mid] = rec

    todo = [(k, cc, rx, ex, False) for k, cc, rx, ex in WANTED] + [(k, cc, rx, ex, True) for k, cc, rx, ex in EXTRA]
    todo.sort(key=lambda t: t[0] not in CUPS)
    for key, cc, rx, ex, fallback in todo:
        if state["stop"]:
            break
        cand = find_league(leagues, cc, rx, ex)
        if not cand and fallback:
            cand = find_league(leagues, None, rx, ex)
        if not cand:
            continue
        lg = cand[0]
        season = season_of(lg)
        if not season:
            continue
        done.add(lg["id"])
        q = urllib.parse.quote(season, safe="")
        played = (api(f"/v1/leagues/{lg['id']}/matches?season={q}") or {}).get("matches", [])
        future = (api(f"/v1/leagues/{lg['id']}/matches?season={q}&status=upcoming") or {}).get("matches", [])
        for m in played + future:
            if DIAG and DIAG in (m["home_team"]["name"] + " " + m["away_team"]["name"]).lower():
                print(f"   [{DIAG}] {key}: {str(m.get('date',''))[:10]} {m['home_team']['name']} - {m['away_team']['name']} stato={m.get('status')}")
        if key in CUPS:
            for m in played + future:
                cup_ids.add(tid_of(m["home_team"])); cup_ids.add(tid_of(m["away_team"]))
        elif key not in TOP5:
            played = [m for m in played if tid_of(m["home_team"]) in cup_ids or tid_of(m["away_team"]) in cup_ids]
        for m in future:
            if key in TOP5 or key in CUPS or tid_of(m["home_team"]) in cup_ids or tid_of(m["away_team"]) in cup_ids:
                add_fix(m, key)
        print(f"✔ {key}: {len(played)} partite da leggere")
        for m in played:
            read(m, key)
            if state["stop"]:
                break
        json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)

    # altri campionati delle squadre di coppa
    for lg in leagues:
        if state["stop"]:
            break
        if lg["id"] in done or SKIP.search(lg.get("name", "")):
            continue
        season = season_of(lg)
        if not season:
            continue
        q = urllib.parse.quote(season, safe="")
        played = (api(f"/v1/leagues/{lg['id']}/matches?season={q}") or {}).get("matches", [])
        mine = [m for m in played if tid_of(m["home_team"]) in cup_ids or tid_of(m["away_team"]) in cup_ids]
        if not mine:
            continue
        fut = (api(f"/v1/leagues/{lg['id']}/matches?season={q}&status=upcoming") or {}).get("matches", [])
        for m in fut:
            if tid_of(m["home_team"]) in cup_ids or tid_of(m["away_team"]) in cup_ids:
                add_fix(m, "campionato")
        print(f"+ {lg['name']}: {len(mine)} partite di squadre di coppa")
        for m in mine:
            read(m, "campionato")
            if state["stop"]:
                break
        json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)

    # controllo: cosa restituisce il calendario per giorno (partite che il calendario del campionato non contiene)
    for dd in os.environ.get("DIAG_DATES", "").split(","):
        dd = dd.strip()
        if not dd:
            continue
        res = safe(f"/v1/date/{dd}")
        lst = as_list(res, "matches", "data")
        print(f"[date {dd}] tipo={type(res).__name__} partite={len(lst)}")
        if lst:
            print("   campi della prima partita:", sorted(lst[0].keys()) if isinstance(lst[0], dict) else lst[0])
        for m in lst:
            if isinstance(m, dict) and DIAG and DIAG in json.dumps(m, ensure_ascii=False).lower():
                print("   ", json.dumps(m, ensure_ascii=False)[:400])
    print(f"Partite senza dati giocatori: {len(skipped)}")
    for x in skipped[:80]:
        print("   ", x)
    if state["stop"]:
        print(f"⏱ Fermo dopo {MAX_MIN:.0f} minuti: le partite rimaste si leggono al prossimo giro.")
    cutoff = f"{SEASON_START}-07-01"
    for k in [k for k, v in cm.items() if v.get("d") and v["d"] < cutoff]:
        del cm[k]
    json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)

    # una riga per giocatore: medie di stagione (campionato / coppa) e ultime 5 partite
    per = {}
    for r in cm.values():
        for pid, tid, mins, tot, sot in r["p"]:
            if not mins or mins <= 0:
                continue
            starter = mins >= MIN_HIT      # hit rate: solo partite con almeno 50 minuti giocati
            per.setdefault(pid, []).append((r["d"], r["comp"] in CUPS, tid, mins, tot, sot, starter))
    players = []
    for pid, rows in per.items():
        rows.sort(reverse=True)
        lg_, cup_ = [0, 0, 0, 0], [0, 0, 0, 0]
        for d, is_cup, tid, mins, tot, sot, starter in rows:
            a = cup_ if is_cup else lg_
            a[0] += 1; a[1] += tot; a[2] += sot; a[3] += mins
        players.append({"i": pid, "n": pnames.get(pid, "?"), "t": tnames.get(rows[0][2], ""),
                        "l": [round(x, 1) for x in lg_], "c": [round(x, 1) for x in cup_],
                        "r": [[int(x[4]), int(x[5]), int(x[3])] for x in rows[:5]],
                        "h": [[int(x[4]), int(x[5]), int(x[3])] for x in [y for y in rows if y[6]][:5]]})
    players.sort(key=lambda p: p["n"])
    for k in fix:
        fix[k] = sorted(fix[k])[:4]
    json.dump({"updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "players": players, "fix": fix},
              open(OUT_FILE, "w"), ensure_ascii=False, separators=(",", ":"))
    print("Scritto", OUT_FILE, "- giocatori:", len(players), "- partite in memoria:", len(cm), "- nuove:", state["new"])


if __name__ == "__main__":
    main()
