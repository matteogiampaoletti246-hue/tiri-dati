#!/usr/bin/env python3
"""Affidabilita' per i campionati aggiunti (Eredivisie, Pro League, Superligaen, Super League 1, Liga Portugal, Super Lig).

Legge l'archivio FotMob della stagione in corso (arch/<fm>/<stagione>.json e partite/<fm>/<stagione>.json.gz) e scrive
calc_extra.json con la stessa forma dei dati dei top campionati:
  leagues: medie tiri (totali e in porta, fatti e subiti) di TUTTE le squadre, come data.json
  upd:     per i giocatori gia' presenti in giocatori.json (id p_...): presenze, tiri, tiri in porta e minuti di campionato,
           ultime 5 partite e ultime 5 da 50+ minuti (giocatori.json ne ha solo 1-2 per questi campionati)
  players: giocatori che giocatori.json non ha (id d'archivio fm~<lega>~<stagione>~<id FotMob>), stessa forma di giocatori.json
  fix:     prossime partite delle squadre che giocatori.json non ha: [data (Roma), avversario, 1 se in casa, campionato]
L'app unisce questo file a data.json e giocatori.json (data/load.js). Nomi squadra: se la squadra c'e' gia' nei dati
API-Football si usa quel nome, cosi' non nascono squadre doppie. Mai dati inventati: solo partite finite con statistiche,
tiri dei giocatori letti dalla stessa partita."""
import gzip, json, os, re, unicodedata
from datetime import datetime
from zoneinfo import ZoneInfo

ROME = ZoneInfo("Europe/Rome")
# fm FotMob -> (chiave del Calcolatore, nome, moltiplicatore campionati minori come update_data.handicap)
LEGHE = {
    57: ("eredivisie", "Eredivisie", 0.85),
    40: ("pro-league", "Pro League", 0.85),
    46: ("fm-46", "Superliga", 0.75),
    135: ("gre-super-league-1", "Super League", 0.80),
    61: ("liga-portugal", "Liga Portugal", 0.85),
    71: ("super-lig", "Super Lig", 0.80),
}
OUT = "calc_extra.json"
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


def main():
    idx = json.load(open("arch/index.json"))
    by = universe()
    taken = set()
    out = {"leagues": {}, "players": [], "upd": [], "fix": {}}
    OLD = {}
    try:
        for p in json.load(open("giocatori.json")).get("players", []):
            OLD.setdefault(p["t"], []).append(p)
    except Exception:
        pass
    old_fix = {}
    try:
        old_fix = json.load(open("giocatori.json")).get("fix") or {}
    except Exception:
        pass
    used = set()

    def find_old(team, name):
        """Giocatore gia' nei dati API-Football: stesso nome, altrimenti stesso cognome e stessa iniziale (uno solo)."""
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
    for fm, (key, label, handi) in LEGHE.items():
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
            tname[str(tid)] = same_name(n, by, taken)
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
            old = find_old(tn, p["n"])
            if old:
                out["upd"].append({"i": old["i"], "l": tot, "r": last, "h": hit})
                n_upd += 1
            else:
                out["players"].append({"i": f"fm~{fm}~{sk}~{pid}", "n": p["n"], "t": tn, "fm": int(pid), "lg": key, "l": tot, "r": last, "h": hit})
                n_new += 1
        nxt = {}
        for r in cal.get("fix") or []:
            hid, aid, utc, started, canc = str(r[2]), str(r[3]), r[4], r[6], r[8]
            if started or canc or hid not in tname or aid not in tname or rome_day(utc) < today:
                continue
            d = rome_day(utc)
            nxt.setdefault(tname[hid], []).append((utc, [d, tname[aid], 1, key]))
            nxt.setdefault(tname[aid], []).append((utc, [d, tname[hid], 0, key]))
        for tn, lst in nxt.items():
            if tn in old_fix:     # squadre che giocatori.json ha gia': le sue partite (anche di coppa) restano quelle
                continue
            lst.sort(key=lambda x: x[0])
            out["fix"][tn] = [x[1] for x in lst[:NEXT_FIX]]
        ren = sorted({(cal["teams"][k], v) for k, v in tname.items() if cal["teams"][k] != v})
        print(f"{label}: {sk}, {n_fin} partite, {len(teams)} squadre, {n_upd} giocatori aggiornati, {n_new} nuovi")
        if ren:
            print("   nomi unificati:", ", ".join(f"{a} -> {b}" for a, b in ren))
    json.dump(out, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print("scritto", OUT, round(os.path.getsize(OUT) / 1024), "KB")


if __name__ == "__main__":
    main()
