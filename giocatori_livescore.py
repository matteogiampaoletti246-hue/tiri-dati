#!/usr/bin/env python3
"""Gerarchia dati dei giocatori, livello 4 (regola fissa, vedi CLAUDE.md): dove ne' FotMob ne' PitchAPI danno le statistiche dei singoli
(partita finita senza `p`, competizione non coperta da PitchAPI o partita senza abbinamento in pitch_stato.json) si ricavano da LiveScore:
formazioni + eventi -> presenze, minuti, gol, assist, gialli. LiveScore NON ha tiri, passaggi, voti: niente dati inventati, solo queste voci.
Scritte nello STESSO formato di FotMob (`p`, marcate `px: livescore`, `pn` quando FotMob non ha le formazioni).
Abbinamento: evento LiveScore per data (+-1 giorno) e id squadra FotMob dallo stemma (`enet/<id>.png`), altrimenti nomi simili;
giocatore per nome dentro le formazioni/rose FotMob della squadra. Referto: livescore_giocatori.json."""
import json, os, re, sys, time, urllib.request
from datetime import datetime, timedelta, timezone
import kvstats
from giocatori_pitch import norm, same_team, parse_ts, lineup_index, find_player, team_index, load_gz, dump_gz, TOP, SKIP

MAX_MIN = float(os.environ.get("MAX_MIN", "40"))
MAX_MATCH = int(os.environ.get("MAX_MATCH", "1500"))
T0 = time.time()
REPORT, STATE = "livescore_giocatori.json", "livescore_stato.json"
RETRY_DAYS = 7
B = "https://prod-cdn-public-api.livescore.com/v1/api/app/"
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1"}
IT_GOAL, IT_PEN, IT_OWN, IT_ASSIST, IT_YELLOW, IT_SUB = 36, 37, 39, 63, 43, 5
CODES = {}   # codici IT visti (per controllare che non ci siano cartellini rossi non contati)
DAYS = {}


def get(url):
    for k in range(3):
        try:
            return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read().decode("utf8", "replace"))
        except Exception as e:
            if "404" in str(e):
                return None
            time.sleep(1.5)
    return None


def day_events(ymd):
    if ymd not in DAYS:
        j = get(B + f"date/soccer/{ymd}/1?countryCode=GB&locale=en&MD=1") or {}
        evs = []
        for s in j.get("Stages", []):
            for x in s.get("Events", []):
                t1, t2 = (x.get("T1") or [{}])[0], (x.get("T2") or [{}])[0]
                i1, i2 = re.search(r"enet/(\d+)\.png", t1.get("Img") or ""), re.search(r"enet/(\d+)\.png", t2.get("Img") or "")
                evs.append((x.get("Eid"), i1 and i1.group(1), i2 and i2.group(1), t1.get("Nm"), t2.get("Nm")))
        DAYS[ymd] = evs
    return DAYS[ymd]


def find_event(ts, hid, aid, hn, an):
    for off in (0, -1, 1):
        ymd = datetime.fromtimestamp(ts + off * 86400, timezone.utc).strftime("%Y%m%d")
        for eid, i1, i2, n1, n2 in day_events(ymd):
            if (i1 == str(hid) and i2 == str(aid)) or (not i1 and not i2 and same_team(hn, n1) and same_team(an, n2)):
                return eid
    return None


def flat(o):
    if isinstance(o, dict):
        if "IT" in o:
            yield o
        for v in o.values():
            yield from flat(v)
    elif isinstance(o, list):
        for v in o:
            yield from flat(v)


def pname(x):
    n = (str(x.get("Fn") or "") + " " + str(x.get("Ln") or "")).strip()
    return n or x.get("Pn") or ""


def build(eid):
    """-> {side(1|2): {id LiveScore: {n: nome, in: minuto entrata, out: minuto uscita|None, g, a, y}}} oppure None."""
    ln, inc = get(B + f"lineups/soccer/{eid}?locale=en"), get(B + f"incidents/soccer/{eid}?locale=en")
    if not ln or not inc:
        return None
    P = {1: {}, 2: {}}
    for t in ln.get("Lu") or []:
        side = t.get("Tnb")
        for p in t.get("Ps") or []:
            if side in P and p.get("Pid"):
                P[side][str(p["Pid"])] = {"n": pname(p), "in": 0, "out": p.get("Mo") if isinstance(p.get("Mo"), int) and p.get("Mo") else None, "g": 0, "a": 0, "y": 0}
    if not P[1] and not P[2]:
        return None
    end = 90
    ev = list(flat(ln.get("Subs"))) + list(flat(inc.get("Incs")))
    for x in ev:
        CODES[x["IT"]] = CODES.get(x["IT"], 0) + 1
        side, mn = x.get("Nm"), x.get("Min") or 0
        if side not in P or not isinstance(mn, int):
            continue
        a = str(x.get("Aid") or x.get("ID") or "")
        if x["IT"] == IT_SUB:
            o = str(x.get("IDo") or "")
            if a in P[side] and a != o:
                P[side][a]["in"] = min(P[side][a]["in"] or mn, mn) if P[side][a]["in"] else mn
            elif a and a != o:
                P[side][a] = {"n": pname(x), "in": mn, "out": None, "g": 0, "a": 0, "y": 0}
            if o in P[side]:
                P[side][o]["out"] = mn
            continue
        if not a:
            continue
        r = P[side].setdefault(a, {"n": pname(x), "in": None, "out": None, "g": 0, "a": 0, "y": 0})
        if x["IT"] in (IT_GOAL, IT_PEN):
            r["g"] += 1
        elif x["IT"] == IT_ASSIST:
            r["a"] += 1
        elif x["IT"] == IT_YELLOW:
            r["y"] += 1
    return P


def main():
    if not kvstats.ON:
        sys.exit('Manca CLOUDFLARE_API_TOKEN: le statistiche di fonti terze vanno solo su KV')
    idx = json.load(open("arch/index.json"))
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    pst = json.load(open("pitch_stato.json")) if os.path.exists("pitch_stato.json") else {}
    rep = {"competizioni": {}, "codici_it_visti": {}}
    done_m = 0
    jobs = []
    for fm, e in idx.items():
        if SKIP.search(e.get("n", "")):
            continue
        for rank, sk in enumerate(sorted(e.get("s") or [], reverse=True)):
            jobs.append((rank, 0 if str(fm) in TOP else 1, int(fm), fm, e, sk))
    jobs.sort(key=lambda j: j[:3])
    for _, _, _, fm, e, sk in jobs:
        if (time.time() - T0) / 60 > MAX_MIN or done_m >= MAX_MATCH:
            break
        stk = f"{fm}|{sk}"
        pp = pst.get(stk)
        if pp is None:
            continue  # PitchAPI non ha ancora guardato questa stagione: prima tocca a lui
        stt = state.get(stk) or {}
        if time.time() - stt.get("t", 0) < 1 * 86400 and stt.get("fine"):
            continue
        path = f"partite/{fm}/{sk}.json.gz"
        if not os.path.exists(path):
            continue
        try:
            d = load_gz(path)
            arch = json.load(open(f"arch/{fm}/{sk}.json"))
        except Exception:
            continue
        pfail = set(pp.get("fail") or [])
        kv = kvstats.load(fm, sk)   # dati di fonti terze: solo su Cloudflare KV, mai nel repository
        todo = {}
        for r in arch.get("fix") or []:
            mid = str(r[0])
            if not r[5] or (d.get("m") or {}).get(mid, {}).get("p") or mid in kv:
                continue
            if pp.get("nolega") or mid in pfail:
                todo[mid] = r
        fail = set(stt.get("fail") or []) if time.time() - stt.get("t", 0) < RETRY_DAYS * 86400 else set()
        todo = {k: v for k, v in todo.items() if k not in fail}
        if not todo:
            state[stk] = {"t": time.time(), "fine": True, "fail": sorted(fail)}
            continue
        teams = arch.get("teams") or {}
        tidx = team_index(fm, sk, d, arch)
        n_ok = n_pl = 0
        for mid, r in todo.items():
            if (time.time() - T0) / 60 > MAX_MIN or done_m >= MAX_MATCH:
                break
            ts = parse_ts(r[4])
            hn, an = teams.get(str(r[2])) or teams.get(r[2]), teams.get(str(r[3])) or teams.get(r[3])
            eid = find_event(ts, r[2], r[3], hn, an) if ts else None
            if not eid:
                fail.add(mid); continue
            P = build(eid)
            done_m += 1
            time.sleep(0.3)
            if not P:
                fail.add(mid); continue
            m = d["m"].get(mid) or {}
            hidx = {**tidx.get(str(r[2]), {}), **lineup_index(m.get("h") or {})}
            aidx = {**tidx.get(str(r[3]), {}), **lineup_index(m.get("a") or {})}
            out, pn = {}, {}
            for side, sidx, tid in ((1, hidx, r[2]), (2, aidx, r[3])):
                for lid, x in P[side].items():
                    start = x["in"]
                    if start is None:
                        continue  # citato negli eventi ma mai in campo nelle formazioni: non si inventano minuti
                    fid = find_player(x["n"], sidx)
                    mins = (x["out"] if x["out"] else 90) - start
                    if not fid or mins <= 0:
                        continue
                    v = {"minutes_played": mins}
                    for k, kk in (("g", "goals"), ("a", "assists"), ("y", "yellow_cards")):
                        if x[k]:
                            v[kk] = x[k]
                    out[fid] = v
                    pn[fid] = [x["n"], "h" if side == 1 else "a", str(tid)]
            if out:
                kv[mid] = {"p": out, "px": "livescore"}
                if not m.get("h") or not m.get("a"):
                    kv[mid]["pn"] = pn
                n_ok += 1
                n_pl += len(out)
            else:
                fail.add(mid)
        state[stk] = {"t": time.time(), "fine": False, "fail": sorted(fail)}
        if n_ok and not kvstats.save([(fm, sk, kv)]):
            print("scrittura KV fallita", fm, sk); sys.exit(1)
        rep["competizioni"][f"{e.get('n')} {sk}"] = {"partite_completate": n_ok, "giocatori": n_pl, "da_fare": len(todo)}
        print(e.get("n"), sk, rep["competizioni"][f"{e.get('n')} {sk}"])
    rep["partite_completate_in_questo_giro"] = done_m
    rep["codici_it_visti"] = {str(k): v for k, v in sorted(CODES.items())}
    json.dump(state, open(STATE, "w"), separators=(",", ":"))
    json.dump(rep, open(REPORT, "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
