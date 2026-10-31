"""Sonda PitchAPI /stats: gruppi e campi delle voci (solo struttura; per le voci un esempio di CHIAVE e di tipo di valore, non di partita)."""
import json, urllib.parse
from collections import Counter
from update_data import api
L = (api("/v1/leagues") or {}).get("leagues", [])
grp = Counter(); keys = Counter(); item_fields = Counter(); ex = []; fmt = Counter(); n = 0
for l in L[:25]:
    ss = sorted(l.get("seasons") or [])
    if not ss: continue
    for m in [x for x in (api(f"/v1/leagues/{l['id']}/matches?season={urllib.parse.quote(ss[-1], safe='')}") or {}).get("matches", []) if x.get("status") == "finished"][-1:]:
        n += 1
        st = api(f"/v1/matches/{m['id']}/stats") or {}
        for p in st.get("periods") or []:
            if p.get("period") != "All": continue
            for g in p.get("groups") or []:
                grp[g.get("group_name")] += 1
                for it in g.get("items") or []:
                    for k, v in it.items(): item_fields[k + ":" + type(v).__name__] += 1
                    keys[str(it.get("key") or it.get("name"))] += 1
                    if len(ex) < 6 and n == 1: ex.append(json.dumps({k: (v if k in ("key", "name", "title", "type", "format", "unit") else type(v).__name__) for k, v in it.items()}))
out = ["partite " + str(n), "gruppi " + json.dumps(grp), "campi voce " + json.dumps(item_fields), "esempi " + " | ".join(ex), "chiavi (" + str(len(keys)) + "): " + ", ".join(k for k, _ in keys.most_common(150))]
open("sonda_pitch_stats.txt", "w").write("\n".join(out))
