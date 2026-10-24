#!/usr/bin/env python3
"""Partite finite dei top 5 campionati: eventi, statistiche, arbitro, stadio.
Scrive match/<id>.json (uno per partita), storico.json (indice) e arbitri.json (statistiche arbitri).
Si ferma dopo MAX_MIN minuti e riprende da dove era arrivato."""
import json, os, sys, time, urllib.parse
from datetime import datetime, timezone
from update_data import api, find_league, WANTED, SEASON_START, PAUSE, KEY
from update_angoli import TOP5, CUPS, tid_of, season_of

MAX_MIN = float(os.environ.get("MAX_MIN", "35"))
VER = 3
T0 = time.time()
os.makedirs("match", exist_ok=True)


def safe(path):
    try:
        return api(path)
    except Exception as ex:
        print("   (non letto)", path, str(ex)[:120])
        return None


def nm(x):
    if isinstance(x, dict):
        return x.get("name") or x.get("full_name")
    return x if x else None


def items(period):
    out = []
    for g in period.get("groups", []) or []:
        its = []
        for i in g.get("items", []) or []:
            its.append([i.get("title") or i.get("key"), i.get("home"), i.get("away"), i.get("key")])
        if its:
            gt = next((g.get(k) for k in ("title", "name", "label", "header", "group", "key", "id") if isinstance(g.get(k), str) and g.get(k)), None)
            out.append({"t": gt, "i": its})
    return out


def compact_stats(s):
    out = {}
    for p in (s or {}).get("periods") or []:
        k = str(p.get("period"))
        k = {"All": "all"}.get(k, k)
        out[k] = items(p)
    return out


def num(v):
    try:
        return float(str(v).replace("%", "").split("(")[0].strip())
    except Exception:
        return None


def read_one(m, key, probe):
    mid = m["id"]
    det = safe(f"/v1/matches/{mid}") or {}
    time.sleep(PAUSE)
    ev = safe(f"/v1/matches/{mid}/events")
    time.sleep(PAUSE)
    st = safe(f"/v1/matches/{mid}/stats")
    time.sleep(PAUSE)
    ev = ev.get("events", []) if isinstance(ev, dict) else (ev or [])
    lu = safe(f"/v1/matches/{mid}/lineups")
    time.sleep(PAUSE)
    mo = safe(f"/v1/matches/{mid}/momentum")
    time.sleep(PAUSE)
    lus = {}
    for side, k in (("home", "h"), ("away", "a")):
        o = (lu or {}).get(side) or {}
        pk = lambda x: [x.get("name"), x.get("shirt_number"), x.get("position_id"), x.get("pitch_x"), x.get("pitch_y"), 1 if x.get("is_captain") else 0]
        lus[k] = {"f": o.get("formation"), "co": nm(o.get("coach")), "cr": o.get("coach") if isinstance(o.get("coach"), dict) else None, "st": [pk(x) for x in o.get("starters", []) or []], "su": [pk(x) for x in o.get("subs", []) or []]}
    hid = tid_of(m["home_team"])
    events = []
    for x in ev:
        pl = x.get("player") or {}
        events.append([str(x.get("event_type", "")).lower(), x.get("minute"), x.get("minute_added"), x.get("period"),
                       "h" if x.get("team_id") == hid else "a", pl.get("name"), x.get("score_home"), x.get("score_away"),
                       1 if x.get("is_own_goal") else 0, 1 if x.get("is_penalty") else 0, (x.get("sub_in_player") or {}).get("name")])
    rec = {"v": VER, "id": mid, "lg": key, "d": str(m.get("date", ""))[:10], "h": m["home_team"]["name"], "a": m["away_team"]["name"],
           "sh": m.get("score_home"), "sa": m.get("score_away"), "ref": nm(det.get("referee") or m.get("referee")),
           "stad": nm(det.get("stadium") or m.get("stadium")), "round": m.get("round_name"),
           "ev": events, "st": compact_stats(st), "lu": lus, "mo": (mo or {}).get("points") if isinstance(mo, dict) else None}
    if probe is not None and not probe:
        for ep in ("momentum", "shotmap", "shots", "commentary", "incidents", "graph", "highlights", "odds", "weather", "lineups"):
            r = safe(f"/v1/matches/{mid}/{ep}")
            probe[ep] = None if r is None else (list(r.keys())[:12] if isinstance(r, dict) else type(r).__name__)
            time.sleep(PAUSE)
        probe["match_keys"] = sorted(det.keys()) if isinstance(det, dict) else None
        probe["referee_raw"] = det.get("referee") if isinstance(det, dict) else None
        probe["stadium_raw"] = det.get("stadium") if isinstance(det, dict) else None
    return rec


def build_referees():
    """arbitri.json: per ogni arbitro le medie sul campionato (o sulla coppa dove ha arbitrato di piu') e, in 'by', le medie di ogni competizione."""
    ref = {}
    for fn in os.listdir("match"):
        try:
            r = json.load(open("match/" + fn))
        except Exception:
            continue
        if not r.get("ref"):
            continue
        o = ref.setdefault(r["ref"], {}).setdefault(r["lg"], {"n": 0, "y": 0, "r": 0, "pen": 0, "fo": 0, "nfo": 0, "m": []})
        o["n"] += 1
        for e in r["ev"]:
            if e[0] == "yellowcard":
                o["y"] += 1
            elif e[0] in ("redcard", "yellowredcard"):
                o["r"] += 1
            elif e[0] == "goal" and e[9]:
                o["pen"] += 1
        for g in (r["st"].get("all") or []):
            for t, h, a, k in g["i"]:
                if str(k).lower() in ("fouls", "foulscommitted") or str(t).lower() in ("fouls", "falli"):
                    hv, av = num(h), num(a)
                    if hv is not None and av is not None:
                        o["fo"] += hv + av; o["nfo"] += 1
        o["m"].append([r["d"], r["h"], r["a"], r["sh"], r["sa"], r["id"]])

    def fin(o):
        n = o["n"]
        return {"n": n, "y": round(o["y"] / n, 2), "r": round(o["r"] / n, 2), "pen": round(o["pen"] / n, 2),
                "fo": round(o["fo"] / o["nfo"], 1) if o["nfo"] else None, "m": sorted(o["m"], reverse=True)[:8]}

    out = {}
    for name, bylg in ref.items():
        dom = {k: v for k, v in bylg.items() if k not in CUPS} or bylg
        main_lg = max(dom, key=lambda k: dom[k]["n"])
        e = fin(dom[main_lg]); e["lg"] = main_lg
        e["by"] = {k: fin(v) for k, v in bylg.items()}
        out[name] = e
    return out


COUNTRY = {"serie-a": "Italia", "premier-league": "United Kingdom", "bundesliga": "Deutschland", "la-liga": "España", "ligue-1": "France"}


def geocode(q):
    import urllib.request
    url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + urllib.parse.quote(q)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "tiri-dati/1.0 (github pages stats app)"})
        with urllib.request.urlopen(req, timeout=30) as r:
            j = json.loads(r.read().decode())
        time.sleep(1.2)
        if j:
            return round(float(j[0]["lat"]), 4), round(float(j[0]["lon"]), 4)
    except Exception as ex:
        print("   (geocodifica fallita)", q, str(ex)[:80])
    return None


def build_stadi():
    old = json.load(open("stadi.json")) if os.path.exists("stadi.json") else {}
    last = {}
    for fn in os.listdir("match"):
        try:
            r = json.load(open("match/" + fn))
        except Exception:
            continue
        if r.get("stad") and (r["h"] not in last or r["d"] > last[r["h"]][0]):
            last[r["h"]] = (r["d"], r["stad"], r["lg"])
    for team, (d, st, lg) in last.items():
        o = old.get(team)
        if o and o.get("s") == st and o.get("lat") is not None:
            continue
        pos = geocode(f"{st}, {COUNTRY.get(lg, '')}") or geocode(f"{team} stadium, {COUNTRY.get(lg, '')}")
        old[team] = {"s": st, "lat": pos[0] if pos else None, "lon": pos[1] if pos else None}
    json.dump(old, open("stadi.json", "w"), ensure_ascii=False, separators=(",", ":"))
    return len(old)


def main():
    if not KEY:
        sys.exit("Manca la variabile PITCHAPI_KEY (segreto del repository).")
    idx = json.load(open("storico.json")) if os.path.exists("storico.json") else {}
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    new, stop, probe = 0, False, {}
    for key, cc, rx, ex in WANTED:
        if (key not in TOP5 and key not in CUPS) or stop:
            continue
        cand = find_league(leagues, cc, rx, ex)
        if not cand:
            continue
        lg = cand[0]; season = season_of(lg)
        if not season:
            continue
        q = urllib.parse.quote(season, safe="")
        played = [m for m in (api(f"/v1/leagues/{lg['id']}/matches?season={q}") or {}).get("matches", []) if m.get("status") == "finished"]
        print(f"✔ {key}: {len(played)} finite")
        for m in played:
            mid = m["id"]; path = f"match/{mid}.json"
            k = str(m.get("date", ""))[:10] + "|" + m["home_team"]["name"] + "|" + m["away_team"]["name"]
            if os.path.exists(path):
                try:
                    if json.load(open(path)).get("v") == VER:
                        idx[k] = mid; continue
                except Exception:
                    pass
            if (time.time() - T0) / 60 > MAX_MIN:
                stop = True; break
            rec = read_one(m, key, probe)
            json.dump(rec, open(path, "w"), ensure_ascii=False, separators=(",", ":"))
            idx[k] = mid; new += 1
            if new % 30 == 0:
                json.dump(idx, open("storico.json", "w"), ensure_ascii=False, separators=(",", ":"))
    json.dump(idx, open("storico.json", "w"), ensure_ascii=False, separators=(",", ":"))
    arb = build_referees()
    json.dump({"updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "ref": arb}, open("arbitri.json", "w"), ensure_ascii=False, separators=(",", ":"))
    ns = build_stadi()
    if probe:
        json.dump(probe, open("diag_storico.json", "w"), ensure_ascii=False, indent=1)
    print(f"Nuove partite lette: {new}; totale indice: {len(idx)}; arbitri: {len(arb)}; stadi: {ns}")
    if stop:
        print(f"⏱ Fermo dopo {MAX_MIN:.0f} minuti: le partite rimaste si leggono al prossimo giro.")


if __name__ == "__main__":
    main()
