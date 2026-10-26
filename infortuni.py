#!/usr/bin/env python3
"""Giocatori infortunati da FotMob (playerData.injuryInformation) -> infortuni.json {id_nostro: {r, e, ed, s}}.
Usa gli id FotMob gia' trovati da carriere.py (carriere.json, campo fm)."""
import json, os, time, re
from concurrent.futures import ThreadPoolExecutor
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
OUT = "infortuni.json"
MAX_MIN = float(os.environ.get("MAX_MIN", "35"))
T0 = time.time()
SHOWN = [0]


def get(fid):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request("https://www.fotmob.com/api/data/playerData?id=%d" % fid, headers=UA), timeout=30) as r:
                return json.load(r)
        except Exception:
            time.sleep(1 + i)
    return None


def txt(v):
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        return v.get("fallback") or v.get("text") or v.get("name") or v.get("utcTime") or None
    return None


def iso(v):
    s = txt(v) if not isinstance(v, str) else v
    if isinstance(v, dict) and v.get("utcTime"):
        s = v["utcTime"]
    m = re.match(r"(\d{4}-\d{2}-\d{2})", s or "")
    return m.group(1) if m else None


def parse(j):
    inj = j.get("injuryInformation")
    if not inj:
        return None
    if SHOWN[0] < 6:
        SHOWN[0] += 1
        print("ESEMPIO injuryInformation:", json.dumps(inj, ensure_ascii=False)[:400])
    if not isinstance(inj, dict):
        return {"r": str(inj)}
    r = txt(inj.get("name")) or txt(inj.get("injuryName")) or txt(inj.get("type")) or txt(inj.get("reason"))
    ret = inj.get("expectedReturn") or inj.get("expectedReturnDate") or inj.get("returnDate")
    out = {"r": r}
    ex = {k: v for k, v in inj.items() if k not in ("name",)}
    if ex: out["x"] = ex
    e = txt(ret)
    if e: out["e"] = e
    ed = iso(ret)
    if ed: out["ed"] = ed
    s = iso(inj.get("lastUpdated") or inj.get("startDate") or inj.get("date"))
    if s: out["s"] = s
    return out


def main():
    car = json.load(open("carriere.json"))
    st = json.load(open("stats.json"))
    ix = {c: i for i, c in enumerate(st["cols"])}
    mins = {r[ix["id"]]: r[ix["min"]] for r in st["players"]}
    todo = [(pid, v["fm"]) for pid, v in car.items() if v.get("fm")]
    todo.sort(key=lambda x: -(mins.get(x[0]) or 0))
    out, seen = {}, 0

    def work(a):
        if (time.time() - T0) / 60 > MAX_MIN:
            return a[0], "skip"
        j = get(a[1])
        time.sleep(0.15)
        if not isinstance(j, dict):
            return a[0], "err"
        return a[0], parse(j)

    with ThreadPoolExecutor(6) as ex:
        for pid, r in ex.map(work, todo):
            seen += 1
            if r and r != "skip" and r != "err":
                out[pid] = r
    print("controllati", seen, "infortunati", len(out))
    json.dump({"updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "p": out}, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
