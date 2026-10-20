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

# chiave app, paese, nome (regex)
WANTED = [
    ("serie-a", "ITA", r"^serie a$"),
    ("premier-league", "ENG", r"premier league"),
    ("bundesliga", "GER", r"^bundesliga$"),
    ("la-liga", "ESP", r"laliga|la liga"),
    ("ligue-1", "FRA", r"^ligue 1$"),
    ("eredivisie", "NED", r"eredivisie"),
    ("liga-portugal", "POR", r"liga portugal|primeira"),
    ("super-lig", "TUR", r"s[uü]per lig"),
    ("pro-league", "BEL", r"pro league|jupiler"),
]

def api(path):
    for attempt in range(6):
        req = urllib.request.Request(BASE + path, headers={"X-API-KEY": KEY})
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

def main():
    if not KEY:
        sys.exit("Manca la variabile PITCHAPI_KEY (segreto del repository).")
    cache = json.load(open(CACHE_FILE)) if os.path.exists(CACHE_FILE) else {}
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    print(f"Campionati nel catalogo: {len(leagues)}")
    out = {"updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "season_start": SEASON_START, "leagues": {}}
    printed_titles = False
    for key, cc, rx in WANTED:
        cand = [l for l in leagues if l.get("country_code") == cc and re.search(rx, l.get("name", ""), re.I)]
        if not cand:
            print(f"✘ {key}: NON trovato nel catalogo"); continue
        lg = cand[0]
        season = next((s for s in lg.get("seasons", []) if str(s).startswith(SEASON_START)), None)
        if not season:
            print(f"✘ {key}: {lg['name']} senza stagione {SEASON_START} (disponibili: {lg.get('seasons')})"); continue
        data = api(f"/v1/leagues/{lg['id']}/matches?season={urllib.request.quote(season, safe='')}") or {}
        matches = data.get("matches", [])
        print(f"✔ {key}: {lg['name']} {season} — {len(matches)} partite giocate")
        teams, missing = {}, 0
        for m in matches:
            mid = m["id"]
            rec = cache.get(mid)
            if rec is None:
                s = api(f"/v1/matches/{mid}/stats")
                time.sleep(PAUSE)
                vals, items = (parse_stats(s) if s else (None, []))
                if not printed_titles and items:
                    printed_titles = True
                    print("Voci con 'shot' nella prima partita letta:")
                    for i in items:
                        if re.search(r"shot", i.get("title", "") + i.get("key", ""), re.I):
                            print("   ", i.get("title"), f"[{i.get('key')}]", i.get("home"), "-", i.get("away"))
                rec = {"vals": vals, "home": m["home_team"]["name"], "away": m["away_team"]["name"], "date": m.get("date")}
                if vals is not None:
                    cache[mid] = rec          # le partite senza statistiche si riprovano al giro dopo
            if rec["vals"] is None:
                missing += 1; continue
            tf_h, tf_a, sf_h, sf_a = rec["vals"]
            for name, f, a, sf, sa in ((rec["home"], tf_h, tf_a, sf_h, sf_a), (rec["away"], tf_a, tf_h, sf_a, sf_h)):
                t = teams.setdefault(name, {"n": 0, "tf": 0.0, "ta": 0.0, "sf": 0.0, "sa": 0.0})
                t["n"] += 1; t["tf"] += f; t["ta"] += a; t["sf"] += sf; t["sa"] += sa
        res = {}
        for name, t in teams.items():
            res[name] = {"games": t["n"], "totalFor": round(t["tf"] / t["n"], 3), "totalAgainst": round(t["ta"] / t["n"], 3),
                         "sotFor": round(t["sf"] / t["n"], 3), "sotAgainst": round(t["sa"] / t["n"], 3)}
        n = len(res)
        avg = {k: round(sum(v[k] for v in res.values()) / n, 3) for k in ("totalFor", "totalAgainst", "sotFor", "sotAgainst")} if n else {}
        out["leagues"][key] = {"name": lg["name"], "season": season, "matches": len(matches), "matches_without_stats": missing,
                               "size": n, "league_avg": avg, "teams": res}
        json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)
    json.dump(out, open(OUT_FILE, "w"), ensure_ascii=False, indent=1, sort_keys=True)
    print("Scritto", OUT_FILE)

if __name__ == "__main__":
    main()
