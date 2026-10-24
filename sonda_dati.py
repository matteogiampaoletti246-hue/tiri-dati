#!/usr/bin/env python3
"""Sonda una tantum: salva in sonda_dati.json esempi reali di FotMob/ESPN (tiri fuori porta, allenatori, arbitri, statistiche giocatore, rose)."""
import json, urllib.request, urllib.parse, datetime, time

UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*", "Accept-Language": "en-US,en;q=0.9"}
OUT = {}


def get(url, hdr=None):
    try:
        req = urllib.request.Request(url, headers=hdr or UA)
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, json.loads(r.read().decode("utf-8", "replace"))
    except Exception as ex:
        code = getattr(ex, "code", None)
        return code, {"errore": str(ex)[:200]}


def trim(o, depth=0, maxl=3):
    if isinstance(o, dict):
        return {k: trim(v, depth + 1, maxl) for k, v in list(o.items())[:60]}
    if isinstance(o, list):
        return [trim(v, depth + 1, maxl) for v in o[:maxl]]
    return o


def day(delta):
    return (datetime.date.today() + datetime.timedelta(days=delta)).strftime("%Y%m%d")


TOP = [47, 54, 87, 53, 55]
CUP = [42, 73, 10216]


def matches(d):
    st, j = get(f"https://www.fotmob.com/api/data/matches?date={d}&timezone=Europe%2FRome&ccode3=ITA")
    out = []
    for l in (j.get("leagues") or []):
        lid = l.get("primaryId") or l.get("id")
        if lid in TOP + CUP:
            for m in l.get("matches") or []:
                out.append((lid, m))
    return st, out


def main():
    st, fin = matches(day(-1))
    OUT["matches_status"] = st
    fin = [x for x in fin if (x[1].get("status") or {}).get("finished")]
    st2, up = matches(day(1))
    up = [x for x in up if not (x[1].get("status") or {}).get("started")]
    OUT["n_finished_ieri"] = len(fin); OUT["n_upcoming_domani"] = len(up)
    if fin:
        lid, m = fin[0]
        s, j = get("https://www.fotmob.com/api/data/matchDetails?matchId=%s" % m["id"])
        OUT["finita"] = {"match": (m.get("home") or {}).get("name", "") + " - " + (m.get("away") or {}).get("name", ""), "status": s,
                         "general_keys": list((j.get("general") or {}).keys()), "content_keys": list((j.get("content") or {}).keys())}
        c = j.get("content") or {}
        shots = ((c.get("shotmap") or {}).get("shots")) or []
        OUT["finita"]["n_shots"] = len(shots)
        pick = []
        for kind in ("Miss", "AttemptSaved", "Goal", "Post"):
            for x in shots:
                if x.get("eventType") == kind and not x.get("isBlocked"):
                    pick.append(x); break
        pick += [x for x in shots if x.get("isBlocked")][:2]
        OUT["finita"]["shots_sample"] = pick
        lu = c.get("lineup") or {}
        OUT["finita"]["lineup_keys"] = list(lu.keys()) if isinstance(lu, dict) else str(type(lu))
        for side in ("homeTeam", "awayTeam"):
            t = lu.get(side) if isinstance(lu, dict) else None
            if isinstance(t, dict):
                OUT["finita"]["lineup_" + side] = {"keys": list(t.keys()), "coach": t.get("coach"), "starter0": (t.get("starters") or [None])[0]}
        ps = c.get("playerStats") or {}
        vals = list(ps.values()) if isinstance(ps, dict) else ps
        OUT["finita"]["n_playerStats"] = len(vals)
        OUT["finita"]["playerStats_sample"] = vals[:2]
        mf = c.get("matchFacts") or {}
        OUT["finita"]["matchFacts_keys"] = list(mf.keys())
        OUT["finita"]["infoBox"] = mf.get("infoBox")
        OUT["finita"]["general_sample"] = trim(j.get("general"), 0, 2)
    if up:
        lid, m = up[0]
        s, j = get("https://www.fotmob.com/api/data/matchDetails?matchId=%s" % m["id"])
        c = j.get("content") or {}
        mf = c.get("matchFacts") or {}
        OUT["futura"] = {"match": (m.get("home") or {}).get("name", "") + " - " + (m.get("away") or {}).get("name", ""), "status": s,
                         "content_keys": list(c.keys()), "matchFacts_keys": list(mf.keys()), "infoBox": mf.get("infoBox"),
                         "lineup": trim(c.get("lineup"), 0, 1)}
    # coppe: una partita recente di Champions o Europa League
    for dd in (-1, -2, 0, 1):
        s, ms = matches(day(dd))
        cup = [x for x in ms if x[0] in CUP]
        if cup:
            OUT["coppa_" + str(dd)] = [(x[0], (x[1].get("home") or {}).get("name"), (x[1].get("away") or {}).get("name"), x[1].get("id")) for x in cup[:6]]
    # campionato Champions: struttura pagina e link statistiche
    s, j = get("https://www.fotmob.com/api/data/leagues?id=42&ccode3=ITA")
    OUT["lega_42"] = {"status": s, "keys": list(j.keys())[:30] if isinstance(j, dict) else None}
    if isinstance(j, dict):
        st_ = j.get("stats") or {}
        OUT["lega_42"]["stats"] = trim(st_, 0, 3)
        OUT["lega_42"]["tabs"] = j.get("tabs")
    # rosa di una squadra (ruoli)
    if fin:
        tid = (fin[0][1].get("home") or {}).get("id")
        s, j = get("https://www.fotmob.com/api/data/teams?id=%s&ccode3=ITA" % tid)
        sq = (j.get("squad") or {}) if isinstance(j, dict) else {}
        OUT["rosa"] = {"status": s, "keys": list(j.keys())[:30] if isinstance(j, dict) else None, "squad": trim(sq, 0, 2)}
    # ESPN: ufficiali di partite di domani
    for lg in ("ita.1", "eng.1", "uefa.champions", "uefa.europa"):
        s, j = get("https://site.api.espn.com/apis/site/v2/sports/soccer/%s/scoreboard?dates=%s" % (lg, day(1)), {"User-Agent": "Mozilla/5.0"})
        evs = j.get("events") or [] if isinstance(j, dict) else []
        if evs:
            e = evs[0]
            s2, k = get("https://site.api.espn.com/apis/site/v2/sports/soccer/%s/summary?event=%s" % (lg, e["id"]), {"User-Agent": "Mozilla/5.0"})
            OUT["espn_" + lg] = {"match": e.get("name"), "officials": (k.get("gameInfo") or {}).get("officials") if isinstance(k, dict) else None,
                                 "gameInfo_keys": list((k.get("gameInfo") or {}).keys()) if isinstance(k, dict) else None}
        time.sleep(0.5)
    json.dump(OUT, open("sonda_dati.json", "w"), ensure_ascii=False, indent=1, default=str)
    print("scritto sonda_dati.json", len(json.dumps(OUT, default=str)), "byte")


if __name__ == "__main__":
    main()
