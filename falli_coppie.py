#!/usr/bin/env python3
"""Coppie di falli (chi ha commesso fallo e su chi) dalla cronaca ESPN, abbinate a partite e giocatori FotMob, con il ruolo
dell'app di ogni giocatore (dal modulo FotMob della partita). Scrive falli/<id FotMob campionato>/<stagione>.json.gz:
  { "<id partita FotMob>": {"p": [[id di chi commette, id di chi subisce], ...], "r": {"<id giocatore>": [ruolo, 0 casa | 1 ospite]}} }
Nel repository finiscono solo id e ruoli, mai il testo della cronaca.
Uso: python falli_coppie.py [chiave,chiave...]   (senza argomenti: top 5, coppe europee e coppe nazionali dei top 5)"""
import gzip, json, os, re, sys, time, unicodedata, urllib.request
from difflib import SequenceMatcher

ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/"
# chiave app -> (codice ESPN, id FotMob)
LEGHE = {"serie-a": ("ita.1", 55), "premier-league": ("eng.1", 47), "la-liga": ("esp.1", 87), "bundesliga": ("ger.1", 54),
         "ligue-1": ("fra.1", 53), "champions-league": ("uefa.champions", 42), "europa-league": ("uefa.europa", 73),
         "conference-league": ("uefa.europa.conf", 10216), "coppa-italia": ("ita.coppa_italia", 141), "dfb-pokal": ("ger.dfb_pokal", 209),
         "coupe-de-france": ("fra.coupe_de_france", 134), "efl-cup": ("eng.league_cup", 133),
         # Nations League (nazionali): stessa competizione ESPN per le quattro leghe, si abbina per data e nomi delle squadre
         "fm-9806": ("uefa.nations", 9806), "fm-9807": ("uefa.nations", 9807), "fm-9808": ("uefa.nations", 9808), "fm-9809": ("uefa.nations", 9809)}
PAUSA = float(os.environ.get("PAUSA", "0.15"))


def get(url, tent=3):
    for i in range(tent):
        try:
            rq = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept-Encoding": "gzip"})
            with urllib.request.urlopen(rq, timeout=40) as r:
                raw = r.read()
                if r.headers.get("Content-Encoding") == "gzip":
                    raw = gzip.decompress(raw)
                return json.loads(raw)
        except Exception:
            time.sleep(1 + i)
    return None


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9 ]+", " ", s).split()


def sim(a, b):
    ta, tb = norm(a), norm(b)
    if not ta or not tb:
        return 0.0
    if set(ta) & set(tb) and (set(ta) <= set(tb) or set(tb) <= set(ta)):
        return 1.0
    return SequenceMatcher(None, " ".join(ta), " ".join(tb)).ratio()


# ---------- ruoli dal modulo (regole dell'utente) ----------
# FotMob elenca i titolari dal portiere in avanti, reparto per reparto, da destra a sinistra.
# Ruoli app: TD TS DC DCD DCS CC CCD CCS ED ES AD AS CO ATT
def ruoli_modulo(modulo):
    """Lista dei ruoli dei 10 giocatori di movimento, nell'ordine dei titolari (dopo il portiere)."""
    try:
        righe = [int(x) for x in str(modulo).split("-")]
    except ValueError:
        return None
    if sum(righe) != 10 or len(righe) < 3:
        return None
    dif, att = righe[0], righe[-1]
    mezzo = righe[1:-1]
    out = []
    # difesa
    if dif == 4:
        out += ["TD", "DC", "DC", "TS"]
    elif dif == 3:
        out += ["DCD", "DC", "DCS"]
    elif dif == 5:
        out += ["ED", "DCD", "DC", "DCS", "ES"]  # esterni a tutta fascia = ED/ES
    elif dif == 2:
        out += ["DC", "DC"]
    else:
        return None
    # centrocampo e trequarti
    n = len(mezzo)
    ultimo_2_1 = n >= 1 and mezzo[-1] == 2 and att == 1  # moduli che finiscono con 2-1
    for i, k in enumerate(mezzo):
        ultima_linea = i == n - 1
        if ultima_linea and att > 0 and i >= 1 and k <= 3:
            # linea dietro l'attacco: 3 -> AD CO AS ; 2 e finale 2-1 -> AD AS ; altrimenti CO
            if k == 3:
                out += ["AD", "CO", "AS"]
            elif k == 2 and ultimo_2_1:
                out += ["AD", "AS"]
            else:
                out += ["CO"] * k
        elif ultima_linea and att > 0 and i >= 1 and k == 3:
            out += ["AD", "CO", "AS"]
        else:
            # linee di centrocampo vere e proprie
            if k == 5:
                out += ["ED", "CCD", "CC", "CCS", "ES"]
            elif k == 4:
                out += ["ED", "CC", "CC", "ES"]
            elif k == 3:
                out += ["CCD", "CC", "CCS"]
            else:
                out += ["CC"] * k
    # attacco
    if att == 3:
        out += ["AD", "ATT", "AS"]
    else:
        out += ["ATT"] * att
    return out if len(out) == 10 else None


def ruoli_partita(side, ev_sub):
    """id giocatore FotMob -> ruolo, per titolari e (tramite le sostituzioni) per chi entra."""
    r = {}
    st = side.get("st") or []
    sl = ruoli_modulo(side.get("f"))
    if sl and len(st) == 11:
        for p, ro in zip(st[1:], sl):
            r[str(p[0])] = ro
    for sw in ev_sub:  # [(entra, esce)] della stessa squadra, in ordine di minuto
        e, u = sw
        if str(u) in r and str(e) not in r:
            r[str(e)] = r[str(u)]
    return r


def sostituzioni(m, lato):
    out = []
    for e in m.get("e") or []:
        if e.get("type") == "Substitution" and bool(e.get("isHome")) == (lato == "h"):
            sw = e.get("swap") or []
            if len(sw) == 2:
                out.append((sw[0].get("id"), sw[1].get("id")))
    return out


# ---------- abbinamento giocatori ----------
def trova(nome, lista):
    """id FotMob del giocatore con quel nome nella lista [(id, nome)]."""
    tn = norm(nome)
    if not tn:
        return None
    best, bs = None, 0.0
    for pid, n in lista:
        tl = norm(n)
        if tl == tn:
            return str(pid)
        s = SequenceMatcher(None, " ".join(tn), " ".join(tl)).ratio()
        if tn[-1] == tl[-1]:
            s += 0.25
        if set(tn) <= set(tl) or set(tl) <= set(tn):
            s += 0.2
        if s > bs:
            best, bs = pid, s
    return str(best) if best is not None and bs >= 0.85 else None


def coppie_partita(summ, m):
    h, a = m["h"], m["a"]
    lista = {"h": [(p[0], p[1]) for k in ("st", "sb") for p in (h.get(k) or [])],
             "a": [(p[0], p[1]) for k in ("st", "sb") for p in (a.get(k) or [])]}
    ruoli = {"h": ruoli_partita(h, sostituzioni(m, "h")), "a": ruoli_partita(a, sostituzioni(m, "a"))}
    com = summ.get("commentary") or []
    out, mancati = [], 0
    visti = set()
    for ci, c in enumerate(com):
        t = c.get("text") or ""
        mt = re.match(r"Foul by (.+?) \((.+?)\)\.?$", t)
        if not mt:
            continue
        pl = c.get("play") or {}
        parts = [x.get("athlete", {}).get("displayName") for x in pl.get("participants") or []]
        if len(parts) < 2:
            # competizioni senza partecipanti nella cronaca (es. DFB-Pokal): chi subisce e' nella riga accanto "X (Squadra) wins a free kick"
            parts = []
            for nb in (ci + 1, ci - 1, ci + 2):
                if 0 <= nb < len(com):
                    mv = re.match(r"(.+?) \((.+?)\) wins a free kick", com[nb].get("text") or "")
                    if mv and norm(mv.group(2)) != norm(mt.group(2)):
                        parts = [mt.group(1), mv.group(1)]
                        break
            if len(parts) < 2:
                mancati += 1
                continue
        key = (c.get("sequence"), parts[0], parts[1], (c.get("time") or {}).get("value"))
        if key in visti:
            continue
        visti.add(key)
        fallo, subi = parts[0], parts[1]
        # lato di chi commette: squadra tra parentesi
        lato_f = "h" if sim(mt.group(2), h.get("name") or "") >= sim(mt.group(2), a.get("name") or "") else "a"
        idf = trova(fallo, lista[lato_f])
        ids = trova(subi, lista["a" if lato_f == "h" else "h"])
        if not idf or not ids:
            mancati += 1
            continue
        rf = ruoli["h" if lato_f == "h" else "a"].get(idf)
        rs = ruoli["a" if lato_f == "h" else "h"].get(ids)
        if not rf or not rs:
            mancati += 1
            continue
        out.append([int(idf), int(ids)])
    rmap = {pid: [ro, 0] for pid, ro in ruoli["h"].items()}
    rmap.update({pid: [ro, 1] for pid, ro in ruoli["a"].items()})
    return out, rmap, mancati


def main():
    chiavi = sys.argv[1].split(",") if len(sys.argv) > 1 else list(LEGHE)
    for k in chiavi:
        cod, fm = LEGHE[k]
        pdir = f"partite/{fm}"
        stag = sorted(f[:-8] for f in os.listdir(pdir) if f.endswith(".json.gz"))[-1]
        d = json.load(gzip.open(f"{pdir}/{stag}.json.gz"))["m"]
        fix = json.load(open(f"arch/{fm}/{stag}.json"))
        nomi = fix.get("teams") or {}
        quando = {r[0]: r[4] for r in fix.get("fix") or []}
        anni = sorted({stag[:4], stag[5:]})
        eventi = []
        for an in anni:
            sb = get(f"{ESPN}{cod}/scoreboard?dates={an}&limit=1000")
            eventi += (sb or {}).get("events") or []
        out_f = f"falli/{fm}/{stag}.json.gz"
        os.makedirs(os.path.dirname(out_f), exist_ok=True)
        try:
            ris = json.load(gzip.open(out_f))
        except Exception:
            ris = {}
        tot = tot_m = n_part = 0
        for mid, m in d.items():
            if not m or not m.get("h") or not m.get("a") or mid in ris:
                continue
            t0 = quando.get(mid, "")
            hn, an_ = nomi.get(str(m["h"]["id"]), ""), nomi.get(str(m["a"]["id"]), "")
            best, bs = None, 0.0
            for ev in eventi:
                if ev["status"]["type"]["state"] != "post" or ev["date"][:10] != t0[:10]:
                    continue
                cs = {c["homeAway"]: c["team"]["displayName"] for c in ev["competitions"][0]["competitors"]}
                s = sim(hn, cs.get("home")) + sim(an_, cs.get("away"))
                if s > bs:
                    best, bs = ev, s
            if not best or bs < 1.2:
                continue
            summ = get(f"{ESPN}{cod}/summary?event={best['id']}")
            time.sleep(PAUSA)
            if not summ:
                continue
            m["h"]["name"], m["a"]["name"] = hn, an_
            coppie, rmap, manc = coppie_partita(summ, m)
            ris[mid] = {"p": coppie, "r": rmap}
            tot += len(coppie); tot_m += manc; n_part += 1
        with gzip.open(out_f, "wt", encoding="utf-8") as fh:
            json.dump(ris, fh, separators=(",", ":"))
        print(f"{k}: {n_part} partite nuove, {tot} coppie, {tot_m} non abbinate, totale {len(ris)} partite", flush=True)


if __name__ == "__main__":
    main()
