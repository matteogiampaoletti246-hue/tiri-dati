#!/usr/bin/env python3
"""Dati biografici e carriera dei giocatori da FotMob -> carriere.json {id_nostro: {...}}.
Rose dei 5 campionati -> id FotMob -> playerData. Riprende da dove si e' fermato."""
import json, os, re, time, unicodedata, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*", "Accept-Language": "en-US,en;q=0.9"}
OUT = "carriere.json"
LEAGUES = {"serie-a": 55, "premier-league": 47, "la-liga": 87, "bundesliga": 54, "ligue-1": 53}
MAX_MIN = float(os.environ.get("MAX_MIN", "40"))
T0 = time.time()


def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.load(r)
        except Exception as e:
            print("  errore", url[-50:], str(e)[:80]); time.sleep(2 + i * 2)
    return None


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def find_teams(o, out):
    if isinstance(o, dict):
        if "id" in o and "name" in o and isinstance(o.get("id"), int) and ("pageUrl" in o or "shortName" in o):
            out[o["id"]] = o["name"]
        for v in o.values():
            find_teams(v, out)
    elif isinstance(o, list):
        for v in o:
            find_teams(v, out)


def find_members(o, out):
    if isinstance(o, dict):
        if "id" in o and "name" in o and isinstance(o.get("id"), int) and ("role" in o or "ccode" in o or "positionId" in o or "shirtNumber" in o):
            out.append((o["id"], o["name"]))
        for v in o.values():
            find_members(v, out)
    elif isinstance(o, list):
        for v in o:
            find_members(v, out)


def main():
    res = json.load(open(OUT)) if os.path.exists(OUT) else {}
    st = json.load(open("stats.json"))
    cols = st["cols"]; ix = {c: i for i, c in enumerate(cols)}
    ours = {}
    for r in st["players"]:
        ours.setdefault(r[ix["lg"]], {}).setdefault(norm(r[ix["t"]]), {})[norm(r[ix["n"]])] = r[ix["id"]]
    for g in json.load(open("giocatori.json"))["players"]:
        pass
    pairs = []  # (nostro id, id fotmob)
    for lg, lid in LEAGUES.items():
        j = get("https://www.fotmob.com/api/data/leagues?id=%d&ccode3=ITA" % lid)
        teams = {}
        find_teams((j or {}).get("table") or j, teams)
        print(lg, len(teams), "squadre")
        mine = ours.get(lg, {})
        for tid, tname in teams.items():
            tn = norm(tname)
            cand = mine.get(tn)
            if not cand:
                for k, v in mine.items():
                    if k in tn or tn in k:
                        cand = v; break
            if not cand:
                print("  squadra non trovata", tname); continue
            t = get("https://www.fotmob.com/api/data/teams?id=%d&ccode3=ITA" % tid)
            mem = []
            find_members((t or {}).get("squad"), mem)
            for fid, fname in mem:
                n = norm(fname)
                pid = cand.get(n)
                if not pid:
                    last = n.split(" ")[-1]
                    m = [v for k, v in cand.items() if k.split(" ")[-1] == last and k.split(" ")[0][:1] == n[:1]]
                    pid = m[0] if len(m) == 1 else None
                if pid:
                    pairs.append((pid, fid))
            time.sleep(0.4)
    print("abbinati", len(pairs))
    new = 0
    for pid, fid in pairs:
        if pid in res and res[pid].get("ok"):
            continue
        if (time.time() - T0) / 60 > MAX_MIN:
            print("tempo finito"); break
        j = get("https://www.fotmob.com/api/data/playerData?id=%d" % fid)
        if not isinstance(j, dict):
            continue
        ch = ((j.get("careerHistory") or {}).get("careerItems") or {})
        res[pid] = {
            "ok": True, "fm": fid, "name": j.get("name"),
            "birth": (j.get("birthDate") or {}).get("utcTime"),
            "info": j.get("playerInformation"),
            "team": (j.get("primaryTeam") or {}),
            "pos": j.get("positionDescription"),
            "career": ch.get("senior"),
            "nat": ch.get("national") or j.get("careerHistory", {}).get("careerItems", {}).get("national"),
            "contract": (j.get("contractEnd") or {}).get("utcTime") if isinstance(j.get("contractEnd"), dict) else None,
            "keys": list(j.keys())[:40],
        }
        new += 1
        if new % 50 == 0:
            json.dump(res, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
            print(new, "giocatori")
        time.sleep(0.35)
    json.dump(res, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print("scritto", len(res))


if __name__ == "__main__":
    main()
