#!/usr/bin/env python3
"""Gerarchia dati dei giocatori, livello 5 (16/11/2026): diretta.it per le partite FINITE degli ultimi 7 giorni dove ne' FotMob ne' PitchAPI ne' LiveScore
hanno dato le statistiche dei singoli (`p` assente nel file partite e nel KV). Da diretta.it: formazioni (GraphQL `dlie2`) + eventi (`df_sui_1_<id>`) ->
presenze, minuti, gol, assist, gialli, rossi. Niente tiri o passaggi: diretta.it non li da' per giocatore nei feed pubblici verificati. Niente dati inventati.
Il feed dell'elenco partite di diretta.it copre solo pochi giorni: per questo lo script gira ogni 3 ore sulle partite recenti.
Formato uguale a FotMob (`p`, `px: diretta`, `pn` se FotMob non ha le formazioni). Dati di terzi: SOLO su Cloudflare KV (`kvstats`), mai nel repository.
Abbinamento: partita per orario del fischio + nomi squadre (stessa regola del worker, `worker/diretta.js`), giocatore per nome dentro le formazioni/rose FotMob.
Referto (solo conteggi): diretta_giocatori.json. Uso: python giocatori_diretta.py"""
import json, os, re, sys, time, unicodedata, urllib.request
from datetime import datetime, timezone, timedelta
from difflib import SequenceMatcher
import kvstats
from giocatori_pitch import parse_ts, lineup_index, find_player, team_index, load_gz, SKIP

MAX_MIN = float(os.environ.get("MAX_MIN", "40"))
DAYS = int(os.environ.get("DAYS", "7"))
T0 = time.time()
REPORT, STATE = "diretta_giocatori.json", "diretta_stato.json"
FEED = "https://www.diretta.it/x/feed/"
GQL = "https://400.ds.lsapp.eu/pq_graphql?projectId=400&_hash="
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1"
FEED_H = {"x-fsign": "SW9D1eZo", "User-Agent": UA, "Accept": "*/*", "Referer": "https://www.diretta.it/", "Origin": "https://www.diretta.it"}
GQL_H = {"User-Agent": UA, "Accept": "application/json,*/*", "Referer": "https://www.diretta.it/", "Origin": "https://www.diretta.it"}

# ---- nomi squadre: stessa normalizzazione del worker (paesi in italiano letti da worker/diretta.js, una sola fonte)
COUNTRY = dict(re.findall(r'"([a-z ]+)": "([a-z ]+)"', open("worker/diretta.js", encoding="utf-8").read().split("const COUNTRY = {", 1)[1].split("};", 1)[0]))
CLUB = [(r"\bmunich\b", "monaco"), (r"\b(cologne|koln)\b", "colonia"), (r"\bmarseille\b", "marsiglia"), (r"\bseville\b", "siviglia"), (r"\blisbon\b", "lisbona"),
        (r"\bturin\b", "torino"), (r"\bnuremberg\b", "norimberga"), (r"\bstuttgart\b", "stoccarda"), (r"\bunited\b", "utd"), (r"\batletico\b", "atl"),
        (r"\bathletic club\b", "athletic bilbao"), (r"\bparis saint germain\b", "psg"), (r"\bparis sg\b", "psg")]
NOISE = {"fc", "cf", "afc", "sc", "ac", "sv", "fk", "sk", "bk", "if", "ik", "ssc", "us", "ss", "cd", "ud", "rc", "vfl", "vfb", "tsg", "bsc", "1", "de", "the"}


def tnorm(s):
    s = str(s or "").replace("ø", "o").replace("Ø", "o").replace("æ", "ae").replace("ß", "ss").replace("đ", "d").replace("ð", "d").replace("ł", "l").replace("ı", "i")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def canon(name):
    s = tnorm(name)
    s = re.sub(r"\b(women|woman|w|ladies|femminile|fem)$", "d", s)
    whole = re.sub(r" (u ?\d\d)$", "", s)
    if whole in COUNTRY:
        s = COUNTRY[whole] + s[len(whole):]
    for a, b in CLUB:
        s = re.sub(a, b, s)
    return " ".join(t for t in s.split() if t and t not in NOISE)


def sim(a, b):
    x, y = canon(a), canon(b)
    if not x or not y:
        return 0
    if x == y:
        return 1
    X, Y = set(x.split()), set(y.split())
    sm, lg = (X, Y) if len(X) <= len(Y) else (Y, X)
    if sm <= lg and len("".join(sm)) >= 4:
        return 0.9
    return SequenceMatcher(None, x, y).ratio()


def get(url, headers, js=False):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=25)
        b = r.read().decode("utf-8", "replace")
        return json.loads(b) if js else b
    except Exception:
        return None


# ---- elenco partite del giorno (fuso italiano): {timestamp fischio: [segmenti]}
def rome_off(ts):   # ore di differenza Roma-UTC in quel momento (ultima domenica di marzo/ottobre)
    d = datetime.fromtimestamp(ts, timezone.utc)
    def last_sun(y, m):
        x = datetime(y, m + 1, 1, tzinfo=timezone.utc) - timedelta(days=1) if m < 12 else datetime(y, 12, 31, tzinfo=timezone.utc)
        return x - timedelta(days=(x.weekday() + 1) % 7)
    a = last_sun(d.year, 3).replace(hour=1); b = last_sun(d.year, 10).replace(hour=1)
    return 2 if a <= d < b else 1


DAYFEED = {}
def day_segments(ts):
    now = time.time()
    k_day = datetime.fromtimestamp(ts + rome_off(ts) * 3600, timezone.utc).date()
    n_day = datetime.fromtimestamp(now + rome_off(now) * 3600, timezone.utc).date()
    off = (k_day - n_day).days
    if abs(off) > DAYS:
        return None
    key = (off, rome_off(ts))
    if key not in DAYFEED:
        txt = get(FEED + f"f_1_{off}_{key[1]}_it_1", FEED_H) or ""
        segs = {}
        for chunk in txt.split("~AA÷")[1:]:
            seg = "AA÷" + chunk.split("~")[0]
            f = dict(kv.split("÷", 1) for kv in seg.split("¬") if "÷" in kv)
            try:
                segs.setdefault(int(f.get("AD") or 0), []).append(f)
            except ValueError:
                pass
        DAYFEED[key] = segs
        time.sleep(0.3)
    return DAYFEED[key]


def find_mid(ts, hn, an):
    segs = day_segments(ts)
    if not segs:
        return None
    for dt in (0, -300, 300, -900, 900, -1800, 1800, -3600, 3600):
        cands = segs.get(int(ts) + dt) or []
        if not cands:
            continue
        sc = sorted(((sim(hn, c.get("CX") or c.get("AE")), sim(an, c.get("AF")), c) for c in cands), key=lambda x: -(x[0] + x[1]))
        a, b, c = sc[0]
        if a < 0.4 or b < 0.4 or (a + b) / 2 < 0.55:
            return None
        if len(sc) > 1 and (a + b) / 2 - (sc[1][0] + sc[1][1]) / 2 < 0.08:
            return None
        return c if c.get("AB") == "3" else None   # solo partite finite
    return None


def swap(n):   # "Cognome N." -> "N. Cognome" (come FotMob)
    m = re.match(r"^(.+?)\s+((?:[A-Z][a-z]?\.\s?)+)$", str(n or "").strip())
    return (m.group(2).strip() + " " + m.group(1)).strip() if m else str(n or "").strip()


def minute(x):
    m = re.search(r"(\d+)", str(x or ""))
    return int(m.group(1)) if m else None


def build(mid):
    """-> {1: {nome: {...}}, 2: {...}} con titolari, entrati, minuti, gol, assist, gialli, rossi; None se mancano formazioni o eventi."""
    lj = get(GQL + "dlie2&eventId=" + mid, GQL_H, js=True)
    eps = (((lj or {}).get("data") or {}).get("findEventById") or {}).get("eventParticipants") or []
    P = {1: {}, 2: {}}
    for ep in eps:
        side = 1 if ((ep.get("type") or {}).get("side") == "HOME") else 2 if ((ep.get("type") or {}).get("side") == "AWAY") else 0
        L = ep.get("lineup") or {}
        if not side or not L.get("players") or not L.get("formation"):
            continue
        by = {p.get("id"): p for p in L["players"]}
        starters = [i for r in ((L["formation"].get("lines") or [{}])[0].get("rows") or []) for i in (r.get("playerIds") or [])]
        if len(starters) != 11:
            continue
        subs = [i for g in (L.get("groups") or []) if g.get("groupType") == "SUBSTITUTES" for i in (g.get("playerIds") or [])]
        for i in starters + subs:
            p = by.get(i)
            if p:
                P[side][swap(p.get("listName") or p.get("fieldName"))] = {"in": 0 if i in starters else None, "out": None, "g": 0, "a": 0, "y": 0, "r": 0}
    if not P[1] or not P[2]:
        return None
    txt = get(FEED + "df_sui_1_" + mid, FEED_H)
    if txt is None:
        return None
    end = 90
    for chunk in txt.split("~III÷")[1:]:
        body = "III÷" + chunk.split("~")[0]
        f, groups, cur = {}, [], None
        for kv in body.split("¬"):
            if "÷" not in kv:
                continue
            k, v = kv.split("÷", 1)
            if k == "IE":
                cur = {"IE": v}; groups.append(cur)
            elif cur is not None and k in ("IF", "IK"):
                cur[k] = v
            elif cur is None:
                f[k] = v
        side = 1 if f.get("IA") == "1" else 2 if f.get("IA") == "2" else 0
        t = minute(f.get("IB"))
        if not side or t is None or not groups:
            continue
        if t > 105 and "+" not in str(f.get("IB")):
            end = 120   # supplementari (il recupero non conta, come FotMob)
        def row(name):
            return P[side].get(swap(name)) if name else None
        text = groups[0].get("IK") or ""
        if re.search(r"sostituzione", text, re.I):
            inn = next((g for g in groups if re.search(r"entra", g.get("IK") or "", re.I)), None)
            out = next((g for g in groups if re.search(r"esce", g.get("IK") or "", re.I)), None)
            if inn and row(inn.get("IF")) is not None: row(inn.get("IF"))["in"] = t
            if out and row(out.get("IF")) is not None: row(out.get("IF"))["out"] = t
        elif re.search(r"^gol|rigore", text, re.I) and not re.search(r"autogol|sbagliat|annullat", text, re.I):
            r = row(groups[0].get("IF"))
            if r is not None: r["g"] += 1
            asg = next((g for g in groups[1:] if re.search(r"assist", g.get("IK") or "", re.I)), None)
            if asg and row(asg.get("IF")) is not None: row(asg.get("IF"))["a"] += 1
        elif re.search(r"cartellino", text, re.I):
            r = row(groups[0].get("IF"))
            if r is None:
                continue
            if re.search(r"rosso", text, re.I):
                r["r"] += 1
                r["out"] = t if r["out"] is None else min(r["out"], t)
            elif re.search(r"giallo", text, re.I):
                r["y"] += 1
    for side in (1, 2):
        for r in P[side].values():
            r["end"] = end
    return P


def main():
    if not kvstats.ON:
        sys.exit("Manca CLOUDFLARE_API_TOKEN: le statistiche di fonti terze vanno solo su KV")
    idx = json.load(open("arch/index.json"))
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    rep = {"competizioni": {}, "partite_completate": 0, "giocatori": 0, "senza_abbinamento": 0, "senza_formazioni_diretta": 0}
    lim = time.time() - DAYS * 86400
    for fm, e in idx.items():
        if SKIP.search(e.get("n", "")):
            continue
        for sk in sorted(e.get("s") or [], reverse=True)[:1]:   # partite recenti: solo la stagione in corso
            if (time.time() - T0) / 60 > MAX_MIN:
                break
            path = f"partite/{fm}/{sk}.json.gz"
            try:
                arch = json.load(open(f"arch/{fm}/{sk}.json"))
                d = load_gz(path) if os.path.exists(path) else {"m": {}}
            except Exception:
                continue
            rec = [r for r in arch.get("fix") or [] if r[5] and (parse_ts(r[4]) or 0) >= lim and not ((d.get("m") or {}).get(str(r[0])) or {}).get("p")]
            if not rec:
                continue
            kv = kvstats.load(fm, sk)
            stk = f"{fm}|{sk}"
            tried = set(state.get(stk) or [])
            todo = [r for r in rec if not (kv.get(str(r[0])) or {}).get("p") and str(r[0]) not in tried]
            if not todo:
                continue
            teams = arch.get("teams") or {}
            tidx = team_index(fm, sk, d, arch)
            n_ok = n_pl = 0
            for r in todo:
                if (time.time() - T0) / 60 > MAX_MIN:
                    break
                mid = str(r[0])
                ts = parse_ts(r[4])
                hn, an = teams.get(str(r[2])) or "", teams.get(str(r[3])) or ""
                seg = find_mid(ts, hn, an) if ts else None
                if not seg:
                    rep["senza_abbinamento"] += 1; tried.add(mid); continue
                P = build(seg["AA"])
                time.sleep(0.3)
                if not P:
                    rep["senza_formazioni_diretta"] += 1; tried.add(mid); continue
                m = d["m"].get(mid) or {}
                hidx = {**tidx.get(str(r[2]), {}), **lineup_index(m.get("h") or {})}
                aidx = {**tidx.get(str(r[3]), {}), **lineup_index(m.get("a") or {})}
                out, pn = {}, {}
                for side, sidx, tid in ((1, hidx, r[2]), (2, aidx, r[3])):
                    for name, x in P[side].items():
                        if x["in"] is None:
                            continue   # in panchina senza entrare
                        mins = (x["out"] if x["out"] is not None else x["end"]) - x["in"]
                        fid = find_player(name, sidx)
                        if not fid or mins <= 0:
                            continue
                        v = {"minutes_played": mins}
                        for k, kk in (("g", "goals"), ("a", "assists"), ("y", "yellow_cards"), ("r", "red_cards")):
                            if x[k]:
                                v[kk] = x[k]
                        out[fid] = v
                        pn[fid] = [name, "h" if side == 1 else "a", str(tid)]
                if out:
                    kv.setdefault(mid, {}).update({"p": out, "px": "diretta"})
                    if not m.get("h") or not m.get("a"):
                        kv[mid]["pn"] = pn
                    n_ok += 1; n_pl += len(out)
                tried.add(mid)
            state[stk] = sorted(tried)
            if n_ok and not kvstats.save([(fm, sk, kv)]):
                print("scrittura KV fallita", fm, sk); sys.exit(1)
            if n_ok or todo:
                rep["competizioni"][f"{e.get('n')} {sk}"] = {"partite_completate": n_ok, "giocatori": n_pl, "da_fare": len(todo)}
                rep["partite_completate"] += n_ok; rep["giocatori"] += n_pl
                print(e.get("n"), sk, rep["competizioni"][f"{e.get('n')} {sk}"])
    # lo stato tiene solo le partite recenti (le altre escono dalla finestra di diretta.it)
    json.dump(state, open(STATE, "w"), separators=(",", ":"))
    json.dump(rep, open(REPORT, "w"), ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in rep.items() if k != "competizioni"}))


if __name__ == "__main__":
    main()
