#!/usr/bin/env python3
"""Resoconto per fonte (richiesto il 16/11/2026): quante partite finite e quante schede giocatore sono coperte da ogni fonte.
Fonti delle statistiche dei giocatori in una partita, nell'ordine in cui l'app le usa:
  fotmob            = statistiche giocatore FotMob nel file partite/ (`p`)
  pitchapi/livescore/diretta = statistiche dal Cloudflare KV (`px`; `px2` = fonte arricchita da PitchAPI)
  formazioni_fotmob = nessuna statistica, minuti/gol/assist ricavati da formazioni e cambi FotMob (`kvstats.synth_p`, come synthP nell'app)
  nessuna           = partita finita senza giocatori da nessuna fonte
Giocatori: una scheda e' "coperta da FotMob" se ha almeno una partita con statistiche FotMob; le altre si contano per la fonte che le copre.
Scrive solo conteggi in resoconto_fonti.json (nessun dato di terzi). Serve CLOUDFLARE_API_TOKEN per leggere il KV."""
import json, os, gzip, collections, time
import kvstats

idx = json.load(open("arch/index.json"))
kvi = set()
if kvstats.ON:
    from rose_livescore import kv_get
    kvi = set(kv_get(kvstats.INDEX) or [])

SRC = ["fotmob", "pitchapi", "livescore", "diretta", "formazioni_fotmob", "nessuna"]
tot = {"tutte": collections.Counter(), "ultime_due_stagioni": collections.Counter()}
per_comp = {}
pl_src = collections.defaultdict(set)   # id giocatore -> fonti che lo coprono
pl_src_recent = collections.defaultdict(set)
arricchite = collections.Counter()
for fm, e in idx.items():
    seasons = sorted(e.get("s") or [], reverse=True)
    for i, sk in enumerate(seasons):
        path = f"partite/{fm}/{sk}.json.gz"
        try:
            fix = [r for r in json.load(open(f"arch/{fm}/{sk}.json")).get("fix") or [] if r[5]]
        except Exception:
            continue
        if not fix:
            continue
        try:
            d = json.load(gzip.open(path)) if os.path.exists(path) else {"m": {}}
        except Exception:
            d = {"m": {}}
        kv = kvstats.load(fm, sk) if f"{fm}/{kvstats.slug(sk)}" in kvi else {}
        c = collections.Counter()
        lineup_only = {}
        for r in fix:
            mid = str(r[0])
            m = (d.get("m") or {}).get(mid) or {}
            k = kv.get(mid) or {}
            if m.get("p"):
                src, P = "fotmob", m["p"]
            elif k.get("p"):
                src, P = str(k.get("px") or "kv"), k["p"]
                if k.get("px2"):
                    arricchite[f"{k.get('px2')}+{k.get('px')}"] += 1
            elif m.get("h") and m.get("a"):
                lineup_only[mid] = dict(m, e=m.get("e") or k.get("e")); continue
            else:
                src, P = "nessuna", {}
            c[src] += 1
            for pid in P:
                pl_src[pid].add(src)
                if i < 2: pl_src_recent[pid].add(src)
        if lineup_only:
            dd = kvstats.synth_p({"m": lineup_only})
            for mid, m in dd["m"].items():
                P = m.get("p") or {}
                c["formazioni_fotmob" if P else "nessuna"] += 1
                for pid in P:
                    pl_src[pid].add("formazioni_fotmob")
                    if i < 2: pl_src_recent[pid].add("formazioni_fotmob")
        tot["tutte"].update(c)
        if i < 2:
            tot["ultime_due_stagioni"].update(c)
            per_comp[f"{e.get('n')} ({e.get('c')}) {sk}"] = dict(c)


def players(ps):
    fot = sum(1 for s in ps.values() if "fotmob" in s)
    other = {s: sum(1 for x in ps.values() if "fotmob" not in x and s in x) for s in SRC if s not in ("fotmob", "nessuna")}
    only = {s: sum(1 for x in ps.values() if x == {s}) for s in SRC if s != "nessuna"}
    return {"schede_con_partite": len(ps), "coperte_da_fotmob": fot, "non_coperte_da_fotmob": len(ps) - fot,
            "non_fotmob_coperte_da": other, "coperte_solo_da": only}


out = {"aggiornato": time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime()),
       "partite_finite": {k: {s: v.get(s, 0) for s in SRC} | {"totale": sum(v.values())} for k, v in tot.items()},
       "partite_arricchite_da_pitchapi": dict(arricchite),
       "giocatori": {"tutte": players(pl_src), "ultime_due_stagioni": players(pl_src_recent)},
       "competizioni_ultime_due_stagioni": per_comp}
json.dump(out, open("resoconto_fonti.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in out.items() if k != "competizioni_ultime_due_stagioni"}, ensure_ascii=False, indent=1))
