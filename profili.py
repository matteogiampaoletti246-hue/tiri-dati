#!/usr/bin/env python3
"""Profili giocatore unici e partite per l'Hit Rate (nessuna chiave API: legge solo i file del repository; con CLOUDFLARE_API_TOKEN
usa anche le statistiche di fonti terze del KV, `kvstats.overlay`).

Per ogni giocatore di giocatori.json (PitchAPI, id p_...) e calc_extra.json:
1. id FotMob (`f`): squadra PitchAPI -> squadra FotMob (nome + date delle partite), poi giocatore per nome normalizzato (accenti,
   ordine delle parole, cognome unico) dentro la squadra, confermato dalle date e dai minuti; senza nome uguale, solo se date e minuti
   coincidono (firma delle presenze). Mai a caso: senza abbinamento sicuro resta senza `f`.
2. profili doppi uniti: due id PitchAPI con lo stesso id FotMob (PitchAPI ne ha dati due allo stesso giocatore) -> uno solo, l'altro in
   `al` (alias); giocatore d'archivio di calc_extra (fm~...) con lo stesso id FotMob di un p_ -> tolto, i suoi numeri vanno al p_.
3. statistiche complete della stagione in corso: partite PitchAPI + partite FotMob che PitchAPI non ha (stessa giornata = stessa
   partita). `l` = campionato nazionale, `c` = coppe europee, `r` = ultime 5 (tutte le competizioni).
4. Hit Rate (regola fissa): `h` = fino a 5 partite con ALMENO 50 minuti, dalla piu' recente, tutte le competizioni; se nella stagione in
   corso sono meno di 5 si completa con la stagione passata (sempre a ritroso). Righe [tiri, in porta, minuti, falli, falli subiti, giorno,
   competizione FotMob]; `hn` = partite usate, `hp` = di cui della stagione passata. `dl` = campionato nazionale FotMob della squadra.
Referti: report/profili_uniti.json (unioni con motivo) e report/profili_stato.json (conteggi, giocatori ancora sotto le 5 partite)."""
import glob, gzip, json, os, re, sys, unicodedata
from collections import defaultdict, Counter
from datetime import date, timedelta

MIN_HIT = 50
SEASON_START = os.environ.get("SEASON_START", "2026")   # come update_data.py: stagione 2026/2027 (e 2026 per i campionati ad anno solare)
EURO = {42, 73, 10216}
CUP_RX = re.compile(r"cup|pokal|copa|coppa|coupe|ta[cç]a|beker|kupa|puchar|trophy|shield|super ?cup|supercopa|supercoppa|troph|pokalen|kupok|cupa|kubok|league cup", re.I)
TOKS_OUT = {"fc", "cf", "ac", "sc", "afc", "sk", "fk", "nk", "gnk", "cd", "ud", "rc", "sl", "sv", "as", "ss", "club", "de", "calcio", "bk", "if",
            "ik", "aik", "kv", "krc", "rsc", "vfb", "vfl", "tsg", "1", "fsv", "ssc", "us", "ogc", "losc", "stade", "real", "atletico", "sporting",
            "cp", "sad", "hnk", "rnk", "pfc", "jk", "ks", "mks", "sfc", "bsc", "the", "and", "of", "1.", "a", "b"}
# nomi brevi di FotMob (Man City, PSG, Wolves...)
ALIAS = {"man": "manchester", "utd": "united", "psg": "paris saint germain", "wolves": "wolverhampton wanderers", "spurs": "tottenham hotspur",
         "inter": "internazionale", "bayern": "bayern munchen", "gladbach": "borussia monchengladbach", "brighton": "brighton hove albion",
         "nott": "nottingham", "forest": "forest", "leverkusen": "bayer leverkusen", "wisla": "wisla", "lok": "lokomotiva", "hamkam": "hamarkameratene"}
try:
    import kvstats
except Exception:
    kvstats = None


def nk(s):
    s = str(s or "").replace("ı", "i").replace("ø", "o").replace("ł", "l").replace("đ", "d").replace("ß", "ss").replace("æ", "ae")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return " ".join(re.sub(r"[^a-z0-9]+", " ", s).split())


def team_toks(s):
    t = set(" ".join(ALIAS.get(w, w) for w in nk(s).split()).split())
    core = t - TOKS_OUT
    return core or t


def load_json(p, default=None):
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def load_gz(p):
    try:
        with gzip.open(p, "rt", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def day(s):
    try:
        return date.fromisoformat(str(s)[:10])
    except Exception:
        return None


def near(d, days, tol=1):
    return d is not None and any(d + timedelta(k) in days for k in range(-tol, tol + 1))


IDX = load_json("arch/index.json", {})
CUR = {}       # fm -> stagione in corso (prima dell'indice)
PREV = {}      # fm -> stagione precedente
for k, v in IDX.items():
    s = v.get("s") or []
    if s:
        CUR[int(k)] = s[0]
        if len(s) > 1:
            PREV[int(k)] = s[1]
_ARCH, _PART = {}, {}
HIT_DATES = {}     # id -> [(giorno, competizione)] delle partite dell'Hit Rate (solo referto)
CLUB = set()


def arch(fm, sk):
    key = (fm, sk)
    if key not in _ARCH:
        _ARCH[key] = load_json(f"arch/{fm}/{sk.replace('/', '-')}.json")
    return _ARCH[key]


STATS = Counter()


def partite(fm, sk):
    key = (fm, sk)
    if key not in _PART:
        d = load_gz(f"partite/{fm}/{sk.replace('/', '-')}.json.gz")
        if d is not None and kvstats is not None and getattr(kvstats, "ON", False):
            try:
                kvstats.overlay(fm, sk, d)
            except Exception:
                pass
        _PART[key] = d
    return _PART[key]


def is_league(fm, sk):
    """campionato (con classifica) e non coppa: nome senza 'cup/pokal/coppa...' e calendario con classifica"""
    e = IDX.get(str(fm)) or {}
    if e.get("c") == "INT" or CUP_RX.search(e.get("n") or ""):
        return False
    a = arch(fm, sk)
    return bool(a and (a.get("table") or a.get("groups")))


def match_rows(fm, sk):
    """righe per giocatore di una competizione/stagione: fid -> [(giorno, fm, squadra, min, tiri, in porta, falli, subiti, ha_tiri, nome)]"""
    d = partite(fm, sk)
    a = arch(fm, sk) or {}
    if not d:
        return None, {}
    fx = {str(m[0]): m for m in a.get("fix") or []}
    out = defaultdict(list)
    tdays = defaultdict(set)
    for mid, m in (d.get("m") or {}).items():
        f = fx.get(mid)
        dd = day(f[4]) if f else None
        if dd is None:
            continue
        side = {}
        for sd in ("h", "a"):
            lu = m.get(sd) or {}
            tid = lu.get("id") or (f[2] if sd == "h" else f[3])
            if tid:
                tdays[str(tid)].add(dd)
            for x in (lu.get("st") or []) + (lu.get("sb") or []):
                if isinstance(x, list) and x and x[0] is not None:
                    side[str(x[0])] = (str(tid), x[1] if len(x) > 1 else "")
        for pid, v in (m.get("pn") or {}).items():
            if isinstance(v, list) and len(v) >= 3:
                side.setdefault(str(pid), (str(v[2]), v[0]))
        shots_ok = m.get("px") != "livescore"     # LiveScore non ha tiri
        for pid, v in (m.get("p") or {}).items():
            mins = v.get("minutes_played") or 0
            if mins <= 0:
                continue
            tid, nm = side.get(str(pid), ("", ""))
            out[str(pid)].append((dd, fm, tid, float(mins), float(v.get("total_shots") or 0), int(v.get("ShotsOnTarget") or 0),
                                  v.get("fouls", 0 if shots_ok else None), v.get("was_fouled", 0 if shots_ok else None), shots_ok, nm))
    return out, tdays


def main():
    G = load_json("giocatori.json")
    CACHE = load_json("cache_giocatori.json", {"m": {}, "p": {}, "t": {}})
    CX = load_json("calc_extra.json", {"players": [], "upd": []})
    if not G:
        sys.exit("giocatori.json mancante")
    players = G["players"]
    tnames = CACHE.get("t") or {}

    # --- partite PitchAPI per giocatore (stagione in corso) ---
    prow = defaultdict(list)       # p_id -> [(giorno, comp, tid, min, tiri, in porta)]
    pteam_days = defaultdict(set)  # squadra PitchAPI -> giorni
    for mid, r in (CACHE.get("m") or {}).items():
        dd = day(r.get("d"))
        if dd is None:
            continue
        for pid, tid, mins, tot, sot in r.get("p") or []:
            pteam_days[tid].add(dd)
            if mins and mins > 0:
                prow[pid].append((dd, r.get("comp"), tid, float(mins), float(tot or 0), int(sot or 0)))

    # --- archivio FotMob: stagione in corso di tutte le competizioni ---
    frows = defaultdict(list)      # fid -> righe stagione in corso
    fname = {}
    team_days = defaultdict(set)   # squadra FotMob -> giorni
    team_players = defaultdict(set)
    team_comp_n = defaultdict(Counter)   # squadra -> competizione -> partite (per il campionato nazionale)
    for fm, sk in CUR.items():
        if sk[:4] != SEASON_START:
            continue        # stagione gia' finita (es. Mondiale per club 2025): non e' la stagione in corso
        rows, tdays = match_rows(fm, sk)
        if rows is None:
            continue
        for t, ds in tdays.items():
            team_days[t] |= ds
            team_comp_n[t][fm] += len(ds)
        for pid, lst in rows.items():
            frows[pid].extend(lst)
            for x in lst:
                if x[2]:
                    team_players[x[2]].add(pid)
                if x[9]:
                    fname[pid] = x[9]
    # rose complete (rosa/<id%100>.json)
    rosa = {}
    for p in glob.glob("rosa/*.json"):
        for tid, v in (load_json(p, {}) or {}).items():
            if not isinstance(v, dict):
                continue
            rosa[str(tid)] = v.get("p") or []
            for r in rosa[str(tid)]:
                if r and isinstance(r[0], int) and r[0] > 0:
                    team_players[str(tid)].add(str(r[0]))
                    fname.setdefault(str(r[0]), r[1])
    # nomi squadre FotMob (indice squadre) solo per chi gioca nella stagione in corso; club = squadra con almeno un torneo nazionale
    # (le nazionali giocano solo competizioni internazionali): le partite con la nazionale non contano (regola: campionato e coppe del club)
    fteam_name = {}
    for p in glob.glob("tidx/*.json"):
        for tid, v in (load_json(p, {}) or {}).items():
            if any((IDX.get(str(c[0])) or {}).get("c") not in (None, "INT") for c in v[1:] if isinstance(c, list) and c):
                CLUB.add(str(tid))
            if str(tid) in team_days:
                fteam_name[str(tid)] = v[0]
    for pid in list(frows):
        frows[pid] = [x for x in frows[pid] if x[2] in CLUB]
    for fm, sk in CUR.items():
        a = _ARCH.get((fm, sk))
        if a:
            for tid, n in (a.get("teams") or {}).items():
                if str(tid) in team_days:
                    fteam_name.setdefault(str(tid), n)

    # --- 1a. squadre PitchAPI -> FotMob ---
    by_tok = defaultdict(set)
    for tid, n in fteam_name.items():
        for t in team_toks(n):
            by_tok[t].add(tid)
    tmap, tscore = {}, {}
    for ptid, pname in tnames.items():
        pt = team_toks(pname)
        pdays = pteam_days.get(ptid) or set()
        cands = set()
        for t in pt:
            cands |= by_tok.get(t, set())
        best = None
        exact = [c for c in cands if nk(fteam_name[c]) == nk(pname)]
        for c in cands:
            ft = team_toks(fteam_name[c])
            name = len(pt & ft) / max(1, len(pt | ft))
            if nk(fteam_name[c]) == nk(pname):
                name = 1.0
            fd = team_days.get(c) or set()
            ov = sum(1 for d in pdays if near(d, fd)) / len(pdays) if pdays else 0
            sc = name + 2 * ov
            if (name >= 0.5 or ov >= 0.8) and (best is None or sc > best[0]):
                best = (sc, c, name, ov)
        if best and (best[3] >= 0.6 or (best[2] >= 0.99 and len(exact) == 1)):
            tmap[ptid] = best[1]
            tscore[ptid] = best
        elif best:
            tscore[ptid] = ("scartata", fteam_name.get(best[1]), round(best[2], 2), round(best[3], 2))

    # --- 1b. giocatori PitchAPI -> FotMob ---
    def frows_of(fid):
        return frows.get(str(fid)) or []

    def date_check(pid, fid):
        pr = prow.get(pid) or []
        fr = frows_of(fid)
        if not pr or not fr:
            return None
        fdays = {x[0] for x in fr}
        ok = sum(1 for x in pr if near(x[0], fdays))
        return ok / len(pr)

    pteam_of = {}
    for p in players:
        cnt = Counter(x[2] for x in prow.get(p["i"], []))
        pteam_of[p["i"]] = cnt.most_common(1)[0][0] if cnt else next((k for k, v in tnames.items() if v == p["t"]), None)

    fmap, how = {}, {}
    for p in players:
        pid = p["i"]
        tids = {tmap.get(x[2]) for x in prow.get(pid, [])} | {tmap.get(pteam_of.get(pid))}
        tids.discard(None)
        pool = set()
        for t in tids:
            pool |= team_players.get(t, set())
        n = nk(p["n"])
        words = n.split()
        sw = " ".join(sorted(words))
        hit = [f for f in pool if nk(fname.get(f)) == n]
        why = "nome uguale"
        if not hit:
            hit = [f for f in pool if " ".join(sorted(nk(fname.get(f)).split())) == sw]
            why = "stesse parole del nome"
        if not hit and words:
            last = words[-1]
            hit = [f for f in pool if nk(fname.get(f)).split()[-1:] == [last] and nk(fname.get(f))[:1] == n[:1]] if len(last) > 2 else []
            why = "cognome e iniziale"
        if not hit and len(words) >= 1:
            ws = set(words)
            hit = [f for f in pool if (ws <= set(nk(fname.get(f)).split()) or set(nk(fname.get(f)).split()) <= ws) and len(nk(fname.get(f)).split()) >= 1 and len(ws & set(nk(fname.get(f)).split())) >= 1 and max(len(w) for w in ws & set(nk(fname.get(f)).split())) > 3]
            why = "nome contenuto"
        if len(hit) > 1:
            # piu' omonimi: decide la coincidenza di date
            sc = sorted(((date_check(pid, f) or 0, f) for f in hit), reverse=True)
            hit = [sc[0][1]] if sc[0][0] >= 0.6 and (len(sc) == 1 or sc[1][0] < sc[0][0]) else []
            why += " + date"
        if len(hit) == 1:
            dc = date_check(pid, hit[0])
            if dc is None or dc >= 0.5:
                fmap[pid] = hit[0]
                how[pid] = why + (f" + date {dc:.0%}" if dc is not None else " (rosa)")
                continue
        # firma delle presenze: stesse giornate e stessi minuti (+-2) in almeno 3 partite
        pr = prow.get(pid) or []
        if len(pr) >= 3:
            best = []
            for f in pool:
                fr = {x[0]: x[3] for x in frows_of(f)}
                if not fr:
                    continue
                same = 0
                for x in pr:
                    for k in (-1, 0, 1):
                        m = fr.get(x[0] + timedelta(k))
                        if m is not None and abs(m - x[3]) <= 2:
                            same += 1
                            break
                if same >= 3 and same / len(pr) >= 0.8:
                    best.append((same, f))
            best.sort(reverse=True)
            if best and (len(best) == 1 or best[1][0] < best[0][0]):
                fmap[pid] = best[0][1]
                how[pid] = f"date e minuti uguali in {best[0][0]}/{len(pr)} partite"

    # --- 2. doppi ---
    merges = []
    by_f = defaultdict(list)
    for p in players:
        if p["i"] in fmap:
            by_f[fmap[p["i"]]].append(p)
    alias = {}
    drop = set()
    for f, lst in by_f.items():
        if len(lst) < 2:
            continue
        lst.sort(key=lambda p: (-len(prow.get(p["i"], [])), p["i"]))
        keep = lst[0]
        for o in lst[1:]:
            alias[o["i"]] = keep["i"]
            drop.add(o["i"])
            prow[keep["i"]].extend(prow.get(o["i"], []))
        merges.append({"nome": keep["n"], "squadra": keep["t"], "id_uniti": [p["i"] for p in lst] + [f"fm:{f}"], "tenuto": keep["i"],
                       "motivo": "stesso id FotMob (" + "; ".join(how[p["i"]] for p in lst) + "): PitchAPI aveva due profili"})
    p_by_f = {fmap[p["i"]]: p for p in players if p["i"] in fmap and p["i"] not in drop}
    lite_drop = []
    for x in CX.get("players") or []:
        f = str(x.get("fm") or "")
        if f and f in p_by_f:
            lite_drop.append(x)
            merges.append({"nome": x["n"], "squadra": x["t"], "id_uniti": [p_by_f[f]["i"], x["i"]], "tenuto": p_by_f[f]["i"],
                           "motivo": "stesso id FotMob: profilo d'archivio (calc_extra) doppio di quello PitchAPI"})
    for p in players:
        if p["i"] in fmap and p["i"] not in drop:
            merges.append({"nome": p["n"], "squadra": p["t"], "id_uniti": [p["i"], f"fm:{fmap[p['i']]}"], "tenuto": p["i"],
                           "motivo": "profilo PitchAPI collegato al profilo FotMob (" + how[p["i"]] + ")", "tipo": "collegato"})

    # --- 3/4. statistiche complete e partite per l'Hit Rate ---
    def dom_league(fid, tid):
        cnt = Counter()
        for x in frows_of(fid):
            if is_league(x[1], CUR.get(x[1], "")):
                cnt[x[1]] += 1
        if not cnt and tid:
            for fm, n in team_comp_n.get(str(tid), {}).items():
                if is_league(fm, CUR.get(fm, "")):
                    cnt[fm] += n
        return cnt.most_common(1)[0][0] if cnt else None

    _prev_cache = {}

    def prev_rows(fid):
        """partite della stagione passata (tutte le competizioni dell'indice giocatori)"""
        rows = []
        miss = []
        sh = int(fid) % 100
        if sh not in _prev_cache:
            _prev_cache[sh] = load_json(f"pidx/{sh}.json", {}) or {}
        ent = _prev_cache[sh].get(str(fid)) or []
        for r in ent[1:]:
            fm, sk = int(r[0]), r[1]
            if PREV.get(fm) != sk or int(sk[:4]) < int(SEASON_START) - 1:
                continue
            if (fm, sk) not in _MR:
                _MR[(fm, sk)] = match_rows(fm, sk)[0]
            rr = _MR[(fm, sk)]
            if rr is None:
                miss.append(f"{fm}/{sk}")
                continue
            rows.extend(rr.get(str(fid), []))
        return rows, miss

    _MR = {}
    stato = Counter()
    sotto5 = []
    added = defaultdict(set)
    prev_missing = Counter()

    def cutoff(dl):
        """inizio della stagione in corso: 1 luglio per i campionati a cavallo d'anno, 1 gennaio per quelli ad anno solare"""
        sk = CUR.get(dl) or ""
        return date(int(SEASON_START), 1, 1) if sk[:4] == SEASON_START and not re.match(r"^\d{4}-\d{4}", sk) else date(int(SEASON_START), 7, 1)

    def build(pid, fid, base, ptid):
        pr = sorted(prow.get(pid, []), key=lambda x: x[0], reverse=True) if pid else []
        cur = []
        dl = dom_league(fid, tmap.get(ptid)) if fid else None
        cut = cutoff(dl)
        for x in pr:
            is_cup = x[1] in ("champions-league", "europa-league")
            cur.append({"d": x[0], "k": "c" if is_cup else "l", "min": x[3], "sh": x[4], "so": x[5], "fo": None, "fs": None, "fm": 42 if x[1] == "champions-league" else 73 if x[1] == "europa-league" else dl})
        if fid:
            fr = sorted((x for x in frows_of(fid) if x[0] >= cut), key=lambda x: x[0], reverse=True)
            for x in fr:
                # stessa giornata = stessa partita: dalla partita FotMob si prendono solo i falli
                same = next((c for c in cur if abs((c["d"] - x[0]).days) <= 1 and c["fo"] is None), None)
                if same:
                    same["fo"], same["fs"], same["fm"] = x[6], x[7], x[1]
                    continue
                if not x[8]:
                    continue        # partita senza tiri (solo LiveScore): non entra nei conteggi dei tiri
                k = "c" if x[1] in EURO else ("l" if x[1] == dl else "o")
                cur.append({"d": x[0], "k": k, "min": x[3], "sh": x[4], "so": x[5], "fo": x[6], "fs": x[7], "fm": x[1]})
                added[pid or fid].add((IDX.get(str(x[1]), {}).get("n") or str(x[1])))
        cur.sort(key=lambda c: c["d"], reverse=True)

        def agg(k):
            a = [0, 0.0, 0, 0.0]
            for c in cur:
                if c["k"] == k:
                    a[0] += 1; a[1] += c["sh"]; a[2] += c["so"]; a[3] += c["min"]
            return [round(a[0], 1), round(a[1], 1), round(a[2], 1), round(a[3], 1)]

        # righe compatte (giocatori.json si scarica all'avvio): giorno e competizione restano solo nel referto
        row = lambda c: [int(c["sh"]), int(c["so"]), int(round(c["min"])), c["fo"], c["fs"]]
        hit = [row(c) for c in cur if c["min"] >= MIN_HIT][:5]
        hit_d = [(c["d"].isoformat(), c["fm"]) for c in cur if c["min"] >= MIN_HIT][:5]
        hp = 0
        if len(hit) < 5 and fid:
            pv, miss = prev_rows(fid)
            # stagione passata = i 12 mesi prima dell'inizio di quella in corso (anche partite di competizioni ad anno solare)
            pv = [x for x in pv + [y for y in frows_of(fid) if y[0] < cut] if cut - timedelta(366) <= x[0] < cut]
            seen_d = set()
            pv = [x for x in sorted(pv, key=lambda x: x[0], reverse=True) if not (x[0], x[1]) in seen_d and not seen_d.add((x[0], x[1]))]
            for m in miss:
                prev_missing[m] += 1
            pv = sorted([x for x in pv if x[3] >= MIN_HIT and x[8] and x[2] in CLUB], key=lambda x: x[0], reverse=True)
            for x in pv:
                if len(hit) >= 5:
                    break
                hit.append([int(x[4]), int(x[5]), int(round(x[3])), x[6], x[7]])
                hit_d.append((x[0].isoformat(), x[1]))
                hp += 1
        out = dict(base)
        if cur:
            out["l"], out["c"] = agg("l"), agg("c")
            out["r"] = [[int(c["sh"]), int(c["so"]), int(round(c["min"]))] for c in cur[:5]]
        out["h"], out["hn"], out["hp"] = hit, len(hit), hp
        HIT_DATES[out.get("i")] = hit_d
        if fid:
            out["f"] = int(fid)
        if dl:
            out["dl"] = int(dl)
        stato["con_stagione_passata"] += 1 if hp else 0
        if len(hit) < 5:
            sotto5.append([out.get("n") or base.get("n"), out.get("t") or base.get("t"), len(hit)])
        return out

    new_players = []
    before_l = {}
    for p in players:
        if p["i"] in drop:
            continue
        before_l[p["i"]] = (p.get("l") or [0])[0] + (p.get("c") or [0])[0]
        q = build(p["i"], fmap.get(p["i"]), p, pteam_of.get(p["i"]))
        # i giocatori dei campionati aggiunti hanno l, r, h da calc_extra (upd): qui si riscrive solo se c'e' un id FotMob
        new_players.append(q)
    G["players"] = new_players
    if alias:
        G["al"] = alias
    G["hv"] = 2

    # calc_extra: aggiornamenti dei p_ (stessi calcoli, si riscrivono con quelli completi) e giocatori d'archivio non doppi
    byid = {p["i"]: p for p in new_players}
    for u in CX.get("upd") or []:
        q = byid.get(u["i"])
        if q:
            for k in ("l", "r", "h", "hn", "hp"):
                if k in q:
                    u[k] = q[k]
    lite_ids = {x["i"] for x in lite_drop}
    # stesso giocatore in due campionati aggiunti (trasferito: Moukoko FC Copenaghen -> Corum): resta il profilo della squadra con la
    # partita piu' recente, l'altro diventa un alias
    by_fm = defaultdict(list)
    for x in CX.get("players") or []:
        if x["i"] not in lite_ids:
            by_fm[str(x.get("fm"))].append(x)
    cx_alias = {}
    for f, lst in by_fm.items():
        if len(lst) < 2:
            continue
        last = lambda x: max((r[0] for r in frows_of(f) if str(r[1]) == str(x["i"]).split("~")[1]), default=date.min)
        lst.sort(key=last, reverse=True)
        for o in lst[1:]:
            lite_ids.add(o["i"])
            cx_alias[o["i"]] = lst[0]["i"]
        merges.append({"nome": lst[0]["n"], "squadra": lst[0]["t"], "id_uniti": [x["i"] for x in lst], "tenuto": lst[0]["i"],
                       "motivo": "stesso id FotMob in due campionati aggiunti (trasferimento): resta la squadra della partita piu' recente"})
    CX["al"] = cx_alias
    newx = []
    for x in CX.get("players") or []:
        if x["i"] in lite_ids:
            continue        # doppio: il profilo PitchAPI ha gia' tutte le partite (anche quelle FotMob)
        newx.append(build(None, str(x["fm"]), x, None))
    CX["players"] = newx

    after_l = {p["i"]: (p.get("l") or [0])[0] + (p.get("c") or [0])[0] for p in new_players}
    more = [i for i in after_l if after_l[i] > before_l.get(i, 0)]
    os.makedirs("report", exist_ok=True)
    real = [m for m in merges if m.get("tipo") != "collegato"]
    if "--calc" not in sys.argv:
      json.dump({"nota": "unioni di profili doppi (stesso giocatore con piu' id) e collegamenti PitchAPI -> FotMob",
                 "doppi_uniti": len(real), "collegati": len(merges) - len(real), "unioni": real,
                 "collegamenti": [m for m in merges if m.get("tipo") == "collegato"]},
                open("report/profili_uniti.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    n_f = sum(1 for p in new_players if p.get("f"))
    senza = [[p["n"], p["t"]] for p in new_players if not p.get("f")]
    hp_n = sum(1 for p in new_players + newx if p.get("hp"))
    stat = {"giocatori": len(new_players), "con_id_fotmob": n_f, "senza_id_fotmob": len(senza),
            "squadre_pitchapi": len(tnames), "squadre_abbinate": len(tmap),
            "squadre_non_abbinate": sorted([v, tscore.get(k)] for k, v in tnames.items() if k not in tmap),
            "doppi_uniti": len(real), "giocatori_con_partite_aggiunte": len(more),
            "competizioni_partite_aggiunte": Counter(c for s in added.values() for c in s).most_common(),
            "hit_rate_con_stagione_passata": hp_n, "hit_rate_sotto_5": len(sotto5),
            "hit_rate_0_partite": sum(1 for x in sotto5 if x[2] == 0),
            "stagione_passata_non_scaricata": prev_missing.most_common(40),
            "kv_terze_parti": bool(kvstats is not None and getattr(kvstats, "ON", False)),
            "esempi_sotto_5": sotto5[:60], "esempi_senza_id": senza[:80],
            # giorni e competizioni delle partite dell'Hit Rate di ogni giocatore (controllo dell'ordine e della stagione passata)
            "partite_hit_rate": {k: v for k, v in HIT_DATES.items() if k}}
    # --giocatori (update.yml): giocatori.json e referti; --calc (calc_extra.yml): solo calc_extra.json. Ogni workflow scrive solo i suoi file
    if "--calc" not in sys.argv:
        json.dump(stat, open("report/profili_stato.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        json.dump(G, open("giocatori.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    if "--giocatori" not in sys.argv:
        json.dump(CX, open("calc_extra.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(json.dumps({k: v for k, v in stat.items() if not k.startswith("esempi") and k != "squadre_non_abbinate"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
