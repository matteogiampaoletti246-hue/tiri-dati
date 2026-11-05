# Sonda UEFA (solo struttura, nessun dato di terzi salvato): endpoint, parametri data, forma delle formazioni e delle coordinate.
import json, time, datetime, urllib.request, urllib.parse
B = "https://match.uefa.com/v5/"
H = {"User-Agent": "ScalperLab/1.0", "Accept": "application/json"}
out = {"quando": datetime.datetime.utcnow().isoformat() + "Z", "prove": {}}

def get(path, **q):
    url = B + path + ("?" + urllib.parse.urlencode(q) if q else "")
    t0 = time.time()
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=20)
        body = r.read()
        return {"url": url, "http": r.status, "ms": int((time.time() - t0) * 1000), "bytes": len(body), "cors": r.headers.get("Access-Control-Allow-Origin"), "cache": r.headers.get("Cache-Control"), "j": json.loads(body)}
    except Exception as e:
        return {"url": url, "http": getattr(e, "code", None), "err": str(e)[:150]}

def forma(x, d=0):
    if d > 2: return "..."
    if isinstance(x, dict): return {k: forma(v, d + 1) for k, v in list(x.items())[:40]}
    if isinstance(x, list): return [forma(x[0], d + 1)] if x else []
    return type(x).__name__

today = datetime.date.today()
d0, d1 = today.isoformat(), (today + datetime.timedelta(days=1)).isoformat()
P = out["prove"]
ls = get("livescore")
P["livescore"] = {k: v for k, v in ls.items() if k != "j"}
if "j" in ls:
    P["livescore"]["n"] = len(ls["j"]) if isinstance(ls["j"], list) else None
    P["livescore"]["forma"] = forma(ls["j"])
for nome, q in {
    "date_fromTo": dict(competitionId="1,14,2019", seasonYear="2027", fromDate=d0, toDate=d1, limit="50", offset="0", order="ASC"),
    "solo_comp14": dict(competitionId="14", seasonYear="2027", limit="200", offset="0", order="ASC"),
    "solo_comp1": dict(competitionId="1", seasonYear="2027", limit="200", offset="0", order="ASC"),
    "solo_comp2019": dict(competitionId="2019", seasonYear="2027", limit="200", offset="0", order="ASC"),
}.items():
    g = get("matches", **q)
    info = {k: v for k, v in g.items() if k != "j"}
    if "j" in g and isinstance(g["j"], list):
        info["n"] = len(g["j"])
        ms = []
        for m in g["j"]:
            ko = (m.get("kickOffTime") or {})
            ms.append({"id": m.get("id"), "comp": (m.get("competition") or {}).get("id"), "h": (m.get("homeTeam") or {}).get("internationalName"), "a": (m.get("awayTeam") or {}).get("internationalName"), "date": ko.get("date"), "dt": ko.get("dateTime"), "st": m.get("status"), "lu": m.get("lineupStatus")})
        info["oggi_domani"] = [x for x in ms if (x["date"] or "") in (d0, d1)]
        if g["j"]: info["forma_match"] = forma(g["j"][0])
    P["matches_" + nome] = info
ids = []
for k, v in P.items():
    for x in v.get("oggi_domani", []) or []:
        if x["id"] not in ids: ids.append(x["id"])
out["lineups"] = []
for mid in ids[:8]:
    g = get("matches/%s/lineups" % mid)
    e = {k: v for k, v in g.items() if k != "j"}
    j = g.get("j")
    if isinstance(j, dict):
        e["lineupStatus"] = j.get("lineupStatus")
        e["forma"] = forma(j)
        for lato in ("homeTeam", "awayTeam"):
            t = j.get(lato) or {}
            f = t.get("field") or []
            e[lato] = {"n_field": len(f), "n_bench": len(t.get("bench") or []), "coach": len(t.get("coaches") or []),
                       "campo_xy": [[p.get("fieldCoordinate"), p.get("fspFieldCoordinate"), p.get("jerseyNumber"), p.get("type")] for p in f],
                       "chiavi_player": list(((f[0] if f else {}).get("player") or {}).keys())[:30],
                       "chiavi_entry": list((f[0] if f else {}).keys())}
    out["lineups"].append({"id": mid, **e})
json.dump(out, open("sonda_uefa.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(out)[:2500])
