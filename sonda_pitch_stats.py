"""Sonda PitchAPI /stats e /shots: struttura, chiavi statistiche, tipi di tiro e intervalli delle coordinate (nessun dato di partita)."""
import json, urllib.parse
from collections import Counter, defaultdict
from update_data import api
L = (api("/v1/leagues") or {}).get("leagues", [])
out = []; stat_keys = Counter(); st_struct = None; shot_keys = defaultdict(Counter); rng = defaultdict(lambda: [1e9, -1e9]); periods = Counter(); n = 0
for l in L[:30]:
    ss = sorted(l.get("seasons") or [])
    if not ss: continue
    ms = [x for x in (api(f"/v1/leagues/{l['id']}/matches?season={urllib.parse.quote(ss[-1], safe='')}") or {}).get("matches", []) if x.get("status") == "finished"][-2:]
    for m in ms:
        n += 1
        st = api(f"/v1/matches/{m['id']}/stats") or {}
        if st_struct is None and st.get("periods"):
            p = st["periods"][0]; g = p["groups"][0]
            st_struct = {"period": p.get("period"), "group_keys": sorted(g), "stat0": g.get("stats", [None])[0] if isinstance(g.get("stats"), list) else str(type(g.get("stats")))}
        for p in st.get("periods") or []:
            periods[str(p.get("period"))] += 1
            for g in p.get("groups") or []:
                for s in g.get("stats") or []:
                    if isinstance(s, dict): stat_keys[(g.get("key") or g.get("title") or "?") + "/" + str(s.get("key"))] += 1
        sh = api(f"/v1/matches/{m['id']}/shots") or {}
        for p in sh.get("periods") or []:
            for s in p.get("shots") or []:
                for k, v in s.items():
                    if v is None: continue
                    t = type(v).__name__
                    shot_keys[k][t if t != "str" else "str:" + str(v)[:20] if k in ("shot_type", "outcome", "result", "situation", "body_part", "event_type", "type") else t] += 1
                    if isinstance(v, (int, float)) and not isinstance(v, bool):
                        r = rng[k]; r[0] = min(r[0], v); r[1] = max(r[1], v)
out += ["partite " + str(n), "struttura stats: " + json.dumps(st_struct, default=str)[:900], "periodi stats " + json.dumps(periods), "chiavi stats (" + str(len(stat_keys)) + "): " + ", ".join(k for k, _ in stat_keys.most_common(120))]
out += ["tiri: " + k + " " + json.dumps(dict(c.most_common(12))) + (" range " + str(rng[k]) if k in rng else "") for k, c in shot_keys.items()]
open("sonda_pitch_stats.txt", "w").write("\n".join(out))
