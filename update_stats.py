#!/usr/bin/env python3
"""Statistiche per giocatore dei top 5 campionati: gol, assist, tiri, tiri in porta, falli commessi/subiti,
fuorigioco, cartellini, minuti (stagione e ultime 5 partite) + foto. Scrive stats.json.
Va nella stessa cartella di update_data.py e update_angoli.py."""
import json, os, sys, time, urllib.parse
from datetime import datetime, timezone
from update_data import api, find_league, WANTED, SEASON_START, PAUSE, KEY
from update_angoli import TOP5, tid_of, season_of
from update_stats_ex import load_matches, role_map, pos_of, nk

CACHE_FILE, OUT_FILE = "cache_stats.json", "stats.json"
MAX_MIN = float(os.environ.get("MAX_MIN", "35"))
VER = 1
T0 = time.time()
KEYS = ("minutes_played", "goals", "assists", "total_shots", "ShotsOnTarget", "fouls", "was_fouled", "Offsides")


def stat_val(groups, key):
    for g in groups or []:
        for k, entry in (g.get("stats") or {}).items():
            if isinstance(entry, dict) and (entry.get("key") or k) == key:
                try:
                    return float((entry.get("stat") or {}).get("value"))
                except (TypeError, ValueError):
                    return None
    return None


def as_list(d, *names):
    if isinstance(d, dict):
        for n in names:
            if isinstance(d.get(n), list):
                return d[n]
        return []
    return d or []


def safe(path):
    try:
        return api(path)
    except Exception as ex:
        print("   (non letto)", path, str(ex)[:120])
        return None


def read_match(mid):
    """-> (righe giocatore, nomi, foto, posizioni) oppure None se non ci sono dati."""
    pl = as_list(safe(f"/v1/matches/{mid}/players"), "players", "data")
    time.sleep(PAUSE)
    if not pl:
        return None
    rows, names, photos, pos = {}, {}, {}, {}
    for e in pl:
        p = e.get("player") or {}
        pid = p.get("id")
        if not pid:
            continue
        names[pid] = p.get("name")
        if p.get("image_url"):
            photos[pid] = p["image_url"]
        if p.get("position_id") is not None:
            pos[pid] = p["position_id"]
        st = e.get("stats")
        v = [stat_val(st, k) for k in KEYS]
        mins = v[0]
        if not mins or mins <= 0:
            continue
        rows[pid] = [pid, e.get("team_id"), mins] + [int(x or 0) for x in v[1:]] + [0, 0]    # ... gialli, rossi in coda
    ev = as_list(safe(f"/v1/matches/{mid}/events"), "events")
    time.sleep(PAUSE)
    for x in ev:
        t = str(x.get("event_type", "")).lower()
        pid = (x.get("player") or {}).get("id")
        if pid in rows and "card" in t:
            if "red" in t:
                rows[pid][-1] += 1
            elif "yellow" in t:
                rows[pid][-2] += 1
        p = x.get("player") or {}
        if p.get("id") and p.get("image_url") and p["id"] not in photos:
            photos[p["id"]] = p["image_url"]
    return list(rows.values()), names, photos, pos


def read_roles(mid, cache):
    """ruolo di ogni titolare dalla posizione in campo (pitch_x): portiere, difensore, centrocampista, attaccante."""
    j = safe(f"/v1/matches/{mid}/lineups")
    time.sleep(PAUSE)
    for side in ("home", "away"):
        for x in ((j or {}).get(side) or {}).get("starters", []) or []:
            pid, px = x.get("player_id"), x.get("pitch_x")
            if not pid or px is None:
                continue
            k = 0 if px <= 0.15 else 1 if px < 0.45 else 2 if px < 0.8 else 3
            v = cache["role"].setdefault(pid, [0, 0, 0, 0])
            v[k] += 1
        # panchinari: ruolo dal position_id della distinta (peso minore, conta solo se non c'e' altro)
        for x in ((j or {}).get(side) or {}).get("subs", []) or []:
            pid, pi = x.get("player_id"), x.get("position_id")
            if not pid or pi is None:
                continue
            k = pi if 0 <= pi <= 3 else (0 if pi < 20 else 1 if pi < 60 else 2 if pi < 90 else 3)
            v = cache["role2"].setdefault(pid, [0, 0, 0, 0])
            v[k] += 1
    cache["lu"][mid] = 2


def probe_diag(mids, tid):
    """Una volta sola: scrive diag2.json con le risposte degli endpoint squadra/rosa (per la scheda Squadra)."""
    if os.path.exists("diag2.json"):
        return
    d = {}
    for path in (f"/v1/teams/{tid}", f"/v1/teams/{tid}/players", f"/v1/teams/{tid}/squad", f"/v1/teams/{tid}/roster"):
        try:
            r = api(path); time.sleep(PAUSE)
        except Exception as ex:
            d[path] = "errore " + str(ex)[:80]; continue
        if r is None:
            d[path] = "non esiste"; continue
        txt = json.dumps(r, ensure_ascii=False)
        d[path] = {"campi": sorted(r.keys()) if isinstance(r, dict) else None, "esempio": txt[:1500]}
    if mids:
        r = safe(f"/v1/matches/{mids[0]}/lineups"); time.sleep(PAUSE)
        try:
            d["lineup_posizioni"] = [[x.get("name"), x.get("position_id"), x.get("pitch_x"), x.get("pitch_y")]
                                     for side in ("home", "away") for x in ((r or {}).get(side) or {}).get("starters", [])]
        except Exception as ex:
            d["lineup_posizioni"] = "errore " + str(ex)[:80]
    json.dump(d, open("diag2.json", "w"), ensure_ascii=False, indent=1)


def main():
    if not KEY:
        sys.exit("Manca la variabile PITCHAPI_KEY (segreto del repository).")
    cache = json.load(open(CACHE_FILE)) if os.path.exists(CACHE_FILE) else {}
    cm = cache.setdefault("m", {})
    for k in ("pn", "ph", "pos", "tn", "role", "role2", "lu"):
        cache.setdefault(k, {})
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    new, skipped, stop, probed = 0, 0, False, False
    for key, cc, rx, ex in WANTED:
        if key not in TOP5 or stop:
            continue
        cand = find_league(leagues, cc, rx, ex)
        if not cand:
            print("✘ non trovato:", key); continue
        lg = cand[0]
        season = season_of(lg)
        if not season:
            continue
        q = urllib.parse.quote(season, safe="")
        played = (api(f"/v1/leagues/{lg['id']}/matches?season={q}") or {}).get("matches", [])
        played = [m for m in played if m.get("status") == "finished"]
        print(f"✔ {key}: {len(played)} partite giocate")
        for m in played:
            mid = m["id"]
            for t in (m["home_team"], m["away_team"]):
                cache["tn"][tid_of(t)] = t["name"]
            rec = cm.get(mid)
            if (time.time() - T0) / 60 > MAX_MIN:
                stop = True
                break
            if rec is not None and rec.get("v") == VER:
                if cache["lu"].get(mid) != 2:
                    read_roles(mid, cache)
                continue
            res = read_match(mid)
            if res is None:
                skipped += 1
                continue
            rows, names, photos, pos = res
            for pid, n in names.items():
                if n:
                    cache["pn"][pid] = n
            cache["ph"].update(photos)
            cache["pos"].update({k: v for k, v in pos.items()})
            cm[mid] = {"v": VER, "d": str(m.get("date", ""))[:10], "lg": key, "p": rows}
            read_roles(mid, cache)
            new += 1
            if not probed:
                probed = True
                probe_diag([mid], tid_of(m["home_team"]))
            if new % 40 == 0:
                json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)
    cutoff = f"{SEASON_START}-07-01"
    for k in [k for k, v in cm.items() if v.get("d") and v["d"] < cutoff]:
        del cm[k]
    json.dump(cache, open(CACHE_FILE, "w"), ensure_ascii=False)
    if stop:
        print(f"⏱ Fermo dopo {MAX_MIN:.0f} minuti: le partite rimaste si leggono al prossimo giro.")

    per = {}
    for r in cm.values():
        for row in r["p"]:
            per.setdefault(row[0], []).append((r["d"], r["lg"], row))
    lst_m = load_matches()
    st_roles, su_roles = role_map(lst_m)
    players, photos = [], {}
    for pid, lst in per.items():
        lst.sort(key=lambda x: x[0], reverse=True)
        tot = [0.0] * 10     # min, gol, assist, tiri, in porta, falli, subiti, fuorigioco, gialli, rossi
        for d, lg_, row in lst:
            for i in range(2, 12):
                tot[i - 2] += row[i]
        l5 = [0.0] * 11      # partite, min, tiri, in porta, falli, subiti, fuorigioco, gol, assist, gialli, rossi
        for d, lg_, row in lst[:5]:
            l5[0] += 1; l5[1] += row[2]; l5[2] += row[5]; l5[3] += row[6]; l5[4] += row[7]; l5[5] += row[8]; l5[6] += row[9]; l5[7] += row[3]; l5[8] += row[4]; l5[9] += row[10]; l5[10] += row[11]
        tid = lst[0][2][1]
        posd = pos_of((nk(cache["pn"].get(pid, "")), cache["tn"].get(tid, "")), st_roles, su_roles)   # ruolo dalle formazioni vere
        rv = cache["role"].get(pid)
        if posd is None:
            posd = "PDCA"[rv.index(max(rv))] if rv and max(rv) > 0 else None
        if posd is None:
            r2 = cache["role2"].get(pid)
            posd = "PDCA"[r2.index(max(r2))] if r2 and max(r2) > 0 else None
        if posd is None:      # nessun dato di ruolo: profilo dai numeri (mai "Altri")
            mn = max(1, tot[0])
            posd = "A" if tot[3] / mn * 90 >= 1.6 or tot[1] > 0 else "C" if tot[5] / mn * 90 < 1.6 else "D"
        players.append([pid, cache["pn"].get(pid, "?"), cache["tn"].get(tid, ""), lst[0][1], len(lst),
                        int(tot[0]), int(tot[1]), int(tot[2]), int(tot[3]), int(tot[4]), int(tot[5]), int(tot[6]),
                        int(tot[7]), int(tot[8]), int(tot[9])] + [int(x) for x in l5[:8]] + [posd] + [int(x) for x in l5[8:]])
        if pid in cache["ph"]:
            photos[pid] = cache["ph"][pid]
    players.sort(key=lambda p: p[1])
    json.dump({"updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
               "cols": ["id", "n", "t", "lg", "g", "min", "go", "as", "sh", "st", "fo", "fs", "of", "y", "r",
                        "l5g", "l5min", "l5sh", "l5st", "l5fo", "l5fs", "l5of", "l5go", "pos", "l5as", "l5y", "l5r"],
               "players": players, "ph": photos}, open(OUT_FILE, "w"), ensure_ascii=False, separators=(",", ":"))
    print("Scritto", OUT_FILE, "- giocatori:", len(players), "- partite in memoria:", len(cm), "- nuove:", new, "- senza dati:", skipped)


if __name__ == "__main__":
    main()
