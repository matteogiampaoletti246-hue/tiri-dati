#!/usr/bin/env python3
"""ESPN come fonte delle rose (regola fissa: docs/regole/squadre-competizioni.md, "Rose: ESPN completa FotMob").
Prima FotMob (rosa/<id%100>.json di rose_tutte.py e rose.json di update_rose.py), poi ESPN per chi FotMob non ha: ogni squadra ESPN (tutti i campionati e le
coppe del catalogo ESPN) viene abbinata alla squadra FotMob dai giocatori in comune (mai dal solo nome), i giocatori ESPN che mancano alla rosa FotMob
(abbinamento per nome, nome corto, eta' e maglia) si aggiungono alla rosa:
  - se la ricerca FotMob trova il giocatore in quella squadra -> id FotMob (scheda normale);
  - altrimenti riga ESPN: id = -(2_000_000_000 + id ESPN), foto ESPN, scheda creata dai dati ESPN (espn/<id%100>.json).
Si lancia DOPO update_rose.py e rose_tutte.py (le righe ESPN delle volte precedenti si tolgono e si rifanno: chi e' partito sparisce da solo).
Uscite: righe aggiunte in rosa/*.json e rose.json, espn/<id ESPN % 100>.json (bio e statistiche ESPN dei soli giocatori senza id FotMob),
report/rose_espn_stato.json.  Variabili: ESPN_MIN (minuti massimi, 60), ESPN_LEAGUES (elenco di slug per prove), SEARCH_BUDGET (ricerche FotMob, 3000)."""
import difflib, json, os, re, sys, time, unicodedata
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rose_tutte as R

ROOT = R.ROOT
OUTE = os.path.join(ROOT, "espn")
ESPN_BASE = -2_000_000_000
MAX_MIN = float(os.environ.get("ESPN_MIN", "60"))
SEARCH_BUDGET = [int(os.environ.get("SEARCH_BUDGET", "3000"))]
T0 = time.time()
SITE = "https://site.api.espn.com/apis/site/v2/sports/soccer/"
UA = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
POS = {"G": "GK", "GK": "GK", "D": "DEF", "CD": "DEF", "CB": "DEF", "LB": "DEF", "RB": "DEF", "SW": "DEF", "LWB": "DEF", "RWB": "DEF", "WB": "DEF",
       "M": "MID", "CM": "MID", "DM": "MID", "AM": "MID", "LM": "MID", "RM": "MID", "CAM": "MID", "F": "ATT", "FW": "ATT", "CF": "ATT", "ST": "ATT", "LW": "ATT", "RW": "ATT"}
POSN = {"goalkeeper": "GK", "defender": "DEF", "midfielder": "MID", "forward": "ATT", "attacker": "ATT"}
late = lambda: (time.time() - T0) / 60 > MAX_MIN


def jget(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                return json.load(r)
        except Exception as e:
            if "404" in str(e):
                return None
            time.sleep(1 + i)
    return None


def leagues():
    if os.environ.get("ESPN_LEAGUES"):
        return [x for x in os.environ["ESPN_LEAGUES"].split(",") if x]
    out, page = [], 1
    while True:
        j = jget("https://sports.core.api.espn.com/v2/sports/soccer/leagues?limit=300&page=%d" % page)
        if not j:
            break
        for it in j.get("items") or []:
            m = re.search(r"/leagues/([^/?]+)", it.get("$ref", ""))
            if m:
                out.append(m.group(1))
        if page >= (j.get("pageCount") or 1):
            break
        page += 1
    return out


def espn_teams(slug):
    j = jget(SITE + slug + "/teams?limit=200")
    try:
        return [t["team"] for t in j["sports"][0]["leagues"][0]["teams"]]
    except Exception:
        return []


def pos_of(a):
    p = a.get("position") or {}
    return POS.get(str(p.get("abbreviation") or "").upper().split("-")[0]) or POSN.get(str(p.get("name") or "").lower()) or "UNK"


def stats_of(a):
    out = {}
    for c in (((a.get("statistics") or {}).get("splits") or {}).get("categories") or []):
        for s in c.get("stats") or []:
            if s.get("value") is not None:
                out[s["name"]] = s["value"]
    return out


def roster(slug, tid):
    j = jget(SITE + slug + "/teams/%s/roster" % tid)
    rows = []
    for a in (j or {}).get("athletes") or []:
        n = a.get("fullName") or a.get("displayName")
        if not a.get("id") or not n:
            continue
        h = a.get("height")
        dob = a.get("dateOfBirth")
        rows.append({"e": int(a["id"]), "n": n, "p": pos_of(a), "j": a.get("jersey"), "c": a.get("citizenship"), "a": a.get("age"),
                     "h": round(float(h) * 2.54) if h else None, "w": round(float(a["weight"]) * 0.4536) if a.get("weight") else None,
                     "b": str(dob)[:10] if dob else None, "s": stats_of(a), "i": 1 if a.get("injuries") else 0})
    return rows


_TR = str.maketrans({"ł": "l", "Ł": "l", "ø": "o", "Ø": "o", "đ": "d", "Đ": "d", "ı": "i", "İ": "i", "æ": "ae", "Æ": "ae", "œ": "oe", "þ": "th", "ð": "d"})


def tok(s):
    return [t for t in R.norm(str(s or "").translate(_TR)).split() if t]


def prep(name, age, num):
    """(parole del nome, eta', maglia) calcolati una volta sola"""
    try:
        age = int(age) if age is not None else None
    except Exception:
        age = None
    try:
        num = int(num) if num not in (None, "") else None
    except Exception:
        num = None
    t = tok(name)
    return (frozenset(t), age, num, " ".join(sorted(t)), "".join(t))


def same(x, y):
    """Stesso giocatore tra rosa FotMob (x) e riga ESPN (y), entrambi da prep(): stesse parole, oppure nome corto (una parola dentro il nome ESPN) o scritto
    in modo un po' diverso (Cavalheira / Carvalheira) con la stessa eta' (+-1) e, se ci sono, la stessa maglia."""
    a, b = x[0], y[0]
    if not a or not b:
        return False
    if a == b or (min(len(a), len(b)) >= 2 and (a <= b or b <= a)):
        return True
    if x[4] == y[4]:   # N'Dicka / Ndicka: stesse lettere
        return True
    ok_age = x[1] is None or y[1] is None or abs(x[1] - y[1]) <= 1
    ok_num = x[2] is None or y[2] is None or x[2] == y[2]
    if not (ok_age and ok_num):
        return False
    # nome corto da una parte (Bremer / Gleison Bremer): serve eta' o maglia uguali, altrimenti sarebbe solo un cognome in comune
    strong = (x[1] is not None and y[1] is not None) or (x[2] is not None and y[2] is not None)
    if (a <= b or b <= a or len(a & b) >= 2) and strong:
        return True
    # nome quasi uguale: solo con la stessa eta' nota e parole che iniziano allo stesso modo
    if x[1] is not None and y[1] is not None and abs(len(x[3]) - len(y[3])) <= 3 and any(p[:3] == q[:3] for p in a for q in b if len(p) >= 3 and len(q) >= 3):
        return difflib.SequenceMatcher(None, x[3], y[3]).ratio() >= 0.86
    return False


def main():
    tidx = R.team_index()
    rosa = R.shards_load()
    try:
        rose = json.load(open(os.path.join(ROOT, "rose.json"), encoding="utf-8"))
    except Exception:
        rose = {}
    rose_by_id = {str(v.get("id")): k for k, v in rose.items() if v.get("id")}
    # via le righe ESPN delle volte precedenti
    for v in list(rosa.values()) + list(rose.values()):
        v["p"] = [r for r in (v.get("p") or []) if not (r[0] is not None and r[0] <= ESPN_BASE)]
    # indice per parola: id squadra FotMob -> righe (rosa/ e rose.json insieme)
    raw_rows = defaultdict(list)
    for tid, v in rosa.items():
        raw_rows[str(tid)] += [r for r in v.get("p") or []]
    for k, v in rose.items():
        if v.get("id"):
            for r in v.get("p") or []:
                raw_rows[str(v["id"])].append(r)
    rows_of = {tid: [prep(r[1], r[5], r[3]) for r in rows] for tid, rows in raw_rows.items()}
    ids_of = {tid: {r[0] for r in rows} for tid, rows in raw_rows.items()}
    tokix = defaultdict(set)
    for tid, rows in rows_of.items():
        for r in rows:
            for t in r[0]:
                if len(t) >= 4:
                    tokix[t].add(tid)
    slugs = leagues()
    print("campionati ESPN", len(slugs), flush=True)
    teams = {}   # id ESPN squadra -> (slug, team)
    with ThreadPoolExecutor(8) as ex:
        for slug, ts in zip(slugs, ex.map(lambda s: [] if late() else espn_teams(s), slugs)):
            for t in ts:
                teams.setdefault(str(t["id"]), (slug, t))
    print("squadre ESPN", len(teams), "minuti", round((time.time() - T0) / 60, 1), flush=True)
    keys = list(teams)
    ros = {}
    with ThreadPoolExecutor(8) as ex:
        for k, r in zip(keys, ex.map(lambda k: None if late() else roster(teams[k][0], k), keys)):
            if r:
                ros[k] = r
    print("rose ESPN lette", len(ros), "minuti", round((time.time() - T0) / 60, 1), flush=True)

    rep = {"squadre_espn": len(teams), "rose_lette": len(ros), "abbinate": 0, "non_abbinate": [], "aggiunti": 0, "con_id_fotmob": 0, "solo_espn": 0, "per_campionato": {}}
    added_by_tid = defaultdict(list)
    espn_players = {}
    pend = []   # (tid, riga, espn)
    done = 0
    for k, rs in ros.items():
        if late():
            break
        done += 1
        if done % 500 == 0:
            print("abbinate", done, "di", len(ros), "minuti", round((time.time() - T0) / 60, 1), flush=True)
        slug, t = teams[k]
        for e in rs:
            e["x"] = prep(e["n"], e["a"], e["j"])
        # squadra FotMob: quella che ha piu' giocatori in comune (almeno 5, o 40% della rosa ESPN piccola)
        votes = Counter()
        for e in rs:
            seen = set()
            # solo le parole rare (poche squadre): "silva" o "jose" non dicono nulla
            for tk in sorted((q for q in e["x"][0] if len(q) >= 4 and 0 < len(tokix.get(q, ())) <= 40), key=lambda q: len(tokix[q]))[:2]:
                for tid in tokix[tk]:
                    if tid in seen:
                        continue
                    if any(same(r, e["x"]) for r in rows_of[tid]):
                        seen.add(tid)
                        votes[tid] += 1
        if not votes:
            rep["non_abbinate"].append("%s (%s)" % (t.get("displayName"), slug))
            continue
        tid, n = votes.most_common(1)[0]
        second = votes.most_common(2)[1][1] if len(votes) > 1 else 0
        if n < min(5, max(3, len(rs) // 3)) or n < second * 1.5:
            rep["non_abbinate"].append("%s (%s) %s/%s" % (t.get("displayName"), slug, n, len(rs)))
            continue
        rep["abbinate"] += 1
        rows = rows_of[tid]
        miss = [e for e in rs if not any(same(r, e["x"]) for r in rows)]
        for e in miss:
            pend.append((tid, e, slug))
    print("squadre abbinate", rep["abbinate"], "giocatori ESPN mancanti", len(pend), "minuti", round((time.time() - T0) / 60, 1), flush=True)

    def resolve(a):
        tid, e, slug = a
        if SEARCH_BUDGET[0] <= 0 or late():
            return None
        SEARCH_BUDGET[0] -= 1
        try:
            return R.fotmob_id_by_name(e["n"], tid)
        except Exception:
            return None
    with ThreadPoolExecutor(6) as ex:
        ids = list(ex.map(resolve, pend))
    for (tid, e, slug), fid in zip(pend, ids):
        st = e["s"]
        goals, ass = int(st.get("totalGoals") or 0), int(st.get("goalAssists") or 0)
        if fid and fid not in ids_of[tid]:
            row = [fid, e["n"], e["p"], e["j"] if e["j"] not in ("", None) else None, e["c"], e["a"], e["h"], None, goals, ass, e["i"], 0]
            rep["con_id_fotmob"] += 1
        elif fid:
            continue
        else:
            row = [ESPN_BASE - e["e"], e["n"], e["p"], int(e["j"]) if str(e["j"] or "").isdigit() else None, e["c"], e["a"], e["h"], None, goals, ass, e["i"], 0]
            espn_players[e["e"]] = {"t": int(tid), "n": e["n"], "p": e["p"], "j": row[3], "c": e["c"], "a": e["a"], "h": e["h"], "w": e["w"], "b": e["b"], "s": e["s"], "lg": slug}
            rep["solo_espn"] += 1
        added_by_tid[tid].append(row)
        rep["aggiunti"] += 1
        rep["per_campionato"][slug] = rep["per_campionato"].get(slug, 0) + 1
    # scrittura: rosa/ e rose.json
    for tid, rows in added_by_tid.items():
        cur = rosa.get(str(tid))
        if cur is not None and cur.get("p"):
            cur["p"].extend(rows)
            cur["src"] = sorted(set((cur.get("src") or []) + ["espn"]))
        nm = rose_by_id.get(str(tid))
        if nm:
            rose[nm].setdefault("p", []).extend(rows)
    R.shards_save(rosa)
    with open(os.path.join(ROOT, "rose.json"), "w", encoding="utf-8") as f:
        json.dump(rose, f, ensure_ascii=False, separators=(",", ":"))
    os.makedirs(OUTE, exist_ok=True)
    sh = defaultdict(dict)
    for eid, v in espn_players.items():
        sh[eid % 100][str(eid)] = v
    for i in range(100):
        p = os.path.join(OUTE, "%d.json" % i)
        if sh.get(i):
            json.dump(sh[i], open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        elif os.path.exists(p):
            os.remove(p)
    rep["non_abbinate_n"] = len(rep["non_abbinate"])
    rep["non_abbinate"] = rep["non_abbinate"][:80]
    rep["per_campionato"] = dict(sorted(rep["per_campionato"].items(), key=lambda x: -x[1])[:60])
    rep["minuti"] = round((time.time() - T0) / 60, 1)
    os.makedirs("report", exist_ok=True)
    json.dump(rep, open("report/rose_espn_stato.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(rep, ensure_ascii=False)[:2500], flush=True)


if __name__ == "__main__":
    main()
