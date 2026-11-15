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
hdr = ""
UAH = {"User-Agent": H["User-Agent"], "Accept": "text/html,*/*", "Accept-Language": "it-IT,it;q=0.9"}
def html(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UAH), timeout=30)
        return r.read().decode("utf8", "replace")
    except Exception as ex:
        return "ERR " + str(ex)[:150]

pg = html("https://www.diretta.it/partita/calcio/belgio-GbB957na/italia-hlKvieGH/riassunto/formazioni/?mid=4YNzMsxg")
OUT["pagina"] = {"n": len(pg), "head": pg[:200]}
snips = {}
for kw in ("feed", "graphql", "lsapp", "flashscore", "project", "sign", "environment", "_hash", "ds."):
    found = []
    for m in re.finditer(re.escape(kw), pg):
        a = max(0, m.start() - 90)
        found.append(pg[a:m.end() + 140].replace("\n", " "))
        if len(found) >= 4:
            break
    snips[kw] = found
OUT["snips"] = snips
scripts = re.findall(r'<script[^>]+src="([^"]+)"', pg)
OUT["scripts"] = scripts[:15]
jsf = {}
for u in scripts[:15]:
    if u.startswith("//"): u = "https:" + u
    if u.startswith("/"): u = "https://www.diretta.it" + u
    t = html(u)
    hits = []
    for kw in ("df_li_", "df_lu_", "lineup", "pq_graphql", "_hash", "feed_sign", "x-fsign", "lsapp"):
        for m in re.finditer(re.escape(kw), t):
            a = max(0, m.start() - 100)
            hits.append((kw, t[a:m.end() + 160].replace("\n", " ")))
            break
    jsf[u[-60:]] = {"n": len(t), "hits": hits[:8]}
OUT["js"] = jsf

for pre in ("df_li_1_", "df_sui_1_", "df_st_1_", "df_hh_1_", "df_su_1_", "df_dc_1_", "df_mh_1_", "df_lpb_1_"):
    r = get(pre + "4YNzMsxg")
    OUT["prova_" + pre] = {"st": r["st"], "n": r.get("n"), "tx": r["tx"][:800]}
rs0 = recs(get("f_1_0_1_it_1")["tx"])
OUT["belgio_in_lista"] = [x for x in rs0 if x.get("AA") == "4YNzMsxg"][:1]
json.dump(OUT, open("sonda_diretta.json", "w"), ensure_ascii=False, indent=1)
print({k: (v.get("st"), v.get("n")) if isinstance(v, dict) else v for k, v in OUT.items() if k.startswith("prova_") or k == "pagina"})
