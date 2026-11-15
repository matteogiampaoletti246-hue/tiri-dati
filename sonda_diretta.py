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
UAH = {"User-Agent": H["User-Agent"], "Accept": "text/html,*/*", "Accept-Language": "it-IT,it;q=0.9", "Origin": "https://www.diretta.it", "Referer": "https://www.diretta.it/"}
def html(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UAH), timeout=30)
        return r.read().decode("utf8", "replace")
    except Exception as ex:
        return "ERR " + str(ex)[:150]

B = "https://www.diretta.it"
detail = html(B + "/res/_fs/build/detail.ToPma-I.js")
names = set(re.findall(r'/res/_fs/build/[A-Za-z0-9_.\-]+\.js', detail))
chunks = {"detail": detail}
for u in sorted(names):
    if re.search(r"(?i)lineup|detail|constants|query|hash|graphql|predicted", u):
        chunks[u] = html(B + u)
OUT["chunks"] = {k: len(v) for k, v in chunks.items()}
hashes = {}
for k, t in chunks.items():
    for m in re.finditer(r'([A-Z][A-Z0-9_]*(?:LINEUP|LINE_UP|PREDICTED|MISSING)[A-Z0-9_]*)\s*[:=]\s*"([A-Za-z0-9_\-]{3,40})"', t):
        hashes[m.group(1)] = m.group(2)
OUT["hashes_lineup"] = hashes
# tutte le costanti *_QUERY/*_UPDATE con hash, per riferimento
allq = {}
for k, t in chunks.items():
    for m in re.finditer(r'([A-Z][A-Z0-9_]*_(?:QUERY|UPDATE))\s*:\s*"([A-Za-z0-9_\-]{3,40})"', t):
        allq[m.group(1)] = m.group(2)
OUT["hashes_all"] = allq
resp = {}
for nm_, h in list(hashes.items()) + [(k, v) for k, v in allq.items() if "LINEUP" in k or "PREDICT" in k]:
    for extra in ("&projectId=400", "&projectId=400&providerId=0"):
        url = "https://400.ds.lsapp.eu/pq_graphql?_hash=" + h + "&eventId=4YNzMsxg" + extra
        t = html(url)
        resp[nm_ + extra[:20]] = t[:2500]
OUT["gql_resp"] = resp
json.dump(OUT, open("sonda_diretta.json", "w"), ensure_ascii=False, indent=1)
print(OUT["chunks"]); print(hashes); print(len(allq))
