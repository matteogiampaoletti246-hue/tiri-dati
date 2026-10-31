#!/usr/bin/env python3
"""Riepilogo (gol, assist, gialli, cambi) delle partite FINITE dove FotMob non ha gli eventi: da LiveScore (formazioni + incidenti).
Gerarchia: FotMob -> LiveScore (PitchAPI: eventi da aggiungere quando si conosceranno i suoi tipi di evento). Dati di terzi: SOLO su Cloudflare KV
(stesso record per partita di `kvstats`: `e` accanto a `p`), mai nel repository. Formato `e` = quello di FotMob nei file partite/ (time, type, isHome,
nameStr, assistStr, card, swap). Codici verificati: gol 36/37, assist 63, giallo 43, cambio 5; autogol (39) e rossi non verificati: non si scrivono.
Referto: eventi_livescore.json (conteggi). Uso: python eventi_livescore.py"""
import json, os, sys, time
import kvstats
from giocatori_livescore import get, find_event, flat, pname, B, IT_GOAL, IT_PEN, IT_ASSIST, IT_YELLOW, IT_SUB
from giocatori_pitch import parse_ts, load_gz, SKIP

MAX_MIN = float(os.environ.get("MAX_MIN", "40"))
MAX_MATCH = int(os.environ.get("MAX_MATCH", "1500"))
STATE, REPORT = "eventi_stato.json", "eventi_livescore.json"
RETRY = 7 * 86400
T0 = time.time()


def events(eid):
    ln, inc = get(B + f"lineups/soccer/{eid}?locale=en"), get(B + f"incidents/soccer/{eid}?locale=en")
    if not inc:
        return None
    names = {}
    for t in (ln or {}).get("Lu") or []:
        for p in t.get("Ps") or []:
            if p.get("Pid"):
                names[str(p["Pid"])] = pname(p)
    rows = list(flat((ln or {}).get("Subs"))) + list(flat(inc.get("Incs")))
    seen, evs, assists = set(), [], {}
    for x in rows:
        side, mn = x.get("Nm"), x.get("Min")
        if side not in (1, 2) or not isinstance(mn, int):
            continue
        if x["IT"] == IT_ASSIST:
            assists[(side, mn)] = pname(x)
    for x in rows:
        side, mn = x.get("Nm"), x.get("Min")
        if side not in (1, 2) or not isinstance(mn, int):
            continue
        add = x.get("MinEx") or 0
        k = (x["IT"], side, mn, add, str(x.get("Aid") or x.get("ID") or ""), str(x.get("IDo") or ""))
        if k in seen:
            continue
        seen.add(k)
        e = {"time": mn, "overloadTime": add, "isHome": side == 1}
        if x["IT"] in (IT_GOAL, IT_PEN):
            e.update(type="Goal", nameStr=pname(x))
            if x["IT"] == IT_PEN:
                e["goalDescription"] = "Penalty"
            if (side, mn) in assists:
                e["assistStr"] = "assist by " + assists[(side, mn)]
        elif x["IT"] == IT_YELLOW:
            e.update(type="Card", card="Yellow", nameStr=pname(x))
        elif x["IT"] == IT_SUB:
            out = names.get(str(x.get("IDo") or ""))
            e.update(type="Substitution", swap=[{"name": pname(x)}, {"name": out or ""}])
        else:
            continue
        evs.append(e)
    evs.sort(key=lambda q: q["time"] * 100 + q["overloadTime"])
    gh = ga = 0
    for e in evs:
        if e["type"] == "Goal":
            if e["isHome"]: gh += 1
            else: ga += 1
        e["homeScore"], e["awayScore"] = gh, ga
    return evs


def main():
    if not kvstats.ON:
        sys.exit("Manca CLOUDFLARE_API_TOKEN")
    idx = json.load(open("arch/index.json"))
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    rep = {"competizioni": {}}
    done = 0
    jobs = []
    for fm, e in idx.items():
        if SKIP.search(e.get("n", "")):
            continue
        for rank, sk in enumerate(sorted(e.get("s") or [], reverse=True)[:2]):
            jobs.append((rank, int(fm), fm, e, sk))
    jobs.sort(key=lambda j: j[:2])
    for _, _, fm, e, sk in jobs:
        if (time.time() - T0) / 60 > MAX_MIN or done >= MAX_MATCH:
            break
        path = f"partite/{fm}/{sk}.json.gz"
        if not os.path.exists(path):
            continue
        try:
            d, arch = load_gz(path), json.load(open(f"arch/{fm}/{sk}.json"))
        except Exception:
            continue
        stk = f"{fm}|{sk}"
        fail = {k for k, t in (state.get(stk) or {}).items() if time.time() - t < RETRY}
        kv = kvstats.load(fm, sk)
        teams = arch.get("teams") or {}
        todo = [r for r in arch.get("fix") or []
                if r[5] and not (d.get("m") or {}).get(str(r[0]), {}).get("e") and not (kv.get(str(r[0])) or {}).get("e") and str(r[0]) not in fail]
        n_ok = 0
        for r in todo:
            if (time.time() - T0) / 60 > MAX_MIN or done >= MAX_MATCH:
                break
            mid = str(r[0])
            ts = parse_ts(r[4])
            hn, an = teams.get(str(r[2])) or teams.get(r[2]), teams.get(str(r[3])) or teams.get(r[3])
            eid = find_event(ts, r[2], r[3], hn, an) if ts else None
            evs = events(eid) if eid else None
            done += 1
            time.sleep(0.3)
            if not evs:
                state.setdefault(stk, {})[mid] = time.time()
                continue
            kv.setdefault(mid, {})["e"] = evs
            n_ok += 1
        if n_ok and not kvstats.save([(fm, sk, kv)]):
            print("scrittura KV fallita", fm, sk); sys.exit(1)
        rep["competizioni"][f"{e.get('n')} {sk}"] = {"partite_con_eventi": n_ok, "da_fare": len(todo)}
        print(e.get("n"), sk, rep["competizioni"][f"{e.get('n')} {sk}"], flush=True)
    rep["partite_in_questo_giro"] = done
    json.dump(state, open(STATE, "w"), separators=(",", ":"))
    json.dump(rep, open(REPORT, "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
