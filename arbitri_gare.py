"""Arbitri: tutte le partite delle ultime due stagioni, di tutte le competizioni, un file per arbitro.
Legge partite/<fm>/<stagione>.json.gz (arbitro, eventi, statistiche) e arch/<fm>/<stagione>.json (data, squadre, risultato)
e scrive arbitri3/<nome-cognome>.json =
{"n": gare, "y": cartellini a partita, "fo": falli a partita,
 "m": [[data, fm, stagione, id partita, casa, ospite, gol casa, gol ospite, cartellini totali, cartellini 1T, cartellini 2T], ...]} (piu' recenti prima).
Ultime due stagioni = le stagioni il cui anno d'inizio e' l'anno della stagione in corso o il precedente (qualunque competizione:
2026-2027 e 2025-2026; i campionati ad anno solare 2026 e 2025). Stesso arbitro scritto in modi diversi = una persona sola (primo + ultimo nome).
Cartellini di una partita = gialli + rossi + secondi gialli dagli eventi (tutti quelli mostrati dall'arbitro); 1T = fino al 45' (recupero compreso),
2T = dopo (supplementari compresi), cosi' 1T + 2T = totale. Senza eventi: totale dalle statistiche e nessuna divisione per tempo.
Falli: somma dei falli delle due squadre; la media conta solo le partite che hanno il dato."""
import gzip, json, os, re, shutil, unicodedata

ROOT = os.path.dirname(os.path.abspath(__file__))
SEASON = re.compile(r"^((\d{4})(?:-\d{4})?(?: - [^_/]+)?)\.json\.gz$")
OUT = "arbitri3"
os.chdir(ROOT)


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def pair_sum(p):
    if not isinstance(p, list) or len(p) < 2:
        return None
    a, b = num(p[0]), num(p[1])
    return None if a is None or b is None else a + b


def toks(name):
    s = unicodedata.normalize("NFD", name.replace("ı", "i").replace("ł", "l")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z ]+", " ", s).split()


def key_of(name):
    t = toks(name)
    if not t:
        return None
    return t[0] if len(t) == 1 else t[0] + "-" + t[-1]


def cards_of(m):
    """(totale, 1T, 2T) di una partita."""
    ev = m.get("e")
    if isinstance(ev, list):
        c = [e for e in ev if isinstance(e, dict) and e.get("type") == "Card"]
        if c:
            first = sum(1 for e in c if (num(e.get("time")) or 0) <= 45)
            return len(c), first, len(c) - first
    s = m.get("s") or {}
    y, r = pair_sum(s.get("yellow_cards")), pair_sum(s.get("red_cards"))
    if y is not None:
        t = int(y + (r or 0))
        # eventi presenti ma senza cartellini e statistiche a zero: zero in entrambi i tempi
        return (t, 0, 0) if t == 0 and isinstance(ev, list) else (t, None, None)
    return None, None, None


def main():
    seasons = {}
    start_years = []
    for fm in sorted(os.listdir("partite")):
        p = os.path.join("partite", fm)
        if not (fm.isdigit() and os.path.isdir(p)):
            continue
        for f in os.listdir(p):
            m = SEASON.match(f)
            if m:
                seasons.setdefault(fm, []).append((m.group(1), int(m.group(2))))
                start_years.append(int(m.group(2)))
    cur = max(start_years)
    by = {}
    for fm, lst in seasons.items():
        for sk, y in lst:
            if y < cur - 1:
                continue
            try:
                with gzip.open("partite/%s/%s.json.gz" % (fm, sk), "rt", encoding="utf-8") as f:
                    d = json.load(f)
                with open("arch/%s/%s.json" % (fm, sk), encoding="utf-8") as f:
                    a = json.load(f)
            except Exception:
                continue
            teams = a.get("teams") or {}
            fix = {str(x[0]): x for x in (a.get("fix") or []) if isinstance(x, list) and len(x) >= 6}
            for mid, m in (d.get("m") or {}).items():
                name = ((m or {}).get("i") or {}).get("ref")
                fx = fix.get(str(mid))
                if not name or not fx:
                    continue
                k = key_of(name)
                sc = re.match(r"^\s*(\d+)\s*-\s*(\d+)\s*$", str(fx[5] or ""))
                if not k or not sc:
                    continue  # partita senza risultato: non ancora giocata
                tot, c1, c2 = cards_of(m)
                fo = pair_sum((m.get("s") or {}).get("fouls"))
                r = by.setdefault(k, {"names": {}, "m": []})
                r["names"][name] = r["names"].get(name, 0) + 1
                r["m"].append([str(fx[4])[:10], fm, sk, str(mid), teams.get(str(fx[2]), ""), teams.get(str(fx[3]), ""), int(sc.group(1)), int(sc.group(2)), tot, c1, c2, fo, str(fx[2]), str(fx[3])])
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    n_files = 0
    for k, r in by.items():
        rows = sorted(r["m"], key=lambda x: (x[0], x[3]), reverse=True)
        cy = [x[8] for x in rows if x[8] is not None]
        fo = [x[11] for x in rows if x[11] is not None]
        out = {
            "n": len(rows),
            "y": round(sum(cy) / len(cy), 3) if cy else None,
            "fo": round(sum(fo) / len(fo), 3) if fo else None,
            "m": [x[:11] + x[12:14] for x in rows],
        }
        with open(os.path.join(OUT, k + ".json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        n_files += 1
    print("arbitri3:", n_files, "arbitri, stagioni dal", cur - 1)


if __name__ == "__main__":
    main()
