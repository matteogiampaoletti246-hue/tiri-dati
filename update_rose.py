#!/usr/bin/env python3
"""Rose di TUTTE le squadre dell'app (campionati e coppe aggiunti) -> rose.json, con piu' fonti che collaborano:
  1) FotMob (rosa completa + allenatore) per ogni squadra, anche quelle delle coppe (per id FotMob);
  2) se FotMob non da' la rosa: giocatori che hanno giocato nella stagione (archivio arch/<lega>/<stagione>_s.json, ruolo sconosciuto "UNK");
  3) se manca ancora e c'e' API_FOOTBALL_KEY: rosa da API-Football (ricerca per nome, con un tetto di richieste).

{nome squadra nell'app: {"id": id FotMob, "co": allenatore, "p": [[id, nome, ruolo(GK/DEF/MID/ATT), maglia, paese, eta, altezza, voto, gol, assist, infortunato], ...]}}
Lanciare ogni giorno: e' leggero (una chiamata per squadra)."""
import json, os, re, time, unicodedata, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*", "Accept-Language": "en-US,en;q=0.9"}
LEAGUES = {"eredivisie": 57, "super-lig": 71, "liga-portugal": 61, "pro-league": 40, "scottish-premiership": 64,
           "aut-bundesliga": 38, "nor-eliteserien": 59, "gre-super-league-1": 135,
           "championship": 48, "serie-b": 86, "bundesliga-2": 146, "laliga-2": 140, "ligue-2": 110, "liga-portugal-2": 185, "eerste-divisie": 111, "turchia-1-lig": 165, "brasileirao": 268, "arg-liga-profesional": 112, "mls": 130, "liga-mx": 230}
# campionati maggiori: qui servono solo gli allenatori (la rosa completa arriva dagli altri file)
COACH_ONLY = {"serie-a": 55, "premier-league": 47, "la-liga": 87, "bundesliga": 54, "ligue-1": 53}
GRP = {"keepers": "GK", "defenders": "DEF", "midfielders": "MID", "attackers": "ATT"}
OUT = "rose.json"


def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.load(r)
        except Exception as e:
            print("  errore", url[-48:], str(e)[:80]); time.sleep(2 + i * 2)
    return None


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\b(fc|ac|as|sc|sk|fk|cf|cd|sv|kv|rsc|rc|ssc)\b", " ", re.sub(r"[^a-z0-9]+", " ", s)).strip()


# seconde squadre / riserve / giovanili / femminili: due nomi che differiscono per uno di questi segni non sono mai la stessa squadra
RESERVE = {"b", "ii", "iii", "2", "u17", "u18", "u19", "u20", "u21", "u22", "u23", "sub", "reserves", "reserve", "res", "castilla", "jong",
           "promesas", "youth", "academy", "primavera", "amateure", "women", "femenino", "feminino", "femminile", "feminine", "ladies", "frauen", "vrouwen"}


def reserve_tag(s):
    return " ".join(sorted(t for t in norm(s).split() if t in RESERVE))


def venue_of(t):
    """Stadio della squadra da FotMob: [nome, lat, lon, citta'] (per il meteo)."""
    w = (((t or {}).get("overview") or {}).get("venue") or {}).get("widget") or {}
    loc = w.get("location") or []
    try:
        return [w.get("name"), round(float(loc[0]), 4), round(float(loc[1]), 4), w.get("city")] if len(loc) == 2 else None
    except Exception:
        return None


def find_teams(o, out):
    if isinstance(o, dict):
        if isinstance(o.get("id"), int) and "name" in o and ("pageUrl" in o or "shortName" in o):
            out[o["id"]] = o["name"]
        for v in o.values():
            find_teams(v, out)
    elif isinstance(o, list):
        for v in o:
            find_teams(v, out)


def num(v):
    try:
        return float(v)
    except Exception:
        return None


# coppe nazionali (id FotMob -> id nell'app): le loro squadre hanno comunque la rosa
CUPS = {141: "coppa-italia", 209: "dfb-pokal", 134: "coupe-de-france", 186: "taca-de-portugal", 133: "efl-cup", 149: "belgian-cup", 278: "austrian-cup", 180: "scottish-league-cup", 9067: "copa-do-brasil"}
AF_KEY = os.environ.get("API_FOOTBALL_KEY", "")
AF_BUDGET = [80]
AF_POS = {"Goalkeeper": "GK", "Defender": "DEF", "Midfielder": "MID", "Attacker": "ATT"}


def af_get(path):
    if not AF_KEY or AF_BUDGET[0] <= 0:
        return None
    AF_BUDGET[0] -= 1
    try:
        req = urllib.request.Request("https://v3.football.api-sports.io" + path, headers={"x-apisports-key": AF_KEY})
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print("  api-football errore", str(e)[:60])
        return None


def from_apifootball(name):
    """Fonte 3: rosa da API-Football (solo se il nome combacia con una squadra trovata)."""
    j = af_get("/teams?search=" + urllib.parse.quote(re.sub(r"[^A-Za-z0-9 ]", " ", name).strip()[:40]))
    n = norm(name)
    cand = [x["team"] for x in ((j or {}).get("response") or []) if norm((x.get("team") or {}).get("name")) == n]
    if len(cand) != 1:
        return None
    k = af_get("/players/squads?team=%d" % cand[0]["id"])
    pl = (((k or {}).get("response") or [{}])[0] or {}).get("players") or []
    rows = [[p.get("id") and -int(p["id"]), p.get("name"), AF_POS.get(p.get("position"), "UNK"), p.get("number"), None, p.get("age"), None, None, 0, 0, 0] for p in pl if p.get("name")]
    return rows or None


def season_players(fm_by_tid):
    """Fonte 2: giocatori che hanno giocato nella stagione in corso (archivio FotMob del repository)."""
    out = {}
    try:
        sk = json.load(open("partite_extra.json")).get("sk", {})
    except Exception:
        return out
    for fm, season in sk.items():
        f = "arch/%s/%s_s.json" % (fm, season)
        if not os.path.exists(f):
            continue
        try:
            d = json.load(open(f))
        except Exception:
            continue
        for k, lst in (d.get("players") or {}).items():
            if k.startswith("_"):
                continue
            for r in lst:
                try:
                    tid, pid, nm = str(r[2]), r[0], r[1]
                except Exception:
                    continue
                if pid and nm:
                    out.setdefault(tid, {})[pid] = nm
    return out


def squad_of(tid):
    t = get("https://www.fotmob.com/api/data/teams?id=%d&ccode3=ITA" % int(tid))
    sq = ((t or {}).get("squad") or {}).get("squad")
    if not sq:
        return None, None
    rows, co = [], None
    for g in sq:
        t0 = g.get("title")
        if t0 == "coach":
            co = (g.get("members") or [{}])[0].get("name")
            continue
        if t0 not in GRP:
            continue
        for m in g.get("members") or []:
            rows.append([m.get("id"), m.get("name"), GRP[t0], m.get("shirtNumber"), m.get("cname"), m.get("age"), num(m.get("height")),
                         num(m.get("rating")), m.get("goals") or 0, m.get("assists") or 0, 1 if m.get("injury") else 0])
    return rows, co


def all_teams():
    """Tutte le squadre dei calendari aggiunti: id FotMob -> (nome, campionato dell'app)."""
    lg_of = {v: k for k, v in LEAGUES.items()}
    teams = {}
    try:
        x = json.load(open("partite_extra.json"))
    except Exception:
        return teams
    for row in x.get("m", []):
        fm, hn, an, hid, aid = row[1], row[3], row[4], row[5], row[6]
        lg = lg_of.get(int(fm)) or CUPS.get(int(fm))
        for tid, nm in ((hid, hn), (aid, an)):
            if not tid or not nm:
                continue
            cur = teams.get(str(tid))
            # se la squadra gioca anche in un campionato nazionale, quello ha la precedenza sulla coppa
            if not cur or (cur[1] in CUPS.values() and lg not in CUPS.values()):
                teams[str(tid)] = (nm, lg)
    return teams


def fill_missing(res):
    have = {str(v.get("id")) for v in res.values() if v.get("id")}
    teams = all_teams()
    todo = [(tid, nm, lg) for tid, (nm, lg) in teams.items() if tid not in have]
    print("squadre senza rosa ancora:", len(todo), "su", len(teams))
    seas = season_players({})

    def one(a):
        tid, nm, lg = a
        rows, co = squad_of(tid)
        time.sleep(0.15)
        return a, rows, co

    with ThreadPoolExecutor(max_workers=4) as ex:
        for (tid, nm, lg), rows, co in ex.map(one, todo):
            src = "fotmob"
            if not rows:
                pl = seas.get(tid)
                if pl:
                    rows = [[pid, n, "UNK", None, None, None, None, None, 0, 0, 0] for pid, n in pl.items()]
                    src = "archivio"
                else:
                    rows = from_apifootball(nm)
                    src = "api-football" if rows else None
            if rows is None:
                continue
            res[nm] = {"id": int(tid), "co": co, "lg": lg, "p": rows, "src": src}
    return res


def main():
    old = json.load(open(OUT)) if os.path.exists(OUT) else {}
    data = json.load(open("data.json")).get("leagues", {})
    names = {}   # campionato -> nomi delle squadre come li usa l'app
    for lg, L in data.items():
        for n in list((L.get("teams") or {})) + list((L.get("logos") or {})):
            names.setdefault(lg, set()).add(n)
    try:
        for m in json.load(open("partite.json")).get("matches") or []:
            names.setdefault(m.get("lg"), set()).update([m.get("h"), m.get("a")])
    except Exception:
        pass
    res = dict(old)
    for lg, lid in {**LEAGUES, **COACH_ONLY}.items():
        j = get("https://www.fotmob.com/api/data/leagues?id=%d&ccode3=ITA" % lid)
        teams = {}
        find_teams((j or {}).get("table") or j or {}, teams)
        mine = {norm(n): n for n in names.get(lg, set()) if n}
        print(lg, len(teams), "squadre")
        for tid, tname in teams.items():
            t = get("https://www.fotmob.com/api/data/teams?id=%d&ccode3=ITA" % tid)
            sq = ((t or {}).get("squad") or {}).get("squad")
            if not sq:
                continue
            key = mine.get(norm(tname))
            if not key:
                key = next((v for k, v in mine.items() if k and (k in norm(tname) or norm(tname) in k) and reserve_tag(v) == reserve_tag(tname)), tname)
            rows, co = [], None
            for g in sq:
                t0 = g.get("title")
                if t0 == "coach":
                    co = (g.get("members") or [{}])[0].get("name")
                    continue
                if t0 not in GRP:
                    continue
                for m in g.get("members") or []:
                    rows.append([m.get("id"), m.get("name"), GRP[t0], m.get("shirtNumber"), m.get("cname"), m.get("age"), num(m.get("height")),
                                 num(m.get("rating")), m.get("goals") or 0, m.get("assists") or 0, 1 if m.get("injury") else 0])
            res[key] = {"id": tid, "co": co, "lg": lg, "p": [] if lg in COACH_ONLY else rows}
            v = venue_of(t)
            if v:
                res[key]["v"] = v
            time.sleep(0.3)
    res = fill_missing(res)
    json.dump(res, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print("scritto", len(res), "squadre")


if __name__ == "__main__":
    main()
