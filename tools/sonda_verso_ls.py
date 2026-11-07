#!/usr/bin/env python3
"""Sonda una tantum: le colonne Fp di LiveScore ("riga:colonna") vanno nello stesso verso della y di FotMob (sinistra->destra)?
Confronto sulle stesse partite (campionati con formazioni FotMob con coordinate). Salva SOLO conteggi: report/sonda_verso_ls.json."""
import json, os, sys, unicodedata, re, urllib.request
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from giocatori_livescore import get, find_event, B

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}


def fm(mid):
    try:
        return json.load(urllib.request.urlopen(urllib.request.Request("https://www.fotmob.com/api/data/matchDetails?matchId=%s" % mid, headers=UA), timeout=25))
    except Exception:
        return None


def key(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z]", "", s.split(" ")[-1])


out = {"same": 0, "reverse": 0, "flat": 0, "matches": 0, "fo_ok": 0, "fo_ko": 0}
for lg in ("55", "53", "47", "87", "54", "57", "61"):
    idx = json.load(open(os.path.join(ROOT, "arch", "index.json")))[lg]
    fx = json.load(open(os.path.join(ROOT, "arch", lg, idx["s"][0] + ".json")))["fix"]
    done = sorted([f for f in fx if f[5] and f[4]], key=lambda f: f[4], reverse=True)[:4]
    for f in done:
        ts = datetime.fromisoformat(f[4].replace("Z", "+00:00")).timestamp()
        eid = find_event(ts, f[2], f[3], "", "")
        j = fm(f[0])
        if not eid or not j:
            continue
        ln = get(B + "lineups/soccer/%s?locale=en" % eid) or {}
        lu = (j.get("content") or {}).get("lineup") or {}
        for t in ln.get("Lu") or []:
            side = lu.get("homeTeam" if t.get("Tnb") == 1 else "awayTeam") or {}
            ys = {key(p.get("name")): (p.get("horizontalLayout") or {}).get("y") for p in side.get("starters") or []}
            if t.get("Fo") and side.get("formation"):
                out["fo_ok" if "-".join(map(str, t["Fo"])) == side["formation"] else "fo_ko"] += 1
            rows = {}
            for p in t.get("Ps") or []:
                fp = str(p.get("Fp") or "")
                if ":" not in fp:
                    continue
                r, c = fp.split(":")
                y = ys.get(key(p.get("Ln") or p.get("Snm")))
                if y is not None:
                    rows.setdefault(r, []).append((int(c), y))
            for r, lst in rows.items():
                if len(lst) < 2 or r == "1":
                    continue
                lst.sort()
                d = [b[1] - a[1] for a, b in zip(lst, lst[1:])]
                if all(x > 0 for x in d):
                    out["same"] += 1
                elif all(x < 0 for x in d):
                    out["reverse"] += 1
                else:
                    out["flat"] += 1
        out["matches"] += 1
os.makedirs(os.path.join(ROOT, "report"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "report", "sonda_verso_ls.json"), "w"))
print(out)
