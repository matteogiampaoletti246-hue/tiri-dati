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
        if k == "AA":
            cur = {"AA": v}
            out.append(cur)
        elif cur is not None:
            cur.setdefault(k, v)
    return out


for off in (0, 1, 2):
    for tz in (1,):
        key = "lista_%d" % off
        r = get("f_1_%d_%d_it_1" % (off, tz))
        OUT[key] = {"st": r["st"], "n": r.get("n"), "err": r.get("err"), "head": r["tx"][:1500]}
        rs = recs(r["tx"])
        OUT[key]["partite"] = len(rs)
        OUT[key]["esempio"] = rs[:3]
        OUT["_mids_%d" % off] = [x["AA"] for x in rs]

full = get("df_lu_1_4YNzMsxg")
OUT["lu_belgio_italia"] = {"st": full["st"], "n": full.get("n"), "err": full.get("err"), "tx": full["tx"][:12000]}

# partite di domani/dopodomani: quali hanno formazioni (probabili/ufficiali) e come sono scritte
prova = {}
for off in (1, 2):
    for mid in OUT["_mids_%d" % off][:60]:
        r = get("df_lu_1_" + mid)
        if r["st"] == 200 and r["n"] > 60:
            prova[mid] = {"n": r["n"], "tx": r["tx"][:3500]}
        if len(prova) >= 6:
            break
    if len(prova) >= 6:
        break
OUT["lu_future"] = prova
for k in list(OUT):
    if k.startswith("_mids_"):
        OUT[k] = OUT[k][:5]
json.dump(OUT, open("sonda_diretta.json", "w"), ensure_ascii=False, indent=1)
print({k: (v.get("st"), v.get("n"), v.get("partite")) if isinstance(v, dict) else v for k, v in OUT.items() if not k.startswith("_")})
