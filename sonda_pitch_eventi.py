"""Sonda PitchAPI /events: tipi di evento e campi per tipo (solo nomi di campi e conteggi, nessun dato di partita)."""
import json, os, urllib.parse
from collections import Counter, defaultdict
from update_data import api
L = (api("/v1/leagues") or {}).get("leagues", [])
types = Counter(); keys = defaultdict(Counter); periods = Counter(); n = 0
for l in L[:40]:
    ss = sorted(l.get("seasons") or [])
    if not ss: continue
    ms = (api(f"/v1/leagues/{l['id']}/matches?season={urllib.parse.quote(ss[-1], safe='')}") or {}).get("matches", [])
    for m in [x for x in ms if x.get("status") == "finished"][-3:]:
        ev = (api(f"/v1/matches/{m['id']}/events") or {}).get("events", [])
        n += 1
        for e in ev:
            t = str(e.get("event_type")); types[t] += 1; periods[str(e.get("period"))] += 1
            for k, v in e.items():
                if v is not None: keys[t][k + ":" + (type(v).__name__ if not isinstance(v, dict) else "{" + ",".join(sorted(v)) + "}")] += 1
out = ["partite", str(n), "tipi " + json.dumps(types), "periodi " + json.dumps(periods)]
for t, c in keys.items(): out.append(t + " -> " + json.dumps(dict(c)))
open("sonda_pitch_eventi.txt", "w").write("\n".join(out))
