"""Foto dei giocatori senza foto in foto.json/stats.json: trova l'id FotMob e scrive foto_fm.json = {id giocatore: id FotMob}.
Fonti, dalla piu' sicura: carriere.json, rosa della squadra (rose.json), classifiche della stagione in corso dell'archivio (stessa squadra e stesso nome).
Il nome da solo vale solo se in tutte le fonti corrisponde a un unico id. Chi non si trova o non ha foto su FotMob resta con la sagoma standard."""
import json, os, re, unicodedata

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)


def load(p, d=None):
    try:
        return json.load(open(p, encoding="utf-8"))
    except Exception:
        return d


def nm(s):
    s = unicodedata.normalize("NFD", str(s or "").lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def team_key(s):
    # stessa squadra tra le fonti: "Banik Ostrava" / "FC Banik Ostrava"
    return " ".join(t for t in nm(s).split() if t not in {"fc", "fk", "sk", "ac", "as", "sc", "cf", "afc", "1"})


def season_rows(by_team, by_name):
    idx = load("arch/index.json", {})
    for fm, e in idx.items():
        seasons = sorted((e or {}).get("s") or [], reverse=True)[:2]
        for sk in seasons:
            d = load("arch/%s/%s_s.json" % (fm, sk))
            s = load("arch/%s/%s.json" % (fm, sk), {}) or {}
            teams = s.get("teams") or {}
            for k, rows in ((d or {}).get("players") or {}).items():
                if k.startswith("_"):
                    continue
                for r in rows or []:
                    if not r or not r[0]:
                        continue
                    n = nm(r[1])
                    tn = team_key(teams.get(str(r[2]), ""))
                    if tn:
                        by_team.setdefault((tn, n), r[0])
                    by_name.setdefault(n, set()).add(r[0])


def main():
    players = (load("giocatori.json", {}) or {}).get("players") or []
    foto = load("foto.json", {}) or {}
    ph = (load("stats.json", {}) or {}).get("ph") or {}
    car = load("carriere.json", {}) or {}
    rose = load("rose.json", {}) or {}
    by_team, by_name = {}, {}
    for t, v in rose.items():
        for r in (v or {}).get("p") or []:
            by_team.setdefault((team_key(t), nm(r[1])), r[0])
            by_name.setdefault(nm(r[1]), set()).add(r[0])
    season_rows(by_team, by_name)
    out, miss = {}, 0
    src = {"carriere": 0, "squadra": 0, "nome": 0}
    for p in players:
        i = p.get("i")
        if not i or ph.get(i) or (foto.get(i) or {}).get("u"):
            continue
        n = nm(p.get("n"))
        c = (car.get(i) or {}).get("fm")
        hit = by_team.get((team_key(p.get("t")), n))
        one = by_name.get(n) or ()
        if c:
            out[i] = c; src["carriere"] += 1
        elif hit:
            out[i] = hit; src["squadra"] += 1
        elif len(one) == 1:
            out[i] = next(iter(one)); src["nome"] += 1
        else:
            miss += 1
    with open("foto_fm.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, separators=(",", ":"), sort_keys=True)
    print("giocatori", len(players), "id trovati", len(out), src, "ancora senza", miss)


if __name__ == "__main__":
    main()
