#!/usr/bin/env python3
"""Nomi veri dei giocatori chiamati con un soprannome (es. "Pote" -> "Pedro Gonçalves") -> nomi.json.
FotMob da' solo il nome d'uso; il nome vero viene da Wikidata (CC0, nessuna chiave), mai inventato:
  1) candidati = giocatori con un nome di una sola parola (giocatori.json, calc_extra.json, poi tutte le rose rosa/), prima quelli dell'app;
  2) data di nascita e paese dalla scheda FotMob del giocatore;
  3) ricerca Wikidata del soprannome (etichette e alias, inglese poi portoghese/spagnolo/italiano): vale solo l'elemento con la STESSA
     data di nascita (giorno esatto) e una sola corrispondenza;
  4) nome = etichetta Wikidata se ha almeno due parole ed e' diversa dal soprannome (Pote -> "Pedro Gonçalves"); altrimenti
     primo nome (P735) + cognome (P734): il primo cognome per gli spagnoli e ispanici, l'ultimo per portoghesi e brasiliani (Pedri -> "Pedro González").
Senza corrispondenza sicura il giocatore resta col suo nome. nomi.json: {id FotMob: [nome vero o null, data controllo, Qid o null, soprannome]}.
Chi resta senza si riprova dopo RIPROVA_GIORNI. Date di nascita FotMob ricordate in nomi_nascite.json; Wikidata con una richiesta SPARQL
ogni 50 date (tutti i calciatori nati in quei giorni), il soprannome deve essere tra etichette e alias. Giro a tempo (NOMI_MIN, default 40)."""
import datetime as dt
import glob
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "nomi.json")
TODAY = dt.date.today().isoformat()
T0 = time.time()
MIN_RUN = float(os.environ.get("NOMI_MIN", "40"))
RIPROVA_GIORNI = 45
UA_FM = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json"}
UA_WD = {"User-Agent": "ScalperLabNomi/1.0 (app personale; github.com/matteogiampaoletti246-hue/tiri-dati)", "Accept": "application/json"}
WD = "https://www.wikidata.org/w/api.php"
LUSO = {"Brazil", "Portugal", "Angola", "Cape Verde", "Mozambique", "Guinea-Bissau", "São Tomé and Príncipe", "East Timor", "Brasil"}


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9 ]", "", s).strip()


def get(url, headers, tries=5):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=40) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (404, 400):
                return None
            ra = e.headers.get("Retry-After") if e.headers else None
            time.sleep(int(ra) if ra and ra.isdigit() else 3 + 5 * k)
        except Exception:
            time.sleep(2 + 3 * k)
    return None


def candidates():
    seen, out = set(), []

    def add(fid, name):
        try:
            fid = int(fid)
        except Exception:
            return
        name = str(name or "").strip()
        if fid <= 0 or not name or " " in name or fid in seen:
            return
        seen.add(fid)
        out.append((fid, name))

    for f in ("giocatori.json", "calc_extra.json"):
        try:
            d = json.load(open(os.path.join(ROOT, f)))
        except Exception:
            continue
        for p in d.get("players", []):
            add(p.get("f"), p.get("n"))
    for f in sorted(glob.glob(os.path.join(ROOT, "rosa", "[0-9]*.json"))):
        try:
            d = json.load(open(f))
        except Exception:
            continue
        for t in d.values():
            if isinstance(t, dict):
                for r in t.get("p") or []:
                    if isinstance(r, list) and len(r) > 1:
                        add(r[0], r[1])
    return out


def fotmob(fid):
    d = get(f"https://www.fotmob.com/api/data/playerData?id={fid}", UA_FM)
    if not d:
        return None, None
    b = None
    try:
        b = (d.get("birthDate") or {}).get("utcTime", "")[:10] or None
    except Exception:
        b = None
    country = None
    for it in d.get("playerInformation") or []:
        if str(it.get("title", "")).lower() in ("country", "nazione"):
            v = it.get("value") or {}
            country = v.get("fallback") if isinstance(v, dict) else v
    return b, country


def wd_entities(ids, props="claims|labels"):
    out = {}
    ids = list(ids)
    for i in range(0, len(ids), 40):
        q = urllib.parse.urlencode({"action": "wbgetentities", "ids": "|".join(ids[i:i + 40]), "props": props, "languages": "en|it|pt|es", "format": "json"})
        d = get(f"{WD}?{q}", UA_WD) or {}
        out.update(d.get("entities") or {})
    return out


def label(e):
    lb = e.get("labels") or {}
    for lg in ("en", "it", "pt", "es"):
        if lg in lb:
            return lb[lg]["value"]
    return None


def claim_ids(e, prop):
    res = []
    for c in (e.get("claims") or {}).get(prop, []):
        try:
            v = c["mainsnak"]["datavalue"]["value"]
        except Exception:
            continue
        if isinstance(v, dict) and "id" in v:
            order = None
            for q in (c.get("qualifiers") or {}).get("P1545", []):
                try:
                    order = int(q["datavalue"]["value"])
                except Exception:
                    pass
            res.append((order if order is not None else 99, len(res), v["id"]))
    return [x[2] for x in sorted(res)]


def birth(e):
    out = set()
    for c in (e.get("claims") or {}).get("P569", []):
        try:
            v = c["mainsnak"]["datavalue"]["value"]
            if v.get("precision", 0) >= 11:
                out.add(v["time"][1:11])
        except Exception:
            pass
    return out


SUFF = {"filho", "junior", "júnior", "neto", "sobrinho", "jr", "jr."}
PART = {"de", "da", "do", "das", "dos", "del", "della", "di", "van", "von", "der", "den", "la", "le", "y", "e"}


def short(lab, luso):
    """Etichette lunghe (nome completo all'anagrafe) -> nome + cognome. Portoghesi e brasiliani: l'ultimo cognome
    ("Alexsandro Amorim de Freitas Filho" -> "Alexsandro Freitas Filho"); spagnoli e ispanici: il primo dei due cognomi
    ("José Ángel Esmorís Tasende" -> "José Esmorís")."""
    w = lab.split()
    if len(w) < 3:
        return lab
    if len(w) == 3:
        # "Rodrigo Hernández Cascante" -> "Rodrigo Hernández"; "Cassiano Dias Moreira" -> "Cassiano Moreira";
        # restano interi con particella o suffisso ("Richarlison de Andrade", "Alexsandro Freitas Filho")
        if w[1].lower() in PART or w[2].lower() in SUFF:
            return lab
        return f"{w[0]} {w[2]}" if luso else f"{w[0]} {w[1]}"
    if luso:
        last = [w[-2], w[-1]] if w[-1].lower() in SUFF else [w[-1]]
    else:
        k = len(w) - 2
        while k > 1 and w[k - 1].lower() in PART:
            k -= 1
        last = [x for x in w[k:-1]] if w[-2].lower() not in PART else [w[-2], w[-1]]
    return " ".join([w[0]] + last)


def resolve(nick, born, country):
    found = {}
    for lg in ("en", "pt"):
        q = urllib.parse.urlencode({"action": "wbsearchentities", "search": nick, "language": lg, "uselang": lg, "type": "item", "limit": 20, "format": "json"})
        d = get(f"{WD}?{q}", UA_WD) or {}
        ids = [x["id"] for x in d.get("search") or [] if x.get("id") not in found]
        if ids:
            ents = wd_entities(ids)
            for qid, e in ents.items():
                if born in birth(e):
                    found[qid] = e
        if found:
            break
        time.sleep(0.1)
    if len(found) != 1:
        return None, None
    qid, e = next(iter(found.items()))
    lab = label(e)
    if lab and len(lab.split()) >= 2 and norm(lab) != norm(nick) and "(" not in lab:
        return short(lab, country in LUSO), qid
    given, fam = claim_ids(e, "P735"), claim_ids(e, "P734")
    if not given or not fam:
        return None, qid
    labs = wd_entities(set([given[0]] + fam), "labels")
    g = label(labs.get(given[0], {}))
    fams = [label(labs.get(f, {})) for f in fam]
    fams = [f for f in fams if f]
    if not g or not fams:
        return None, qid
    f = fams[-1] if (country in LUSO) else fams[0]
    full = f"{g} {f}"
    if norm(full) == norm(nick):
        return None, qid
    return full, qid


SPARQL = "https://query.wikidata.org/sparql"


def sparql(q):
    for k in range(4):
        try:
            data = urllib.parse.urlencode({"query": q, "format": "json"}).encode()
            req = urllib.request.Request(SPARQL, data=data, headers={**UA_WD, "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/sparql-results+json"})
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode("utf-8"))["results"]["bindings"]
        except Exception as e:
            print("sparql errore", str(e)[:120], flush=True)
            time.sleep(5 + 10 * k)
    return None


def by_dates(dates):
    """Calciatori (P106 = Q937857) nati in quelle date: {data: {Qid: {"lab": etichetta, "names": set di etichette e alias}}}."""
    vals = " ".join(f'"{d}T00:00:00Z"^^xsd:dateTime' for d in dates)
    q = ("SELECT ?item ?bd ?l ?a WHERE { VALUES ?bd { " + vals + " } ?item wdt:P569 ?bd ; wdt:P106 wd:Q937857 . "
         'OPTIONAL { ?item rdfs:label ?l FILTER(LANG(?l) IN ("en","pt","es","it","fr","de")) } '
         'OPTIONAL { ?item skos:altLabel ?a FILTER(LANG(?a) IN ("en","pt","es","it","fr","de")) } }')
    rows = sparql(q)
    if rows is None:
        return None
    out = {}
    for r in rows:
        d = r["bd"]["value"][:10]
        qid = r["item"]["value"].rsplit("/", 1)[-1]
        e = out.setdefault(d, {}).setdefault(qid, {"lab": {}, "names": set(), "alias": set()})
        for key in ("l", "a"):
            if key in r:
                v = r[key]["value"]
                e["names"].add(norm(v))
                if key == "a":
                    e["alias"].add(v)
                if key == "l":
                    e["lab"][r[key].get("xml:lang", "")] = v
    return out


def clean(full):
    """Solo nomi fatti di parole vere (niente "/", cifre, parentesi)."""
    if not full or re.search(r"[/\\()\[\]0-9,;]", full):
        return None
    return full if all(w[0].isalpha() for w in full.split()) else None


def compose(qid, e, nick, country):
    return clean(_compose(qid, e, nick, country))


def _compose(qid, e, nick, country):
    lab = None
    for lg in ("en", "it", "pt", "es", "fr", "de"):
        if lg in e["lab"]:
            lab = e["lab"][lg]
            break
    if lab and len(lab.split()) >= 2 and norm(lab) != norm(nick) and "(" not in lab:
        return short(lab, country in LUSO)
    ent = wd_entities([qid]).get(qid)
    if not ent:
        raise RuntimeError("wikidata non risponde")  # si riprova al giro dopo, senza segnarlo come controllato
    luso = country in LUSO
    given, fam = claim_ids(ent, "P735"), claim_ids(ent, "P734")
    if given and fam:
        labs = wd_entities(set([given[0]] + fam), "labels")
        g = label(labs.get(given[0], {}))
        fams = [x for x in (label(labs.get(f, {})) for f in fam) if x]
        if g and fams:
            full = f"{g} {fams[-1] if luso else fams[0]}"
            if norm(full) != norm(nick):
                return full
    # nome alla nascita (P1477), poi l'alias piu' lungo con almeno tre parole (di solito il nome all'anagrafe)
    for c in (ent.get("claims") or {}).get("P1477", []):
        try:
            v = c["mainsnak"]["datavalue"]["value"]["text"]
        except Exception:
            continue
        if len(v.split()) >= 2 and norm(v) != norm(nick):
            return short(v, luso)
    al = sorted((a for a in e.get("alias", ()) if len(a.split()) >= 3 and "(" not in a and not any(ch.isdigit() for ch in a)), key=len, reverse=True)
    return short(al[0], luso) if al else None


def main():
    try:
        db = json.load(open(OUT))
    except Exception:
        db = {}
    try:
        births = json.load(open(os.path.join(ROOT, "nomi_nascite.json")))
    except Exception:
        births = {}
    cands = candidates()
    todo = []
    for fid, nick in cands:
        r = db.get(str(fid))
        if r and r[3] == nick and (r[0] or (dt.date.fromisoformat(TODAY) - dt.date.fromisoformat(r[1])).days < RIPROVA_GIORNI):
            continue
        todo.append((fid, nick))
    print(f"candidati: {len(cands)}, da controllare: {len(todo)}", flush=True)

    # 1) data di nascita e paese da FotMob (ricordati in nomi_nascite.json)
    need = [(fid, nick) for fid, nick in todo if str(fid) not in births]

    def fm(c):
        if (time.time() - T0) / 60 > MIN_RUN * 0.6:
            return None
        b, cn = fotmob(c[0])
        return c[0], b, cn
    with ThreadPoolExecutor(8) as ex:
        for res in ex.map(fm, need):
            if res and res[1]:
                births[str(res[0])] = [res[1], res[2]]
    json.dump(births, open(os.path.join(ROOT, "nomi_nascite.json"), "w"), ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    print(f"date di nascita: {len(births)}", flush=True)

    # 2) Wikidata: tutti i calciatori nati in quelle date (50 date per richiesta), soprannome tra etichette e alias
    ready = [(fid, nick) for fid, nick in todo if str(fid) in births]
    dates = sorted({births[str(fid)][0] for fid, _ in ready})
    pool = {}
    for i in range(0, len(dates), 50):
        if (time.time() - T0) / 60 > MIN_RUN:
            break
        got = by_dates(dates[i:i + 50])
        if got is None:
            continue
        for d in dates[i:i + 50]:
            pool[d] = got.get(d, {})
        time.sleep(1)
    def one(c):
        fid, nick = c
        if (time.time() - T0) / 60 > MIN_RUN:
            return None
        b, cn = births[str(fid)]
        if b not in pool:
            return None
        hits = [(q, e) for q, e in pool[b].items() if norm(nick) in e["names"]]
        full = qid = None
        if len(hits) == 1:
            qid = hits[0][0]
            try:
                full = compose(qid, hits[0][1], nick, cn)
            except Exception:
                return None
        return fid, nick, full, qid

    done = found = 0
    with ThreadPoolExecutor(1) as ex:
        for res in ex.map(one, ready):
            if not res:
                continue
            fid, nick, full, qid = res
            db[str(fid)] = [full, TODAY, qid, nick]
            done += 1
            if full:
                found += 1
                print(f"{nick} -> {full} ({qid})", flush=True)
    json.dump(db, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    tot = sum(1 for v in db.values() if v[0])
    print(f"controllati ora: {done}, trovati ora: {found}, nomi veri in archivio: {tot}/{len(db)}", flush=True)


if __name__ == "__main__":
    sys.exit(main())
