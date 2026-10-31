#!/usr/bin/env python3
"""Sposta le statistiche di PitchAPI/LiveScore (campi p/px/pn delle partite con px) dal repository a Cloudflare KV, poi le toglie dai file.
Fasi: `carica` (scrive il KV, non tocca i file) e `toglie` (toglie i campi dai file, solo per le partite presenti nel KV)."""
import gzip, json, glob, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import kvstats

fase = sys.argv[1] if len(sys.argv) > 1 else "carica"
if not kvstats.ON:
    sys.exit("token Cloudflare mancante")
items, n = [], 0
for f in sorted(glob.glob("partite/*/*.json.gz")):
    fm, sk = f.split("/")[1], os.path.basename(f)[:-8]
    d = json.load(gzip.open(f, "rt", encoding="utf-8"))
    mine = {mid: {k: m[k] for k in ("p", "px", "pn") if k in m} for mid, m in (d.get("m") or {}).items() if m.get("px")}
    if not mine:
        continue
    if fase == "carica":
        items.append((fm, sk, {**kvstats.load(fm, sk), **mine}))
        n += len(mine)
        continue
    saved = kvstats.load(fm, sk)
    if not all(mid in saved for mid in mine):
        print("NON nel KV, non tolgo:", f); continue
    for mid in mine:
        m = d["m"][mid]
        for k in ("p", "px", "pn"):
            m.pop(k, None)
        if not m:
            del d["m"][mid]
    with gzip.open(f, "wt", encoding="utf-8", compresslevel=9) as o:
        json.dump(d, o, ensure_ascii=False, separators=(",", ":"))
    n += len(mine)
if fase == "carica":
    if not kvstats.save(items):
        sys.exit("scrittura KV fallita")
print(fase, n, "partite", len(items), "file")
