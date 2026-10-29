#!/usr/bin/env python3
"""Classifiche mancanti nell'archivio: FotMob per molte stagioni da' la classifica a gironi/conference (`tables`) e non una sola `table`,
e archivio.py salvava `table: null` (niente zone ne' leggenda nell'app). Qui si riprendono e si salvano in arch/{lid}/{stagione}.json:
- un solo gruppo -> `table` + `legend` come le altre stagioni;
- piu' gruppi -> `groups: [{n, table, legend}]` (MLS East/West, gironi delle coppe, fasi finali a punti).
Riprendibile: chi ha gia' `table` o `groups` (o `nogroups`, FotMob non ha nulla) si salta. ONLY_IDS=47,130 per limitare."""
import json, os, re, sys, time, glob, gzip, urllib.request, urllib.parse
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
BUDGET = float(os.environ.get("BUDGET_MIN", "300")) * 60
ONLY = [x for x in os.environ.get("ONLY_IDS", "").split(",") if x]
T0 = time.time()


def get(url, tries=3):
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
            try: r = gzip.decompress(r)
            except Exception: pass
            return json.loads(r)
        except Exception:
            time.sleep(1.5 * (i + 1))
    return None


def tables_of(d):
    """[(nome gruppo, {all,home,away,form}, legend)] dalla risposta leagues di FotMob (tabella semplice o a gruppi)."""
    out = []
    for tb in d.get("table") or []:
        data = tb.get("data") or {}
        if isinstance(data.get("table"), dict) and data["table"].get("all"):
            out.append((data.get("leagueName") or "", {k: data["table"].get(k) for k in ("all", "home", "away", "form")}, data.get("legend")))
        for g in data.get("tables") or []:
            t = g.get("table") or {}
            if isinstance(t, dict) and t.get("all"):
                out.append((g.get("leagueName") or "", {k: t.get(k) for k in ("all", "home", "away", "form")}, g.get("legend")))
    return out


def apply(arch, groups):
    if len(groups) == 1:
        arch["table"], arch["legend"] = groups[0][1], groups[0][2]
    elif groups:
        arch["groups"] = [{"n": n, "table": t, "legend": l} for n, t, l in groups]
    for _, t, _ in groups:
        for r in t.get("all") or []:
            if r.get("id") is not None and str(r["id"]) not in arch.setdefault("teams", {}):
                arch["teams"][str(r["id"])] = r.get("shortName") or r.get("name")


def season_name(sk):
    return re.sub(r"^(\d{4})-(\d{4})", r"\1/\2", sk)


def run():
    idx = json.load(open("arch/index.json", encoding="utf-8"))
    done = filled = empty = 0
    for lid, e in idx.items():
        if ONLY and lid not in ONLY: continue
        c = e.get("c") or "INT"
        for p in sorted(glob.glob(f"arch/{lid}/*.json")):
            if p.endswith("_s.json"): continue
            if time.time() - T0 > BUDGET: print("budget finito"); return report(done, filled, empty)
            try: a = json.load(open(p, encoding="utf-8"))
            except Exception: continue
            if a.get("table") or a.get("groups") or a.get("nogroups"): continue
            sk = os.path.basename(p)[:-5]
            d = get(f"https://www.fotmob.com/api/data/leagues?id={lid}&season={urllib.parse.quote(season_name(sk))}&ccode3={c}")
            done += 1
            if not d: continue
            g = tables_of(d)
            if g: apply(a, g); filled += 1
            else: a["nogroups"] = 1; empty += 1
            json.dump(a, open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
            time.sleep(0.25)
    report(done, filled, empty)


def report(done, filled, empty):
    print(f"richieste {done}, classifiche aggiunte {filled}, senza classifica su FotMob {empty}")


if __name__ == "__main__":
    run()
