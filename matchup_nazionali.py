#!/usr/bin/env python3
"""Migliori Matchup: partite delle nazionali (Nations League A-D) dei prossimi giorni, con le medie attese di angoli, cartellini,
tiri, tiri in porta, falli e fuorigioco. Dall'archivio FotMob (arch/ e partite/), nessuna chiave. Scrive matchup_nazionali.json
{days: {data: [partita]}} con la stessa forma di angoli.json -> days[data].tutte (l'app le unisce).
Storico delle medie: partite ufficiali degli ULTIMI 12 MESI (WINDOW_DAYS) di Nations League, Mondiali e qualificazioni ai Mondiali
(HIST_COMPS); le amichevoli sono escluse. Le partite da giocare restano quelle della Nations League A e B.
Medie come update_angoli.py: attesi casa = (fatti dalla casa + subiti dall'ospite) / 2; angoli e tiri con la sede (casa/trasferta),
falli e fuorigioco su tutte le partite; tiri e tiri in porta col handicap della divisione (A 1.0, B 0.9, C 0.8, D 0.7, come il Calcolatore)."""
import gzip, json, os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

ROME = ZoneInfo("Europe/Rome")
# Solo Nations League A e B: C e D non servono in Migliori Matchup (richiesta del 9/11/2026)
COMPS = {9806: ("Nations League A", 1.0), 9807: ("Nations League B", 0.9)}
DAYS = 8
WINDOW_DAYS = 365   # le medie usano le partite degli ultimi 12 mesi (23/11/2026)
# Competizioni dello storico (nessuna amichevole): Nations League A-B, Mondiali, qualificazioni ai Mondiali (UEFA, altre confederazioni, spareggi
# intercontinentali). Le stagioni si leggono tutte dall'indice e le partite si filtrano per data.
HIST_COMPS = {9806, 9807, 77, 10195, 10196, 10197, 10198, 10199, 10200, 10201}


def load(p):
    if p.endswith(".gz"):
        return json.load(gzip.open(p, "rt", encoding="utf-8"))
    return json.load(open(p, encoding="utf-8"))


def pair(s, *keys):
    for k in keys:
        v = s.get(k)
        if isinstance(v, list) and len(v) == 2 and None not in v:
            try:
                return float(v[0]), float(v[1])
            except (TypeError, ValueError):
                pass
    return None


def rome_day(utc):
    return datetime.fromisoformat(utc.replace("Z", "+00:00")).astimezone(ROME).strftime("%Y-%m-%d")


def cards_1t(m):
    """Cartellini del primo tempo per (casa, trasferta) dagli eventi FotMob (tipo Card, minuto <= 45 compreso il recupero); None senza eventi."""
    ev = m.get("e") or []
    if not ev:
        return None
    h = a = 0
    for e in ev:
        if e.get("type") == "Card" and (e.get("time") or 0) <= 45:
            if e.get("isHome"):
                h += 1
            else:
                a += 1
    return float(h), float(a)


def mean(v):
    v = [x for x in v if x is not None]
    return (sum(v) / len(v), len(v)) if v else (None, 0)


def main():
    idx = load("arch/index.json")
    today = datetime.now(ROME).date()
    limit = today + timedelta(days=DAYS)
    hist = {}      # (id squadra, 'h'|'a') -> partite giocate con le statistiche
    names, handi, upcoming = {}, {}, []
    since = str(today - timedelta(days=WINDOW_DAYS))
    for fm in sorted(HIST_COMPS):
        e = idx.get(str(fm))
        if not e or not e.get("s"):
            continue
        label, hv = COMPS.get(fm, (e.get("n"), None))
        for sk in e["s"]:
            cal_p, par_p = f"arch/{fm}/{sk}.json", f"partite/{fm}/{sk}.json.gz"
            if not (os.path.exists(cal_p) and os.path.exists(par_p)):
                continue
            cal = load(cal_p)
            fixs = cal.get("fix") or []
            # stagione troppo vecchia: nessuna partita dentro la finestra -> non si apre l'archivio partite
            if not any(len(r) > 4 and r[4] and since <= rome_day(r[4]) <= str(limit) for r in fixs):
                continue
            par = load(par_p).get("m", {})
            if fm in COMPS and sk == e["s"][0]:
                for tid, n in (cal.get("teams") or {}).items():
                    names[str(tid)] = n
                    handi[str(tid)] = hv
            for r in fixs:
                mid, hid, aid, utc, fin = str(r[0]), str(r[2]), str(r[3]), r[4], r[6] if len(r) > 6 else None
                if not utc:
                    continue
                d = rome_day(utc)
                m = par.get(mid)
                if m and r[5]:
                    if d < since or d > str(today):
                        continue
                    s = m.get("s") or {}
                    c, y, rd = pair(s, "corners"), pair(s, "yellow_cards"), pair(s, "red_cards") or (0.0, 0.0)
                    sh, so = pair(s, "total_shots"), pair(s, "ShotsOnTarget")
                    fo, of = pair(s, "fouls"), pair(s, "Offsides")
                    k1 = cards_1t(m)
                    for side, i in (("h", 0), ("a", 1)):
                        j = 1 - i
                        g = lambda p: (p[i], p[j]) if p else (None, None)
                        hist.setdefault((hid if side == "h" else aid, side), []).append({
                            "c": g(c), "k": (y[i] + rd[i]) if y else None, "k1": k1[i] if k1 and y else None, "s": g(sh), "t": g(so), "f": g(fo), "o": g(of)})
                elif not r[5] and fm in COMPS and sk == e["s"][0] and str(today) <= d <= str(limit) and hid in names and aid in names:
                    upcoming.append({"id": mid, "h": hid, "a": aid, "date": d, "time": utc, "league": label, "fm": fm, "sk": sk})

    def rows(tid, side=None):
        return hist.get((tid, "h"), []) + hist.get((tid, "a"), []) if side is None else hist.get((tid, side), [])

    def col(rs, key, k):
        return [x[key][k] if isinstance(x[key], tuple) else None for x in rs]

    def expect(u, key, split, use_h=False):
        hr, ar = rows(u["h"], "h" if split else None), rows(u["a"], "a" if split else None)
        hf, n1 = mean(col(hr, key, 0)); ha, _ = mean(col(hr, key, 1))
        af, n2 = mean(col(ar, key, 0)); aa, _ = mean(col(ar, key, 1))
        if None in (hf, ha, af, aa) or min(n1, n2) < 1:
            return None
        sh = handi.get(u["h"], 1.0) if use_h else 1.0
        sa = handi.get(u["a"], 1.0) if use_h else 1.0
        return (hf * sh + aa / sa) / 2, (af * sa + ha / sh) / 2, n1, n2

    days = {}
    for u in upcoming:
        e = {"id": u["id"], "date": u["date"], "time": u["time"], "league": u["league"], "home": names[u["h"]], "away": names[u["a"]], "hid": u["h"], "aid": u["a"], "fm": u["fm"], "sk": u["sk"]}
        for tag, key, split, use_h, gk in (("corners", "c", True, False, "games"), ("tiri", "s", True, True, "tiri_games"), ("sot", "t", True, True, "sot_games"),
                                           ("falli", "f", False, False, "falli_games"), ("off", "o", False, False, "off_games")):
            r = expect(u, key, split, use_h)
            if r:
                e.update({tag + "_home": round(r[0], 1), tag + "_away": round(r[1], 1), gk: [r[2], r[3]]})
        hk, hn = mean([x["k"] for x in rows(u["h"])]); ak, an = mean([x["k"] for x in rows(u["a"])])
        if hk is not None and ak is not None:
            e.update(cards=round(hk + ak, 1), cards_home=round(hk, 1), cards_away=round(ak, 1), games_k=[hn, an])
            h1, _ = mean([x["k1"] for x in rows(u["h"])]); a1, _ = mean([x["k1"] for x in rows(u["a"])])
            if h1 is not None and a1 is not None:
                e.update(cards_1t=round(h1 + a1, 1), cards_1t_home=round(h1, 1), cards_1t_away=round(a1, 1))
        if any(k in e for k in ("corners_home", "tiri_home", "sot_home", "falli_home", "off_home", "cards")):
            days.setdefault(u["date"], []).append(e)
    out = {"updated_at": datetime.now(ROME).isoformat(timespec="seconds"), "days": days}
    json.dump(out, open("matchup_nazionali.json", "w"), ensure_ascii=False, separators=(",", ":"))
    print("matchup_nazionali.json - giorni:", len(days), "- partite:", sum(len(v) for v in days.values()), "- squadre con storico:", len({k[0] for k in hist}))


if __name__ == "__main__":
    main()
