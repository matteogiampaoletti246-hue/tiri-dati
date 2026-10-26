#!/usr/bin/env python3
"""Scarica l'elenco completo delle competizioni FotMob -> catalogo_raw.json (diagnostica)."""
import json, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
j = json.load(urllib.request.urlopen(urllib.request.Request("https://www.fotmob.com/api/data/allLeagues?locale=en", headers=UA), timeout=40))
json.dump(j, open("catalogo_raw.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(j.get("countries", [])), "paesi")
# run
