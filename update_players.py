#!/usr/bin/env python3
"""Aggiunge a match/<id>.json i voti dei giocatori ('pl') e i tiri con coordinate ('tr'). Solo le partite a cui mancano."""
import json, os, sys, glob, time
from update_data import api, PAUSE, KEY

MAX_MIN = float(os.environ.get("MAX_MIN", "40"))
T0 = time.time()
# [chiave PitchAPI, ...] -> posizioni nella riga: [nome, lato, voto, minuti, gol, assist, tiri, in porta, xG, xA, occasioni create, tocchi]
KEYS = ["rating_title", "minutes_played", "goals", "assists", "total_shots", "ShotsOnTarget", "expected_goals", "expected_assists", "chances_created", "touches"]


def flat(groups):
    out = {}
    for g in groups or []:
        for k, e in (g.get("stats") or {}).items():
            if isinstance(e, dict):
                out[e.get("key") or k] = (e.get("stat") or {}).get("value")
    return out


def nme(p):
    if isinstance(p, dict):
        return p.get("name") or p.get("full_name") or p.get("short_name")
    return p


def main():
    if not KEY:
        sys.exit("Manca PITCHAPI_KEY")
    files = sorted(glob.glob("match/*.json"))
    todo = []
    for f in files:
        try:
            d = json.load(open(f))
        except Exception:
            continue
        if "pl" not in d or "tr" not in d:
            todo.append((f, d))
    print(len(todo), "partite da completare")
    n = 0
    for f, d in todo:
        if (time.time() - T0) / 60 > MAX_MIN:
            break
        names = {"h": set(), "a": set()}
        for s in ("h", "a"):
            for x in ((d.get("lu") or {}).get(s) or {}).get("st", []) + ((d.get("lu") or {}).get(s) or {}).get("su", []):
                names[s].add((x[0] or "").lower())
        tside = {}
        if "pl" not in d:
            try:
                r = api(f"/v1/matches/{d['id']}/players")
            except Exception as ex:
                print("  errore", d["id"], str(ex)[:100]); continue
            time.sleep(PAUSE)
            lst = r.get("players") if isinstance(r, dict) else r
            rows = []
            for x in lst or []:
                nm = nme(x.get("player")) or ""
                side = "h" if nm.lower() in names["h"] else "a" if nm.lower() in names["a"] else None
                if side and x.get("team_id") is not None:
                    tside[x["team_id"]] = side
                rows.append((nm, x.get("team_id"), side, flat(x.get("stats"))))
            out = []
            for nm, tid, side, st in rows:
                side = side or tside.get(tid)
                if not side:
                    continue
                v = [st.get(k) for k in KEYS]
                out.append([nm, side] + [round(x, 2) if isinstance(x, (int, float)) else x for x in v])
            d["pl"] = out
            d["plk"] = KEYS
        if "tr" not in d:
            try:
                sh = api(f"/v1/matches/{d['id']}/shots")
            except Exception as ex:
                print("  tiri non letti", d["id"], str(ex)[:100]); sh = None
            time.sleep(PAUSE)
            allsh = []
            for per in (sh or {}).get("periods", []) or []:
                allsh += per.get("shots", []) or []
            for x in allsh:
                nm = nme(x.get("player")) or ""
                side = "h" if nm.lower() in names["h"] else "a" if nm.lower() in names["a"] else None
                if side and x.get("team_id") is not None:
                    tside[x["team_id"]] = side
            tr = []
            for x in allsh:
                nm = nme(x.get("player")) or ""
                side = "h" if nm.lower() in names["h"] else "a" if nm.lower() in names["a"] else tside.get(x.get("team_id"))
                if not side:
                    continue
                tr.append([x.get("minute"), side, nm, x.get("x"), x.get("y"), x.get("expected_goals"), x.get("expected_goals_on_target"),
                           1 if x.get("is_on_target") else 0, x.get("goal_crossed_y"), x.get("goal_crossed_z"), x.get("shot_type"), x.get("event_type"), x.get("situation"), 1 if x.get("is_inside_box") else 0])
            d["tr"] = tr
        json.dump(d, open(f, "w"), ensure_ascii=False, separators=(",", ":"))
        n += 1
        if n % 25 == 0:
            print("  ", n, "fatte")
    print("completate", n)


if __name__ == "__main__":
    main()

