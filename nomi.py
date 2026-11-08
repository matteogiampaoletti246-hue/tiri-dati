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
Chi resta senza si riprova dopo RIPROVA_GIORNI. Giro a tempo (NOMI_MIN, default 40 minuti): i successivi riprendono da dove resta."""
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


def get(url, headers, tries=3):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=25) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (404, 400):
                return None
            time.sleep(2 + 3 * k)
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


def short(lab):
    """Etichette lunghe (nome completo all'anagrafe) -> nome + cognome: "Alexsandro Amorim de Freitas Filho" -> "Alexsandro Freitas Filho"."""
    w = lab.split()
    if len(w) <= 3:
        return lab
    last = [w[-1]]
    if w[-1].lower() in SUFF and len(w) > 2:
        last = [w[-2], w[-1]]
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
        return short(lab), qid
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


def main():
    try:
        db = json.load(open(OUT))
    except Exception:
        db = {}
    cands = candidates()
    print(f"candidati: {len(cands)}, gia' in archivio: {len(db)}", flush=True)
    todo = []
    for fid, nick in cands:
        r = db.get(str(fid))
        if r and r[3] == nick and (r[0] or (dt.date.fromisoformat(TODAY) - dt.date.fromisoformat(r[1])).days < RIPROVA_GIORNI):
            continue
        todo.append((fid, nick))
    print(f"da controllare: {len(todo)}", flush=True)

    def one(c):
        fid, nick = c
        if (time.time() - T0) / 60 > MIN_RUN:
            return None
        try:
            born, country = fotmob(fid)
            full, qid = (resolve(nick, born, country) if born else (None, None))
        except Exception:
            return None
        return fid, nick, full, qid

    done = found = 0
    with ThreadPoolExecutor(6) as ex:
        for res in ex.map(one, todo):
            if not res:
                continue
            fid, nick, full, qid = res
            db[str(fid)] = [full, TODAY, qid, nick]
            done += 1
            if full:
                found += 1
                print(f"{nick} -> {full} ({qid})", flush=True)
            if done % 100 == 0:
                json.dump(db, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    json.dump(db, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    tot = sum(1 for v in db.values() if v[0])
    print(f"controllati ora: {done}, trovati ora: {found}, nomi veri in archivio: {tot}/{len(db)}", flush=True)


if __name__ == "__main__":
    sys.exit(main())
