#!/usr/bin/env python3
"""Sonda una tantum: per le competizioni dove FotMob non da' formazioni con coordinate, LiveScore ha le formazioni?
Salva SOLO conteggi e nomi dei campi (mai dati di terzi): report/sonda_formazioni_ls.json."""
import json, os, sys, time
from datetime import datetime, timezone
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from giocatori_livescore import get, find_event, B

MISS = ["116", "118", "128", "129", "134", "136", "137", "143", "149", "164", "169", "171", "173", "177", "179", "183", "185", "186", "190", "193", "197", "198", "204", "205", "213", "216", "217", "218", "219", "225", "228", "229", "231", "232", "239", "240", "241", "248", "249", "250", "251", "253", "254", "256", "260", "262", "263", "267", "271", "275", "278", "300", "305", "330", "332", "333", "335", "336", "337", "338", "342", "439", "442", "490", "512", "516", "521", "522", "523", "533", "544", "8815", "8935", "8938", "8944", "8947", "8968", "8969", "8970", "8971", "8973", "8978", "9011", "9039", "9069", "9096", "9097", "9098", "9100", "9112", "9113", "9117", "9122", "9123", "9125", "9126", "9137", "9138", "9166", "9195", "9213", "9253", "9372", "9389", "9429", "9464", "9468", "9483", "9487", "9490", "9493", "9504", "9514", "9521", "9523", "9527", "9528", "9530", "9537", "9551", "9658", "9682", "9690", "9833", "9906", "9943", "10009", "10046", "10075", "10076", "10078", "10084", "10175", "10223", "10226", "10230", "10270", "10288", "10291", "10342", "10343", "10448", "10508", "10609", "10628", "10650", "11017", "11020", "11646", "11840"]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
idx = json.load(open(os.path.join(ROOT, "arch", "index.json")))
out = {}
T0 = time.time()
for fm in MISS:
    if time.time() - T0 > 40 * 60:
        break
    e = idx.get(fm) or {}
    res = {"n": e.get("n"), "c": e.get("cn"), "m": []}
    for s in (e.get("s") or [])[:2]:
        try:
            fx = json.load(open(os.path.join(ROOT, "arch", fm, s + ".json"))).get("fix") or []
        except Exception:
            fx = []
        done = sorted([f for f in fx if f[5] and f[4]], key=lambda f: f[4], reverse=True)[:3]
        for f in done:
            ts = datetime.fromisoformat(f[4].replace("Z", "+00:00")).timestamp()
            eid = find_event(ts, f[2], f[3], "", "")
            if not eid:
                res["m"].append({"eid": 0})
                continue
            ln = get(B + "lineups/soccer/%s?locale=en" % eid) or {}
            lu = ln.get("Lu") or []
            r = {"eid": 1, "keys": sorted(ln.keys()), "teams": len(lu)}
            if lu:
                t = lu[0]
                ps = t.get("Ps") or []
                r["tkeys"] = sorted(t.keys())
                r["pkeys"] = sorted({k for p in ps for k in p.keys()})
                r["np"] = [len(x.get("Ps") or []) for x in lu]
                # campi di posizione: solo l'insieme dei codici (es. 1..4), mai nomi
                for k in ("Pos", "Fp", "Pon", "Psn", "Pn"):
                    if any(k in p for p in ps) and k != "Pn":
                        r["v_" + k] = sorted({str(p.get(k)) for p in ps})[:20]
                for k in ("Fo", "Fm", "Frm"):
                    if k in t:
                        r["t_" + k] = str(t[k])[:20]
            res["m"].append(r)
        if res["m"]:
            break
    out[fm] = res
os.makedirs(os.path.join(ROOT, "report"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "report", "sonda_formazioni_ls.json"), "w"), ensure_ascii=False, indent=0)
print(len(out))
