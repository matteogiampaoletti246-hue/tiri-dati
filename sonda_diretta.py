#!/usr/bin/env python3
"""Sonda diretta.it (Flashscore): lista partite del giorno e formazioni, dai server GitHub. Scrive sonda_diretta.json (solo diagnosi, nessun dato nel repo oltre alla sonda)."""
import json, time, urllib.request

H = {"x-fsign": "SW9D1eZo", "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1",
     "Accept": "*/*", "Referer": "https://www.diretta.it/", "Origin": "https://www.diretta.it"}
OUT = {}


def get(path, base="https://www.diretta.it/x/feed/"):
    t = time.time()
    try:
        r = urllib.request.urlopen(urllib.request.Request(base + path, headers=H), timeout=30)
        b = r.read().decode("utf8", "replace")
        return {"st": r.status, "n": len(b), "sec": round(time.time() - t, 1), "tx": b}
    except Exception as ex:
        code = getattr(ex, "code", None)
        return {"st": code, "err": str(ex)[:160], "sec": round(time.time() - t, 1), "tx": ""}


def recs(tx):
    out, cur = [], None
    for tok in tx.split("¬"):
        if "÷" not in tok:
            continue
        k, v = tok.split("÷", 1)
        k = k.lstrip("~")
        if k == "ZA":
            hdr = v
        if k == "AA":
            cur = {"AA": v, "_ZA": hdr if "hdr" in dir() else ""}
            out.append(cur)
        elif cur is not None:
            cur.setdefault(k, v)
    return out


import re
import re
UAH = {"User-Agent": H["User-Agent"], "Accept": "application/json,*/*", "Origin": "https://www.diretta.it", "Referer": "https://www.diretta.it/"}
G = "https://400.ds.lsapp.eu/pq_graphql?projectId=400&_hash="
def gql(h, mid):
    try:
        r = urllib.request.urlopen(urllib.request.Request(G + h + "&eventId=" + mid, headers=UAH), timeout=30)
        return json.loads(r.read().decode("utf8", "replace"))
    except Exception as ex:
        return {"ERR": str(ex)[:150]}

def clean(o):
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items() if k not in ("__typename", "images", "teamLogo")}
    if isinstance(o, list):
        return [clean(x) for x in o]
    return o

OUT["dlie2_belgio"] = clean(gql("dlie2", "4YNzMsxg"))
OUT["dplie_belgio"] = clean(gql("dplie", "4YNzMsxg"))
for off in (0, 1, 2, 3):
    r = get("f_1_%d_1_it_1" % off)
    OUT["_r%d" % off] = recs(r["tx"])
cand = []
for off in (0, 1, 2, 3):
    for x in OUT["_r%d" % off]:
        if x.get("AB") == "1":
            top = any(t in x.get("_ZA", "") for t in ("Serie A", "Premier League", "LaLiga", "Bundesliga", "Ligue 1", "Champions", "Europa League", "Eredivisie", "Liga Portugal", "Super Lig", "Pro League", "MLS", "Championship", "Serie B", "Nations", "Mondiali", "Amichevoli", "Qualificazioni"))
            cand.append((0 if top else 1, int(x.get("AD", "0")), x))
cand.sort(key=lambda c: (c[0], c[1]))
fut = []
now = time.time()
for _, ts, x in cand[:70]:
    mid = x["AA"]
    a = gql("dplie", mid); b = gql("dlie2", mid)
    def players(g, key):
        try:
            return [len(((e.get(key) or {}).get("players")) or []) for e in g["data"]["findEventById"]["eventParticipants"]]
        except Exception:
            return None
    fut.append({"mid": mid, "ZA": x.get("_ZA"), "casa": x.get("CX"), "ospite": x.get("AF"), "in_min": round((ts - now) / 60), "pred": players(a, "predictedLineup"), "uff": players(b, "lineup"), "_a": a, "_b": b})
OUT["futuro"] = [{k: v for k, v in f.items() if not k.startswith("_")} for f in fut]
# un esempio pieno per tipo
ex_pred = next((f for f in fut if f["pred"] and any(f["pred"])), None)
ex_uff = next((f for f in fut if f["uff"] and any(f["uff"])), None)
OUT["esempio_pred"] = clean(ex_pred["_a"]) if ex_pred else None
OUT["esempio_pred_meta"] = {k: v for k, v in ex_pred.items() if not k.startswith("_")} if ex_pred else None
OUT["esempio_uff"] = clean(ex_uff["_b"]) if ex_uff else None
OUT["esempio_uff_meta"] = {k: v for k, v in ex_uff.items() if not k.startswith("_")} if ex_uff else None
for k in [k for k in OUT if k.startswith("_r")]:
    del OUT[k]
json.dump(OUT, open("sonda_diretta.json", "w"), ensure_ascii=False, indent=1)
print(len(fut), sum(1 for f in fut if f["pred"] and any(f["pred"])), sum(1 for f in fut if f["uff"] and any(f["uff"])))
