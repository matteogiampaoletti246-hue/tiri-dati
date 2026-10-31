#!/usr/bin/env python3
"""Gerarchia dati dei giocatori, livello 3 (regola fissa, vedi CLAUDE.md): dove FotMob non da' le statistiche dei singoli nelle partite
(`p` mancante in partite/<fm>/<stagione>.json.gz) si prendono da PitchAPI e si scrivono nello STESSO formato di FotMob (`p`: id FotMob -> {chiave: valore}),
cosi' l'app (statsFromMatches, classifiche, schede giocatore) le usa senza modifiche. Si completano solo le partite finite senza `p`.
Abbinamento: lega per paese + nome, partita per data + nomi squadre, giocatore per nome dentro la formazione FotMob della partita.
Scrive anche pitch_giocatori.json (cosa e' stato completato e cosa no)."""
import json, os, re, sys, time, gzip, unicodedata, urllib.parse
from difflib import SequenceMatcher
from datetime import datetime
from update_data import api, PAUSE, KEY

MAX_MIN = float(os.environ.get("MAX_MIN", "40"))
MAX_MATCH = int(os.environ.get("MAX_MATCH", "1500"))
T0 = time.time()
REPORT = "pitch_giocatori.json"
SKIP = re.compile(r"women|femin|vrouwen|frauen|kvinner|\bu\d\d\b|youth|reserve", re.I)


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\b(fc|cf|sc|afc|ac|as|ssc|us|fk|sk|bk|if|ik|cd|ud|sv|vfb|vfl|1\.|club|de|the)\b", " ", s)
    return re.sub(r"[^a-z0-9 ]+", " ", s).split()


def same_team(a, b):
    na, nb = norm(a), norm(b)
    if not na or not nb:
        return False
    ja, jb = " ".join(na), " ".join(nb)
    if ja == jb or ja in jb or jb in ja:
        return True
    return SequenceMatcher(None, ja, jb).ratio() >= 0.8


def season_pitch(sk):
    m = re.fullmatch(r"(\d{4})-(\d{4})", sk or "")
    if m:
        return f"{m.group(1)}/{m.group(2)}"
    return sk if re.fullmatch(r"\d{4}", sk or "") else None


def parse_ts(s):
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00")).timestamp()
    except Exception:
        return None


def compact(stats):
    d = {}
    for grp in stats or []:
        for name, it in (grp.get("stats") or {}).items():
            if not isinstance(it, dict):
                continue
            s = it.get("stat") or {}
            v = s.get("value")
            if isinstance(v, bool) or not isinstance(v, (int, float)) or v == 0:
                continue
            k = it.get("key") or name
            if k not in d:
                d[k] = v
            t = s.get("total")
            if isinstance(t, (int, float)) and not isinstance(t, bool) and t and (k + "_t") not in d:
                d[k + "_t"] = t
    return d


def lineup_index(side):
    """nome normalizzato -> id FotMob, per una squadra di una partita FotMob."""
    out = {}
    for r in (side.get("st") or []) + (side.get("sb") or []):
        if r and r[0] is not None:
            out[" ".join(norm(r[1]))] = str(r[0])
    return out


def find_player(name, idx):
    toks = norm(name)
    key = " ".join(toks)
    if key in idx:
        return idx[key]
    ts = set(toks)
    cand = [v for k, v in idx.items() if ts and (ts <= set(k.split()) or set(k.split()) <= ts)]
    if len(cand) == 1:
        return cand[0]
    if toks:
        last = [v for k, v in idx.items() if k.split() and k.split()[-1] == toks[-1]]
        if len(last) == 1:
            return last[0]
    return None


def load_gz(p):
    with gzip.open(p, "rt", encoding="utf-8") as f:
        return json.load(f)


def dump_gz(p, o):
    with gzip.open(p, "wt", encoding="utf-8", compresslevel=9) as f:
        json.dump(o, f, ensure_ascii=False, separators=(",", ":"))


def main():
    if not KEY:
        sys.exit("Manca PITCHAPI_KEY")
    idx = json.load(open("arch/index.json"))
    leagues = [l for l in (api("/v1/leagues") or {}).get("leagues", []) if not SKIP.search(l.get("name", ""))]
    rep = {"competizioni": {}, "senza_lega_pitch": []}
    done_m = 0
    for fm, e in sorted(idx.items(), key=lambda kv: (0 if str(kv[0]) in TOP else 1, kv[0])):
        if (time.time() - T0) / 60 > MAX_MIN or done_m >= MAX_MATCH:
            break
        if SKIP.search(e.get("n", "")):
            continue
        sks = sorted(e.get("s") or [], reverse=True)[:2]  # stagione in corso e precedente
        for sk in sks:
            path = f"partite/{fm}/{sk}.json.gz"
            if not os.path.exists(path):
                continue
            ps = season_pitch(sk)
            if not ps:
                continue
            try:
                d = load_gz(path)
                arch = json.load(open(f"arch/{fm}/{sk}.json"))
            except Exception:
                continue
            todo = {}
            fix = {str(r[0]): r for r in (arch.get("fix") or [])}
            for mid, m in (d.get("m") or {}).items():
                if m.get("p") or not m.get("h") or not m.get("a") or mid not in fix:
                    continue
                r = fix[mid]
                if not r[5]:
                    continue  # senza risultato = non finita
                todo[mid] = r
            if not todo:
                continue
            cc = e.get("c")
            cand = [l for l in leagues if (cc == "INT" or l.get("country_code") == cc) and ps in (l.get("seasons") or [])
                    and norm(l.get("name")) == norm(e.get("n"))]
            lab = f"{e.get('n')} ({cc}) {sk}"
            if len(cand) != 1:
                rep["senza_lega_pitch"].append([fm, lab, len(todo), len(cand)])
                continue
            lg = cand[0]
            try:
                pms = (api(f"/v1/leagues/{lg['id']}/matches?season={urllib.parse.quote(ps, safe='')}") or {}).get("matches", [])
            except Exception as ex:
                print("errore lega", lab, str(ex)[:100]); continue
            pms = [x for x in pms if x.get("status") == "finished"]
            teams = arch.get("teams") or {}
            n_ok = n_pl = n_miss = 0
            for mid, r in todo.items():
                if (time.time() - T0) / 60 > MAX_MIN or done_m >= MAX_MATCH:
                    break
                hn, an, ts = teams.get(str(r[2])) or teams.get(r[2]), teams.get(str(r[3])) or teams.get(r[3]), parse_ts(r[4])
                pm = next((x for x in pms if ts and abs((parse_ts(x.get("time_utc")) or 0) - ts) < 36 * 3600
                           and same_team(hn, (x.get("home_team") or {}).get("name")) and same_team(an, (x.get("away_team") or {}).get("name"))), None)
                if not pm:
                    n_miss += 1
                    continue
                try:
                    res = api(f"/v1/matches/{pm['id']}/players")
                except Exception as ex:
                    print("  errore", pm["id"], str(ex)[:80]); continue
                time.sleep(PAUSE)
                done_m += 1
                lst = res.get("players") if isinstance(res, dict) else res
                m = d["m"][mid]
                hidx, aidx = lineup_index(m["h"]), lineup_index(m["a"])
                htid = (pm.get("home_team") or {}).get("id")
                out = {}
                for x in lst or []:
                    pl = x.get("player") or {}
                    nm = pl.get("name") if isinstance(pl, dict) else pl
                    side_idx = hidx if x.get("team_id") == htid else aidx
                    fid = find_player(nm, side_idx) or find_player(nm, aidx if side_idx is hidx else hidx)
                    stt = compact(x.get("stats"))
                    if fid and stt:
                        out[fid] = stt
                if out:
                    m["p"] = out
                    m["px"] = "pitchapi"
                    n_ok += 1
                    n_pl += len(out)
                else:
                    n_miss += 1
            if n_ok:
                dump_gz(path, d)
            rep["competizioni"][lab] = {"lega_pitch": lg.get("name"), "partite_completate": n_ok, "giocatori": n_pl, "senza_abbinamento": n_miss, "da_fare": len(todo)}
            print(lab, rep["competizioni"][lab])
    rep["partite_completate_in_questo_giro"] = done_m
    json.dump(rep, open(REPORT, "w"), ensure_ascii=False, indent=1)


# competizioni piu' importanti prima
TOP = {str(x) for x in (47, 87, 55, 54, 53, 57, 61, 48, 86, 146, 71, 40, 64, 268, 112, 130, 230, 38, 59, 135, 42, 73, 10216, 108, 132, 138, 133, 141)}

if __name__ == "__main__":
    main()
