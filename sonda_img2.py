#!/usr/bin/env python3
"""Sonda 2: copertura stemmi/volti per campionato; varianti URL; fonti alternative (Sofascore, TheSportsDB)."""
import json, glob, random, urllib.request, urllib.parse, collections
from concurrent.futures import ThreadPoolExecutor
random.seed(3)
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Referer": "https://www.fotmob.com/", "Accept": "image/*,*/*"}
def head(u, h=UA):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=25)
        b = r.read()
        return r.status, len(b)
    except Exception as e:
        return getattr(e, "code", 0), 0
ok = lambda x: x[0] == 200 and x[1] > 700
ix = json.load(open("arch/index.json"))
tmeta = {}  # team id -> (country, league name, last year)
pmeta = {}  # player id -> (name, country, last year)
for k, v in ix.items():
    for se in v["s"]:
        p = "arch/%s/%s.json" % (k, se.replace("/", "-"))
        try: d = json.load(open(p))
        except Exception: continue
        y = int(se[:4])
        for t, nm in d["teams"].items():
            o = tmeta.get(t)
            if not o or y > o[2]: tmeta[t] = (v["c"], v["n"], y, nm)
        try: s = json.load(open(p.replace(".json", "_s.json")))
        except Exception: continue
        for lst in s["players"].values():
            for r in lst:
                o = pmeta.get(r[0])
                if not o or y > o[2]: pmeta[r[0]] = (r[1], v["c"], y, v["n"])
print(len(tmeta), len(pmeta))
T = sorted(tmeta); P = random.sample(sorted(pmeta), min(4000, len(pmeta)))
def tt(t): return t, head("https://images.fotmob.com/image_resources/logo/teamlogo/%s.png" % t)
def pp(p): return p, head("https://images.fotmob.com/image_resources/playerimages/%s.png" % p)
with ThreadPoolExecutor(16) as ex:
    tr = list(ex.map(tt, T)); pr = list(ex.map(pp, P))
res = {"teams_tot": len(T), "teams_ok": sum(ok(r) for _, r in tr), "players_tot": len(P), "players_ok": sum(ok(r) for _, r in pr)}
by = collections.defaultdict(lambda: [0, 0])
for t, r in tr: by[tmeta[t][0]][0] += 1; by[tmeta[t][0]][1] += ok(r)
res["teams_by_country"] = {c: v for c, v in sorted(by.items(), key=lambda x: -x[1][0] + x[1][1])[:60]}
byp = collections.defaultdict(lambda: [0, 0]); byy = collections.defaultdict(lambda: [0, 0])
for p, r in pr:
    byp[pmeta[p][1]][0] += 1; byp[pmeta[p][1]][1] += ok(r)
    y = pmeta[p][2]; byy[y][0] += 1; byy[y][1] += ok(r)
res["players_by_country"] = {c: v for c, v in sorted(byp.items(), key=lambda x: -x[1][0])[:50]}
res["players_by_lastyear"] = dict(sorted(byy.items()))
badT = [t for t, r in tr if not ok(r)]; badP = [p for p, r in pr if not ok(r)]
res["bad_team_sample"] = [(t, tmeta[t]) for t in badT[:60]]
res["bad_player_sample"] = [(p, pmeta[p]) for p in badP[:60]]
# varianti URL su un campione dei mancanti
var = {}
for t in badT[:25]:
    var[t] = {s: head("https://images.fotmob.com/image_resources/logo/teamlogo/%s%s.png" % (t, s)) for s in ("_small", "_xsmall", "_large")}
res["team_variants"] = var
varp = {}
for p in badP[:25]:
    varp[p] = {s: head("https://images.fotmob.com/image_resources/playerimages/%s%s.png" % (p, s)) for s in ("_small", "_large", "")}
res["player_variants"] = varp
# fonti alternative su un campione di mancanti: TheSportsDB per nome squadra, Sofascore ricerca
alt = []
for t in badT[:25]:
    nm = tmeta[t][3]; row = {"id": t, "nome": nm, "lega": tmeta[t][1]}
    try:
        j = json.load(urllib.request.urlopen(urllib.request.Request("https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=" + urllib.parse.quote(nm), headers=UA), timeout=25))
        row["tsdb"] = [(x.get("strTeam"), x.get("strCountry"), bool(x.get("strBadge"))) for x in (j.get("teams") or [])[:2]]
    except Exception as e: row["tsdb"] = str(e)[:40]
    try:
        j = json.load(urllib.request.urlopen(urllib.request.Request("https://api.sofascore.com/api/v1/search/teams?q=" + urllib.parse.quote(nm), headers=UA), timeout=25))
        row["sofa"] = [(x["entity"].get("name"), (x["entity"].get("country") or {}).get("name"), x["entity"].get("id")) for x in (j.get("results") or [])[:2]]
        if row["sofa"]: row["sofa_img"] = head("https://api.sofascore.app/api/v1/team/%s/image" % row["sofa"][0][2])
    except Exception as e: row["sofa"] = str(e)[:40]
    alt.append(row)
res["alt_team"] = alt
json.dump(res, open("diag_img2.json", "w"), ensure_ascii=False, indent=1, default=str)
