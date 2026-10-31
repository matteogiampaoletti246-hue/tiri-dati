#!/usr/bin/env python3
"""Sonda: LiveScore e OneFootball danno statistiche per giocatore (tiri) di una partita finita? FA Cup 2026-05-16 Chelsea-Man City, Copa del Rey 2026-03-03.
Scrive sonda_partita_fonti.json (solo struttura e chiavi, non i dati)."""
import json, re, time, urllib.request, urllib.parse
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,text/html,*/*", "Accept-Language": "en-US,en;q=0.9"}
OUT = {}


def get(url, tries=2):
    for k in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30)
            return r.status, r.read().decode("utf8", "replace")
        except Exception as e:
            err = str(e)[:150]
            time.sleep(1.5)
    return None, err


def keys_with(o, pat, path="", out=None, depth=0):
    out = [] if out is None else out
    if depth > 9 or len(out) > 40:
        return out
    if isinstance(o, dict):
        for k, v in o.items():
            if re.search(pat, str(k), re.I):
                out.append(path + "/" + str(k) + "=" + json.dumps(v)[:60])
            keys_with(v, pat, path + "/" + str(k), out, depth + 1)
    elif isinstance(o, list):
        for i, v in enumerate(o[:3]):
            keys_with(v, pat, path + "[]", out, depth + 1)
    return out


def next_data(html):
    m = re.search(r'__NEXT_DATA__"[^>]*>(.*?)</script>', html or "", re.S)
    return json.loads(m.group(1)) if m else None


def livescore(date, home, away, tag):
    e = {}
    st, b = get(f"https://prod-cdn-public-api.livescore.com/v1/api/app/date/soccer/{date}/1?countryCode=GB&locale=en&MD=1")
    e["scoreboard_status"] = st
    b0 = b
    ev = None
    try:
        j0 = json.loads(b)
        e["chiavi"] = list(j0.keys())[:12]
        stg = j0.get("Stages", [])
        e["n_stages"] = len(stg)
        e["stage_nomi"] = [(x.get("Snm"), x.get("Cnm"), len(x.get("Events", []))) for x in stg[:40]]
        e["evento_chiavi"] = list((stg[0].get("Events") or [{}])[0].keys())[:30] if stg else None
        e["evento_esempio"] = json.dumps((stg[0].get("Events") or [{}])[0])[:500] if stg else None
    except Exception as ex:
        e["parse_err"] = str(ex)[:100] + " " + str(b)[:200]
    try:
        j = json.loads(b)
        for s in j.get("Stages", []):
            for x in s.get("Events", []):
                names = json.dumps(x).lower()
                if home in names and away in names:
                    ev = (x.get("Eid"), s.get("Snm"), s.get("Scd"), s.get("Ccd"))
    except Exception as ex:
        e["scoreboard_err"] = str(ex)[:100] + " " + str(b)[:120]
    if not ev:
        try:
            x = json.loads(b0)["Stages"][0]
            ev = (x["Events"][0]["Eid"], x.get("Snm"), x.get("Scd"), x.get("Ccd"))
            e["evento_di_ripiego"] = True
        except Exception as ex:
            e["ripiego_err"] = str(ex)[:80]
    e["evento"] = ev
    if ev:
        eid = ev[0]
        for nm, url in [("lineups", f"https://prod-cdn-public-api.livescore.com/v1/api/app/lineups/soccer/{eid}?locale=en"),
                        ("stats", f"https://prod-cdn-public-api.livescore.com/v1/api/app/stats/soccer/{eid}?locale=en"),
                        ("scoreboard", f"https://prod-cdn-public-api.livescore.com/v1/api/app/scoreboard/soccer/{eid}?locale=en"),
                        ("incidents", f"https://prod-cdn-public-api.livescore.com/v1/api/app/incidents/soccer/{eid}?locale=en")]:
            st, b = get(url)
            r = {"status": st, "bytes": len(b or "")}
            try:
                j = json.loads(b)
                r["chiavi"] = list(j.keys())[:20]
                r["tiri"] = keys_with(j, r"shot|sot|ontarget|rating|xg", out=[])[:12]
            except Exception:
                r["head"] = str(b)[:150]
            e[nm] = r
        slug = (ev[1] or "x").lower().replace(" ", "-")
        for url in [f"https://www.livescore.com/en/football/{(ev[3] or 'x')}/{(ev[2] or 'x')}/{home}-vs-{away}/{eid}/lineups/"]:
            st, b = get(url)
            nd = next_data(b) if st == 200 else None
            e["pagina_lineups"] = {"status": st, "next_data": bool(nd), "tiri": keys_with(nd, r"shot|rating|xg", out=[])[:15] if nd else None}
    OUT["livescore_" + tag] = e


def onefootball(q, tag):
    e = {}
    st, b = get("https://search-api.onefootball.com/v2/en/search?q=" + urllib.parse.quote(q))
    e["ricerca_status"] = st
    try:
        j = json.loads(b)
        e["ricerca_chiavi"] = list(j.keys())[:10]
        e["ricerca_partite"] = keys_with(j, r"match|url|link", out=[])[:10]
    except Exception:
        e["ricerca_head"] = str(b)[:200]
    OUT["onefootball_" + tag] = e


livescore("20260516", "chelsea", "manchester city", "fa_cup")
livescore("20260303", "barcelona", "atl", "copa")
onefootball("Chelsea Manchester City FA Cup", "fa_cup")
json.dump(OUT, open("sonda_partita_fonti.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(OUT, ensure_ascii=False)[:3000])
