#!/usr/bin/env python3
"""Calendario e classifica della stagione IN CORSO di ogni competizione dell'archivio, sempre aggiornati.
archivio.py scarica una stagione una volta sola: tutto cio' che FotMob aggiunge dopo (play-off, turni di coppa sorteggiati piu'
tardi, recuperi con un id nuovo, squadre entrate ai turni successivi, stagione nuova) restava fuori da arch/<fm>/<stagione>.json
e quelle partite in Home non si aprivano (es. Liguilla della Liga de Expansion MX, 12/11/2026: 48 partite in 9 competizioni).
Qui, per ogni competizione (una richiesta ciascuna):
- stagione gia' in archivio: `fix` = calendario FotMob di adesso (le righe nuove entrano, quelle vecchie si aggiornano; si tengono
  le partite finite che FotMob non elenca piu' e la posizione 9 = squadra eliminata), `teams` si completa, classifica/gironi/zone si rinfrescano;
- stagione nuova (non ancora nell'indice): si scrive il file e si riapre la competizione per archivio.py (statistiche stagionali).
Si riscrive un file solo se cambia. ONLY_IDS=8976,138 per limitare; BUDGET_MIN minuti (30)."""
import gzip
import json
import os
import sys
import time
import urllib.parse
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
INDEX = "arch/index.json"


def get(url, tries=3):
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
            try:
                r = gzip.decompress(r)
            except Exception:
                pass
            return json.loads(r)
        except Exception:
            time.sleep(1.5 * (i + 1))
    return None


def dump(p, o):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(o, f, ensure_ascii=False, separators=(",", ":"))


def tables_of(d):
    out = []
    for tb in d.get("table") or []:
        data = tb.get("data") or {}
        if isinstance(data.get("table"), dict) and data["table"].get("all"):
            out.append((data.get("leagueName") or "", {k: data["table"].get(k) for k in ("all", "home", "away", "form")}, data.get("legend")))
        for g in data.get("tables") or []:
            t = g.get("table") or {}
            if isinstance(t, dict) and t.get("all"):
                out.append((g.get("leagueName") or "", {k: t.get(k) for k in ("all", "home", "away", "form")}, g.get("legend")))
    return out


def compact_fix(m):
    s = m.get("status", {})
    return [str(m.get("id")), m.get("round"), str(m["home"]["id"]), str(m["away"]["id"]), s.get("utcTime"), s.get("scoreStr"),
            int(bool(s.get("finished"))), int(bool(s.get("started"))), int(bool(s.get("cancelled")))]


def removed_ids():
    try:
        return {str(x) for x in json.load(open("competizioni_rimosse.json", encoding="utf-8")).get("ids", [])}
    except Exception:
        return set()


def refresh(fm, idx):
    """Aggiorna la stagione in corso di una competizione. Ritorna (cambiato, stagione) oppure (False, None) se FotMob non risponde."""
    fm = str(fm)
    e = idx.get(fm)
    if not isinstance(e, dict) or e.get("skip"):
        return False, None
    d = get("https://www.fotmob.com/api/data/leagues?id=%s&ccode3=%s" % (fm, e.get("c") or "INT"))
    if not d:
        return False, None
    sel = (d.get("details") or {}).get("selectedSeason")
    if not sel or not str(sel)[:4].isdigit():
        return False, None
    sk = str(sel).replace("/", "-")
    all_m = (d.get("fixtures") or {}).get("allMatches") or []
    new_fix = []
    for m in all_m:
        try:
            new_fix.append(compact_fix(m))
        except Exception:
            pass
    teams = {}
    for m in all_m:
        for k in ("home", "away"):
            try:
                teams[str(m[k]["id"])] = m[k].get("shortName") or m[k].get("name")
            except Exception:
                pass
    groups = tables_of(d)
    # fasi non ancora iniziate (es. Clausura con tutti a 0 partite mentre si gioca l'Apertura): non sono una classifica, si saltano
    played = [any((r.get("played") or 0) > 0 for r in (t.get("all") or [])) for _, t, _ in groups]
    if any(played) and not all(played):
        groups = [g for g, ok in zip(groups, played) if ok]
    for _, t, _ in groups:
        for r in t.get("all") or []:
            teams[str(r.get("id"))] = r.get("shortName") or r.get("name")
    p = "arch/%s/%s.json" % (fm, sk)
    known = sk in (e.get("s") or [])
    if not known or not os.path.exists(p):
        # stagione nuova: mai piu' vecchia di quelle gia' in archivio (FotMob a volte torna alla stagione precedente tra una e l'altra)
        if e.get("s") and sk < max(e["s"]):
            return False, None
        if not new_fix and not groups:
            return False, None
        out = {"table": groups[0][1] if len(groups) == 1 else None, "legend": groups[0][2] if len(groups) == 1 else None, "teams": teams, "fix": new_fix}
        if len(groups) > 1:
            out["groups"] = [{"n": n, "table": t, "legend": lg} for n, t, lg in groups]
        elif not groups:
            out["nogroups"] = 1
        dump(p, out)
        e.setdefault("s", [])
        if sk not in e["s"]:
            e["s"].insert(0, sk)
        e.pop("done", None)  # archivio.py scarichera' le statistiche stagionali
        idx[fm] = e
        return True, sk
    try:
        old = json.load(open(p, encoding="utf-8"))
    except Exception:
        return False, None
    before = json.dumps(old, ensure_ascii=False, sort_keys=True)
    by_old = {str(m[0]): m for m in old.get("fix") or []}
    seen = set()
    fix = []
    for n in new_fix:
        o = by_old.get(n[0])
        seen.add(n[0])
        if o:
            row = list(o)
            # una partita gia' finita nell'archivio non torna indietro (risposta FotMob in ritardo)
            if o[6] and o[5] and not n[6]:
                fix.append(row)
                continue
            # stesso tipo degli id gia' salvati (stringa o numero): il file non deve cambiare per questo
            row[1] = n[1] if n[1] is not None else o[1]
            if n[4] and n[4] != o[4]:
                try:
                    import datetime
                    a = datetime.datetime.fromisoformat(str(n[4]).replace("Z", "+00:00")).timestamp()
                    b = datetime.datetime.fromisoformat(str(o[4]).replace("Z", "+00:00")).timestamp()
                    if a != b:
                        row[4] = n[4]
                except Exception:
                    row[4] = n[4]
            row[5:9] = n[5:9]
            fix.append(row)
        else:
            fix.append(n)
    # partite finite che FotMob non elenca piu': restano (risultati veri gia' mostrati); quelle mai giocate e sparite si tolgono (id cambiato)
    for k, o in by_old.items():
        if k not in seen and o[6] and not o[8]:
            fix.append(o)
    if new_fix:
        old["fix"] = fix
    t0 = old.get("teams") or {}
    for k, v in teams.items():
        if v and (k not in t0 and (not k.isdigit() or int(k) not in t0)):
            t0[k] = v
    old["teams"] = t0
    if len(groups) == 1:
        old["table"], old["legend"] = groups[0][1], groups[0][2]
        old.pop("nogroups", None)
        old.pop("groups", None)
    elif len(groups) > 1:
        old["groups"] = [{"n": n, "table": t, "legend": lg} for n, t, lg in groups]
        old["table"], old["legend"] = None, None
        old.pop("nogroups", None)
    if json.dumps(old, ensure_ascii=False, sort_keys=True) == before:
        return False, sk
    dump(p, old)
    return True, sk


def main():
    budget = float(os.environ.get("BUDGET_MIN", "30")) * 60
    only = [x for x in os.environ.get("ONLY_IDS", "").split(",") if x]
    t0 = time.time()
    idx = json.load(open(INDEX, encoding="utf-8"))
    rm = removed_ids()
    ids = [k for k, v in idx.items() if isinstance(v, dict) and k not in rm and (not only or k in only)]
    ch = fail = new = 0
    for fm in ids:
        if time.time() - t0 > budget:
            print("budget finito")
            break
        had = list((idx[fm].get("s") or []))
        ok, sk = refresh(fm, idx)
        if sk is None:
            fail += 1
        if ok:
            ch += 1
            if sk not in had:
                new += 1
                print("stagione nuova", fm, idx[fm].get("n"), sk)
                dump(INDEX, idx)
        time.sleep(0.25)
    dump(INDEX, idx) if new else None
    print("calendari", len(ids), "aggiornati", ch, "stagioni nuove", new, "senza risposta", fail)


if __name__ == "__main__":
    main()
