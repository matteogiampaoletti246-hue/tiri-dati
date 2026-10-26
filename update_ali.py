#!/usr/bin/env python3
"""Ali: conta, per ogni giocatore, quante volte e' partito titolare in una posizione larga e avanzata
(fascia laterale, linea alta: ali del 4-3-3, esterni alti del 4-2-3-1, ali del 3-4-3). Legge match/*.json (formazioni con coordinate).
Scrive ali.json: {"Nome|Squadra": [partite da ala, partite da titolare]}."""
import glob, json
from collections import defaultdict

X_MIN = 0.66       # linea alta (esclude esterni di centrocampo del 4-4-2 / quinti del 3-5-2)
EDGE = 0.25        # fascia: y <= 0.25 oppure y >= 0.75
FORM = {"4-2-3-1", "4-3-3", "3-4-3", "4-1-4-1", "4-2-1-3", "4-1-2-3", "4-3-2-1"}   # moduli con ali/esterni alti veri (no quinti, no esterni del 4-4-2 o 3-5-2)
cnt = defaultdict(lambda: [0, 0])
for f in sorted(glob.glob("match/*.json")):
    try:
        d = json.load(open(f))
    except Exception:
        continue
    lu = d.get("lu") or {}
    for side, team in (("h", d.get("h")), ("a", d.get("a"))):
        for p in (lu.get(side) or {}).get("st") or []:
            try:
                name, x, y = p[0], float(p[3]), float(p[4])
            except Exception:
                continue
            if x < 0.2:
                continue   # portiere
            c = cnt[f"{name}|{team}"]
            c[1] += 1
            if (lu.get(side) or {}).get("f") in FORM and x >= X_MIN and (y <= EDGE or y >= 1 - EDGE):
                c[0] += 1
out = {k: v for k, v in cnt.items() if v[0] > 0}
json.dump(out, open("ali.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "giocatori con almeno una partenza da ala")
