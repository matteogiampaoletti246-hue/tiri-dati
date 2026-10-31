#!/usr/bin/env python3
"""Statistiche di squadra e mappa tiri delle partite FINITE dove FotMob non ha le statistiche (`s` assente): da PitchAPI, in formato FotMob.
PitchAPI /stats: stesse chiavi di FotMob (groups -> items key/home/away): `s` = {chiave: [casa, ospite]} (valori numerici interi se interi, altrimenti testo come
"628 (89%)"); /shots: stessi campi del shotmap FotMob -> `sh` nel formato del worker /fx (righe [min, minAggiunto, idSquadraFotMob, giocatore, x, y, tipo, murato,
inPorta, bloccatoX, bloccatoY, golY, golZ, xG, xGOT, parte del corpo, situazione, autogol, periodo]) + `hi` (id FotMob della squadra di casa).
Gerarchia: FotMob -> PitchAPI (LiveScore non ha statistiche di squadra). SOLO su Cloudflare KV (record della partita), mai nel repository.
Referto: stats_pitch.json (conteggi). Uso: python stats_pitch.py"""
import json, os, sys, time, urllib.parse
import kvstats
from update_data import api, KEY
from giocatori_pitch import norm, same_team, parse_ts, load_gz, season_pitch, SKIP

MAX_MIN = float(os.environ.get("MAX_MIN", "40"))
MAX_MATCH = int(os.environ.get("MAX_MATCH", "1500"))
STATE, REPORT = "stats_pitch_stato.json", "stats_pitch.json"
RETRY = 7 * 86400
T0 = time.time()
SHOT_MAX_KEYS = 0


def val(x):
    if x is None or x == "":
        return None
    try:
        f = float(x)
        return int(f) if f == int(f) and "." not in str(x) and "(" not in str(x) else x
    except (TypeError, ValueError):
        return x


def convert_stats(st):
    out = {}
    for p in st.get("periods") or []:
        if p.get("period") != "All":
            continue
        for g in p.get("groups") or []:
            for it in g.get("items") or []:
                k = it.get("key")
                if not k:
                    continue
                a, b = val(it.get("home")), val(it.get("away"))
                if a is None and b is None:
                    continue
                out[k] = [a, b]
    return out


def convert_shots(sh, pm, r):
    """r = riga arch.fix: r[2] casa, r[3] ospite (id squadra FotMob)."""
    hid, aid = str((pm.get("home_team") or {}).get("id")), str((pm.get("away_team") or {}).get("id"))
    rows = []
    for per in sh.get("periods") or []:
        for s in per.get("shots") or []:
            tid = str(s.get("team_id"))
            if tid == hid:
                fm = r[2]
            elif tid == aid:
                fm = r[3]
            else:
                continue
            if s.get("x") is None or s.get("y") is None:
                continue
            rows.append([s.get("minute"), s.get("minute_added") or 0, fm, (s.get("player") or {}).get("name") or "", s.get("x"), s.get("y"),
                         s.get("event_type"), 1 if s.get("is_blocked") else 0, 1 if s.get("is_on_target") else 0, s.get("blocked_x"), s.get("blocked_y"),
                         s.get("goal_crossed_y"), s.get("goal_crossed_z"), s.get("expected_goals"), s.get("expected_goals_on_target"),
                         s.get("shot_type"), s.get("situation"), 1 if s.get("is_own_goal") else 0, per.get("period")])
    rows.sort(key=lambda x: ((x[0] or 0), (x[1] or 0)))
    return rows


def main():
    if not KEY:
        sys.exit("Manca PITCHAPI_KEY")
    if not kvstats.ON:
        sys.exit("Manca CLOUDFLARE_API_TOKEN")
    idx = json.load(open("arch/index.json"))
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    leagues = [l for l in (api("/v1/leagues") or {}).get("leagues", []) if not SKIP.search(l.get("name", ""))]
    rep = {"competizioni": {}}
    done = 0
    jobs = []
    for fm, e in idx.items():
        if SKIP.search(e.get("n", "")):
            continue
        for rank, sk in enumerate(sorted(e.get("s") or [], reverse=True)):
            jobs.append((rank, int(fm), fm, e, sk))
    jobs.sort(key=lambda j: j[:2])
    for _, _, fm, e, sk in jobs:
        if (time.time() - T0) / 60 > MAX_MIN or done >= MAX_MATCH:
            break
        path = f"partite/{fm}/{sk}.json.gz"
        ps = season_pitch(sk)
        if not ps or not os.path.exists(path):
            continue
        try:
            d, arch = load_gz(path), json.load(open(f"arch/{fm}/{sk}.json"))
        except Exception:
            continue
        stk = f"{fm}|{sk}"
        fail = {k for k, t in (state.get(stk) or {}).items() if time.time() - t < RETRY}
        kv = kvstats.load(fm, sk)
        todo = [r for r in arch.get("fix") or []
                if r[5] and str(r[0]) not in fail and not (d.get("m") or {}).get(str(r[0]), {}).get("s") and not (kv.get(str(r[0])) or {}).get("s")]
        if not todo:
            continue
        cc = e.get("c")
        cand = [l for l in leagues if (cc == "INT" or l.get("country_code") == cc) and ps in (l.get("seasons") or []) and norm(l.get("name")) == norm(e.get("n"))]
        if len(cand) != 1:
            continue
        try:
            pms = [x for x in (api(f"/v1/leagues/{cand[0]['id']}/matches?season={urllib.parse.quote(ps, safe='')}") or {}).get("matches", []) if x.get("status") == "finished"]
        except Exception as ex:
            print("errore lega", str(ex)[:80]); continue
        teams = arch.get("teams") or {}
        n_s = n_sh = 0
        for r in todo:
            if (time.time() - T0) / 60 > MAX_MIN or done >= MAX_MATCH:
                break
            mid = str(r[0])
            hn, an, ts = teams.get(str(r[2])) or teams.get(r[2]), teams.get(str(r[3])) or teams.get(r[3]), parse_ts(r[4])
            pm = next((x for x in pms if ts and abs((parse_ts(x.get("time_utc")) or 0) - ts) < 36 * 3600
                       and same_team(hn, (x.get("home_team") or {}).get("name")) and same_team(an, (x.get("away_team") or {}).get("name"))), None)
            if not pm:
                state.setdefault(stk, {})[mid] = time.time(); continue
            try:
                st = convert_stats(api(f"/v1/matches/{pm['id']}/stats") or {})
                sh = convert_shots(api(f"/v1/matches/{pm['id']}/shots") or {}, pm, r)
            except Exception as ex:
                print("  errore", str(ex)[:80]); continue
            done += 1
            if not st and not sh:
                state.setdefault(stk, {})[mid] = time.time(); continue
            rec = kv.setdefault(mid, {})
            if st:
                rec["s"] = st; n_s += 1
            if sh:
                rec["sh"] = sh; rec["hi"] = r[2]; n_sh += 1
        if (n_s or n_sh) and not kvstats.save([(fm, sk, kv)]):
            print("scrittura KV fallita", fm, sk); sys.exit(1)
        rep["competizioni"][f"{e.get('n')} {sk}"] = {"con_statistiche": n_s, "con_mappa_tiri": n_sh, "da_fare": len(todo)}
        print(e.get("n"), sk, rep["competizioni"][f"{e.get('n')} {sk}"], flush=True)
    rep["partite_in_questo_giro"] = done
    json.dump(state, open(STATE, "w"), separators=(",", ":"))
    json.dump(rep, open(REPORT, "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
