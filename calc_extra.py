#!/usr/bin/env python3
"""Affidabilita' per i campionati aggiunti (Eredivisie, Pro League, Superligaen, Super League 1, Liga Portugal, Super Lig).

Legge l'archivio FotMob della stagione in corso (arch/<fm>/<stagione>.json e partite/<fm>/<stagione>.json.gz) e scrive
calc_extra.json con la stessa forma dei dati dei top campionati:
  leagues: medie tiri (totali e in porta, fatti e subiti) di TUTTE le squadre, come data.json
  upd:     per i giocatori gia' presenti in giocatori.json (id p_...): presenze, tiri, tiri in porta e minuti di campionato,
           ultime 5 partite e ultime 5 da 50+ minuti (giocatori.json ne ha solo 1-2 per questi campionati)
  players: giocatori che giocatori.json non ha (id d'archivio fm~<lega>~<stagione>~<id FotMob>), stessa forma di giocatori.json
  fix:     prossime partite delle squadre dei campionati aggiunti (calendario FotMob; le coppe restano quelle di giocatori.json): [data (Roma), avversario, 1 se in casa, campionato]
L'app unisce questo file a data.json e giocatori.json (data/load.js). Nomi squadra: se la squadra c'e' gia' nei dati
API-Football si usa quel nome, cosi' non nascono squadre doppie. Mai dati inventati: solo partite finite con statistiche,
tiri dei giocatori letti dalla stessa partita."""
import gzip, json, os, re, sys, unicodedata
from datetime import datetime
from zoneinfo import ZoneInfo
from femminili import NOT_TEAM, is_women_comp, women_name

ROME = ZoneInfo("Europe/Rome")
# fm FotMob -> (chiave del Calcolatore, nome, moltiplicatore campionati minori come update_data.handicap)
LEGHE = {
    57: ("eredivisie", "Eredivisie", 0.85),
    40: ("pro-league", "Pro League", 0.85),
    46: ("fm-46", "Superliga", 0.75),
    135: ("gre-super-league-1", "Super League", 0.80),
    61: ("liga-portugal", "Liga Portugal", 0.85),
    71: ("super-lig", "Super Lig", 0.80),
    # Nations League (nazionali): il giocatore ha gia' il suo profilo di club; le sue statistiche con la nazionale vanno in "nat" (mai in "upd"/"players",
    # altrimenti sostituirebbero quelle del club). Quinto valore True = nazionali.
    9806: ("fm-9806", "Nations League A", 1.0, True),
    9807: ("fm-9807", "Nations League B", 0.9, True),
    9808: ("fm-9808", "Nations League C", 0.8, True),
    9809: ("fm-9809", "Nations League D", 0.7, True),
}
TUTTE = "--tutte" in sys.argv   # tutte le altre competizioni di club con statistiche tiri -> calc_tutte.json (stessa forma di calc_extra.json)
OUT = "calc_tutte.json" if TUTTE else "calc_extra.json"
MIN_HIT = 50          # minuti minimi perche' una partita conti per l'hit rate (come update_giocatori.py)
NEXT_FIX = 6          # prossime partite per squadra
STOP = {"fc", "sc", "cf", "fk", "afc", "ac", "as", "sk", "bk", "kv", "sv", "vv", "ssc", "if", "bsc", "ca", "cd", "cs", "sl", "sd", "de", "da", "do", "the", "club", "kvc", "krc", "ksc", "rsc"}


def load(path):
    return json.load(gzip.open(path)) if path.endswith(".gz") else json.load(open(path))


def nk(s):
    s = str(s or "").translate(str.maketrans({"ð": "d", "Ð": "D", "þ": "th", "ø": "o", "Ø": "O", "æ": "ae", "Æ": "AE", "ł": "l", "Ł": "L", "ß": "ss", "đ": "d", "ı": "i"}))
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return " ".join(t for t in re.sub(r"[^a-z0-9]+", " ", s).split() if t not in STOP)


def universe():
    """Nomi squadra delle fonti API-Football (giocatori.json, data.json): un club si chiama come li' se c'e'."""
    names = set()
    try:
        g = json.load(open("giocatori.json"))
        names |= {p["t"] for p in g.get("players", [])}
        for t, lst in (g.get("fix") or {}).items():
            names.add(t)
            names |= {x[1] for x in lst}
    except Exception:
        pass
    try:
        for lg in (json.load(open("data.json")).get("leagues") or {}).values():
            names |= set((lg.get("teams") or {}).keys())
    except Exception:
        pass
    by = {}
    for n in names:
        by.setdefault(nk(n), set()).add(n)
    return by


def same_name(fm_name, by, taken):
    k = nk(fm_name)
    if not k:
        return fm_name
    if k in by:
        return sorted(by[k], key=lambda n: (n != fm_name, len(n)))[0]
    kt = set(k.split())
    cand = []
    for ku, ns in by.items():
        ut = set(ku.split())
        if not ut or abs(len(ut) - len(kt)) > 1:
            continue
        small, big = (kt, ut) if len(kt) <= len(ut) else (ut, kt)
        if small <= big and any(len(t) >= 4 for t in small):
            cand += list(ns)
    cand = [c for c in cand if c not in taken]
    return cand[0] if len(cand) == 1 else fm_name


def rome_day(utc):
    return datetime.fromisoformat(utc.replace("Z", "+00:00")).astimezone(ROME).strftime("%Y-%m-%d")


def r3(x):
    return round(x + 1e-9, 3)


# ---------------------------------------------------------------------------------------------------------------------------------
# Modalita' --tutte (calc_tutte.json): TUTTE le altre competizioni di club dell'archivio che hanno le statistiche tiri della stagione in corso
# (campionati di ogni paese, coppe nazionali e continentali). Stessa forma di calc_extra.json; non tocca le competizioni gia' coperte
# (top 5, campionati aggiunti, Champions ed Europa League, Nations League) ne' le competizioni tra nazionali (restano a parte).
# ---------------------------------------------------------------------------------------------------------------------------------
# id che l'app usa per i campionati con nome proprio (data/archive.js FM_ID); tutti gli altri sono fm-<id FotMob>
SLUG = {10216: "conference-league", 48: "championship", 86: "serie-b", 146: "bundesliga-2", 140: "laliga-2", 110: "ligue-2", 185: "liga-portugal-2",
        111: "eerste-divisie", 165: "turchia-1-lig", 268: "brasileirao", 112: "arg-liga-profesional", 130: "mls", 230: "liga-mx", 141: "coppa-italia",
        209: "dfb-pokal", 134: "coupe-de-france", 186: "taca-de-portugal", 133: "efl-cup", 149: "belgian-cup", 278: "austrian-cup", 180: "scottish-league-cup",
        9067: "copa-do-brasil", 64: "scottish-premiership", 38: "aut-bundesliga", 59: "nor-eliteserien"}
GIA_COPERTE = {47, 53, 54, 55, 87, 42, 73}   # top 5 + Champions + Europa League: data.json
# competizioni tra nazionali (Mondiale, qualificazioni, amichevoli, coppe continentali, Olimpiadi...): non sono qui, un giocatore ci appare piu' volte
NAZIONALI = {289, 10608, 9428, 298, 9821, 44, 10368, 10242, 329, 66, 114, 77, 10201, 10195, 9265, 9876, 9849, 11648}
CUP_RX = re.compile(r"cup|pokal|copa|coppa|coupe|ta[cç]a|beker|kupa|puchar|trophy|shield|super ?cup|supercopa|supercoppa|troph|pokalen|kupok|cupa|kubok|league cup", re.I)
UEFA = {"ENG", "ESP", "ITA", "GER", "FRA", "NED", "POR", "BEL", "TUR", "GRE", "DEN", "SCO", "AUT", "CRO", "CZE", "POL", "ISR", "NOR", "SVK", "SUI", "SWE",
        "BUL", "CYP", "HUN", "SRB", "ROU", "UKR", "FIN", "ISL", "IRL", "LVA", "RUS"}
PRIO = ["ENG", "ESP", "ITA", "GER", "FRA", "NED", "POR", "BEL", "TUR", "GRE", "DEN", "SCO"]
# handicap nelle coppe europee (come i campionati gia' presenti): top 5 nessuno; gli altri paesi UEFA il valore del loro campionato, 0,60 se non ce n'e' uno
HANDI = {"NED": 0.85, "POR": 0.85, "BEL": 0.85, "TUR": 0.80, "GRE": 0.80, "DEN": 0.75, "POL": 0.80, "NOR": 0.75, "CZE": 0.75, "AUT": 0.65, "CRO": 0.65, "SCO": 0.65, "ISR": 0.55, "SVK": 0.50}
NO_HANDI = {"ENG", "ESP", "ITA", "GER", "FRA"}
MIN_PARTITE_COMP = 6    # partite finite con statistiche per tenere una competizione
MIN_PARTITE_SQ = 3      # partite con statistiche per tenere una squadra (medie)


# nomi brevi di FotMob -> nome dell'app (data.json: API-Football) per le squadre dei top 5 e di Champions/Europa League: "Brighton" e "Brighton & Hove Albion"
# sono la stessa squadra anche quando compare in una coppa (Conference League, FA Cup, Coppa Italia...): si abbina per id FotMob, dentro la stessa competizione
ALIAS_T = {"man": "manchester", "utd": "united", "nottm": "nottingham", "psg": "paris saint germain", "wolves": "wolverhampton wanderers", "spurs": "tottenham hotspur"}
APP_COMPS = [(47, "premier-league"), (55, "serie-a"), (54, "bundesliga"), (87, "la-liga"), (53, "ligue-1"), (42, "champions-league"), (73, "europa-league")]


def _toks(s):
    t = nk(str(s or "").replace("M'gladbach", "Monchengladbach").replace("Mönchengladbach", "Monchengladbach")).split()
    return {w for x in t for w in ALIAS_T.get(x, x).split()}


def app_names_by_id(idx):
    """id FotMob squadra -> nome che l'app (data.json) usa per quella squadra."""
    try:
        d = json.load(open("data.json")).get("leagues") or {}
    except Exception:
        return {}
    out = {}
    for fm, key in APP_COMPS:
        e, L = idx.get(str(fm)), d.get(key)
        if not e or not L or not e.get("s"):
            continue
        p = f"arch/{fm}/{e['s'][0]}.json"
        if not os.path.exists(p):
            continue
        fmn = {str(k): v for k, v in (load(p).get("teams") or {}).items()}
        app = set(L.get("teams") or {})
        left = dict(fmn)
        for tid, n in list(left.items()):
            if n in app:
                out[tid] = n
                left.pop(tid)
        free = app - set(out.values())
        for tid, n in list(left.items()):
            a = _toks(n)
            hit = [x for x in free if a and (a <= _toks(x) or _toks(x) <= a)]
            if len(hit) == 1:
                out[tid] = hit[0]
                free.discard(hit[0])
    return out


def prio(c):
    return (PRIO.index(c) if c in PRIO else len(PRIO), c or "")


def main_tutte():
    idx = json.load(open("arch/index.json"))
    by = universe()
    skip = GIA_COPERTE | set(LEGHE) | NAZIONALI
    ex = {}
    try:
        ex = json.load(open("calc_extra.json"))
    except Exception:
        pass
    fixed = {}      # id FotMob squadra -> nome scelto da calc_extra (stesse squadre = stesso nome in tutta l'app)
    for L in (ex.get("leagues") or {}).values():
        for n, u in (L.get("logos") or {}).items():
            m = re.search(r"teamlogo/(\d+)\.png", u or "")
            if m:
                fixed[m.group(1)] = n
    for tid, n in app_names_by_id(idx).items():
        fixed.setdefault(tid, n)
    taken = set(fixed.values())
    # 1) elenco competizioni e paese di ogni squadra (serve ai nomi uguali di paesi diversi: "Liverpool" inglese e uruguaiano)
    cand = []
    tcountry, nkc = {}, {}
    for k, e in idx.items():
        fm = int(k)
        if fm in skip or e.get("skip") or not e.get("s"):
            continue
        sk = e["s"][0]
        cp, pp = f"arch/{fm}/{sk}.json", f"partite/{fm}/{sk}.json.gz"
        if not (os.path.exists(cp) and os.path.exists(pp)):
            continue
        cal = load(cp)
        nfin = sum(1 for r in cal.get("fix") or [] if r[7])
        if nfin < MIN_PARTITE_COMP:
            continue
        name, c = e.get("n") or str(fm), e.get("c") or ""
        women = is_women_comp(fm, name)
        cand.append({"fm": fm, "sk": sk, "name": name, "c": c, "cup": c == "INT" or bool(CUP_RX.search(name)), "n": nfin, "women": women, "teams": dict(cal.get("teams") or {})})
    # paese di ogni squadra: dai campionati (poi dalle coppe nazionali); le squadre solo di coppe continentali restano senza paese
    for d in sorted(cand, key=lambda d: (d["cup"], d["c"] == "INT")):
        for tid in d["teams"]:
            if d["c"] != "INT":
                tcountry.setdefault((str(tid), d["women"]), d["c"])
    for d in cand:
        for tid, tn in d["teams"].items():
            if NOT_TEAM.search(str(tn)):
                continue
            c = tcountry.get((str(tid), d["women"]))
            if c:
                nkc.setdefault(nk(women_name(tn) if d["women"] else tn), set()).add(c)
    # prima i campionati (domesticKey dell'app cerca il primo campionato che contiene la squadra), poi le coppe nazionali, poi le continentali
    cand.sort(key=lambda d: (d["cup"], d["c"] == "INT", prio(d["c"]), -d["n"], d["fm"]))
    owner = {k: min(v, key=prio) for k, v in nkc.items()}
    tmap = {}

    def tutte_name(tid, n, women, cup_c):
        key = (str(tid), women)
        if key in tmap:
            return tmap[key]
        base = women_name(n) if women else n
        c = tcountry.get(key) or ""
        k = nk(base)
        if str(tid) in fixed and not women:
            nm = fixed[str(tid)]
        elif len(nkc.get(k, ())) > 1 and c and c != owner.get(k):
            nm = f"{base} ({c})"
        elif c in UEFA and not women:
            nm = same_name(base, by, taken)
        else:
            nm = base
        taken.add(nm)
        tmap[key] = nm
        return nm

    OLD, BY_F = {}, {}
    old_fix = {}
    try:
        g = json.load(open("giocatori.json", encoding="utf-8"))
        for p in g.get("players", []):
            OLD.setdefault(p["t"], []).append(p)
            if p.get("f"):
                BY_F[str(p["f"])] = p
    except Exception:
        pass
    used = set()

    def find_old(team, name, fid=None):
        if fid is not None and str(fid) in BY_F and BY_F[str(fid)]["i"] not in used:
            used.add(BY_F[str(fid)]["i"])
            return BY_F[str(fid)]
        lst = [p for p in OLD.get(team, []) if p["i"] not in used]
        k = nk(name)
        hit = [p for p in lst if nk(p["n"]) == k]
        if not hit:
            tk = k.split()
            if len(tk) >= 2:
                hit = [p for p in lst if nk(p["n"]).split() and nk(p["n"]).split()[-1] == tk[-1] and nk(p["n"])[:1] == k[:1]]
        if len(hit) == 1:
            used.add(hit[0]["i"])
            return hit[0]
        return None

    today = datetime.now(ROME).strftime("%Y-%m-%d")
    out = {"leagues": {}, "players": [], "upd": [], "fix": {}, "nat": [], "order": []}
    deferred = []      # (ordine competizione, fm, sk, chiave, id giocatore, squadra, partite)
    nxt_all = {}
    for pos, d in enumerate(cand):
        fm, sk, women = d["fm"], d["sk"], d["women"]
        key = SLUG.get(fm) or f"fm-{fm}"
        cal, par = load(f"arch/{fm}/{sk}.json"), load(f"partite/{fm}/{sk}.json.gz").get("m", {})
        tname = {str(tid): tutte_name(tid, n, women, d["c"]) for tid, n in (cal.get("teams") or {}).items() if not NOT_TEAM.search(str(n))}
        T = {n: {"for": [], "ag": [], "sf": [], "sa": []} for n in tname.values()}
        rows, n_fin = {}, 0
        for r in cal.get("fix") or []:
            mid, hid, aid, utc, fin = str(r[0]), str(r[2]), str(r[3]), r[4], r[7]
            m = par.get(mid)
            if not fin or not m or hid not in tname or aid not in tname:
                continue
            s = m.get("s") or {}
            sh, so = s.get("total_shots"), s.get("ShotsOnTarget")
            if not (isinstance(sh, list) and isinstance(so, list) and len(sh) == 2 and len(so) == 2 and None not in sh and None not in so):
                continue
            n_fin += 1
            h, a = tname[hid], tname[aid]
            T[h]["for"].append(sh[0]); T[h]["ag"].append(sh[1]); T[h]["sf"].append(so[0]); T[h]["sa"].append(so[1])
            T[a]["for"].append(sh[1]); T[a]["ag"].append(sh[0]); T[a]["sf"].append(so[1]); T[a]["sa"].append(so[0])
            side = {}
            for sd, tid in (("h", hid), ("a", aid)):
                lu = m.get(sd) or {}
                for x in (lu.get("st") or []) + (lu.get("sb") or []):
                    if isinstance(x, list) and x and x[0] is not None:
                        side[str(x[0])] = (tid, x[1] if len(x) > 1 else "")
            for pid, v in (m.get("p") or {}).items():
                mins = v.get("minutes_played") or 0
                if mins <= 0 or str(pid) not in side:
                    continue
                tid, nm = side[str(pid)]
                p = rows.setdefault(str(pid), {"n": nm, "t": tid, "ms": []})
                p["ms"].append((utc, int(v.get("total_shots") or 0), int(v.get("ShotsOnTarget") or 0), int(round(mins))))
        if n_fin < MIN_PARTITE_COMP:
            print(f"{d['name']} ({d['c']}): solo {n_fin} partite con statistiche, salto")
            continue
        teams, logos = {}, {}
        fmid = {v: k for k, v in tname.items()}
        for n, t in T.items():
            g = len(t["for"])
            if g < MIN_PARTITE_SQ:
                continue
            teams[n] = {"games": g, "totalFor": r3(sum(t["for"]) / g), "totalAgainst": r3(sum(t["ag"]) / g), "sotFor": r3(sum(t["sf"]) / g), "sotAgainst": r3(sum(t["sa"]) / g)}
            logos[n] = f"https://images.fotmob.com/image_resources/logo/teamlogo/{fmid[n]}.png"
        if len(teams) < 2:
            print(f"{d['name']} ({d['c']}): meno di 2 squadre con {MIN_PARTITE_SQ} partite, salto")
            continue
        vals = list(teams.values())
        avg = {k: r3(sum(v[k] for v in vals) / len(vals)) for k in ("totalFor", "totalAgainst", "sotFor", "sotAgainst")}
        handi = None if (d["c"] in NO_HANDI or d["c"] not in UEFA or d["cup"]) else HANDI.get(d["c"], 0.60)
        out["leagues"][key] = {"label": d["name"], "name": d["name"], "handicap": handi, "league_avg": avg, "logos": logos, "matches": n_fin, "restricted": False,
                               "season": sk.replace("-", "/"), "size": len(teams), "teams": teams, "country": d["c"], "cup": d["cup"], "women": women}
        out["order"].append(key)
        for pid, p in rows.items():
            tn = tname[p["t"]]
            if tn in teams:
                deferred.append((pos, fm, sk, key, pid, tn, p))
        for r in cal.get("fix") or []:
            hid, aid, utc, started, canc = str(r[2]), str(r[3]), r[4], r[6], r[8]
            if started or canc or hid not in tname or aid not in tname or rome_day(utc) < today:
                continue
            dd = rome_day(utc)
            nxt_all.setdefault(tname[hid], []).append((utc, [dd, tname[aid], 1, key]))
            nxt_all.setdefault(tname[aid], []).append((utc, [dd, tname[hid], 0, key]))
        print(f"{d['name']} ({d['c']}) -> {key}: {n_fin} partite, {len(teams)} squadre")
    # un giocatore = un profilo: quello della prima competizione (campionato prima delle coppe) in cui ha giocato; profili.py ricalcola poi
    # campionato, coppe, ultime 5 e hit rate su tutte le sue competizioni
    # chi e' gia' in calc_extra.json (campionati aggiunti) resta li': stesso profilo, profili.py lo ricalcola su tutte le sue competizioni
    ex_fm = {str(x.get("fm")) for x in ex.get("players") or []} | {str(x.get("fm")) for x in ex.get("nat") or []}
    ex_upd = {u["i"] for u in ex.get("upd") or []}
    seen = set(ex_fm)
    n_new = n_upd = 0
    for pos, fm, sk, key, pid, tn, p in sorted(deferred, key=lambda x: x[0]):
        if pid in seen:
            continue
        seen.add(pid)
        ms = sorted(p["ms"], key=lambda x: x[0], reverse=True)
        tot = [len(ms), float(sum(x[1] for x in ms)), sum(x[2] for x in ms), float(sum(x[3] for x in ms))]
        last = [[x[1], x[2], x[3]] for x in ms[:5]]
        hit = [[x[1], x[2], x[3]] for x in [y for y in ms if y[3] >= MIN_HIT][:5]]
        old = find_old(tn, p["n"], pid)
        if old:
            if old["i"] in ex_upd:
                continue
            out["upd"].append({"i": old["i"], "l": tot, "r": last, "h": hit})
            n_upd += 1
        else:
            out["players"].append({"i": f"fm~{fm}~{sk}~{pid}", "n": p["n"], "t": tn, "fm": int(pid), "lg": key, "l": tot, "r": last, "h": hit})
            n_new += 1
    for tn, lst in nxt_all.items():
        lst.sort(key=lambda x: x[0])
        out["fix"][tn] = [x[1] for x in lst][:NEXT_FIX]
    json.dump(out, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"{len(out['leagues'])} competizioni, {len(out['players'])} giocatori nuovi, {n_upd} aggiornati, {len(out['fix'])} squadre con calendario; scritto {OUT} {round(os.path.getsize(OUT) / 1024)} KB")


def main():
    idx = json.load(open("arch/index.json"))
    by = universe()
    taken = set()
    out = {"leagues": {}, "players": [], "upd": [], "fix": {}, "nat": []}
    OLD = {}
    BY_F = {}       # id FotMob gia' collegato da profili.py: lo stesso giocatore non diventa un secondo profilo
    try:
        for p in json.load(open("giocatori.json", encoding="utf-8")).get("players", []):
            OLD.setdefault(p["t"], []).append(p)
            if p.get("f"):
                BY_F[str(p["f"])] = p
    except Exception:
        pass
    old_fix = {}
    try:
        old_fix = json.load(open("giocatori.json")).get("fix") or {}
    except Exception:
        pass
    used = set()

    def find_old(team, name, fid=None):
        """Giocatore gia' nei dati API-Football: stesso id FotMob, poi stesso nome, altrimenti stesso cognome e stessa iniziale (uno solo)."""
        if fid is not None and str(fid) in BY_F and BY_F[str(fid)]["i"] not in used:
            used.add(BY_F[str(fid)]["i"])
            return BY_F[str(fid)]
        lst = [p for p in OLD.get(team, []) if p["i"] not in used]
        k = nk(name)
        hit = [p for p in lst if nk(p["n"]) == k]
        if not hit:
            tk = k.split()
            if len(tk) >= 2:
                hit = [p for p in lst if nk(p["n"]).split() and nk(p["n"]).split()[-1] == tk[-1] and nk(p["n"])[:1] == k[:1]]
        if len(hit) == 1:
            used.add(hit[0]["i"])
            return hit[0]
        return None

    today = datetime.now(ROME).strftime("%Y-%m-%d")
    for fm, (key, label, handi, *_nat) in LEGHE.items():
        nat = bool(_nat and _nat[0])
        e = idx.get(str(fm))
        if not e or not e.get("s"):
            print(f"{label}: non nell'indice")
            continue
        sk = e["s"][0]
        cal_p, par_p = f"arch/{fm}/{sk}.json", f"partite/{fm}/{sk}.json.gz"
        if not (os.path.exists(cal_p) and os.path.exists(par_p)):
            print(f"{label}: file {sk} mancanti")
            continue
        cal, par = load(cal_p), load(par_p).get("m", {})
        tname = {}
        for tid, n in (cal.get("teams") or {}).items():
            # le nazionali tengono il nome di FotMob: mai unite a un club (Armenia non e' "Ararat Armenia")
            tname[str(tid)] = n if nat else same_name(n, by, taken)
            taken.add(tname[str(tid)])
        T = {n: {"for": [], "ag": [], "sf": [], "sa": []} for n in tname.values()}
        rows = {}
        n_fin = 0
        for r in cal.get("fix") or []:
            mid, hid, aid, utc, fin = str(r[0]), str(r[2]), str(r[3]), r[4], r[7]
            m = par.get(mid)
            if not fin or not m or hid not in tname or aid not in tname:
                continue
            s = m.get("s") or {}
            sh, so = s.get("total_shots"), s.get("ShotsOnTarget")
            if not (isinstance(sh, list) and isinstance(so, list) and len(sh) == 2 and len(so) == 2 and None not in sh and None not in so):
                continue
            n_fin += 1
            h, a = tname[hid], tname[aid]
            T[h]["for"].append(sh[0]); T[h]["ag"].append(sh[1]); T[h]["sf"].append(so[0]); T[h]["sa"].append(so[1])
            T[a]["for"].append(sh[1]); T[a]["ag"].append(sh[0]); T[a]["sf"].append(so[1]); T[a]["sa"].append(so[0])
            side = {}
            for sd, tid in (("h", hid), ("a", aid)):
                lu = m.get(sd) or {}
                for x in (lu.get("st") or []) + (lu.get("sb") or []):
                    if isinstance(x, list) and x and x[0] is not None:
                        side[str(x[0])] = (tid, x[1] if len(x) > 1 else "")
            for pid, v in (m.get("p") or {}).items():
                mins = v.get("minutes_played") or 0
                if mins <= 0 or str(pid) not in side:
                    continue
                tid, nm = side[str(pid)]
                p = rows.setdefault(str(pid), {"n": nm, "t": tid, "ms": []})
                p["ms"].append((utc, int(v.get("total_shots") or 0), int(v.get("ShotsOnTarget") or 0), int(round(mins))))
        teams, logos = {}, {}
        fmid = {v: k for k, v in tname.items()}
        for n, t in T.items():
            g = len(t["for"])
            if not g:
                continue
            teams[n] = {"games": g, "totalFor": r3(sum(t["for"]) / g), "totalAgainst": r3(sum(t["ag"]) / g), "sotFor": r3(sum(t["sf"]) / g), "sotAgainst": r3(sum(t["sa"]) / g)}
            logos[n] = f"https://images.fotmob.com/image_resources/logo/teamlogo/{fmid[n]}.png"
        if not teams:
            print(f"{label}: nessuna partita finita con statistiche")
            continue
        vals = list(teams.values())
        avg = {k: r3(sum(v[k] for v in vals) / len(vals)) for k in ("totalFor", "totalAgainst", "sotFor", "sotAgainst")}
        out["leagues"][key] = {"label": label, "name": label, "handicap": handi, "league_avg": avg, "logos": logos, "matches": n_fin, "restricted": False, "season": sk.replace("-", "/"), "size": len(teams), "teams": teams}
        n_new = n_upd = 0
        for pid, p in rows.items():
            tn = tname[p["t"]]
            ms = sorted(p["ms"], key=lambda x: x[0], reverse=True)
            tot = [len(ms), float(sum(x[1] for x in ms)), sum(x[2] for x in ms), float(sum(x[3] for x in ms))]
            last = [[x[1], x[2], x[3]] for x in ms[:5]]
            hit = [[x[1], x[2], x[3]] for x in [y for y in ms if y[3] >= MIN_HIT][:5]]
            old = None if nat else find_old(tn, p["n"], pid)
            if nat:
                out["nat"].append({"i": f"nat~{fm}~{sk}~{pid}", "n": p["n"], "t": tn, "fm": int(pid), "lg": key, "nat": 1, "l": tot, "r": last, "h": hit})
                n_new += 1
            elif old:
                out["upd"].append({"i": old["i"], "l": tot, "r": last, "h": hit})
                n_upd += 1
            else:
                out["players"].append({"i": f"fm~{fm}~{sk}~{pid}", "n": p["n"], "t": tn, "fm": int(pid), "lg": key, "l": tot, "r": last, "h": hit})
                n_new += 1
        if nat:
            # rose delle nazionali (rosa/<id%100>.json): chi non ha ancora minuti in Nations League e' comunque raggiungibile (ricerca, Calcolatore),
            # con le statistiche vuote; se ha un profilo di club il collegamento e' per id FotMob (app: players.js)
            have = {x["fm"] for x in out["nat"] if x["lg"] == key}
            for tid, tn in tname.items():
                try:
                    sh = json.load(open(f"rosa/{int(tid) % 100}.json"))
                except Exception:
                    continue
                for r in ((sh.get(str(tid)) or {}).get("p") or []):
                    if not r or r[0] is None or r[0] in have or not r[1] or (isinstance(r[0], int) and r[0] < 0):
                        continue
                    have.add(r[0])
                    out["nat"].append({"i": f"nat~{fm}~{sk}~{r[0]}", "n": r[1], "t": tn, "fm": int(r[0]), "lg": key, "nat": 1, "l": [0, 0.0, 0, 0.0], "r": [], "h": []})
        nxt = {}
        for r in cal.get("fix") or []:
            hid, aid, utc, started, canc = str(r[2]), str(r[3]), r[4], r[6], r[8]
            if started or canc or hid not in tname or aid not in tname or rome_day(utc) < today:
                continue
            d = rome_day(utc)
            nxt.setdefault(tname[hid], []).append((utc, [d, tname[aid], 1, key]))
            nxt.setdefault(tname[aid], []).append((utc, [d, tname[hid], 0, key]))
        for tn, lst in nxt.items():
            lst.sort(key=lambda x: x[0])
            mine = [x[1] for x in lst]
            # il calendario del campionato e' sempre quello di FotMob (le liste di giocatori.json per questi campionati erano
            # vecchie o sbagliate: Standard-Kortrijk non compariva); le partite di coppa di giocatori.json restano
            cups = [f for f in (old_fix.get(tn) or []) if f[3] != key and f[0] >= today]
            out["fix"][tn] = sorted(mine + cups, key=lambda f: f[0])[:NEXT_FIX]
        ren = sorted({(cal["teams"][k], v) for k, v in tname.items() if cal["teams"][k] != v})
        print(f"{label}: {sk}, {n_fin} partite, {len(teams)} squadre, {n_upd} giocatori aggiornati, {n_new} nuovi")
        if ren:
            print("   nomi unificati:", ", ".join(f"{a} -> {b}" for a, b in ren))
    nat_clubs(out)
    json.dump(out, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print("scritto", OUT, round(os.path.getsize(OUT) / 1024), "KB")


def nat_clubs(out):
    """Banner unico giocatore: ogni profilo della nazionale porta il suo club.
    - "cl": id del profilo di club quando questo non ha l'id FotMob (stesso nome, unico): l'app li unisce in un solo banner
    - "ct"/"cf": club attuale (nome, id FotMob squadra) dalle carriere car/ per chi non ha un profilo di club nel Calcolatore"""
    try:
        gioc = load("giocatori.json") or {}
    except Exception:
        gioc = {}
    clubs = (gioc.get("players") or []) + (out.get("players") or [])
    by_fm = {str(p.get("f") or p.get("fm")) for p in clubs if p.get("f") or p.get("fm")}
    by_name = {}
    for p in clubs:
        by_name.setdefault(nk(p["n"]), []).append(p)
    today = datetime.now(ROME).strftime("%Y-%m")
    shards = {}
    n_cl = n_ct = 0
    for x in out.get("nat") or []:
        for k in ("cl", "ct", "cf"):
            x.pop(k, None)
        if str(x["fm"]) in by_fm:
            continue
        same = [p for p in by_name.get(nk(x["n"]), []) if not (p.get("f") or p.get("fm"))]
        if len(same) == 1 and len(by_name.get(nk(x["n"]), [])) == 1:
            x["cl"] = same[0]["i"]
            n_cl += 1
            continue
        sh = x["fm"] % 100
        if sh not in shards:
            try:
                shards[sh] = json.load(open(f"car/{sh}.json"))
            except Exception:
                shards[sh] = {}
        car = ((shards[sh].get(str(x["fm"])) or {}).get("car")) or []
        cur = [r for r in car if r and r[1] and r[1][:7] <= today and (not r[2] or r[2][:7] >= today)]
        if cur:
            r = cur[0]
            x["ct"] = r[0]
            if r[-1]:
                x["cf"] = int(r[-1])
            n_ct += 1
    print(f"nazionali: {n_cl} uniti al club per nome, {n_ct} con il club dalle carriere")


if __name__ == "__main__":
    import sys
    if "--solo-club" in sys.argv:  # solo il club dei profili delle nazionali, sul file gia' scritto
        _o = json.load(open(OUT))
        nat_clubs(_o)
        json.dump(_o, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    elif TUTTE:
        main_tutte()
    else:
        main()
