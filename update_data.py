#!/usr/bin/env python3
"""Scarica le statistiche tiri da PitchAPI e salva medie per squadra in data.json.
Usa solo la libreria standard di Python. La chiave arriva dalla variabile PITCHAPI_KEY."""
import json, os, re, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone

BASE = os.environ.get("PITCHAPI_BASE", "https://api.pitchapi.dev")
KEY = os.environ.get("PITCHAPI_KEY", "").strip()
SEASON_START = os.environ.get("SEASON_START", "2026")   # stagione 2026/2027
PAUSE = float(os.environ.get("PAUSE", "0.25"))
CACHE_FILE, OUT_FILE = "cache.json", "data.json"

# chiave app, paese (None = senza filtro paese), nome (regex), esclusioni (regex)
WANTED = [
    ("serie-a", "ITA", r"^serie a$", None),
    ("premier-league", "ENG", r"premier league", r"u21|u18|women|2"),
    ("bundesliga", "GER", r"^bundesliga$", None),
    ("la-liga", "ESP", r"laliga|la liga", r"2|hypermotion|segunda|women"),
    ("ligue-1", "FRA", r"^ligue 1$", None),
    ("eredivisie", "NED", r"eredivisie", r"women|vrouwen"),
    ("liga-portugal", "POR", r"liga portugal|primeira", r"2|segunda|women"),
    ("super-lig", "TUR", r"s[uü]per lig", r"women|2"),
    ("pro-league", "BEL", r"pro league|jupiler|first division a",
     r"challenger|u23|futures|cup|super|women|youth|first division b"),
    ("champions-league", None, r"champions league",
     r"afc|caf|concacaf|conmebol|women|qualif|youth|asia|africa|oceania|libertadores"),
    ("europa-league", None, r"europa league",
     r"conference|women|qualif|youth|afc|caf"),
]

def api(path):
    for attempt in range(6):
        req = urllib.request.Request(BASE + path, headers={"X-API-KEY": KEY, "User-Agent": "tiri-dati/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                j = json.loads(r.read().decode())
                if "error" in j:
                    raise RuntimeError(f"{j['error'].get('code')}: {j['error'].get('message')}")
                return j["data"]
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = int(e.headers.get("Retry-After", "3") or 3)
                time.sleep(min(wait, 60) + 1); continue
            if e.code == 404:
                return None
            if e.code >= 500:
                time.sleep(3 * (attempt + 1)); continue
            print("ERRORE API", e.code, path, e.read().decode()[:300])
            raise
        except (urllib.error.URLError, TimeoutError):
            time.sleep(3 * (attempt + 1))
    raise RuntimeError("troppi tentativi falliti per " + path)

def num(v):
    m = re.search(r"-?\d+(\.\d+)?", str(v if v is not None else ""))
    return float(m.group(0)) if m else None

def parse_stats(s):
    periods = s.get("periods") or []
    allp = next((p for p in periods if p.get("period") == "All"), periods[0] if periods else None)
    items = [i for g in (allp or {}).get("groups", []) for i in g.get("items", [])]
    tot = next((i for i in items if re.fullmatch(r"total shots", i.get("title", ""), re.I) or i.get("key") == "total_shots"), None)
    sot = next((i for i in items if re.search(r"shots on target", i.get("title", ""), re.I) and not re.search(r"xg", i.get("title", ""), re.I)), None)
    if not tot or not sot:
        return None, items
    vals = [num(tot["home"]), num(tot["away"]), num(sot["home"]), num(sot["away"])]
    return (None if None in vals else vals), items

def find_league(leagues, cc, rx, ex):
    out = []
    for l in leagues:
        name = l.get("name", "")
        if cc is not None and l.get("country_code") != cc:
            continue
        if not re.search(rx, name, re.I):
            continue
        if ex and re.search(ex, name, re.I):
            continue
        out.append(l)
    return out

# --- campionati in piu' (chiave, paese, nome regex, esclusioni regex) ---
EXTRA = [
    ("scottish-premiership", "SCO", r"scottish premiership|^premiership$", r"women|u\d\d|cup|2"),
    ("ekstraklasa", "POL", r"ekstraklasa|pko", r"women|u\d\d|cup"),
    ("czech-first-league", "CZE", r"czech|first league|chance liga|fortuna", r"women|u\d\d|cup|2"),
]
TOP5 = {"serie-a", "premier-league", "bundesliga", "la-liga", "ligue-1"}   # nessun handicap, tutte le squadre
CUPS = {"champions-league", "europa-league"}
SKIP = re.compile(r"women|femin|\bu-?\d\d\b|youth|junior|reserve|cup|copa|coppa|pokal|ta[cc]a|beker|supercup|super cup"
                  r"|qualif|conference|champions|europa|nations|world|friendl|afc|caf|concacaf|conmebol|play-?off", re.I)

# ranking UEFA dei campionati (Transfermarkt, ott 2026), in ordine
UEFA = ["ENG", "ITA", "ESP", "GER", "FRA", "POR", "BEL", "NED", "TUR", "GRE", "POL", "CZE", "NOR", "DEN", "CYP",
        "SUI", "HUN", "AUT", "CRO", "SCO", "SWE", "ROU", "UKR", "AZE", "ISR", "SVN", "SVK", "RUS", "BUL", "SRB",
        "ISL", "IRL", "ARM", "LVA", "KOS", "BIH", "FIN", "KAZ"]
ISO = {"DEU": "GER", "NLD": "NED", "PRT": "POR", "GRC": "GRE", "DNK": "DEN", "CHE": "SUI", "HRV": "CRO",
       "BGR": "BUL", "XKX": "KOS", "XKS": "KOS"}
H_START, H_STEP, H_FLOOR = 0.85, 0.05, 0.50   # scaglioni da 3 posizioni: 6-8 = 0,85; 9-11 = 0,80; 12-14 = 0,75 ...


def handicap(key, cc):
    """None per i top 5; altrimenti moltiplicatore s: tiri fatti x s, tiri subiti / s."""
    if key in TOP5:
        return None
    cc = ISO.get(cc, cc)
    rank = UEFA.index(cc) + 1 if cc in UEFA else 99
    if rank <= 5:
        rank = 6            # serie minori dei paesi top 5: primo scaglione
    tier = (rank - 6) // 3
    return round(max(H_FLOOR, H_START - H_STEP * tier), 2)


def season_of(lg):
    return next((s for s in lg.get("seasons", []) if str(s).startswith(SEASON_START)), None)


def tid(t):
    return t.get("id") or t["name"]


def main():
    if not KEY:
        sys.exit("Manca la variabile PITCHAPI_KEY (segreto del repository).")
    cache = json.load(open(CACHE_FILE)) if os.path.exists(CACHE_FILE) else {}
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    print(f"Campionati nel catalogo: {len(leagues)}")
    out = {"updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "season_start": SEASON_START, "leagues": {}}
    state = {"printed": False}
    cup_ids, done = set(), set()

    def league_matches(lg, upcoming=False):
        q = urllib.request.quote(season_of(lg), safe="")
        extra = "&status=upcoming" if upcoming else ""
        return (api(f"/v1/leagues/{lg['id']}/matches?season={q}{extra}") or {}).get("matches", [])

    def build(key, lg, label, restricted):
        matches = league_matches(lg)
        if restricted:
            matches = [m for m in matches if tid(m["home_team"]) in cup_ids or tid(m["away_team"]) in cup_ids]
            if not matches:
                return
        h = handicap(key, lg.get("country_code")) if key not in CUPS else None
        print(f"✔ {key}: {lg['name']} [{lg.get('country_code')}] - {len(matches)} partite" +
              (f" (solo squadre europee), handicap x{h}" if restricted else "") + ("" if restricted else (f", handicap x{h}" if h else "")))
        teams, ids, imgs, missing = {}, {}, {}, 0
        for m in matches:
            mid = m["id"]
            rec = cache.get(mid)
            if rec is None:
                s = api(f"/v1/matches/{mid}/stats")
                time.sleep(PAUSE)
                vals, items = (parse_stats(s) if s else (None, []))
                if not state["printed"] and items:
                    state["printed"] = True
                    print("Voci con 'shot' nella prima partita letta:")
                    for i in items:
                        if re.search(r"shot", i.get("title", "") + i.get("key", ""), re.I):
                            print("   ", i.get("title"), f"[{i.get('key')}]", i.get("home"), "-", i.get("away"))
                rec = {"vals": vals, "home": m["home_team"]["name"], "away": m["away_team"]["name"], "date": m.get("date")}
                if vals is not None:
                    cache[mid] = rec          # le partite senza statistiche si riprovano al giro dopo
            ids[m["home_team"]["name"]] = tid(m["home_team"]); ids[m["away_team"]["name"]] = tid(m["away_team"])
            for side in ("home_team", "away_team"):
                if m[side].get("image_url"):
                    imgs[m[side]["name"]] = m[side]["image_url"]
            if rec["vals"] is None:
                missing += 1; continue
            tf_h, tf_a, sf_h, sf_a = rec["vals"]
            for name, f, a, sf, sa in ((rec["home"], tf_h, tf_a, sf_h, sf_a), (rec["away"], tf_a, tf_h, sf_a, sf_h)):
                t = teams.setdefault(name, {"n": 0, "tf": 0.0, "ta": 0.0, "sf": 0.0, "sa": 0.0})
                t["n"] += 1; t["tf"] += f; t["ta"] += a; t["sf"] += sf; t["sa"] += sa
        res = {}
        for name, t in teams.items():
            if restricted and ids.get(name) not in cup_ids:
                continue                      # solo le squadre presenti nelle coppe europee
            res[name] = {"games": t["n"], "totalFor": round(t["tf"] / t["n"], 3), "totalAgainst": round(t["ta"] / t["n"], 3),
                         "sotFor": round(t["sf"] / t["n"], 3), "sotAgainst": round(t["sa"] / t["n"], 3)}
        n = len(res)
        if not n:
            return
        # stemmi delle squadre: dall'elenco partite se c'e', altrimenti /v1/teams/{id} (una volta sola, poi in cache)
        logos = {}
        for name in res:
            url, t_id = imgs.get(name), ids.get(name)
            if not url and t_id:
                c = cache.get("logo:" + str(t_id))
                if c:
                    url = c.get("logo")
                else:
                    try:
                        d = api(f"/v1/teams/{t_id}") or {}
                        time.sleep(PAUSE)
                        url = d.get("image_url")
                        if url:
                            cache["logo:" + str(t_id)] = {"logo": url}
                    except Exception as ex:
                        print("stemma non letto per", name, ex)
            if url:
                logos[name] = url
        avg = {k: round(sum(v[k] for v in res.values()) / n, 3) for k in ("totalFor", "totalAgainst", "sotFor", "sotAgainst")}
        out["leagues"][key] = {"name": lg["name"], "label": label, "country": lg.get("country_code"), "season": season_of(lg),
                               "matches": len(matches), "matches_without_stats": missing, "restricted": restricted,
                               "logo": lg.get("image_url"), "logos": logos,
                               "size": n, "league_avg": avg, "teams": res}
        if h:
            out["leagues"][key]["handicap"] = h
        json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)

    # 1) prima le coppe: servono per sapere quali squadre sono europee
    todo = [(k, cc, rx, ex, False) for k, cc, rx, ex in WANTED] + [(k, cc, rx, ex, True) for k, cc, rx, ex in EXTRA]
    todo.sort(key=lambda t: t[0] not in CUPS)
    for key, cc, rx, ex, fallback in todo:
        cand = find_league(leagues, cc, rx, ex)
        if not cand and fallback:
            cand = find_league(leagues, None, rx, ex)
        if not cand:
            print(f"✘ {key}: NON trovato nel catalogo")
            if cc is None:
                print("   nomi simili nel catalogo:", [f"{l.get('name')} [{l.get('country_code')}]" for l in leagues
                                                       if re.search(r"uefa|champions|europa", l.get("name", ""), re.I)])
            continue
        lg = cand[0]
        if not season_of(lg):
            print(f"✘ {key}: {lg['name']} senza stagione {SEASON_START} (disponibili: {lg.get('seasons')})"); continue
        done.add(lg["id"])
        if key in CUPS:
            for m in league_matches(lg) + league_matches(lg, upcoming=True):
                cup_ids.add(tid(m["home_team"])); cup_ids.add(tid(m["away_team"]))
            print(f"   {key}: squadre europee finora: {len(cup_ids)}")
        build(key, lg, lg["name"], restricted=(key not in TOP5 and key not in CUPS))

    # 2) tutti gli altri campionati delle squadre europee (solo le loro statistiche)
    for lg in leagues:
        if lg["id"] in done or SKIP.search(lg.get("name", "")) or not season_of(lg):
            continue
        key = re.sub(r"[^a-z0-9]+", "-", f"{lg.get('country_code', 'xx')}-{lg['name']}".lower()).strip("-")
        build(key, lg, f"{lg['name']} ({lg.get('country_code')})", restricted=True)

    cutoff = f"{SEASON_START}-07-01"
    cache = {k: v for k, v in cache.items() if not v.get("date") or str(v["date"])[:10] >= cutoff}
    json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)
    json.dump(out, open(OUT_FILE, "w"), ensure_ascii=False, indent=1, sort_keys=True)
    print("Scritto", OUT_FILE, "- competizioni:", len(out["leagues"]))


if __name__ == "__main__":
    main()
