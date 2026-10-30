#!/usr/bin/env python3
"""Giorni passati per la Home nativa: giorni_arch/<YYYY-MM-DD>.json (stesso formato di giorni/<data>.json).
giorni/ tiene solo 10 giorni (risultati.py); i giorni piu' vecchi si ricavano dalle stagioni archiviate (arch/<fm>/<stagione>.json),
senza rete. Parte dal 1 luglio dell'anno scorso. Righe: [id, fm, utc, idCasa, idOspite, casa, ospite, punteggio, stato, eliminata, (minuto, vuoto), stagione]
(solo partite finite con risultato). Si riscrive un file solo se cambia."""
import datetime, json, os
from zoneinfo import ZoneInfo
from femminili import is_women_comp, is_women_name, women_name

ROME = ZoneInfo("Europe/Rome")
OUT = "giorni_arch"
today = datetime.datetime.now(ROME).date()
START = datetime.date(today.year - 1, 7, 1)


def main():
    idx = json.load(open("arch/index.json", encoding="utf-8"))
    by = {}
    for fm, e in idx.items():
        if not isinstance(e, dict) or not e.get("s"):
            continue
        for sk in sorted(e["s"])[-2:]:
            p = f"arch/{fm}/{sk}.json"
            if not os.path.exists(p):
                continue
            try:
                c = json.load(open(p, encoding="utf-8"))
            except Exception:
                continue
            teams = c.get("teams") or {}
            women = is_women_comp(fm, e.get("n"))
            for r in c.get("fix") or []:
                if len(r) < 9 or not r[4] or not r[5] or r[8]:
                    continue
                try:
                    d = datetime.datetime.fromisoformat(r[4].replace("Z", "+00:00")).astimezone(ROME).date()
                except Exception:
                    continue
                if d < START or d >= today:
                    continue
                hn, an = teams.get(str(r[2])), teams.get(str(r[3]))
                if not hn or not an:
                    continue
                if women or is_women_name(hn) or is_women_name(an):
                    hn, an = women_name(hn), women_name(an)
                row = [str(r[0]), int(fm), r[4], int(r[2]) if str(r[2]).isdigit() else r[2], int(r[3]) if str(r[3]).isdigit() else r[3], hn, an, r[5], "f", r[9] if len(r) > 9 else None, None, sk]
                by.setdefault(d.isoformat(), {})[row[0]] = row
    os.makedirs(OUT, exist_ok=True)
    n = 0
    for d, rows in by.items():
        lst = sorted(rows.values(), key=lambda r: (r[2] or "", r[1], r[0]))
        p = f"{OUT}/{d}.json"
        new = {"m": lst}
        try:
            if json.load(open(p, encoding="utf-8")) == new:
                continue
        except Exception:
            pass
        with open(p, "w", encoding="utf-8") as f:
            json.dump(new, f, ensure_ascii=False, separators=(",", ":"))
        n += 1
    print("giorni:", len(by), "scritti:", n, "righe:", sum(len(v) for v in by.values()))


if __name__ == "__main__":
    main()
