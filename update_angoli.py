#!/usr/bin/env python3
"""Angoli e cartellini: medie per squadra (ultime partite in casa / in trasferta)
e migliori partite dei prossimi giorni. Scrive angoli.json.
Va nella stessa cartella di update_data.py, di cui riusa le funzioni."""
import json, os, re, sys, time, urllib.parse
from datetime import datetime, timezone, timedelta
from update_data import api, num, find_league, WANTED, SEASON_START, PAUSE, KEY, handicap

CACHE_FILE, OUT_FILE = "cache_angoli.json", "angoli.json"
NLAST = int(os.environ.get("NLAST", "0"))       # 0 = tutte le partite della stagione in corso; N = solo le ultime N per sede
MIN_G = int(os.environ.get("MIN_G", "1"))       # partite minime per sede per entrare in classifica
DAYS = int(os.environ.get("DAYS_AHEAD", "8"))   # giorni in avanti da mostrare
TOP = int(os.environ.get("TOP", "5"))           # massimo partite per categoria e per giorno
CUPS = {"champions-league", "europa-league"}
TOP5 = {"serie-a", "premier-league", "bundesliga", "la-liga", "ligue-1"}   # tutte le squadre; gli altri campionati: solo squadre europee

# campionati in piu' rispetto a quelli dei tiri: (chiave, paese, nome regex, esclusioni regex)
EXTRA = [
    ("scottish-premiership", "SCO", r"scottish premiership|^premiership$", r"women|u\d\d|cup|2"),
    ("ekstraklasa", "POL", r"ekstraklasa|pko", r"women|u\d\d|cup"),
    ("czech-first-league", "CZE", r"czech|first league|chance liga|fortuna", r"women|u\d\d|cup|2"),
]
# campionati scoperti da soli (quelli delle squadre di coppa): si saltano coppe, femminili, giovanili
SKIP = re.compile(r"women|femin|\bu-?\d\d\b|youth|junior|reserve|cup|copa|coppa|pokal|ta[cç]a|beker|supercup|super cup"
                  r"|qualif|conference|champions|europa|nations|world|friendl|afc|caf|concacaf|conmebol|play-?off", re.I)

CORNERS = ({"corners", "corner kicks"}, {"corners"})
YELLOW = ({"yellow cards", "yellow card"}, {"yellow_cards", "yellowcards"})
RED = ({"red cards", "red card"}, {"red_cards", "redcards"})
SHOTS = ({"total shots"}, {"total_shots"})
SOT = ({"shots on target"}, {"shots_on_target"})
FOULS = ({"fouls", "fouls committed", "total fouls"}, {"fouls", "fouls_committed", "total_fouls"})
OFFS = ({"offsides", "offside"}, {"offsides", "offside"})
VER = 2     # versione dei dati in cache: se cambia, le partite vengono riscaricate una volta


def items_of(period):
    return [i for g in (period or {}).get("groups", []) for i in g.get("items", [])]


def pick(items, spec, rx=None, bad=None):
    titles, keys = spec
    for i in items:
        t = i.get("title", "").strip().lower()
        if t in titles or i.get("key", "") in keys or (rx and re.search(rx, t) and not (bad and re.search(bad, t))):
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
    return {"c": c, "k": k, "k1": k1,
            "s": pick(it, SHOTS), "t": pick(it, SOT, r"shots on target", r"xg|expected"),
            "f": pick(it, FOULS, r"\bfouls?\b", r"drawn|won|suffer|against"),
            "o": pick(it, OFFS, r"offside", r"trap|against")}


def debug(s):
    periods = s.get("periods") or []
    print("Periodi trovati nella prima partita letta:", [p.get("period") for p in periods])
    for p in periods:
        for i in items_of(p):
            if re.search(r"corner|card|shot|foul|offside", i.get("title", "") + i.get("key", ""), re.I):
                print("   ", p.get("period"), "|", i.get("title"), f"[{i.get('key')}]", i.get("home"), "-", i.get("away"))


def tid_of(t):
    return t.get("id") or t["name"]


def season_of(lg):
    return next((s for s in lg.get("seasons", []) if str(s).startswith(SEASON_START)), None)


def main():
    if not KEY:
        sys.exit("Manca la variabile PITCHAPI_KEY (segreto del repository).")
    cache = json.load(open(CACHE_FILE)) if os.path.exists(CACHE_FILE) else {}
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    today = datetime.now(timezone.utc).date()
    limit = today + timedelta(days=DAYS)
    recs, upcoming, seen, names = {}, {}, set(), {}
    cup_ids, done = set(), set()
    state = {"printed": False}

    logos = {}

    def reg(t):
        names[tid_of(t)] = t["name"]
        if t.get("image_url"):
            logos[tid_of(t)] = t["image_url"]

    team_h = {}     # handicap tiri del campionato di ogni squadra (1 = nessuno)

    def read(m, comp, hv=None):
        mid = m["id"]
        rec = cache.get(mid)
        if hv is not None:
            for t in (m["home_team"], m["away_team"]):
                team_h[tid_of(t)] = max(team_h.get(tid_of(t), 0), hv)
        if rec is None or rec.get("v") != VER:
            s = api(f"/v1/matches/{mid}/stats")
            time.sleep(PAUSE)
            if not s:
                if rec is not None:
                    recs[mid] = rec; reg(m["home_team"]); reg(m["away_team"])
                return
            if not state["printed"]:
                state["printed"] = True
                debug(s)
            parsed = parse(s)
            if parsed is None:
                if rec is not None:
                    recs[mid] = rec; reg(m["home_team"]); reg(m["away_team"])
                return          # senza angoli/cartellini: si riprova al giro dopo
            rec = dict(parsed, v=VER, d=str(m.get("date", ""))[:10], comp=comp,
                       h=tid_of(m["home_team"]), a=tid_of(m["away_team"]))
            cache[mid] = rec
        recs[mid] = rec
        reg(m["home_team"]); reg(m["away_team"])

    todo = [(k, cc, rx, ex, False) for k, cc, rx, ex in WANTED] + [(k, cc, rx, ex, True) for k, cc, rx, ex in EXTRA]
    todo.sort(key=lambda t: t[0] not in CUPS)   # prima le coppe: servono per sapere quali sono le squadre europee
    for key, cc, rx, ex, fallback in todo:
        cand = find_league(leagues, cc, rx, ex)
        if not cand and fallback:
            cand = find_league(leagues, None, rx, ex)
        if not cand:
            print(f"✘ {key}: NON trovato nel catalogo"); continue
        lg = cand[0]
        season = season_of(lg)
        if not season:
            print(f"✘ {key}: senza stagione {SEASON_START}"); continue
        done.add(lg["id"])
        q = urllib.parse.quote(season, safe="")
        played = (api(f"/v1/leagues/{lg['id']}/matches?season={q}") or {}).get("matches", [])
        future = (api(f"/v1/leagues/{lg['id']}/matches?season={q}&status=upcoming") or {}).get("matches", [])
        print(f"✔ {key}: {lg['name']} - {len(played)} giocate, {len(future)} future")
        if key in CUPS:
            for m in played + future:
                cup_ids.add(tid_of(m["home_team"])); cup_ids.add(tid_of(m["away_team"]))
        restricted = key not in TOP5 and key not in CUPS
        if restricted:   # campionati sotto i top 5: solo le partite delle squadre di coppa europea
            played = [m for m in played if tid_of(m["home_team"]) in cup_ids or tid_of(m["away_team"]) in cup_ids]
            print(f"   {key}: uso {len(played)} partite di squadre europee")
        hv = None if key in CUPS else (handicap(key, lg.get("country_code")) or 1.0)
        for m in played:
            read(m, key, hv)
        for m in future:
            d = str(m.get("date", ""))[:10]
            if m["id"] in seen or not (str(today) <= d <= str(limit)):
                continue
            if restricted and not (tid_of(m["home_team"]) in cup_ids and tid_of(m["away_team"]) in cup_ids):
                continue   # media dell'avversario non europeo non disponibile
            seen.add(m["id"])
            upcoming[m["id"]] = {"id": m["id"], "date": d, "time": m.get("date"), "league": lg["name"],
                                 "h": tid_of(m["home_team"]), "a": tid_of(m["away_team"])}
            reg(m["home_team"]); reg(m["away_team"])
        json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)

    # tutti gli altri campionati delle squadre di coppa: solo le partite in cui gioca una squadra di coppa
    print(f"Squadre di Champions/Europa League trovate: {len(cup_ids)}")
    for lg in leagues:
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
        print(f"+ {lg['name']} [{lg.get('country_code')}]: {len(mine)} partite di squadre di coppa")
        hv = handicap("campionato", lg.get("country_code")) or 1.0
        for m in mine:
            read(m, "campionato", hv)
        json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)

    # la cache tiene solo la stagione in corso
    cutoff = f"{SEASON_START}-07-01"   # via le partite delle stagioni passate
    cache = {k: v for k, v in cache.items() if not v.get("d") or v["d"] >= cutoff}
    json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)

    # storico per squadra e sede (h = in casa, a = in trasferta); coppa e campionato nello stesso mucchio
    hist, covered = {}, set()

    def sd(r, key, i):
        return r[key][i] if r.get(key) else None

    for r in recs.values():
        for side, i in (("h", 0), ("a", 1)):
            j = 1 - i
            tid = r[side]
            hist.setdefault((tid, side), []).append({
                "d": r["d"], "cf": r["c"][i], "ca": r["c"][j], "k": r["k"][i],
                "k1": None if r["k1"] is None else r["k1"][i],
                "sf": sd(r, "s", i), "sa": sd(r, "s", j), "tf": sd(r, "t", i), "ta": sd(r, "t", j),
                "ff": sd(r, "f", i), "fa": sd(r, "f", j), "of": sd(r, "o", i), "oa": sd(r, "o", j)})
            if r["comp"] not in CUPS:
                covered.add(tid)

    def rows_of(tid, side=None):
        rs = hist.get((tid, "h"), []) + hist.get((tid, "a"), []) if side is None else hist.get((tid, side), [])
        rs = sorted(rs, key=lambda x: x["d"], reverse=True)
        return rs[:NLAST] if NLAST > 0 else rs

    def mean(rows, key):
        v = [x[key] for x in rows if x[key] is not None]
        return (sum(v) / len(v), len(v)) if v else (None, 0)

    def expect(u, kf, ka, split, use_h=False):
        """Attesi (casa, trasferta) = media tra cio' che la squadra fa e cio' che l'altra concede.
        split=True: la casa con le partite in casa, l'ospite con quelle in trasferta; False: tutte le partite."""
        hr = rows_of(u["h"], "h" if split else None)
        ar = rows_of(u["a"], "a" if split else None)
        hf, n1 = mean(hr, kf); ha, _ = mean(hr, ka)
        af, n2 = mean(ar, kf); aa, _ = mean(ar, ka)
        if None in (hf, ha, af, aa) or min(n1, n2) < MIN_G:
            return None
        sh = team_h.get(u["h"], 1.0) if use_h else 1.0     # handicap: fatti x s, subiti / s
        sa = team_h.get(u["a"], 1.0) if use_h else 1.0
        return (hf * sh + aa / sa) / 2, (af * sa + ha / sh) / 2, n1, n2

    days = {}
    for u in upcoming.values():
        day = days.setdefault(u["date"], {"matches": [], "analizzate": 0})
        day["analizzate"] += 1
        e = {"id": u["id"], "hid": u["h"], "aid": u["a"], "date": u["date"], "time": u["time"], "league": u["league"],
             "home": names[u["h"]], "away": names[u["a"]],
             "non_coperto": [names[t] for t in (u["h"], u["a"]) if t not in covered]}
        r = expect(u, "cf", "ca", True)                      # angoli: casa / trasferta
        if r:
            e.update(corners_home=round(r[0], 1), corners_away=round(r[1], 1), gap=round(abs(r[0] - r[1]), 1), games=[r[2], r[3]])
        for tag, kf, ka in (("tiri", "sf", "sa"), ("sot", "tf", "ta")):    # tiri: casa / trasferta + handicap
            r = expect(u, kf, ka, True, True)
            if r:
                e.update({tag + "_home": round(r[0], 1), tag + "_away": round(r[1], 1),
                          tag + "_gap": round(abs(r[0] - r[1]), 1), tag + "_games": [r[2], r[3]]})
        for tag, kf, ka in (("falli", "ff", "fa"), ("off", "of", "oa")):   # falli e fuorigiochi: tutte le partite
            r = expect(u, kf, ka, False)
            if r:
                e.update({tag + "_home": round(r[0], 1), tag + "_away": round(r[1], 1),
                          tag + "_gap": round(abs(r[0] - r[1]), 1), tag + "_games": [r[2], r[3]]})
        hk, hn = mean(rows_of(u["h"]), "k"); ak, an = mean(rows_of(u["a"]), "k")      # cartellini: tutte le partite
        if hk is not None and ak is not None and min(hn, an) >= MIN_G:
            h1, _ = mean(rows_of(u["h"]), "k1"); a1, _ = mean(rows_of(u["a"]), "k1")
            e.update(cards=round(hk + ak, 1), cards_1t=round(h1 + a1, 1) if h1 is not None and a1 is not None else None,
                     games_k=[hn, an])
        if any(k in e for k in ("gap", "cards", "tiri_gap", "sot_gap", "falli_gap", "off_gap")):
            day["matches"].append(e)

    out = {"updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
           "window": {"nlast": NLAST, "min_games": MIN_G, "days_ahead": DAYS}, "days": {}}
    LISTS = {"corner": ("gap", True), "tiri": ("tiri_gap", True), "tiri_sot": ("sot_gap", True),
             "falli": ("falli_gap", True), "fuorigiochi": ("off_gap", True),
             "cartellini": ("cards", False), "cartellini_1t": ("cards_1t", False)}
    for d in sorted(days):
        ms = days[d]["matches"]
        o = {"analizzate": days[d]["analizzate"], "con_dati": len(ms)}
        for name, (k, desc) in LISTS.items():
            o[name] = sorted([x for x in ms if x.get(k) is not None], key=lambda x: -x[k] if desc else x[k])[:TOP]
        o["tutte"] = [{k: v for k, v in x.items() if k not in ("non_coperto", "hid", "aid")} for x in ms]      # tutte le partite del giorno con tutte le statistiche (servono alla scheda partita)
        out["days"][d] = o
    # stemmi: se l'elenco partite non li contiene, si chiede il dettaglio solo delle partite mostrate
    shown = {}
    for d in out["days"].values():
        for k in LISTS:
            for m in d[k]:
                shown[m["id"]] = m
    for mid, m in shown.items():
        if m["hid"] in logos and m["aid"] in logos:
            continue
        try:
            det = api(f"/v1/matches/{mid}") or {}
            time.sleep(PAUSE)
            for t in (det.get("home_team") or {}, det.get("away_team") or {}):
                if t.get("image_url"):
                    logos[tid_of(t)] = t["image_url"]
        except Exception as ex:
            print("stemma non letto per", mid, ex)
    for m in shown.values():
        m["home_logo"] = logos.get(m.pop("hid"))
        m["away_logo"] = logos.get(m.pop("aid"))
    json.dump(out, open(OUT_FILE, "w"), ensure_ascii=False, indent=1)
    print("Stemmi trovati per", sum(1 for m in shown.values() if m["home_logo"] or m["away_logo"]), "partite su", len(shown))
    print("Scritto", OUT_FILE, "- giorni:", len(out["days"]))


if __name__ == "__main__":
    main()
