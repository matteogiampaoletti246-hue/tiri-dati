#!/usr/bin/env python3
"""File "snelli" per i falli: partf/<id FotMob campionato>/<stagione>.json.gz.
Stessa struttura di partite/<id>/<stagione>.json.gz ma con SOLO quello che serve al calcolo dei falli (falli di squadra, minuti, falli commessi/subiti
dei giocatori, id e nomi dalle formazioni, portieri): `calcFouls.js` -> build(). Sono ~10 volte piu' piccoli, quindi nelle Formazioni (prima del fischio)
i voti dei falli compaiono veloci come quelli dei tiri, anche nell'app nativa dove la decompressione e la lettura del JSON sono in JavaScript.
Il file originale non cambia mai: se manca un file snello l'app legge quello completo. Si rifa solo se la sorgente e' cambiata (impronta `src`).
Uso: python falli_stat.py [id_campionato ...]   (senza argomenti: tutte le competizioni, ultime 3 stagioni di ciascuna)"""
import gzip, hashlib, json, os, sys

STAGIONI = 3


def snello(m):
    """Partita ridotta ai soli campi letti da build() in calcFouls.js (stesse regole: niente di nuovo, niente di inventato)."""
    if not isinstance(m, dict):
        return m
    o = {}
    s = m.get("s")
    if isinstance(s, dict) and s:
        f = s.get("fouls")
        o["s"] = {"fouls": f} if isinstance(f, list) else {"_": 0}   # `s` non vuoto resta non vuoto (la sovrascrittura KV lo controlla)
    for lato in ("h", "a"):
        sd = m.get(lato)
        if not isinstance(sd, dict):
            continue
        n = {}
        if "id" in sd:
            n["id"] = sd["id"]
        for k, v in sd.items():
            if k == "id" or not isinstance(v, list):
                continue
            rows = []
            for r in v:
                if isinstance(r, list) and r and r[0] is not None:
                    # build() legge r[0] (id), r[1] (nome) e r[3] (ruolo: 11 = portiere); r[3] assente (riga corta) e' diverso da null
                    rows.append([r[0], r[1] if len(r) > 1 else None, None, r[3]] if len(r) > 3 else ([r[0], r[1]] if len(r) > 1 else [r[0]]))
            n[k] = rows
        o[lato] = n
    # statistiche di fonti terze (PitchAPI/LiveScore: partite con `px`) non vanno mai nel repository pubblico: `tools/stats_terzi_kv.py` le toglie
    # da `partite` (campi p/px/pn) e l'app le rilegge dal KV, quindi qui non si copiano mai (come se fossero gia' tolte)
    terzi = bool(m.get("px"))
    p = None if terzi else m.get("p")
    if isinstance(p, dict):
        q = {}
        for pid, v in p.items():
            if not isinstance(v, dict):
                continue
            e = {}
            for k in ("minutes_played", "fouls", "was_fouled"):
                if k in v:
                    e[k] = v[k]
            if any("save" in k.lower() for k in v):
                e["saves"] = 1   # build() cerca solo la presenza di una chiave con "save" per riconoscere i portieri
            q[pid] = e
        o["p"] = q
    if not terzi and isinstance(m.get("pn"), dict):
        o["pn"] = m["pn"]
    return o


def stagioni(fm):
    d = f"partite/{fm}"
    if not os.path.isdir(d):
        return []
    sk = sorted((f[:-8] for f in os.listdir(d) if f.endswith(".json.gz")), reverse=True)
    return sk[:STAGIONI]


def fai(fm, sk):
    src = f"partite/{fm}/{sk}.json.gz"
    raw = open(src, "rb").read()
    h = hashlib.sha1(raw).hexdigest()[:16]
    out = f"partf/{fm}/{sk}.json.gz"
    if os.path.exists(out):
        try:
            if json.loads(gzip.decompress(open(out, "rb").read())).get("src") == h:
                return "uguale", 0
        except Exception:
            pass
    d = json.loads(gzip.decompress(raw))
    res = {"src": h, "done": d.get("done"), "m": {mid: snello(m) for mid, m in (d.get("m") or {}).items()}}
    os.makedirs(os.path.dirname(out), exist_ok=True)
    data = json.dumps(res, separators=(",", ":"), ensure_ascii=False).encode()
    with open(out, "wb") as fh:
        fh.write(gzip.compress(data, 9, mtime=0))
    return "scritto", len(data)


def main():
    fms = sys.argv[1:] or sorted(f for f in os.listdir("partite") if os.path.isdir(f"partite/{f}"))
    n = tot = 0
    for fm in fms:
        for sk in stagioni(fm):
            r, b = fai(fm, sk)
            n += r == "scritto"
            tot += b
    print(f"falli_stat: {n} file scritti ({tot // 1024} KB di JSON)")


if __name__ == "__main__":
    main()
