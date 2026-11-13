#!/usr/bin/env python3
"""Statistiche di squadra delle partite FINITE dove FotMob non le ha (`s` assente), da ESPN, nello stesso formato di FotMob.
Ordine delle fonti per le statistiche di squadra: FotMob -> ESPN -> PitchAPI (`stats_pitch.py`, gira dopo e salta le partite che ESPN ha gia' riempito)
-> LiveScore (non ha statistiche di squadra). ESPN le ha solo per una parte delle partite (UEFA quasi tutte, CAF/AFC/CONCACAF poche): una partita entra
solo se ESPN da' tiri e tiri in porta di ENTRAMBE le squadre, altrimenti resta vuota e ci pensa PitchAPI. Mai valori inventati o a meta'.
Dati di terzi: SOLO su Cloudflare KV (`kvstats.py`, spazio `idx:ps/<fm>/<stagione>`, campo `s`), mai nel repository (e' pubblico).
Nel repository finisce solo `stats_espn_stato.json` (id partita -> quando e' stata provata) e `stats_espn.json` (conteggi).
Uso: python stats_espn.py [id FotMob,id FotMob...]   (senza argomenti: prima le qualificazioni e le nazionali, poi le altre competizioni di CODICI)
Prova senza KV: DRY=1 python stats_espn.py 10199 (stampa i conteggi e un esempio, non scrive niente)."""
import json, os, sys, time, gzip
import kvstats
from falli_coppie import get, sim, ESPN
from tiri_espn import CODICI

PAUSA = float(os.environ.get("PAUSA", "0.15"))
BUDGET = float(os.environ.get("ESPN_BUDGET_MIN", "40")) * 60
DRY = bool(os.environ.get("DRY"))
STATE, REPORT = "stats_espn_stato.json", "stats_espn.json"
RETRY = 7 * 86400
T0 = time.time()
# nazionali per prime: qualificazioni (10195-10201, 10607-10609, 10717-10719), Mondiali, amichevoli
EXTRA = {10200: "fifa.worldq.ofc", 10201: "fifa.worldq.playoff"}
PRIMA = [10195, 10196, 10197, 10198, 10199, 10200, 10201, 10607, 10608, 10609, 10717, 10718, 10719, 77, 114]
# chiave ESPN -> chiave FotMob (stesse chiavi di `partite/<fm>/<stagione>.json.gz` campo `s`)
MAPPA = {"totalShots": "total_shots", "shotsOnTarget": "ShotsOnTarget", "blockedShots": "blocked_shots", "wonCorners": "corners", "foulsCommitted": "fouls",
         "yellowCards": "yellow_cards", "redCards": "red_cards", "offsides": "Offsides", "possessionPct": "BallPossesion", "saves": "keeper_saves",
         "interceptions": "interceptions", "totalClearance": "clearances", "totalTackles": "matchstats.headers.tackles", "accurateCrosses": "accurate_crosses",
         "accurateLongBalls": "long_balls_accurate", "accuratePasses": "accurate_passes", "totalPasses": "passes"}


def num(x):
    try:
        f = float(x)
    except (TypeError, ValueError):
        return None
    return int(f) if f == int(f) else round(f, 1)


def converti(summ):
    """boxscore ESPN -> {chiave FotMob: [casa, ospite]} oppure None se mancano tiri e tiri in porta di una delle due squadre."""
    teams = (summ.get("boxscore") or {}).get("teams") or []
    if len(teams) != 2:
        return None
    per = {}
    for t in teams:
        lato = 0 if t.get("homeAway") == "home" else 1 if t.get("homeAway") == "away" else None
        if lato is None:
            return None
        per[lato] = {x.get("name"): num(x.get("value", x.get("displayValue"))) for x in t.get("statistics") or []}
    if set(per) != {0, 1}:
        return None
    for l in (0, 1):
        if per[l].get("totalShots") is None or per[l].get("shotsOnTarget") is None:
            return None
    # controllo di plausibilita': ESPN a volte ha record quasi vuoti (possesso 100-0, un tiro in tutta la partita): meglio niente che numeri falsi
    pos = [per[0].get("possessionPct"), per[1].get("possessionPct")]
    if None in pos or not (5 <= pos[0] <= 95 and 5 <= pos[1] <= 95 and 97 <= pos[0] + pos[1] <= 103):
        return None
    if per[0]["totalShots"] + per[1]["totalShots"] < 4 or min(per[0]["totalShots"], per[1]["totalShots"]) < 0:
        return None
    if min(per[l].get("totalPasses") or 0 for l in (0, 1)) < 60:
        return None
    out = {}
    for ek, fk in MAPPA.items():
        a, b = per[0].get(ek), per[1].get(ek)
        if a is None or b is None:
            continue
        out[fk] = [a, b]
    # tiri fuori = tiri - in porta - murati (come FotMob: total_shots comprende i murati); solo se ESPN da' anche i murati
    if "blocked_shots" in out:
        off = [out["total_shots"][i] - out["ShotsOnTarget"][i] - out["blocked_shots"][i] for i in (0, 1)]
        if min(off) >= 0:
            out["ShotsOffTarget"] = off
    return out


def main():
    if not DRY and not kvstats.ON:
        sys.exit("Manca CLOUDFLARE_API_TOKEN (per la prova senza KV: DRY=1)")
    cod = dict(CODICI)
    cod.update(EXTRA)
    scelte = [int(x) for x in sys.argv[1].split(",")] if len(sys.argv) > 1 else PRIMA + [k for k in cod if k not in PRIMA]
    scelte = [k for k in scelte if k in cod]
    idx = json.load(open("arch/index.json"))
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    rep = {"competizioni": {}}
    resta = False
    for fm in scelte:
        e = idx.get(str(fm))
        if not e:
            continue
        for sk in sorted(e.get("s") or [], reverse=True):
            if time.time() - T0 > BUDGET:
                resta = True
                break
            path = f"partite/{fm}/{sk}.json.gz"
            if not os.path.exists(path) or not os.path.exists(f"arch/{fm}/{sk}.json"):
                continue
            try:
                d = (json.load(gzip.open(path)).get("m")) or {}
                arch = json.load(open(f"arch/{fm}/{sk}.json"))
            except Exception:
                continue
            stk = f"{fm}|{sk}"
            fail = {k for k, t in (state.get(stk) or {}).items() if time.time() - t < RETRY}
            kv = {} if DRY else kvstats.load(fm, sk)
            todo = [r for r in arch.get("fix") or [] if r[6] and not r[8] and str(r[0]) not in fail
                    and not ((d.get(str(r[0])) or {}).get("s") or {}).get("total_shots") and not (kv.get(str(r[0])) or {}).get("s")]
            if not todo:
                continue
            nomi = arch.get("teams") or {}
            eventi = []
            for an in sorted({a for a in (sk[:4], sk[5:9]) if a}):
                sb = get(f"{ESPN}{cod[fm]}/scoreboard?dates={an}&limit=1000")
                eventi += (sb or {}).get("events") or []
            if not eventi:
                continue
            n_ok = n_no = 0
            for r in todo:
                if time.time() - T0 > BUDGET:
                    resta = True
                    break
                mid, t0 = str(r[0]), str(r[4] or "")
                hn, an_ = nomi.get(str(r[2]), ""), nomi.get(str(r[3]), "")
                best, bs = None, 0.0
                for ev in eventi:
                    if ev["status"]["type"]["state"] != "post" or ev["date"][:10] != t0[:10]:
                        continue
                    cs = {c["homeAway"]: c["team"]["displayName"] for c in ev["competitions"][0]["competitors"]}
                    s = sim(hn, cs.get("home")) + sim(an_, cs.get("away"))
                    if s > bs:
                        best, bs = ev, s
                if not best or bs < 1.2:
                    state.setdefault(stk, {})[mid] = time.time()
                    n_no += 1
                    continue
                summ = get(f"{ESPN}{cod[fm]}/summary?event={best['id']}")
                time.sleep(PAUSA)
                st = converti(summ) if summ else None
                if st:
                    kv.setdefault(mid, {})["s"] = st
                    n_ok += 1
                else:
                    n_no += 1
                    # ESPN completa i dati dopo la partita: le recentissime si riprovano al giro dopo
                    if t0 and time.time() - time.mktime(time.strptime(t0[:10], "%Y-%m-%d")) > 3 * 86400:
                        state.setdefault(stk, {})[mid] = time.time()
            if n_ok and not DRY and not kvstats.save([(fm, sk, kv)]):
                print("scrittura KV fallita", fm, sk)
                sys.exit(1)
            rep["competizioni"][f"{e.get('n')} {sk}"] = {"con_statistiche": n_ok, "senza": n_no, "da_fare": len(todo)}
            print(e.get("n"), sk, rep["competizioni"][f"{e.get('n')} {sk}"], flush=True)
            if DRY and n_ok:
                mid = next(k for k, v in kv.items() if v.get("s"))
                print("  esempio", mid, json.dumps(kv[mid]["s"]))
        if resta:
            break
    if not DRY:
        json.dump(state, open(STATE, "w"), separators=(",", ":"))
        json.dump(rep, open(REPORT, "w"), ensure_ascii=False, indent=1)
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as fh:
            fh.write(f"resta={'1' if resta else '0'}\n")


if __name__ == "__main__":
    main()
