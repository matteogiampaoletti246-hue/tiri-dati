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
UAH = {"User-Agent": H["User-Agent"], "Accept": "text/html,*/*", "Accept-Language": "it-IT,it;q=0.9"}
def html(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UAH), timeout=30)
        return r.read().decode("utf8", "replace")
    except Exception as ex:
        return "ERR " + str(ex)[:150]

core = html("https://www.diretta.it/x/js/core_400_2324000000.js")
chunks = {"core": core}
refs = set(re.findall(r'/res/_fs/build/[A-Za-z0-9_.\-]+\.js', core))
pg = html("https://www.diretta.it/partita/calcio/belgio-GbB957na/italia-hlKvieGH/riassunto/formazioni/?mid=4YNzMsxg")
refs |= set(re.findall(r'/res/_fs/build/[A-Za-z0-9_.\-]+\.js', pg))
OUT["refs"] = sorted(refs)[:80]
for u in sorted(refs)[:60]:
    chunks[u] = html("https://www.diretta.it" + u)
OUT["chunks"] = {k: len(v) for k, v in chunks.items()}
dfs = {}
for k, t in chunks.items():
    for m in re.findall(r"df_[a-z0-9]+_", t):
        dfs.setdefault(m, set()).add(k[-30:])
OUT["df_tokens"] = {k: sorted(v) for k, v in dfs.items()}
ctx = []
for k, t in chunks.items():
    for m in re.finditer(r"(?i)lineup|line_up|formazion", t):
        a = max(0, m.start() - 120)
        ctx.append([k[-30:], t[a:m.end() + 200].replace("\n", " ")])
        if len(ctx) >= 40:
            break
OUT["lineup_ctx"] = ctx
gq = []
for k, t in chunks.items():
    for m in re.finditer(r"_hash|persistedQuer|pq_graphql", t):
        a = max(0, m.start() - 150)
        gq.append([k[-30:], t[a:m.end() + 250].replace("\n", " ")])
        if len(gq) >= 25:
            break
OUT["graphql_ctx"] = gq
json.dump(OUT, open("sonda_diretta.json", "w"), ensure_ascii=False, indent=1)
print({k: (len(v) if hasattr(v, "__len__") else v) for k, v in OUT.items()})
