#!/usr/bin/env python3
"""Foto dei giocatori delle coppe europee da PitchAPI. Scrive fotocoppe.json: {squadra: {nome normalizzato: url}}.
Legge le formazioni delle partite di Champions, Europa e Conference e, per ogni giocatore nuovo, la sua foto."""
import json, os, sys, time, re, unicodedata, urllib.parse
from update_data import api, find_league, WANTED, PAUSE, KEY
from update_angoli import season_of

MAX_MIN = float(os.environ.get("MAX_MIN", "40"))
T0 = time.time()
OUT = "fotocoppe.json"
COPPE = [("champions-league", None, r"champions league", r"afc|caf|concacaf|conmebol|women|qualif|youth|asia|africa|oceania|libertadores"),
         ("europa-league", None, r"europa league", r"conference|women|qualif|youth|afc|caf"),
         ("conference-league", None, r"conference league", r"women|qualif|youth|afc|caf")]


def norm(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z ]", "", s).strip()


def main():
    if not KEY:
        sys.exit("Manca PITCHAPI_KEY")
    d = json.load(open(OUT)) if os.path.exists(OUT) else {}
    done = set(d.get("_m", [])); ids = d.get("_p", {}); teams = d.get("t", {})
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    for key, cc, rx, ex in COPPE:
        cand = find_league(leagues, cc, rx, ex)
        if not cand:
            print("non trovata", key); continue
        lg = cand[0]; season = season_of(lg)
        if not season:
            continue
        q = urllib.parse.quote(season, safe="")
        ms = (api(f"/v1/leagues/{lg['id']}/matches?season={q}") or {}).get("matches", [])
        ms += (api(f"/v1/leagues/{lg['id']}/matches?season={q}&status=upcoming") or {}).get("matches", [])
        seen = set(); print(key, len(ms), "partite")
        for m in ms:
            if m["id"] in seen or m["id"] in done:
                continue
            seen.add(m["id"])
            if (time.time() - T0) / 60 > MAX_MIN:
                break
            try:
                lu = api(f"/v1/matches/{m['id']}/lineups"); time.sleep(PAUSE)
            except Exception as ex2:
                print("  lineup errore", str(ex2)[:80]); continue
            got = False
            for side, tn in (("home", m["home_team"]["name"]), ("away", m["away_team"]["name"])):
                o = (lu or {}).get(side) or {}
                for x in (o.get("starters") or []) + (o.get("subs") or []):
                    pid, nm = x.get("player_id"), x.get("name")
                    if not pid or not nm:
                        continue
                    got = True
                    if pid not in ids:
                        try:
                            p = api(f"/v1/players/{pid}") or {}; time.sleep(PAUSE)
                        except Exception:
                            continue
                        ids[pid] = p.get("image_url") or ""
                    if ids[pid]:
                        teams.setdefault(tn, {})[norm(nm)] = ids[pid]
            if got and m.get("status") == "finished":
                done.add(m["id"])
    json.dump({"_m": sorted(done), "_p": ids, "t": teams}, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print("squadre", len(teams), "foto", sum(len(v) for v in teams.values()))


if __name__ == "__main__":
    main()
