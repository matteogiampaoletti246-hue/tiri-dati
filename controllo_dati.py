#!/usr/bin/env python3
"""Controllo a tappeto dei dati della stagione in corso (nessuna chiave API) -> report/controllo_dati.json:
- squadre: per ogni competizione squadre del calendario FotMob contro squadre nelle classifiche dell'app (statistiche squadra dalle
  partite archiviate; per top 5, Champions ed Europa League anche squadre_ex.json / data.json)
- partite finite del calendario che mancano nell'archivio partite (= partite non aggiunte ai giocatori)
- giocatori con almeno 180' fuori dalle classifiche ufficiali FotMob (l'app li aggiunge dalle partite: loadLeaguePlayerStats)
- profili ancora doppi in giocatori.json + calc_extra.json (stesso id FotMob, stesso nome e squadra)"""
import gzip, json, os, unicodedata, re
from collections import Counter, defaultdict

SEASON_START = os.environ.get("SEASON_START", "2026")
APP = {"serie-a": 55, "premier-league": 47, "la-liga": 87, "bundesliga": 54, "ligue-1": 53, "champions-league": 42, "europa-league": 73}


def lj(p, d=None):
    try:
        return json.load(open(p, encoding="utf-8"))
    except Exception:
        return d


def lgz(p):
    try:
        return json.load(gzip.open(p, "rt", encoding="utf-8"))
    except Exception:
        return None


def nk(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return " ".join(re.sub(r"[^a-z0-9]+", " ", s).split())


def main():
    ix = lj("arch/index.json", {})
    sqx = (lj("squadre_ex.json", {}) or {}).get("lg", {})
    dj = (lj("data.json", {}) or {}).get("leagues", {})
    comps, miss_tot, p180_tot = [], 0, 0
    for lid, e in ix.items():
        s = (e.get("s") or [None])[0]
        if not s or s[:4] != SEASON_START:
            continue
        a = lj(f"arch/{lid}/{s}.json")
        if not a or not a.get("fix"):
            continue
        fin = [m for m in a["fix"] if m[7] and not m[8]]
        teams_cal = {str(m[2]) for m in a["fix"]} | {str(m[3]) for m in a["fix"]}
        d = lgz(f"partite/{lid}/{s}.json.gz") or {"m": {}}
        mm = d.get("m") or {}
        miss = [m for m in fin if str(m[0]) not in mm]
        # squadre con statistiche nelle classifiche dell'app (come ArchTeamStatPanel: partite finite con statistiche)
        with_stats = set()
        for m in fin:
            x = mm.get(str(m[0])) or {}
            if x.get("s"):
                with_stats |= {str(m[2]), str(m[3])}
        played = {str(m[2]) for m in fin} | {str(m[3]) for m in fin}
        # come ArchTeamStatPanel: gol fatti/subiti dai risultati per TUTTE le squadre con partite finite, poi le statistiche di chi le ha
        # (statistiche di partita FotMob, o classifiche ufficiali quando le partite non le hanno)
        in_cl = played if len(played) >= 2 else set()
        row = {"id": int(lid), "nome": e.get("n"), "paese": e.get("c"), "stagione": s, "squadre_calendario": len(teams_cal),
               "squadre_con_partite": len(played), "squadre_in_classifica": len(in_cl), "squadre_con_statistiche_partita": len(with_stats),
               "partite_finite": len(fin), "partite_mancanti": len(miss)}
        app = next((k for k, v in APP.items() if v == int(lid)), None)
        if app:
            row["app"] = app
            row["squadre_classifica_app"] = len(sqx.get(app) or {}) or None
            row["squadre_calcolatore"] = len((dj.get(app) or {}).get("teams") or {})
        # giocatori con almeno 180' fuori dalla classifica ufficiale (minuti)
        st = lj(f"arch/{lid}/{s}_s.json") or {}
        mp = (st.get("players") or {}).get("mins_played")
        if mp is not None:
            have = {str(r[0]) for r in mp}
            mins = Counter()
            for x in mm.values():
                for pid, v in (x.get("p") or {}).items():
                    mins[pid] += v.get("minutes_played") or 0
            fuori = [p for p, m in mins.items() if m >= 180 and p not in have]
            row["giocatori_180_fuori_ufficiali"] = len(fuori)
            p180_tot += len(fuori)
        miss_tot += len(miss)
        comps.append(row)
    # profili doppi
    g = (lj("giocatori.json", {}) or {}).get("players", [])
    cx = (lj("calc_extra.json", {}) or {}).get("players", [])
    by_f, by_nt = defaultdict(list), defaultdict(list)
    for p in g + cx:
        f = p.get("f") or p.get("fm")
        if f:
            by_f[str(f)].append(p["i"])
        by_nt[(nk(p["n"]), p["t"])].append(p["i"])
    doppi_f = {k: v for k, v in by_f.items() if len(v) > 1}
    doppi_nt = {f"{k[0]} | {k[1]}": v for k, v in by_nt.items() if len(v) > 1}
    squadre_ko = [c for c in comps if c["squadre_in_classifica"] < c["squadre_con_partite"]]
    app_ko = [c for c in comps if c.get("app") and c.get("squadre_classifica_app") and c["squadre_classifica_app"] < c["squadre_con_partite"]]
    out = {
        "stagione": SEASON_START,
        "competizioni": len(comps),
        "partite_finite_mancanti": miss_tot,
        "competizioni_con_partite_mancanti": sorted(([c["nome"], c["paese"], c["partite_mancanti"]] for c in comps if c["partite_mancanti"]), key=lambda x: -x[2]),
        "competizioni_squadre_mancanti_in_classifica": [[c["nome"], c["paese"], c["squadre_con_partite"], c["squadre_in_classifica"]] for c in squadre_ko],
        "competizioni_senza_statistiche_partita_fotmob": [[c["nome"], c["paese"], c["squadre_con_partite"], c["squadre_con_statistiche_partita"]] for c in comps if c["squadre_con_statistiche_partita"] < c["squadre_con_partite"]],
        "app_classifiche_squadre_incomplete": [[c["app"], c["squadre_con_partite"], c["squadre_classifica_app"]] for c in app_ko],
        "giocatori_180_fuori_ufficiali_aggiunti_dall_app": p180_tot,
        "profili_doppi_stesso_id_fotmob": doppi_f,
        "profili_doppi_stesso_nome_squadra": doppi_nt,
        "dettaglio": sorted(comps, key=lambda c: (c.get("app") is None, c["nome"] or "")),
    }
    os.makedirs("report", exist_ok=True)
    json.dump(out, open("report/controllo_dati.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps({k: (v if not isinstance(v, (list, dict)) else len(v)) for k, v in out.items() if k != "dettaglio"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
