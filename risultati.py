#!/usr/bin/env python3
"""Risultati di tutte le competizioni dell'archivio subito dopo la fine delle partite.
Una richiesta FotMob per giorno (/api/data/matches?date=) copre tutte le leghe:
1) giorni/<YYYY-MM-DD>.json = {"t", "m": [[id, fm, utc, idCasa, idOspite, casa, ospite, punteggio|null, stato, eliminata]]}
   stato: n (da giocare) | l (in corso) | f (finita) | c (annullata/rinviata); punteggio solo a partita finita
   (il live lo da' /fx nell'app: cosi' il file cambia solo a inizio e fine partita e i commit restano pochi);
2) arch/<fm>/<stagione in corso>.json: le righe del calendario si correggono (orario, risultato, finita, iniziata, annullata,
   squadra eliminata ai rigori in posizione 9) e il file si riscrive solo se qualcosa e' cambiato.
DAYS = giorni da scaricare rispetto a oggi (ora di Roma), es. "-2..1"."""
import datetime
import gzip
import json
import os
import time
import urllib.request
from zoneinfo import ZoneInfo

UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
try:
    ROME = ZoneInfo("Europe/Rome")
except Exception:  # Windows senza tzdata: basta per scegliere i giorni
    ROME = datetime.timezone(datetime.timedelta(hours=1))
KEEP_DAYS = 10  # file giorni/ piu' vecchi di 10 giorni si cancellano (il passato sta in arch/)
from femminili import is_women_comp, is_women_name, women_name

def get(url):
    for k in range(3):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
            try:
                r = gzip.decompress(r)
            except Exception:
                pass
            return json.loads(r)
        except Exception:
            time.sleep(2 * (k + 1))
    return None


def dump(p, o):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(o, f, ensure_ascii=False, separators=(",", ":"))


def iso_ts(t):
    try:
        return datetime.datetime.fromisoformat(str(t).replace("Z", "+00:00")).timestamp()
    except Exception:
        return None


def state(s):
    if s.get("cancelled"):
        return "c"
    if s.get("finished"):
        return "f"
    return "l" if s.get("started") else "n"


def days():
    a, b = (os.environ.get("DAYS") or "-2..1").split("..")
    today = datetime.datetime.now(ROME).date()
    return [today + datetime.timedelta(days=i) for i in range(int(a), int(b) + 1)]


def main():
    idx = json.load(open("arch/index.json", encoding="utf-8"))
    cur = {fm: sorted(e["s"])[-1] for fm, e in idx.items() if isinstance(e, dict) and e.get("s")}
    seen = {}  # fm -> {id: riga}
    ok = 0
    for d in days():
        j = get("https://www.fotmob.com/api/data/matches?date=%s&timezone=Europe%%2FRome&ccode3=ITA" % d.strftime("%Y%m%d"))
        if not j:
            continue
        ok += 1
        rows = []
        for lg in j.get("leagues") or []:
            fm = str(lg.get("primaryId") or lg.get("id"))
            if fm not in cur:
                continue
            for x in lg.get("matches") or []:
                s = x.get("status") or {}
                h, a = x.get("home") or {}, x.get("away") or {}
                st = state(s)
                hn, an = h.get("shortName") or h.get("name"), a.get("shortName") or a.get("name")
                if is_women_comp(fm, idx[fm].get("n")) or is_women_name(hn) or is_women_name(an):
                    hn, an = women_name(hn), women_name(an)
                r = [str(x.get("id")), int(fm), s.get("utcTime"), h.get("id"), a.get("id"), hn,
                     an, s.get("scoreStr") if st == "f" else None, st, x.get("eliminatedTeamId")]
                rows.append(r)
                seen.setdefault(fm, {})[r[0]] = (r, s)
        rows.sort(key=lambda r: (r[2] or "", r[1], r[0]))
        p = "giorni/%s.json" % d.isoformat()
        old = None
        if os.path.exists(p):
            try:
                old = json.load(open(p, encoding="utf-8")).get("m")
            except Exception:
                old = None
        if old != rows:
            dump(p, {"t": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"), "m": rows})
    # stagioni in corso dell'archivio: solo le righe cambiate
    fixed = 0
    files = 0
    for fm, by in seen.items():
        p = "arch/%s/%s.json" % (fm, cur[fm])
        if not os.path.exists(p):
            continue
        try:
            dat = json.load(open(p, encoding="utf-8"))
        except Exception:
            continue
        ch = 0
        for m in dat.get("fix") or []:
            hit = by.get(str(m[0]))
            if not hit:
                continue
            r, s = hit
            new = list(m[:9]) + [None] * (9 - len(m[:9]))
            # stesso istante scritto in un altro formato (".000Z"): si lascia com'era
            if s.get("utcTime") and iso_ts(s["utcTime"]) != iso_ts(m[4]):
                new[4] = s["utcTime"]
            new[5] = s.get("scoreStr") if r[8] == "f" else (m[5] if r[8] == "l" else None)
            new[6] = int(r[8] == "f")
            new[7] = int(r[8] in ("f", "l"))
            new[8] = int(r[8] == "c")
            if r[9]:
                new.append(r[9])
            if new != m:
                m[:] = new
                ch += 1
        if ch:
            fixed += ch
            files += 1
            with open(p, "w", encoding="utf-8") as f:
                json.dump(dat, f, ensure_ascii=False, separators=(",", ":"))
    # pulizia dei giorni vecchi
    lim = (datetime.datetime.now(ROME).date() - datetime.timedelta(days=KEEP_DAYS)).isoformat()
    if os.path.isdir("giorni"):
        for f in os.listdir("giorni"):
            if f.endswith(".json") and f[:10] < lim:
                os.remove(os.path.join("giorni", f))
    print("giorni ok", ok, "competizioni", len(seen), "righe corrette", fixed, "file", files)


if __name__ == "__main__":
    main()
