#!/usr/bin/env python3
"""Trova su FotMob le qualificazioni (Mondiali, Europei, Coppe continentali) e le aggiunge a selezione.json
('internazionali'); archivio.py le scarica poi come le altre competizioni. Riprendibile: non duplica."""
import json, gzip, urllib.request, re
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
def get(u):
    r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40).read()
    try: r = gzip.decompress(r)
    except Exception: pass
    return json.loads(r)
d = get("https://www.fotmob.com/api/allLeagues")
found = []
def walk(o):
    if isinstance(o, dict):
        if "id" in o and "name" in o and re.search(r"qualif", str(o["name"]), re.I): found.append({"id": o["id"], "n": o["name"], "c": "INT", "cn": "Internazionale"})
        for v in o.values(): walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
walk(d.get("international") or d)
sel = json.load(open("selezione.json"))
have = {x["id"] for x in sel["internazionali"]}
add = [x for x in found if x["id"] not in have and re.search(r"world cup|euro|nations|asian cup|africa|copa|gold cup", x["n"], re.I)]
sel["internazionali"] += add
json.dump(sel, open("selezione.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(found), "trovate,", len(add), "aggiunte"); [print(x["id"], x["n"]) for x in add]
