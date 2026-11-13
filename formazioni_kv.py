#!/usr/bin/env python3
"""Formazioni UFFICIALI di PitchAPI -> Cloudflare KV `idx:lu/<id partita FotMob>` (regola fissa 14/11/2026: catena ESPN -> FotMob -> PitchAPI -> LiveScore).
Il worker (`pitchLineups` in worker/index.js) le legge come terza fonte dove FotMob/ESPN non hanno ancora i due undici. Dati di terzi: SOLO su KV, mai nel repository.
Le formazioni arrivano da `update_partite.py --formazioni` (partite.json, chiave `lin`, ogni 5 minuti nelle 2 ore prima del fischio); qui si abbinano alla partita
FotMob (`giorni/<data>.json`: orario entro 10 minuti + nomi squadre) e si scrivono nel formato di /fx. Coordinate PitchAPI = coordinate FotMob (verificato 14/11/2026).
Serve CLOUDFLARE_API_TOKEN, CF_ACCOUNT, CF_NAMESPACE; senza, stampa soltanto. Uso: python formazioni_kv.py"""
import json, os, re, sys, unicodedata
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "tools"))
WIN_BEFORE_H, WIN_AFTER_H = float(os.environ.get("KV_BEFORE_H", "3")), float(os.environ.get("KV_AFTER_H", "2"))
STOP = {"fc", "ac", "as", "sc", "afc", "fk", "cf", "ssc", "us", "rc", "sk", "ks", "bk", "if", "sv", "vfl", "vfb", "tsg", "ogc", "rb", "og", "de", "cd", "ca", "ud", "nk", "fcsb", "1"}


def norm(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return " ".join(t for t in re.sub(r"[^a-z0-9 ]", " ", s).split() if t not in STOP)


def same(a, b):
    x, y = norm(a), norm(b)
    if not x or not y:
        return False
    if x == y or x in y or y in x:
        return True
    ty = y.split()
    return any(t in ty for t in x.split() if len(t) > 3)


def fx_side(l):
    """lineup PitchAPI (side_lineup di update_partite.py) -> formato di /fx: [nome, maglia, x, y, capitano, foto, voto, ?, ruolo]."""
    def num(v):
        try:
            return int(v)
        except Exception:
            return v if v not in ("", None) else None
    mk = lambda p, xy: [p[0] or "", num(p[1]), p[2] if xy else None, p[3] if xy else None, bool(p[4]) if len(p) > 4 and xy else False, None, None, None, None]
    s = [mk(p, True) for p in (l.get("s") or []) if p and p[0]]
    b = [mk(p, False) for p in (l.get("b") or []) if p and p[0]]
    co = {"id": None, "n": l["co"], "cc": None} if l.get("co") else None
    return {"f": l.get("f"), "s": s, "b": b, "co": co}


def fm_day(iso, cache={}):
    if iso not in cache:
        try:
            cache[iso] = json.load(open(f"giorni/{iso}.json", encoding="utf8")).get("m") or []
        except Exception:
            cache[iso] = []
    return cache[iso]


def find_fm(m):
    ko = datetime.fromisoformat(m["t"].replace("Z", "+00:00"))
    half = None
    for d in (0, -1, 1):
        for x in fm_day((ko + timedelta(days=d)).strftime("%Y-%m-%d")):
            try:
                xt = datetime.fromisoformat(str(x[2]).replace("Z", "+00:00"))
            except Exception:
                continue
            dt = abs((xt - ko).total_seconds())
            if dt <= 600 and same(m["h"], x[5]) and same(m["a"], x[6]):
                return str(x[0])
            # nome corto da una parte ("PSG" / "Paris Saint-Germain"): stesso orario esatto e una squadra uguale
            if dt <= 300 and (same(m["h"], x[5]) or same(m["a"], x[6])) and half is None:
                half = str(x[0])
    return half


def main():
    o = json.load(open("partite.json", encoding="utf8"))
    now = datetime.now(timezone.utc)
    items, seen = [], 0
    for m in o.get("matches") or []:
        if not m.get("t"):
            continue
        ko = datetime.fromisoformat(m["t"].replace("Z", "+00:00"))
        if not (now - timedelta(hours=WIN_AFTER_H) <= ko <= now + timedelta(hours=WIN_BEFORE_H)):
            continue
        l = (o.get("lin") or {}).get(m["id"]) or {}
        h, a = l.get("h"), l.get("a")
        if not (h and a and h.get("c") and a.get("c") and len(h.get("s") or []) == 11 and len(a.get("s") or []) == 11):
            continue
        seen += 1
        fid = find_fm(m)
        if not fid:
            print("senza partita FotMob:", m["h"], "-", m["a"], m["t"])
            continue
        items.append((f"idx:lu/{fid}", {"c": 1, "at": now.isoformat(timespec="seconds"), "h": fx_side(h), "a": fx_side(a)}))
    print(f"formazioni ufficiali PitchAPI in finestra: {seen}, abbinate a FotMob: {len(items)}")
    if items and os.environ.get("CLOUDFLARE_API_TOKEN") and os.environ.get("CF_ACCOUNT") and os.environ.get("CF_NAMESPACE"):
        from rose_livescore import kv_put
        print("scritte su KV" if kv_put(items) else "KV: scrittura non riuscita")


if __name__ == "__main__":
    main()
