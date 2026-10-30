#!/usr/bin/env python3
"""Rose di TUTTE le squadre dell'indice tidx (non solo quelle dei campionati principali di rose.json) -> rosa/<id%100>.json:
{id squadra: {"co": allenatore, "ci": id allenatore, "p": [righe come rose.json + minuti], "src": fonti}}.
Riga: [id FotMob, nome, ruolo GK/DEF/MID/ATT/UNK, maglia, paese, eta', altezza, None, 0, 0, infortunato, minuti].
Niente voti/gol nella riga: cambiano ogni giornata e riscriverebbero tutti i file ogni giorno.

Fonti, una dopo l'altra per chi resta con meno di 11 giocatori o senza ruolo (mai dati inventati, mai un ruolo indovinato):
  1) FotMob /api/data/teams: rosa per ruolo e allenatore (o l'ultimo di coachHistory nella stagione in corso);
  2) archivio: chi ha giocato l'ultima stagione della squadra (classifiche ufficiali, formazioni, minuti, eventi);
  3) LiveScore (la ricerca da' lo stemma enet/<id FotMob>.png: la squadra e' certa per id), poi OneFootball (stesso nome e stesso paese, una sola squadra);
  4) API-Football (solo con API_FOOTBALL_KEY, tetto di richieste; il nome deve combaciare con una sola squadra del paese giusto).
Le righe esterne stanno in rosa/_esterne.json (si rileggono ogni ROSE_EXT_GIORNI, default 14) e si uniscono per nome ai giocatori FotMob; l'id FotMob di chi resta
senza si cerca con la ricerca FotMob (stessa squadra), altrimenti id negativo: riga senza collegamento e con la sagoma.
Ruolo di chi non l'ha dalla rosa: rosa esterna, posizione piu' usata (righe delle classifiche e formazioni st/sb), rosa FotMob di un'altra squadra, scheda
FotMob del giocatore (ricordata in rosa/_ruoli.json). Senza nessuna di queste resta UNK e l'app lo mette in "Giocatori".

Giro giornaliero a tempo (ROSE_MIN, default 50 minuti, piu' ROSE_EXT_MIN, default 25, per le fonti esterne): prima le squadre della stagione in corso,
le altre ogni 30 giorni (rosa/_stato.json)."""
import datetime as dt
import gzip
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "rosa")
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*", "Accept-Language": "en-US,en;q=0.9"}
GRP = {"keepers": "GK", "defenders": "DEF", "midfielders": "MID", "attackers": "ATT"}
TODAY = dt.date.today().isoformat()
MIN_RUN = float(os.environ.get("ROSE_MIN", "50"))
T0 = time.time()
MIN_ROSA = 11
OLD_DAYS = 30
# posizioni delle formazioni FotMob con un ruolo chiaro, ricavate confrontandole con le rose FotMob (dominante >= 70% su campione ampio).
# Le posizioni ambigue (es. 72, 78: esterni tra centrocampo e attacco) non votano.
POS_ROLE = {11: "GK", 1: "DEF", 32: "DEF", 33: "DEF", 34: "DEF", 35: "DEF", 36: "DEF", 37: "DEF", 38: "DEF", 41: "DEF", 51: "DEF",
            2: "MID", 63: "MID", 64: "MID", 65: "MID", 66: "MID", 67: "MID", 71: "MID", 73: "MID", 74: "MID", 75: "MID", 76: "MID", 77: "MID", 84: "MID", 85: "MID", 86: "MID",
            3: "ATT", 82: "ATT", 83: "ATT", 87: "ATT", 88: "ATT", 103: "ATT", 104: "ATT", 105: "ATT", 106: "ATT", 107: "ATT", 114: "ATT", 115: "ATT"}
LABEL_ROLE = {"keeper": "GK", "goalkeeper": "GK", "defender": "DEF", "midfielder": "MID", "forward": "ATT", "attacker": "ATT", "striker": "ATT"}
EXT_MIN = float(os.environ.get("ROSE_EXT_MIN", "25"))
EXT_DAYS = int(os.environ.get("ROSE_EXT_GIORNI", "14"))
AF_KEY = os.environ.get("API_FOOTBALL_KEY", "")
AF_BUDGET = [int(os.environ.get("AF_BUDGET", "80"))]
AF_POS = {"Goalkeeper": "GK", "Defender": "DEF", "Midfielder": "MID", "Attacker": "ATT"}
PLAYER_BUDGET = [int(os.environ.get("ROSE_GIOCATORI", "4000"))]


def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                # "null" = la fonte non ha quella pagina (non e' un errore: non si riprova)
                j = json.load(r)
                return {} if j is None else j
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(2 + i * 3)
        except Exception:
            time.sleep(2 + i * 3)
    return None


def load(p, gz=False, default=None):
    try:
        return json.load(gzip.open(p, "rt", encoding="utf-8") if gz else open(p, encoding="utf-8"))
    except Exception:
        return default


def num(v):
    try:
        return float(v)
    except Exception:
        return None


def fetch_team(tid):
    """Rosa e allenatore da FotMob. None = richiesta fallita (si tiene quello che c'era); p vuota = FotMob non ha la rosa."""
    t = get("https://www.fotmob.com/api/data/teams?id=%s&ccode3=ITA" % tid)
    if not isinstance(t, dict):
        return None
    rows, co, ci = [], None, None
    for g in ((t.get("squad") or {}).get("squad") or []):
        t0 = g.get("title")
        if t0 == "coach":
            m0 = (g.get("members") or [{}])[0]
            co, ci = m0.get("name"), m0.get("id")
        elif t0 in GRP:
            for m in g.get("members") or []:
                if m.get("id") and m.get("name"):
                    rows.append([m["id"], m["name"], GRP[t0], m.get("shirtNumber"), m.get("cname"), m.get("age"), num(m.get("height")), None, 0, 0, 1 if m.get("injury") else 0, 0])
    if not co:
        # squadre senza rosa su FotMob: l'allenatore della stagione in corso dallo storico (solo se e' proprio di questa stagione)
        latest = (t.get("details") or {}).get("latestSeason")
        hist = ((t.get("overview") or {}).get("coachHistory") or [])
        now = [c for c in hist if latest and c.get("season") == latest]
        if now:
            co, ci = now[-1].get("name"), now[-1].get("id")
    return {"p": rows, "co": co, "ci": ci, "cc": (t.get("details") or {}).get("country")}


def shards_load():
    out = {}
    for i in range(100):
        out.update(load(os.path.join(OUT, "%d.json" % i), default={}) or {})
    return out


def shards_save(data):
    os.makedirs(OUT, exist_ok=True)
    sh = {}
    for tid, v in data.items():
        sh.setdefault(int(tid) % 100, {})[str(tid)] = v
    for i in range(100):
        body = json.dumps(dict(sorted(sh.get(i, {}).items(), key=lambda x: int(x[0]))), ensure_ascii=False, separators=(",", ":"))
        p = os.path.join(OUT, "%d.json" % i)
        try:
            if open(p, encoding="utf-8").read() == body:
                continue
        except Exception:
            pass
        with open(p, "w", encoding="utf-8") as f:
            f.write(body)


def team_index():
    tidx = {}
    d = os.path.join(ROOT, "tidx")
    for f in os.listdir(d):
        if f.endswith(".json"):
            tidx.update(load(os.path.join(d, f), default={}) or {})
    return tidx


def year_of(sk):
    return int(str(sk)[:4]) if str(sk)[:4].isdigit() else 0


def last_season(e):
    """(fm, stagione) piu' recenti di una riga di tidx, per ogni competizione giocata nell'anno piu' recente."""
    rows = [(x[0], x[1][0]) for x in e[1:] if isinstance(x, list) and len(x) > 1 and x[1]]
    if not rows:
        return []
    top = max(year_of(s) for _, s in rows)
    return [(fm, s) for fm, s in rows if year_of(s) == top]


class Archive:
    """Chi ha giocato una stagione: stessa lettura di seasonRoster (data/rose.js), piu' le posizioni."""

    def __init__(self):
        self.cache = {}

    def season(self, fm, sk):
        k = (fm, sk)
        if k in self.cache:
            return self.cache[k]
        by_team, votes, coach = {}, {}, {}

        def add(tid, pid, name, mins=0):
            if not tid or not pid or not name:
                return
            a = by_team.setdefault(str(tid), {}).setdefault(int(pid), [name, 0])
            a[1] = max(a[1], mins or 0)

        st = load(os.path.join(ROOT, "arch", str(fm), sk + "_s.json"))
        for key, rows in ((st or {}).get("players") or {}).items():
            if str(key).startswith("_") or (st or {}).get("v") != 2:
                continue
            for r in rows or []:
                if len(r) < 6:
                    continue
                add(r[2], r[0], r[1], r[4])
                if len(r) > 6 and isinstance(r[6], list) and r[6]:
                    c = votes.setdefault(int(r[0]), Counter())
                    for pos in r[6][:1]:
                        c[pos] += 3  # posizione principale della stagione: vale piu' di una singola partita
        det = load(os.path.join(ROOT, "partite", str(fm), sk + ".json.gz"), gz=True) or {}
        sides = {str(f[0]): (str(f[2]), str(f[3])) for f in (load(os.path.join(ROOT, "arch", str(fm), sk + ".json")) or {}).get("fix") or [] if len(f) > 3}
        for mid, m in (det.get("m") or {}).items():
            if not m:
                continue
            for side in (m.get("h") or {}, m.get("a") or {}):
                tid = side.get("id")
                if not tid:
                    continue
                if side.get("co") and not isinstance(side.get("co"), list):
                    coach[str(tid)] = side["co"]
                for lst, starter in ((side.get("st"), True), (side.get("sb"), False)):
                    for r in lst or []:
                        if not isinstance(r, list) or not r or r[0] is None or len(r) < 2:
                            continue
                        mins = ((m.get("p") or {}).get(str(r[0])) or {}).get("minutes_played") or 0
                        add(tid, r[0], r[1], mins)
                        if starter and len(r) > 3 and r[3] is not None:
                            votes.setdefault(int(r[0]), Counter())[r[3]] += 1
            sd = sides.get(str(mid))
            if sd:
                for ev in m.get("e") or []:
                    if isinstance(ev, dict) and isinstance(ev.get("p"), list) and len(ev["p"]) > 1:
                        add(sd[0] if ev.get("isHome") else sd[1], ev["p"][0], ev["p"][1])
        self.cache[k] = (by_team, votes, coach)
        return self.cache[k]


def role_from_votes(c):
    """Posizione piu' usata con un ruolo chiaro (le posizioni ambigue non votano)."""
    tot = Counter()
    for pos, n in (c or {}).items():
        r = POS_ROLE.get(pos)
        if r:
            tot[r] += n
    return tot.most_common(1)[0][0] if tot else None


def player_role(pid):
    """Scheda FotMob del giocatore: ruolo principale (es. {"label": "forward"})."""
    j = get("https://www.fotmob.com/api/data/playerData?id=%d" % pid)
    if not isinstance(j, dict):
        return None
    pd = (j.get("positionDescription") or {}).get("primaryPosition") or {}
    return LABEL_ROLE.get(str(pd.get("label") or "").strip().lower())


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\b(fc|ac|as|sc|sk|fk|cf|cd|sv|kv|rsc|rc|ssc|afc)\b", " ", re.sub(r"[^a-z0-9]+", " ", s)).strip()


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


def from_apifootball(name, country):
    """Solo se il nome (e il paese, se noto) combaciano con una sola squadra: mai la rosa di un'omonima."""
    j = af_get("/teams?search=" + urllib.parse.quote(re.sub(r"[^A-Za-z0-9 ]", " ", name).strip()[:40]))
    n = norm(name)
    cand = [x["team"] for x in ((j or {}).get("response") or []) if norm((x.get("team") or {}).get("name")) == n]
    if country and len(cand) > 1:
        cand = [c for c in cand if str(c.get("country") or "")[:3].upper() == str(country)[:3].upper()]
    if len(cand) != 1:
        return None
    k = af_get("/players/squads?team=%d" % cand[0]["id"])
    return ((((k or {}).get("response") or [{}])[0] or {}).get("players") or [])


def get_text(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
            return r.read().decode("utf-8", "ignore")
    except Exception:
        return None


def search_name(name):
    """Nome per le ricerche: senza sigle di club e senza etichette (Women, U21...) che i motori non capiscono."""
    return re.sub(r"\s+", " ", re.sub(r"[^\w ]", " ", str(name))).strip()[:40]


def from_livescore(tid, name):
    """LiveScore: la squadra e' quella giusta solo se lo stemma ha il suo id FotMob. Righe [nome, ruolo, maglia, paese, eta', altezza], allenatore."""
    # l'id nello stemma rende sicura anche una ricerca larga: nome intero, senza accenti, poi la parola piu' lunga
    ascii_name = unicodedata.normalize("NFKD", str(name)).encode("ascii", "ignore").decode()
    words = sorted(norm(name).split(), key=len, reverse=True)
    hit = []
    for q in dict.fromkeys([search_name(name), search_name(ascii_name)] + words[:1]):
        if len(q) < 3:
            continue
        j = get("https://prod-cdn-search-api.livescore.com/api/v2/search/soccer/team?query=%s&limit=30" % urllib.parse.quote(q))
        hit = [x for x in ((j or {}).get("Teams") or []) if str(x.get("Img") or "") == "enet/%s.png" % tid]
        if hit:
            break
    if len(hit) != 1:
        return None
    html = get_text("https://www.livescore.com/en/football/team/x/%s/squad/" % hit[0]["ID"])
    m = re.search(r'__NEXT_DATA__"[^>]*>(.*?)</script>', html or "", re.S)
    if not m:
        return None
    try:
        sq = json.loads(m.group(1))["props"]["pageProps"]["initialData"]["squad"]
    except Exception:
        return None
    rows = []
    for key, lst in (sq or {}).items():
        role = LABEL_ROLE.get(key)
        if role:
            rows += [[x["name"], role, x.get("shirtNumber"), x.get("countryName"), None, None] for x in lst or [] if x.get("name")]
    co = ((sq or {}).get("coach") or [{}])[0].get("name")
    return {"p": rows, "co": co, "src": "livescore"} if rows else None


def from_onefootball(name, country):
    """OneFootball: stesso nome e stesso paese, una sola squadra (mai un'omonima)."""
    if not country:
        return None
    j = get("https://search-api.onefootball.com/v2/en/search?q=%s" % urllib.parse.quote(search_name(name)))
    n = norm(name)
    cand = [t for t in ((j or {}).get("teams") or []) if norm(t.get("name")) == n and not t.get("is_national") and norm((t.get("country") or {}).get("name")) == norm(country)]
    if len(cand) != 1:
        return None
    k = get("https://vintagemonster.onefootball.com/api/teams/en/%s.json" % cand[0]["id"])
    t = ((k or {}).get("data") or {}).get("team") or {}
    rows = []
    for x in t.get("players") or []:
        role = LABEL_ROLE.get(str(x.get("position") or "").strip().lower())
        if x.get("name"):
            rows.append([x["name"], role or "UNK", x.get("number") or None, x.get("country"), num(x.get("age")) and int(num(x.get("age"))), x.get("height") or None])
    co = next((o.get("name") for o in t.get("officials") or [] if "coach" in str(o.get("position") or "").lower() and o.get("name")), None)
    return {"p": rows, "co": co, "src": "onefootball"} if rows else None


def name_key(s):
    return sorted(norm(s).split())


def same_person(a, b):
    """Stessa persona tra due fonti: stesse parole del nome, o le parole di uno tutte nell'altro (almeno due)."""
    x, y = set(name_key(a)), set(name_key(b))
    return bool(x and y) and (x == y or (min(len(x), len(y)) >= 2 and (x <= y or y <= x)))


def fotmob_id_by_name(name, tid):
    """Id FotMob dalla ricerca FotMob, solo se il giocatore risulta proprio in questa squadra."""
    j = get("https://apigw.fotmob.com/searchapi/suggest?term=%s&lang=en" % urllib.parse.quote(name))
    for g in ((j or {}).get("squadMemberSuggest") or []):
        for o in g.get("options") or []:
            pl = o.get("payload") or {}
            if str(pl.get("teamId")) == str(tid) and not pl.get("isCoach") and same_person(str(o.get("text")).split("|")[0], name):
                return int(pl["id"])
    return None


def external_fill(data, tidx, country_of, is_current, stato):
    """Squadre con meno di 11 giocatori o con ruoli mancanti: LiveScore, poi OneFootball. Risultati ricordati in rosa/_esterne.json."""
    path = os.path.join(OUT, "_esterne.json")
    ext = load(path, default={}) or {}
    today = dt.date.today()

    def wanted(tid):
        rows = (data.get(tid) or {}).get("p") or []
        return len(rows) < MIN_ROSA or any(x[2] == "UNK" for x in rows)

    def due(tid):
        last = (ext.get(tid) or {}).get("d")
        return not last or (today - dt.date.fromisoformat(last)).days >= EXT_DAYS

    todo = sorted((t for t in tidx if wanted(t) and due(t)), key=lambda t: (not is_current(tidx[t]), int(t)))
    print("fonti esterne: squadre da cercare", len(todo), flush=True)
    t1 = time.time()

    def one(tid):
        if time.time() - t1 > EXT_MIN * 60:
            return tid, "tempo"
        got = from_livescore(tid, tidx[tid][0])
        have = len((got or {}).get("p") or [])
        if have < MIN_ROSA:
            of = from_onefootball(tidx[tid][0], country_of(tid))
            if of and len(of["p"]) > have:
                got = of
                have = len(of["p"])
        # API-Football: tetto di richieste, le squadre della stagione in corso sono le prime della lista
        if have < MIN_ROSA and AF_KEY and AF_BUDGET[0] >= 2:
            pl = from_apifootball(tidx[tid][0], country_of(tid)) or []
            rows = [[p["name"], AF_POS.get(p.get("position"), "UNK"), p.get("number"), None, p.get("age"), None] for p in pl if p.get("name")]
            if len(rows) > have:
                got = {"p": rows, "co": None, "src": "api-football"}
        return tid, got

    found = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        for tid, got in ex.map(one, todo):
            if got == "tempo":
                continue
            ext[tid] = dict(got or {}, d=today.isoformat())
            found += 1 if got else 0
    print("fonti esterne: trovate", found, "su", len(todo), int(time.time() - t1), "s", flush=True)
    # unione: per nome ai giocatori gia' noti (il ruolo della rosa esterna vale per chi non ne ha); gli altri si aggiungono
    n_id, n_add = 0, 0
    for tid, x in ext.items():
        if tid not in tidx or not x.get("p"):
            continue
        cur = data.setdefault(tid, {"p": []})
        rows = cur.setdefault("p", [])
        if not cur.get("co") and x.get("co"):
            cur["co"] = x["co"]
        add = []
        for e in x["p"]:
            old = next((r for r in rows if same_person(r[1], e[0])), None)
            if old:
                if old[2] == "UNK" and e[1] != "UNK":
                    old[2] = e[1]
                for i, v in ((3, e[2]), (4, e[3]), (5, e[4]), (6, e[5])):
                    if old[i] is None and v:
                        old[i] = v
            else:
                add.append(e)
        if add:
            cur["src"] = sorted(set((cur.get("src") or []) + [x.get("src")]))
        for e in add:
            pid = e[6] if len(e) > 6 else None
            if pid is None and PLAYER_BUDGET[0] > 0:
                PLAYER_BUDGET[0] -= 1
                pid = fotmob_id_by_name(e[0], tid)
                if pid:
                    n_id += 1
                while len(e) < 6:
                    e.append(None)
                e.append(pid or 0)  # ricordato: una sola ricerca per giocatore
            if not pid:
                # senza id FotMob: id negativo stabile dal nome, riga senza collegamento e con la sagoma
                pid = -(abs(hash_name(e[0])) % 10 ** 9) - 1
            rows.append([pid, e[0], e[1], e[2], e[3], e[4], e[5], None, 0, 0, 0, 0])
            n_add += 1
    print("fonti esterne: giocatori aggiunti", n_add, "con id FotMob ritrovato", n_id, flush=True)
    json.dump(ext, open(path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def hash_name(s):
    """Hash stabile tra i giri (hash() di Python cambia a ogni avvio)."""
    h = 0
    for c in norm(s):
        h = (h * 131 + ord(c)) % (2 ** 31)
    return h


def main():
    tidx = team_index()
    data = shards_load()
    stato = load(os.path.join(OUT, "_stato.json"), default={}) or {}
    ruoli = load(os.path.join(OUT, "_ruoli.json"), default={}) or {}
    now_year = dt.date.today().year
    arch_idx = load(os.path.join(ROOT, "arch", "index.json"), default={}) or {}

    def country_of(tid):
        """Paese della squadra: la competizione nazionale piu' recente (nome del paese dell'indice)."""
        for x in tidx[tid][1:]:
            e = arch_idx.get(str(x[0])) or {}
            if e.get("c") != "INT" and e.get("cn"):
                return e["cn"]
        return None

    def is_current(e):
        return any(year_of(s) >= now_year - 1 for _, s in last_season(e))

    def due(tid):
        last = stato.get(tid)
        if not last:
            return True
        if is_current(tidx[tid]):
            return last < TODAY
        return (dt.date.today() - dt.date.fromisoformat(last)).days >= OLD_DAYS

    todo = sorted((t for t in tidx if due(t)), key=lambda t: (not is_current(tidx[t]), stato.get(t, ""), int(t)))
    print("squadre", len(tidx), "da scaricare", len(todo), flush=True)
    raw, done, fails = {}, 0, 0

    def one(tid):
        if time.time() - T0 > MIN_RUN * 60:
            return tid, "tempo"
        r = fetch_team(tid)
        time.sleep(0.1)
        return tid, r

    with ThreadPoolExecutor(max_workers=int(os.environ.get("ROSE_THREADS", "4"))) as ex:
        for tid, r in ex.map(one, todo):
            if r == "tempo":
                continue
            done += 1
            if r is None:
                fails += 1
                continue
            raw[tid] = r
            stato[tid] = TODAY
            if done % 500 == 0:
                print(" ", done, "scaricate,", fails, "errori,", int(time.time() - T0), "s", flush=True)
    print("scaricate", done, "errori", fails, int(time.time() - T0), "s", flush=True)

    # le rose FotMob valgono per tutti: un giocatore senza ruolo puo' averlo nella rosa di un'altra squadra
    known = {}
    for tid, r in raw.items():
        for row in r["p"]:
            known[int(row[0])] = row
    for v in data.values():
        for row in v.get("p") or []:
            if row[2] != "UNK":
                known.setdefault(int(row[0]), row)
    for v in (load(os.path.join(ROOT, "rose.json"), default={}) or {}).values():
        for row in (v.get("p") or []):
            if row[0] and row[0] > 0 and row[2] != "UNK":
                known.setdefault(int(row[0]), row)

    # il dato scaricato oggi sostituisce il vecchio; chi non e' stato scaricato tiene la rosa di prima (ma si ricontrollano ruoli e buchi).
    # Righe esterne (id negativi) tolte qui e riaggiunte da external_fill: restano aggiornate con _esterne.json.
    for v in data.values():
        if any(x[0] and x[0] < 0 for x in v.get("p") or []):
            v["p"] = [x for x in v["p"] if not x[0] or x[0] > 0]
    arch = Archive()
    need_role = {}
    for tid, e in tidx.items():
        cur = data.get(tid) or {}
        r = raw.get(tid)
        if r is None and not cur:
            r = {"p": [], "co": None, "ci": None}
        if r is not None:
            cur = {"p": r["p"], "co": r["co"], "ci": r["ci"], "src": ["fotmob"] if r["p"] else [], "cc": r.get("cc")}
        rows = cur.get("p") or []
        fm_rows = sum(1 for x in rows if x[0] and x[0] > 0)
        if fm_rows < MIN_ROSA or any(x[2] == "UNK" for x in rows):
            have = {int(x[0]) for x in rows}
            added = False
            for fm, sk in last_season(e):
                by_team, votes, coach = arch.season(fm, sk)
                if not cur.get("co") and coach.get(tid):
                    cur["co"] = coach[tid]
                for pid, (name, mins) in by_team.get(tid, {}).items():
                    if pid in have:
                        continue
                    have.add(pid)
                    k = known.get(pid)
                    # dalla rosa FotMob di un'altra squadra: stesso giocatore, anagrafica e ruolo veri
                    rows.append([pid, name, "UNK", None, k[4] if k else None, k[5] if k else None, k[6] if k else None, None, 0, 0, 0, mins])
                    added = True
            if added:
                cur["src"] = (cur.get("src") or []) + ["archivio"]
            cur["p"] = rows
        # ruolo di chi non ce l'ha: posizione piu' usata, rosa di un'altra squadra, scheda giocatore
        for x in rows:
            if x[2] != "UNK":
                continue
            pid = int(x[0])
            if pid < 0:
                continue
            role = None
            for fm, sk in last_season(e):
                role = role or role_from_votes(arch.season(fm, sk)[1].get(pid))
            if not role and pid in known:
                role = known[pid][2]
            if not role and ruoli.get(str(pid)):
                role = ruoli[str(pid)]
            if role:
                x[2] = role
            else:
                need_role.setdefault(pid, []).append(x)
        data[tid] = cur

    # schede dei giocatori ancora senza ruolo (ricordate: una sola richiesta per giocatore)
    ids = [p for p in need_role if str(p) not in ruoli][:PLAYER_BUDGET[0]]
    print("giocatori senza ruolo", len(need_role), "schede da leggere", len(ids), flush=True)
    with ThreadPoolExecutor(max_workers=4) as ex:
        for pid, role in zip(ids, ex.map(player_role, ids)):
            ruoli[str(pid)] = role or ""
    for pid, lst in need_role.items():
        role = ruoli.get(str(pid))
        if role:
            for x in lst:
                x[2] = role

    external_fill(data, tidx, country_of, is_current, stato)
    # solo le squadre con qualcosa da mostrare (niente righe vuote: l'app ripiega da sola)
    for tid in list(data):
        v = data[tid]
        v.pop("cc", None)
        if not v.get("co"):
            v.pop("co", None)
        if not v.get("ci"):
            v.pop("ci", None)
        if not v.get("p") and not v.get("co"):
            del data[tid]
    shards_save(data)
    json.dump(stato, open(os.path.join(OUT, "_stato.json"), "w", encoding="utf-8"), separators=(",", ":"), sort_keys=True)
    json.dump({k: v for k, v in sorted(ruoli.items())}, open(os.path.join(OUT, "_ruoli.json"), "w", encoding="utf-8"), separators=(",", ":"))
    tot = Counter()
    for v in data.values():
        p = v.get("p") or []
        tot["squadre"] += 1
        tot["giocatori"] += len(p)
        if len(p) < MIN_ROSA:
            tot["<11"] += 1
        if p and all(x[2] == "UNK" for x in p):
            tot["solo UNK"] += 1
    print(dict(tot), sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, "KB", int(time.time() - T0), "s", flush=True)


if __name__ == "__main__":
    sys.exit(main())
