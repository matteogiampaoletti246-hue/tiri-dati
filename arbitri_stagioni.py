"""Arbitri: gare e medie di falli e cartellini nelle ultime due stagioni di ogni competizione.
Legge partite/<fm>/<stagione>.json.gz e scrive arbitri2/<fm>.json =
{"s": [stagioni usate], "ref": {nome: [gare, cartellini a partita, falli a partita]}, "lg": {"y", "fo", "ys", "fos"}}.
Le medie contano solo le partite che hanno quel dato: una partita senza falli in archivio non abbassa la media.
Competizione senza arbitri in archivio = nessun file (il riquadro in partita usa le altre fonti, mai dati inventati)."""
import gzip, json, os, re, unicodedata

ROOT = os.path.dirname(os.path.abspath(__file__))
SEASON = re.compile(r"^((?:\d{4}-\d{4}|\d{4})(?: - [^_/]+)?)\.json\.gz$")
LAST = 2
os.chdir(ROOT)


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def pair_sum(p):
    # [casa, ospite] -> somma; None se manca uno dei due
    if not isinstance(p, list) or len(p) < 2:
        return None
    a, b = num(p[0]), num(p[1])
    return None if a is None or b is None else a + b


def cards_of(m):
    s = m.get("s") or {}
    y, r = pair_sum(s.get("yellow_cards")), pair_sum(s.get("red_cards"))
    if y is not None:
        return y + (r or 0)
    ev = m.get("e")
    if ev:
        return float(sum(1 for e in ev if e.get("type") == "Card"))
    return None


def season_table(fm, sk, by):
    try:
        with gzip.open("partite/%s/%s.json.gz" % (fm, sk), "rt", encoding="utf-8") as f:
            d = json.load(f)
    except Exception:
        return 0
    n = 0
    for m in (d.get("m") or {}).values():
        name = ((m or {}).get("i") or {}).get("ref")
        if not name:
            continue
        n += 1
        r = by.setdefault(name, {"n": 0, "yn": 0, "y": 0.0, "fn": 0, "fo": 0.0})
        r["n"] += 1
        c = cards_of(m)
        if c is not None:
            r["yn"] += 1
            r["y"] += c
        fo = pair_sum((m.get("s") or {}).get("fouls"))
        if fo is not None:
            r["fn"] += 1
            r["fo"] += fo
    return n


def toks(name):
    s = unicodedata.normalize("NFD", name.replace("ı", "i").replace("ł", "l")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z ]+", " ", s).split()


def merged(by):
    # stesso arbitro scritto in due modi tra le stagioni ("Alberto Arena" / "Alberto Ruben Arena"): stesso nome e cognome = una persona sola
    groups = {}
    for name, r in by.items():
        t = toks(name)
        k = (t[0], t[-1]) if t else (name, name)
        groups.setdefault(k, []).append((name, r))
    out = []
    for items in groups.values():
        tot = {"n": 0, "yn": 0, "y": 0.0, "fn": 0, "fo": 0.0}
        for _, r in items:
            for f in tot:
                tot[f] += r[f]
        out.append(([n for n, _ in items], tot))
    return out


def rnd(v):
    return None if v is None else round(v, 3)


def main():
    out_dir = "arbitri2"
    os.makedirs(out_dir, exist_ok=True)
    files = 0
    for fm in sorted(os.listdir("partite")):
        p = os.path.join("partite", fm)
        if not (fm.isdigit() and os.path.isdir(p)):
            continue
        seasons = sorted((m.group(1) for m in map(SEASON.match, os.listdir(p)) if m), reverse=True)
        by, used = {}, []
        for sk in seasons:
            if season_table(fm, sk, by):
                used.append(sk)
            if len(used) == LAST:
                break
        target = os.path.join(out_dir, fm + ".json")
        if not by:
            if os.path.exists(target):
                os.remove(target)
            continue
        groups = merged(by)
        ref = {}
        vals = []
        for names, r in groups:
            v = [r["n"], rnd(r["y"] / r["yn"]) if r["yn"] else None, rnd(r["fo"] / r["fn"]) if r["fn"] else None]
            vals.append(v)
            for name in names:
                ref[name] = v
        # media del campionato pesata sulle partite, fasce di colore dai valori dei singoli arbitri
        yn, fn = sum(r["yn"] for r in by.values()), sum(r["fn"] for r in by.values())
        lg = {
            "y": rnd(sum(r["y"] for r in by.values()) / yn) if yn else None,
            "fo": rnd(sum(r["fo"] for r in by.values()) / fn) if fn else None,
            "ys": sorted(v[1] for v in vals if v[1] is not None),
            "fos": sorted(v[2] for v in vals if v[2] is not None),
        }
        body = json.dumps({"s": used, "ref": ref, "lg": lg}, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
        old = open(target, encoding="utf-8").read() if os.path.exists(target) else None
        if old != body:
            with open(target, "w", encoding="utf-8", newline="\n") as f:
                f.write(body)
        files += 1
    print("arbitri2:", files, "competizioni")


if __name__ == "__main__":
    main()
