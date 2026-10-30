"""Controllo coerenza giocatori: per ogni competizione/stagione con classifiche ufficiali (_s.json v2) e partite (partite/*.json.gz)
confronta presenze, minuti, gol e assist delle classifiche con la somma delle partite archiviate. Non corregge nulla: l'app mostra
la fonte ufficiale se c'e' (loadPlayerStatsFor), quindi una differenza = partite mancanti nel file della stagione (es. preliminari), non numeri inventati.
Scrive controllo_coerenza_giocatori.json. Tolleranze: minuti +-45 (recupero), presenze +-1."""
import collections, gzip, json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)


def load(p, gz=False):
    try:
        return json.load(gzip.open(p, "rt", encoding="utf-8") if gz else open(p, encoding="utf-8"))
    except Exception:
        return None


def main():
    idx = load("arch/index.json", {}) or {}
    for k, v in (load("arch/index_top.json", {}) or {}).items():
        e = idx.setdefault(k, {"n": v.get("n"), "s": []})
        e["s"] = sorted(set(e.get("s") or []) | set(v.get("s") or []))
    tot = collections.Counter()
    comp = collections.Counter()
    esempi = []
    for fm, e in idx.items():
        for sk in (e or {}).get("s") or []:
            s = load("arch/%s/%s_s.json" % (fm, sk))
            if not s or s.get("v") != 2 or not s.get("players"):
                continue
            d = load("partite/%s/%s.json.gz" % (fm, sk), True)
            if not d or not d.get("m"):
                continue
            P = s["players"]
            off = {}
            for k, c in (("goals", "g"), ("goal_assist", "a"), ("mins_played", "min")):
                for r in P.get(k) or []:
                    o = off.setdefault(str(r[0]), {"nome": r[1]})
                    o[c] = r[3]
                    o["n"] = r[5]
            calc = {}
            for m in d["m"].values():
                for pid, v in ((m or {}).get("p") or {}).items():
                    mi = (v or {}).get("minutes_played") or 0
                    if not mi:
                        continue
                    c = calc.setdefault(pid, {"n": 0, "min": 0, "g": 0, "a": 0})
                    c["n"] += 1
                    c["min"] += mi
                    c["g"] += v.get("goals") or 0
                    c["a"] += v.get("assists") or 0
            tot["righe_competizione_stagione"] += 1
            bad = 0
            for pid, o in off.items():
                c = calc.get(pid)
                if not c:
                    tot["giocatori_ufficiali_senza_dati_partita"] += 1
                    continue
                tot["giocatori_confrontati"] += 1
                diff = [f for f, tol in (("min", 45), ("n", 1), ("g", 0), ("a", 0)) if f in o and abs((o[f] or 0) - c[f]) > tol]
                if diff:
                    tot["giocatori_con_differenze"] += 1
                    bad = 1
                    if len(esempi) < 30:
                        esempi.append({"fm": fm, "competizione": e.get("n"), "stagione": sk, "giocatore": o["nome"], "ufficiale": {f: o.get(f) for f in diff}, "partite": {f: c[f] for f in diff}})
            if bad:
                tot["righe_con_differenze"] += 1
                comp["%s %s" % (fm, e.get("n"))] += 1
    out = dict(tot)
    out["competizioni_con_piu_differenze"] = comp.most_common(30)
    out["esempi"] = esempi
    with open("controllo_coerenza_giocatori.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=0)
    print({k: v for k, v in out.items() if isinstance(v, int)})


if __name__ == "__main__":
    main()
