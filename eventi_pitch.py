#!/usr/bin/env python3
"""Riepilogo (gol, gialli, rossi, cambi) delle partite FINITE dove non arrivano ne' FotMob ne' LiveScore (eventi_stato.json = LiveScore ha fallito): da PitchAPI.
Gerarchia eventi: FotMob -> LiveScore (eventi_livescore.py) -> PitchAPI (questo). Dati di terzi: SOLO su Cloudflare KV (campo `e` del record della partita), mai nel repository.
PitchAPI /v1/matches/<id>/events: goal (player, score_home/away, is_own_goal, is_penalty), yellowcard, redcard, substitution (player + sub_in_player: l'orientamento
si verifica con le formazioni, chi e' titolare e' quello che esce). La squadra di un gol si ricava dal punteggio (chi sale), quella di cartellini e cambi da team_id.
Abbinamento lega/partita come giocatori_pitch.py. Referto: eventi_pitch.json (conteggi). Uso: python eventi_pitch.py"""
import json, os, sys, time, urllib.parse
import kvstats
from update_data import api, KEY
from giocatori_pitch import norm, same_team, parse_ts, load_gz, season_pitch, SKIP

MAX_MIN = float(os.environ.get("MAX_MIN", "40"))
MAX_MATCH = int(os.environ.get("MAX_MATCH", "1500"))
STATE, REPORT = "eventi_pitch_stato.json", "eventi_pitch.json"
RETRY = 7 * 86400
T0 = time.time()
SWAP = [None]  # None = da verificare; False = player esce; True = player entra


def orient(pm, subs):
    """True se in questo feed `player` e' quello che ENTRA (da scambiare), False se esce. Verifica con i titolari della formazione."""
    if SWAP[0] is not None or not subs:
        return bool(SWAP[0])
    try:
        ln = api(f"/v1/matches/{pm['id']}/lineups") or {}
        starters = {str(p.get("player_id")) for s in ("home", "away") for p in ((ln.get(s) or {}).get("starters") or [])}
    except Exception:
        return False
    a = sum(1 for e in subs if str((e.get("player") or {}).get("id")) in starters)
    b = sum(1 for e in subs if str((e.get("sub_in_player") or {}).get("id")) in starters)
    if a == b:
        return False
    SWAP[0] = b > a
    return SWAP[0]


def convert(pm, raw):
    hid = str((pm.get("home_team") or {}).get("id"))
    subs = [e for e in raw if e.get("event_type") == "substitution"]
    swap = orient(pm, subs)
    raw = sorted(raw, key=lambda e: ((e.get("minute") or 0), (e.get("minute_added") or 0)))
    out, ph, pa = [], 0, 0
    for e in raw:
        t, mn, add = e.get("event_type"), e.get("minute"), e.get("minute_added") or 0
        if not isinstance(mn, int):
            continue
        name = (e.get("player") or {}).get("name") or ""
        home = str(e.get("team_id")) == hid
        x = {"time": mn, "overloadTime": add}
        if t == "goal":
            sh, sa = e.get("score_home"), e.get("score_away")
            if isinstance(sh, int) and isinstance(sa, int):
                home = sh > ph or (sh == ph and sa <= pa and home)
                ph, pa = sh, sa
            x.update(type="Goal", isHome=home, nameStr=name)
            if e.get("is_penalty"): x["goalDescription"] = "Penalty"
            if e.get("is_own_goal"): x["goalDescription"] = "Own goal"
        elif t in ("yellowcard", "redcard"):
            x.update(type="Card", isHome=home, card="Yellow" if t == "yellowcard" else "Red", nameStr=name)
        elif t == "substitution":
            a, b = (e.get("player") or {}).get("name") or "", (e.get("sub_in_player") or {}).get("name") or ""
            x.update(type="Substitution", isHome=home, swap=[{"name": a if swap else b}, {"name": b if swap else a}])
        else:
            continue
        x["homeScore"], x["awayScore"] = ph, pa
        out.append(x)
    return out


def main():
    if not KEY:
        sys.exit("Manca PITCHAPI_KEY")
    if not kvstats.ON:
        sys.exit("Manca CLOUDFLARE_API_TOKEN")
    idx = json.load(open("arch/index.json"))
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    ls = json.load(open("eventi_stato.json")) if os.path.exists("eventi_stato.json") else {}
    leagues = [l for l in (api("/v1/leagues") or {}).get("leagues", []) if not SKIP.search(l.get("name", ""))]
    rep = {"competizioni": {}, "tipi_visti": {}}
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
        stk = f"{fm}|{sk}"
        lsfail = ls.get(stk) or {}   # partite dove LiveScore non ha dato eventi
        path = f"partite/{fm}/{sk}.json.gz"
        ps = season_pitch(sk)
        if not lsfail or not ps or not os.path.exists(path):
            continue
        try:
            d, arch = load_gz(path), json.load(open(f"arch/{fm}/{sk}.json"))
        except Exception:
            continue
        kv = kvstats.load(fm, sk)
        fail = {k for k, t in (state.get(stk) or {}).items() if time.time() - t < RETRY}
        todo = [r for r in arch.get("fix") or []
                if r[5] and str(r[0]) in lsfail and str(r[0]) not in fail
                and not (d.get("m") or {}).get(str(r[0]), {}).get("e") and not (kv.get(str(r[0])) or {}).get("e")]
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
        n_ok = 0
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
                raw = (api(f"/v1/matches/{pm['id']}/events") or {}).get("events") or []
            except Exception as ex:
                print("  errore", str(ex)[:80]); continue
            done += 1
            for x in raw:
                rep["tipi_visti"][str(x.get("event_type"))] = rep["tipi_visti"].get(str(x.get("event_type")), 0) + 1
            evs = convert(pm, raw)
            if not evs:
                state.setdefault(stk, {})[mid] = time.time(); continue
            kv.setdefault(mid, {})["e"] = evs
            n_ok += 1
        if n_ok and not kvstats.save([(fm, sk, kv)]):
            print("scrittura KV fallita", fm, sk); sys.exit(1)
        rep["competizioni"][f"{e.get('n')} {sk}"] = {"partite_con_eventi": n_ok, "da_fare": len(todo)}
        print(e.get("n"), sk, rep["competizioni"][f"{e.get('n')} {sk}"], flush=True)
    rep["partite_in_questo_giro"] = done
    rep["orientamento_cambi"] = {None: "non verificato", False: "player esce", True: "player entra"}[SWAP[0]]
    json.dump(state, open(STATE, "w"), separators=(",", ":"))
    json.dump(rep, open(REPORT, "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
