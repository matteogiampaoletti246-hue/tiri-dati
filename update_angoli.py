#!/usr/bin/env python3
"""Angoli e cartellini: medie per squadra (ultime partite in casa / in trasferta)
e migliori partite dei prossimi giorni. Scrive angoli.json.
Va nella stessa cartella di update_data.py, di cui riusa le funzioni."""
import json, os, re, sys, time, urllib.parse
from datetime import datetime, timezone, timedelta
from update_data import api, num, find_league, WANTED, SEASON_START, PAUSE, KEY

CACHE_FILE, OUT_FILE = "cache_angoli.json", "angoli.json"
NLAST = int(os.environ.get("NLAST", "10"))      # ultime partite per squadra e sede
MIN_G = int(os.environ.get("MIN_G", "2"))       # partite minime per sede per entrare in classifica
DAYS = int(os.environ.get("DAYS_AHEAD", "8"))   # giorni in avanti da mostrare
TOP = int(os.environ.get("TOP", "5"))           # massimo partite per categoria e per giorno
CUPS = {"champions-league", "europa-league"}

CORNERS = ({"corners", "corner kicks"}, {"corners"})
YELLOW = ({"yellow cards", "yellow card"}, {"yellow_cards", "yellowcards"})
RED = ({"red cards", "red card"}, {"red_cards", "redcards"})


def items_of(period):
    return [i for g in (period or {}).get("groups", []) for i in g.get("items", [])]


def pick(items, spec):
    titles, keys = spec
    for i in items:
        if i.get("title", "").strip().lower() in titles or i.get("key", "") in keys:
            h, a = num(i.get("home")), num(i.get("away"))
            if h is not None and a is not None:
                return h, a
    return None


def parse(s):
    """Ritorna {c: angoli (casa, trasf.), k: cartellini totali, k1: cartellini 1T o None}."""
    periods = s.get("periods") or []
    allp = next((p for p in periods if str(p.get("period")) == "All"), periods[0] if periods else None)
    first = next((p for p in periods
                  if re.search(r"1st|first|1h|1t|period ?1|^1$", str(p.get("period")), re.I)), None)
    it = items_of(allp)
    c, y = pick(it, CORNERS), pick(it, YELLOW)
    if not c or not y:
        return None
    r = pick(it, RED) or (0.0, 0.0)
    k = (y[0] + r[0], y[1] + r[1])
    k1 = None
    if first:
        it1 = items_of(first)
        y1 = pick(it1, YELLOW)
        if y1:
            r1 = pick(it1, RED) or (0.0, 0.0)
            k1 = (y1[0] + r1[0], y1[1] + r1[1])
    return {"c": c, "k": k, "k1": k1}


def debug(s):
    periods = s.get("periods") or []
    print("Periodi trovati nella prima partita letta:", [p.get("period") for p in periods])
    for p in periods:
        for i in items_of(p):
            if re.search(r"corner|card", i.get("title", "") + i.get("key", ""), re.I):
                print("   ", p.get("period"), "|", i.get("title"), f"[{i.get('key')}]", i.get("home"), "-", i.get("away"))


def tid_of(t):
    return t.get("id") or t["name"]


def main():
    if not KEY:
        sys.exit("Manca la variabile PITCHAPI_KEY (segreto del repository).")
    cache = json.load(open(CACHE_FILE)) if os.path.exists(CACHE_FILE) else {}
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    today = datetime.now(timezone.utc).date()
    limit = today + timedelta(days=DAYS)
    recs, upcoming, seen, printed = {}, {}, set(), False
    names = {}

    for key, cc, rx, ex in WANTED:
        cand = find_league(leagues, cc, rx, ex)
        if not cand:
            print(f"✘ {key}: NON trovato nel catalogo"); continue
        lg = cand[0]
        season = next((s for s in lg.get("seasons", []) if str(s).startswith(SEASON_START)), None)
        if not season:
            print(f"✘ {key}: senza stagione {SEASON_START}"); continue
        q = urllib.parse.quote(season, safe="")
        played = (api(f"/v1/leagues/{lg['id']}/matches?season={q}") or {}).get("matches", [])
        future = (api(f"/v1/leagues/{lg['id']}/matches?season={q}&status=upcoming") or {}).get("matches", [])
        print(f"✔ {key}: {len(played)} giocate, {len(future)} future")

        for m in played:
            mid = m["id"]
            rec = cache.get(mid)
            if rec is None:
                s = api(f"/v1/matches/{mid}/stats")
                time.sleep(PAUSE)
                if not s:
                    continue
                if not printed:
                    printed = True
                    debug(s)
                parsed = parse(s)
                if parsed is None:
                    continue          # senza angoli/cartellini: si riprova al giro dopo
                rec = dict(parsed, d=str(m.get("date", ""))[:10], comp=key,
                           h=tid_of(m["home_team"]), a=tid_of(m["away_team"]))
                cache[mid] = rec
            recs[mid] = rec
            names[tid_of(m["home_team"])] = m["home_team"]["name"]
            names[tid_of(m["away_team"])] = m["away_team"]["name"]

        for m in future:
            d = str(m.get("date", ""))[:10]
            if m["id"] in seen or not (str(today) <= d <= str(limit)):
                continue
            seen.add(m["id"])
            upcoming[m["id"]] = {"id": m["id"], "date": d, "time": m.get("date"), "league": lg["name"],
                                 "h": tid_of(m["home_team"]), "a": tid_of(m["away_team"])}
            names[tid_of(m["home_team"])] = m["home_team"]["name"]
            names[tid_of(m["away_team"])] = m["away_team"]["name"]
        json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)

    # storico per squadra e sede (h = in casa, a = in trasferta)
    hist, covered = {}, set()
    for r in recs.values():
        for side, i in (("h", 0), ("a", 1)):
            tid = r[side]
            k1 = None if r["k1"] is None else r["k1"][i]
            hist.setdefault((tid, side), []).append((r["d"], r["c"][i], r["c"][1 - i], r["k"][i], k1))
            if r["comp"] not in CUPS:
                covered.add(tid)

    def avg(tid, side):
        rows = sorted(hist.get((tid, side), []), reverse=True)[:NLAST]
        if not rows:
            return None
        n = len(rows)
        r1 = [x[4] for x in rows if x[4] is not None]
        return {"n": n, "cf": sum(x[1] for x in rows) / n, "ca": sum(x[2] for x in rows) / n,
                "k": sum(x[3] for x in rows) / n, "k1": sum(r1) / len(r1) if r1 else None}

    days = {}
    for u in upcoming.values():
        h, a = avg(u["h"], "h"), avg(u["a"], "a")
        day = days.setdefault(u["date"], {"matches": [], "analizzate": 0})
        day["analizzate"] += 1
        if not h or not a or min(h["n"], a["n"]) < MIN_G:
            continue
        eh, ea = (h["cf"] + a["ca"]) / 2, (a["cf"] + h["ca"]) / 2
        e = {"date": u["date"], "time": u["time"], "league": u["league"],
             "home": names[u["h"]], "away": names[u["a"]],
             "corners_home": round(eh, 1), "corners_away": round(ea, 1), "gap": round(abs(eh - ea), 1),
             "cards": round(h["k"] + a["k"], 1),
             "cards_1t": round(h["k1"] + a["k1"], 1) if h["k1"] is not None and a["k1"] is not None else None,
             "games": [h["n"], a["n"]],
             "non_coperto": [names[t] for t in (u["h"], u["a"]) if t not in covered]}
        day["matches"].append(e)

    out = {"updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
           "window": {"nlast": NLAST, "min_games": MIN_G, "days_ahead": DAYS}, "days": {}}
    for d in sorted(days):
        ms = days[d]["matches"]
        out["days"][d] = {
            "analizzate": days[d]["analizzate"], "con_dati": len(ms),
            "corner": sorted(ms, key=lambda x: -x["gap"])[:TOP],
            "cartellini": sorted(ms, key=lambda x: x["cards"])[:TOP],
            "cartellini_1t": sorted([x for x in ms if x["cards_1t"] is not None],
                                    key=lambda x: x["cards_1t"])[:TOP]}
    json.dump(out, open(OUT_FILE, "w"), ensure_ascii=False, indent=1)
    print("Scritto", OUT_FILE, "- giorni:", len(out["days"]))


if __name__ == "__main__":
    main()
