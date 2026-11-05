# Sonda 2: orientamento delle coordinate UEFA rispetto a FotMob (solo numeri, nessun dato di terzi salvato).
import json, urllib.request, urllib.parse, datetime
H = {"User-Agent": "ScalperLab/1.0", "Accept": "application/json"}
FH = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
def J(url, h):
    return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=25).read())
out = {"quando": datetime.datetime.utcnow().isoformat() + "Z", "partite": []}
def sign(v): return 1 if v > 0 else (-1 if v < 0 else 0)
try:
    ms = J("https://match.uefa.com/v5/matches?competitionId=14&seasonYear=2027&limit=200&offset=0&order=ASC", H)
    oggi = datetime.date.today().isoformat()
    uefa = [m for m in ms if (m.get("kickOffTime") or {}).get("date") == oggi and m.get("lineupStatus") != "NOT_AVAILABLE"]
    out["n_uefa_con_formazione"] = len(uefa)
    fm = J("https://www.fotmob.com/api/data/matches?date=%s&timezone=Europe%%2FRome&ccode3=ITA" % oggi.replace("-", ""), FH)
    fl = [x for l in fm.get("leagues", []) for x in l.get("matches", [])]
    out["n_fotmob"] = len(fl)
    for m in uefa[:6]:
        h, a = m["homeTeam"]["internationalName"], m["awayTeam"]["internationalName"]
        fx = next((x for x in fl if h[:5].lower() in (x["home"]["name"] or "").lower() or (x["home"]["name"] or "")[:5].lower() in h.lower()), None)
        r = {"uefa": m["id"], "fm": fx and fx["id"]}
        if fx:
            d = J("https://www.fotmob.com/api/data/matchDetails?matchId=%s" % fx["id"], FH)
            lu = (d.get("content") or {}).get("lineup") or {}
            r["fm_tipo"] = lu.get("lineupType")
            ul = J("https://match.uefa.com/v5/matches/%s/lineups" % m["id"], H)
            for lato, fk in (("homeTeam", "homeTeam"), ("awayTeam", "awayTeam")):
                f = ul[lato]["field"]
                fs = {str(p.get("shirtNumber")): p.get("horizontalLayout") for p in (lu.get(fk) or {}).get("starters", [])}
                pr = [(p["fieldCoordinate"], fs[str(p["jerseyNumber"])]) for p in f if str(p["jerseyNumber"]) in fs and fs[str(p["jerseyNumber"])]]
                if len(pr) >= 3:
                    ux = [p[0]["x"] for p in pr]; uy = [p[0]["y"] for p in pr]; fx_ = [p[1]["x"] for p in pr]; fy = [p[1]["y"] for p in pr]
                    mean = lambda v: sum(v) / len(v)
                    cov = lambda a, b: sum((i - mean(a)) * (j - mean(b)) for i, j in zip(a, b))
                    r[lato] = {"n": len(pr), "cov_UEFAx_FMy": sign(cov(ux, fy)), "cov_UEFAy_FMx": sign(cov(uy, fx_)), "cov_UEFAx_FMx": sign(cov(ux, fx_)),
                               "fm_x_range": [min(fx_), max(fx_)], "fm_y_range": [min(fy), max(fy)], "pers_uefa": len(f), "pers_fm": len(fs)}
                else:
                    r[lato] = {"n": len(pr), "fm_starters": len(fs)}
        out["partite"].append(r)
except Exception as e:
    out["errore"] = str(e)[:200]
json.dump(out, open("sonda_uefa.json", "w"), indent=1)
print(json.dumps(out)[:2500])
