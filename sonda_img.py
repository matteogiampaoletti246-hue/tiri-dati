#!/usr/bin/env python3
"""Sonda: stemmi e volti sono raggiungibili per id (squadre vecchie/minori, giocatori ritirati)?"""
import json, glob, random, urllib.request
random.seed(7)
UA = {"User-Agent": "Mozilla/5.0"}
def head(u):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30)
        return r.status, int(r.headers.get("Content-Length") or len(r.read()))
    except Exception as e:
        return getattr(e, "code", str(e)[:40]), 0
teams, pl = {}, {}
for f in glob.glob("arch/*/*.json"):
    if f.endswith("index.json"): continue
    if f.endswith("_s.json"):
        s = json.load(open(f)); y = f.split("/")[-1][:4]
        for lst in s["players"].values():
            for r in lst: pl.setdefault(r[0], y)
    else:
        for t in json.load(open(f))["teams"]: teams[t] = 1
T = random.sample(sorted(teams), 40); P = [p for p, y in pl.items() if y <= "2014"]; P = random.sample(P, 40)
res = {"teams": [(t,) + head("https://images.fotmob.com/image_resources/logo/teamlogo/%s.png" % t) for t in T],
       "players_old": [(p,) + head("https://images.fotmob.com/image_resources/playerimages/%s.png" % p) for p in P]}
res["teams_ok"] = sum(1 for x in res["teams"] if x[1] == 200 and x[2] > 800)
res["players_ok"] = sum(1 for x in res["players_old"] if x[1] == 200 and x[2] > 800)
json.dump(res, open("diag_img.json", "w"))
