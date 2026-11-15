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


hdr = ""
for off in (0, 1, 2, 3):
    r = get("f_1_%d_1_it_1" % off)
    rs = recs(r["tx"])
    OUT["lista_%d" % off] = {"st": r["st"], "n": r.get("n"), "partite": len(rs), "esempio": rs[:2]}
    OUT["_recs_%d" % off] = rs

for pre in ("df_li_1_", "df_lu_1_", "df_lup_1_", "df_lt_1_"):
    r = get(pre + "4YNzMsxg")
    OUT["prova_" + pre] = {"st": r["st"], "n": r.get("n"), "tx": r["tx"][:6000]}

# partite non iniziate (AB=1) di oggi..+3: quali hanno formazioni (probabili/ufficiali) e come sono scritte
prova = {}
tot = 0
for off in (0, 1, 2, 3):
    for x in OUT["_recs_%d" % off]:
        if x.get("AB") != "1":
            continue
        top = any(t in x.get("_ZA", "") for t in ("Serie A", "Premier League", "LaLiga", "Bundesliga", "Ligue 1", "Champions", "Europa League", "Eredivisie", "Liga Portugal", "Super Lig", "Pro League", "Premiership"))
        if not top and tot > 40:
            continue
        tot += 1
        r = get("df_li_1_" + x["AA"])
        if r["st"] == 200 and r["n"] > 20:
            prova[x["AA"]] = {"n": r["n"], "partita": [x.get("CX"), x.get("AF"), x.get("AD"), x.get("_ZA")], "tx": r["tx"][:3500]}
        if len(prova) >= 5 or tot > 120:
            break
    if len(prova) >= 5 or tot > 120:
        break
OUT["lu_future"] = prova
OUT["_tot_provate"] = tot
for k in list(OUT):
    if k.startswith("_recs_"):
        del OUT[k]
json.dump(OUT, open("sonda_diretta.json", "w"), ensure_ascii=False, indent=1)
print({k: (v.get("st"), v.get("n"), v.get("partite")) if isinstance(v, dict) else v for k, v in OUT.items()})
