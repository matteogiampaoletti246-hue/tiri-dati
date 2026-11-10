#!/usr/bin/env python3
"""Sonda: quale fonte ha GIA' gli arbitri delle partite di Nations League dei prossimi giorni? (nessuna chiave)
Prova UEFA, Sofascore, LiveScore, FotMob, 365Scores, ESPN, Transfermarkt, Wikipedia e scrive diag_arbitri.json
{fonte: {status, trovati: {partita: arbitro}, note}}. Solo diagnosi: non tocca i dati dell'app."""
import json, re, sys, urllib.request, urllib.parse, datetime

UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,text/html,*/*"}
OUT = {}
DATES = ["2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"]


def get(url, headers=None, timeout=30, raw=False):
    h = dict(UA); h.update(headers or {})
    r = urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=timeout).read()
    try:
        import gzip; r = gzip.decompress(r)
    except Exception:
        pass
    return r.decode("utf-8", "ignore") if raw else json.loads(r)


def walk(o, path=""):
    """Tutte le chiavi che sembrano un arbitro: (percorso, valore)."""
    if isinstance(o, dict):
        for k, v in o.items():
            p = f"{path}/{k}"
            if re.search(r"referee|official|arbitr|refs?$", k, re.I) and v not in (None, "", [], {}):
                yield p, v
            yield from walk(v, p)
    elif isinstance(o, list):
        for i, v in enumerate(o[:60]):
            yield from walk(v, f"{path}[{i}]")


def rec(name, status, found=None, note=""):
    OUT[name] = {"status": status, "trovati": found or {}, "note": note[:400]}
    print(name, status, len(found or {}), note[:150])


def probe(name, fn):
    try:
        fn()
    except Exception as e:
        rec(name, "errore", note=f"{type(e).__name__}: {e}")


def uefa():
    found, note = {}, ""
    for d in DATES:
        u = f"https://match.uefa.com/v5/matches?fromDate={d}&toDate={d}&limit=60&offset=0"
        data = get(u, {"Origin": "https://www.uefa.com", "Referer": "https://www.uefa.com/"})
        ms = data if isinstance(data, list) else data.get("matches") or data.get("data") or []
        for m in ms:
            hn = ((m.get("homeTeam") or {}).get("internationalName")) or ""
            an = ((m.get("awayTeam") or {}).get("internationalName")) or ""
            comp = ((m.get("competition") or {}).get("metaData") or {}).get("name") or (m.get("competition") or {}).get("code") or ""
            refs = m.get("referees")
            if not refs and m.get("id"):
                try:
                    full = get(f"https://match.uefa.com/v5/matches/{m['id']}", {"Origin": "https://www.uefa.com"})
                    refs = (full[0] if isinstance(full, list) else full).get("referees")
                except Exception as e:
                    note += f" {m.get('id')}:{e}"
            names = []
            for r in refs or []:
                p = r.get("person") or {}
                nm = ((p.get("translations") or {}).get("name") or {}).get("EN") or p.get("name") or ""
                names.append(f"{r.get('role','')}:{nm}")
            if names:
                found[f"{d} {hn}-{an} ({comp})"] = names
            note = note or f"{len(ms)} partite il {d}; esempio chiavi {list(m.keys())[:12]}"
    rec("uefa", "ok", found, note)


def sofascore():
    found, note = {}, ""
    for d in DATES[:2]:
        data = get(f"https://api.sofascore.com/api/v1/sport/football/scheduled-events/{d}")
        for e in data.get("events", []):
            if "Nations League" in ((e.get("tournament") or {}).get("name") or ""):
                try:
                    det = get(f"https://api.sofascore.com/api/v1/event/{e['id']}")
                    ref = ((det.get("event") or {}).get("referee") or {}).get("name")
                except Exception as ex:
                    ref = None; note += f" {ex}"
                if ref:
                    found[f"{d} {e['homeTeam']['name']}-{e['awayTeam']['name']}"] = ref
    rec("sofascore", "ok", found, note)


def livescore():
    found = {}
    for d in DATES[:2]:
        data = get(f"https://prod-cdn-public-api.livescore.com/v1/api/app/date/soccer/{d.replace('-','')}/0?locale=en")
        for st in data.get("Stages", []):
            if "Nations League" in (st.get("Snm", "") + st.get("CompN", "")):
                for ev in st.get("Events", []):
                    try:
                        det = get(f"https://prod-cdn-public-api.livescore.com/v1/api/app/scoreboard/soccer/{ev['Eid']}?locale=en")
                        for p, v in walk(det):
                            found[f"{d} {ev['T1'][0]['Nm']}-{ev['T2'][0]['Nm']}"] = f"{p}={str(v)[:80]}"
                            break
                    except Exception:
                        pass
    rec("livescore", "ok", found)


def fotmob():
    found = {}
    data = get("https://www.fotmob.com/api/data/matches?date=20261112&timezone=Europe/Rome&ccode3=ITA")
    n = 0
    for lg in data.get("leagues", []):
        if "Nations League" in lg.get("name", ""):
            for m in lg.get("matches", []):
                n += 1
                try:
                    det = get(f"https://www.fotmob.com/api/data/matchDetails?matchId={m['id']}")
                    for p, v in walk(det.get("content", {}).get("matchFacts", {}).get("infoBox", {})):
                        found[f"{m['home']['name']}-{m['away']['name']}"] = f"{p}={str(v)[:80]}"; break
                except Exception:
                    pass
    rec("fotmob", "ok", found, f"{n} partite NL il 12/11")


def scores365():
    found = {}
    data = get("https://webws.365scores.com/web/games/allscores/?appTypeId=5&langId=1&timezoneName=Europe/Rome&userCountryId=1&startDate=12/11/2026&endDate=12/11/2026&sports=1")
    for g in data.get("games", []):
        if "Nations League" in (g.get("competitionDisplayName") or ""):
            for p, v in walk(g):
                found[f"{g['homeCompetitor']['name']}-{g['awayCompetitor']['name']}"] = f"{p}={str(v)[:80]}"; break
    rec("365scores", "ok", found, f"{len(data.get('games', []))} partite")


def espn():
    found = {}
    sb = get("https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.nations/scoreboard?dates=20261112")
    for e in sb.get("events", []):
        det = get(f"https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.nations/summary?event={e['id']}")
        for p, v in walk(det.get("gameInfo", {})):
            found[e["name"]] = f"{p}={str(v)[:80]}"; break
    rec("espn", "ok", found, f"{len(sb.get('events', []))} partite")


def transfermarkt():
    html = get("https://www.transfermarkt.com/uefa-nations-league/gesamtspielplan/pokalwettbewerb/UNL1/saison_id/2026", raw=True)
    rec("transfermarkt", "ok", {}, f"pagina {len(html)} caratteri, 'Referee' presente: {'Referee' in html}")


def wikipedia():
    found = {}
    page = "2026–27_UEFA_Nations_League_A"
    txt = get("https://en.wikipedia.org/w/api.php?action=parse&prop=wikitext&format=json&page=" + urllib.parse.quote(page))["parse"]["wikitext"]["*"]
    refs = re.findall(r"\|\s*referee\s*=\s*([^\n|]+)", txt)
    rec("wikipedia", "ok", {f"campo referee #{i}": r.strip() for i, r in enumerate(refs[:40])}, f"{len(refs)} campi referee")


for n, f in (("uefa", uefa), ("sofascore", sofascore), ("livescore", livescore), ("fotmob", fotmob), ("365scores", scores365),
             ("espn", espn), ("transfermarkt", transfermarkt), ("wikipedia", wikipedia)):
    probe(n, f)
OUT["_quando"] = datetime.datetime.utcnow().isoformat() + "Z"
json.dump(OUT, open("diag_arbitri.json", "w"), ensure_ascii=False, indent=1)
