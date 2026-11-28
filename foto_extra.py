#!/usr/bin/env python3
"""Foto dei giocatori che FotMob non ha (regola fissa 22/11/2026: "se manca la foto, la solita gerarchia di fonti").
FotMob -> PitchAPI (foto.json/stats.ph, gia' nell'app) -> LiveScore -> diretta.it.
Per ogni squadra con giocatori senza foto (foto_mancanti.json di foto_check.py, solo id FotMob veri) si leggono le formazioni delle sue partite:
  - LiveScore (ogni data): `lineups/soccer/<eid>` -> Ps[].imageUrl;
  - diretta.it (partite di +-7 giorni, finite o in programma con le probabili): GraphQL `dlie2` -> players[].images.
Il giocatore si abbina all'id FotMob SOLO per nome dentro la sua squadra (team_index: formazioni FotMob della stagione, classifiche, rosa):
mai a caso. La foto si tiene solo se l'indirizzo risponde davvero con un'immagine.
Uscita: Cloudflare KV `idx:ph/<id % 100>` -> {id FotMob: url} (dati di terzi: mai nel repository). Il worker serve /pf/<id>.png.
Nel repository solo lo stato (partite gia' lette) e il resoconto con i numeri: foto_extra_stato.json, report/foto_extra.json.
Variabili: MAX_MIN (40), MAX_TEAM_MATCH (6 partite per squadra)."""
import json, os, re, sys, time, urllib.request
from datetime import datetime, timezone
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import giocatori_diretta as D
from giocatori_livescore import find_event, get as ls_get, pname, B as LSB
from giocatori_pitch import parse_ts, find_player, team_index, load_gz, SKIP

MAX_MIN = float(os.environ.get("MAX_MIN", "40"))
MAX_TEAM_MATCH = int(os.environ.get("MAX_TEAM_MATCH", "6"))
T0 = time.time()
STATE, REPORT = "foto_extra_stato.json", "report/foto_extra.json"
ON = bool(os.environ.get("CLOUDFLARE_API_TOKEN"))
LS_ON = os.environ.get("LS_FOTO") == "1"
LS_BASES = ["https://lsm-static-prod.livescore.com/high/enet/", "https://lsm-static-prod.livescore.com/medium/enet/", "https://lsm-static-prod.livescore.com/high/", "https://lsm-static-prod.livescore.com/medium/"]
DL_BASE = "https://static.flashscore.com/res/image/data/"
late = lambda: (time.time() - T0) / 60 > MAX_MIN
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "image/*,*/*"}


def is_img(u):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=20)
        b = r.read(4096)
        return r.status == 200 and len(b) > 600 and ("image" in (r.headers.get("Content-Type") or "") or b[:4] in (b"\x89PNG", b"RIFF") or b[:2] == b"\xff\xd8")
    except Exception:
        return False


LS_BASE = [None]


def ls_url(img):
    if not img:
        return None
    if LS_BASE[0] is None:
        for b in LS_BASES:
            if is_img(b + img):
                LS_BASE[0] = b; print("LiveScore: indirizzo foto", b, flush=True); break
        else:
            return None
    return LS_BASE[0] + img


def dl_url(images):
    paths = [i.get("path") for i in sorted(images or [], key=lambda i: -(i.get("variantType") or 0)) if i.get("path")]
    return DL_BASE + paths[0] if paths else None


def dl_find(ts, hn, an):
    """come giocatori_diretta.find_mid, ma anche partite in programma o in corso (probabili con le foto)."""
    segs = D.day_segments(ts)
    if not segs:
        return None
    for dt in (0, -300, 300, -900, 900, -1800, 1800, -3600, 3600):
        cands = segs.get(int(ts) + dt) or []
        if not cands:
            continue
        sc = sorted(((D.sim(hn, c.get("CX") or c.get("AE")), D.sim(an, c.get("AF")), c) for c in cands), key=lambda x: -(x[0] + x[1]))
        a, b, c = sc[0]
        if a < 0.4 or b < 0.4 or (a + b) / 2 < 0.55 or (len(sc) > 1 and (a + b) / 2 - (sc[1][0] + sc[1][1]) / 2 < 0.08):
            return None
        return c.get("AA")
    return None


SEARCH = []
late2 = lambda: (time.time() - T0) / 60 > MAX_MIN + float(os.environ.get("SEARCH_MIN", "60"))
SRCH = "https://s.livesport.services/api/v2/search/?q=%s&lang-id=1&type-ids=2,4&project-id=2&project-type-id=1&sport-ids=1"


def dl_search(name, team):
    """giocatore di diretta.it con lo stesso nome (cognome uguale e nome compatibile) in una squadra con nome simile: foto (variante grande)."""
    from urllib.parse import quote
    from giocatori_pitch import norm
    j = D.get(SRCH % quote(name), D.GQL_H, js=True)
    toks = norm(name)
    if not toks or not isinstance(j, list):
        return None
    best = None
    for x in j:
        if ((x.get("type") or {}).get("id")) not in (2, 4) or not x.get("images"):
            continue
        if not any(((pt or {}).get("id")) == 2 for pt in x.get("participantTypes") or []):
            continue
        xt = set(norm(x.get("name") or ""))
        if not xt or toks[-1] not in xt or not (set(toks) <= xt or xt <= set(toks) or len(set(toks) & xt) >= 2):
            continue
        sim = max([D.sim(team, (t or {}).get("name") or "") for t in (x.get("teams") or [])] or [0])
        if sim < 0.6:
            continue
        if best is None or sim > best[0]:
            best = (sim, x)
    if not best:
        return None
    imgs = sorted(best[1]["images"], key=lambda i: (i.get("variantTypeId") != 3, -(i.get("variantTypeId") or 0)))
    return DL_BASE + imgs[0]["path"] if imgs and imgs[0].get("path") else None


def main():
    miss = {str(x) for x in json.load(open("foto_mancanti.json")) if int(x) > 0}
    shards = {}
    if ON:
        from rose_livescore import kv_get
        for n in range(100):
            shards[n] = kv_get(f"idx:ph/{n}") or {}
    have = {k for s in shards.values() for k in s}
    todo_ids = miss - have
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    rep = {"mancanti_fotmob": len(miss), "gia_trovate": len(have), "nuove": {"livescore": 0, "diretta": 0}, "squadre": 0, "partite_lette": 0}
    idx = json.load(open("arch/index.json"))
    now = time.time()
    new = {}
    for fm, e in idx.items():
        if late():
            break
        if SKIP.search(e.get("n", "")):
            continue
        for sk in sorted(e.get("s") or [], reverse=True)[:1]:
            try:
                arch = json.load(open(f"arch/{fm}/{sk}.json"))
            except Exception:
                continue
            path = f"partite/{fm}/{sk}.json.gz"
            d = load_gz(path) if os.path.exists(path) else {"m": {}}
            tidx = team_index(fm, sk, d, arch)
            teams = arch.get("teams") or {}
            # squadre con giocatori senza foto
            need = {tid: {n: pid for n, pid in ix.items() if pid in todo_ids and pid not in new} for tid, ix in tidx.items()}
            need = {t: v for t, v in need.items() if v}
            if not need:
                continue
            rows = sorted([r for r in arch.get("fix") or [] if parse_ts(r[4])], key=lambda r: -parse_ts(r[4]))
            done_t = {t: 0 for t in need}
            tried = set(state.get(f"{fm}|{sk}") or [])
            for r in rows:
                if late():
                    break
                ts = parse_ts(r[4])
                h, a = str(r[2]), str(r[3])
                if not ((h in need and need[h] and done_t[h] < MAX_TEAM_MATCH) or (a in need and need[a] and done_t[a] < MAX_TEAM_MATCH)):
                    continue
                mid = str(r[0])
                if mid in tried or abs(ts - now) > 7 * 86400:
                    continue
                hn, an = teams.get(h) or "", teams.get(a) or ""
                players = {1: [], 2: []}   # (nome, url, fonte)
                if LS_ON and ts <= now + 3 * 3600:   # LiveScore: indirizzo delle foto non trovato (22/11/2026, 14 varianti provate: tutte 404) -> spento
                    eid = find_event(ts, r[2], r[3], hn, an)
                    ln = ls_get(LSB + f"lineups/soccer/{eid}?locale=en") if eid else None
                    for side, t in enumerate(((ln or {}).get("Lu") or [])[:2], 1):
                        for p in t.get("Ps") or []:
                            if p.get("imageUrl"):
                                players[side].append((pname(p) or p.get("Snm") or "", p["imageUrl"], "livescore"))
                if abs(ts - now) <= 7 * 86400 and not (players[1] and players[2]):
                    dmid = dl_find(ts, hn, an)
                    # formazione ufficiale (dlie2); se non c'e' ancora o non ha foto, la probabile (dplie, stessa forma con predictedLineup)
                    for key, gq in (("lineup", "dlie2"), ("predictedLineup", "dplie")):
                        if players[1] and players[2]:
                            break
                        lj = D.get(D.GQL + gq + "&eventId=" + dmid, D.GQL_H, js=True) if dmid else None
                        for ep in (((lj or {}).get("data") or {}).get("findEventById") or {}).get("eventParticipants") or []:
                            side = 1 if ((ep.get("type") or {}).get("side") == "HOME") else 2 if ((ep.get("type") or {}).get("side") == "AWAY") else 0
                            for p in ((ep.get(key) or {}).get("players") or []):
                                u = dl_url(p.get("images"))
                                if side and u and not any(u == x[1] for x in players[side]):
                                    players[side].append((D.swap(p.get("listName") or p.get("fieldName") or ""), u, "diretta"))
                        time.sleep(0.3)
                rep["partite_lette"] += 1
                # una partita senza foto ancora in programma si rilegge alla prossima corsa (la formazione ufficiale esce dopo)
                if players[1] or players[2] or ts < now - 3 * 3600:
                    tried.add(mid)
                for side, tid in ((1, h), (2, a)):
                    if tid not in need:
                        continue
                    done_t[tid] += 1
                    for name, img, src in players[side]:
                        pid = find_player(name, tidx.get(tid) or {})
                        if not pid or pid not in need[tid].values() or pid in new:
                            continue
                        u = ls_url(img) if src == "livescore" else img
                        if u and is_img(u):
                            new[pid] = u; rep["nuove"][src] += 1
                    need[tid] = {n: p for n, p in need[tid].items() if p not in new}
                time.sleep(0.2)
            state[f"{fm}|{sk}"] = sorted(tried)[-400:]
            rep["squadre"] += len(need)
            for tid, v in need.items():
                for nm, pid in v.items():
                    if pid not in new:
                        SEARCH.append((pid, nm, teams.get(tid) or "", e.get("n", "")))
            print(e.get("n"), sk, "nuove finora", len(new), flush=True)
    # 2) ricerca giocatori di diretta.it (chi non e' nelle formazioni di +-7 giorni): nome + squadra; una ricerca per giocatore, ripetuta dopo 30 giorni
    srch = state.setdefault("_ricerca", {})
    t_now = int(time.time())
    seen_p = set()
    rep["ricerche"] = 0
    for pid, nm, team, comp in SEARCH:
        if late2() or pid in new or pid in seen_p:
            continue
        seen_p.add(pid)
        if t_now - int(srch.get(pid) or 0) < 30 * 86400:
            continue
        srch[pid] = t_now
        rep["ricerche"] += 1
        u = dl_search(nm, team)
        if u and is_img(u):
            new[pid] = u; rep["nuove"]["diretta_ricerca"] = rep["nuove"].get("diretta_ricerca", 0) + 1
        time.sleep(0.15)
    if new and ON:
        from rose_livescore import kv_put
        for pid, u in new.items():
            shards.setdefault(int(pid) % 100, {})[pid] = u
        items = [(f"idx:ph/{n}", shards[n]) for n in sorted({int(p) % 100 for p in new})]
        items.append(("idx:ph/ids", sorted(int(k) for sh in shards.values() for k in sh)))   # elenco per l'app (load.js)
        for i in range(0, len(items), 40):
            if not kv_put(items[i:i + 40]):
                sys.exit("scrittura KV fallita")
    rep["totale_con_foto_extra"] = len(have) + len(new)
    rep["ancora_senza"] = len(miss - have - set(new))
    os.makedirs("report", exist_ok=True)
    json.dump(state, open(STATE, "w"), separators=(",", ":"))
    json.dump(rep, open(REPORT, "w"), ensure_ascii=False, indent=1)
    print(json.dumps(rep, ensure_ascii=False))


if __name__ == "__main__":
    main()
