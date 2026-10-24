#!/usr/bin/env python3
"""Statistiche extra, calcolate SOLO dai file match/<id>.json (nessuna chiamata API):
  stats_ex.json   -> statistiche complete di ogni giocatore (stagione e ultime 5), ruoli veri, coppe comprese
  squadre_ex.json -> statistiche di squadra per campionato e coppa (fatte / subite, totale / casa / trasferta)
Va lanciato dopo update_players.py."""
import json, os, glob, re, unicodedata
from datetime import datetime, timezone

META_FILE = "player_keys.json"
PCT = re.compile(r"\((-?\d+(?:\.\d+)?)%\)")
BASE = {"minutes_played", "rating_title"}


def norm(s):
    s = unicodedata.normalize("NFD", str(s or "").lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn").replace("-", " ").replace(".", " ").replace("'", " ").strip()


def nk(s):
    return " ".join(norm(s).split())


def num(v):
    try:
        return float(str(v).replace(",", ".").split("(")[0].strip())
    except Exception:
        return None


def load_matches():
    out = []
    for f in glob.glob("match/*.json"):
        try:
            d = json.load(open(f))
        except Exception:
            continue
        if d.get("id") and d.get("d"):
            out.append(d)
    out.sort(key=lambda d: d["d"])
    return out


# ---------- ruoli dalle formazioni ----------
def role_map(matches):
    st, su = {}, {}
    for d in matches:
        for side, team in (("h", d.get("h")), ("a", d.get("a"))):
            lu = ((d.get("lu") or {}).get(side)) or {}
            for r in lu.get("st", []) or []:
                if len(r) < 4 or r[3] is None:
                    continue
                x = r[3]
                k = 0 if x <= 0.15 else 1 if x < 0.45 else 2 if x < 0.8 else 3
                st.setdefault((nk(r[0]), team), [0, 0, 0, 0])[k] += 1
            for r in lu.get("su", []) or []:
                if len(r) < 3 or not isinstance(r[2], int) or not (0 <= r[2] <= 3):
                    continue
                su.setdefault((nk(r[0]), team), [0, 0, 0, 0])[r[2]] += 1
    return st, su


def pos_of(key, st, su):
    for src in (st, su):
        v = src.get(key)
        if v and max(v) > 0:
            return "PDCA"[v.index(max(v))]
    return None


# ---------- giocatori ----------
def players(matches, meta):
    P = {}
    cols = {}
    for d in matches:
        cards = {}
        for e in d.get("ev") or []:
            if e[0] in ("yellowcard", "redcard", "yellowredcard") and e[5]:
                c = cards.setdefault((nk(e[5]), e[4]), [0, 0])
                c[0 if e[0] == "yellowcard" else 1] += 1
        for row in d.get("ps") or []:
            name, side, full = row
            team = d["h"] if side == "h" else d["a"]
            mn = full.get("minutes_played")
            mn = mn[0] if isinstance(mn, list) else mn
            if not mn or mn <= 0:
                continue
            o = P.setdefault((nk(name), team, d["lg"]), {"n": name, "t": team, "lg": d["lg"], "m": []})
            c = cards.get((nk(name), side), [0, 0])
            o["m"].append((d["d"], full, mn, c))
            for k, v in full.items():
                if k in BASE:
                    continue
                cols[k] = cols.get(k, 0) + 1
                if isinstance(v, list):
                    cols[k + "|t"] = cols.get(k + "|t", 0) + 1
    return P, cols


def col_order(cols, meta):
    base = [k for k in cols if not k.endswith("|t")]
    gorder = {}
    for k in base:
        g = (meta.get(k) or ["", "", "", 0])[1]
        gorder.setdefault(g, len(gorder))
    base.sort(key=lambda k: (gorder.get((meta.get(k) or ["", "", "", 0])[1], 99), -cols[k]))
    out = []
    for k in base:
        out.append(k)
        if k + "|t" in cols:
            out.append(k + "|t")
    return out


def players_out(P, cols, meta, st, su):
    order = col_order(cols, meta)
    rows = []
    for (kn, team, lg), o in P.items():
        ms = sorted(o["m"], key=lambda x: x[0], reverse=True)

        def agg(sub):
            vals = [0.0] * len(order)
            mins, yc, rc, rs, rw = 0.0, 0, 0, 0.0, 0.0
            for d, full, mn, c in sub:
                mins += mn
                yc += c[0]; rc += c[1]
                r = full.get("rating_title")
                r = r[0] if isinstance(r, list) else r
                if isinstance(r, (int, float)) and r > 0:
                    rs += r * mn; rw += mn
                for i, k in enumerate(order):
                    kk = k[:-2] if k.endswith("|t") else k
                    v = full.get(kk)
                    if v is None:
                        continue
                    if k.endswith("|t"):
                        if isinstance(v, list):
                            vals[i] += v[1]
                    else:
                        vals[i] += (v[0] if isinstance(v, list) else v) * (mn if (meta.get(kk) or ["", "", ""])[2].lower().find("percent") >= 0 and not isinstance(v, list) else 1)
            for i, k in enumerate(order):
                kk = k[:-2] if k.endswith("|t") else k
                if (meta.get(kk) or ["", "", ""])[2].lower().find("percent") >= 0 and not k.endswith("|t") and mins > 0:
                    vals[i] = vals[i] / mins
            return [round(v, 2) if v % 1 else int(v) for v in vals], int(mins), len(sub), yc, rc, round(rs / rw, 2) if rw else None

        sv, smin, sg, syc, src, srat = agg(ms)
        lv, lmin, lg5, lyc, lrc, _ = agg(ms[:5])
        pos = pos_of((kn, team), st, su)
        rows.append([o["n"], team, lg, pos, sg, smin, srat, syc, src, lg5, lmin, lyc, lrc, sv, lv])
    rows.sort(key=lambda r: (r[2], r[1], r[0]))
    lab = {k: (meta.get(k[:-2] if k.endswith("|t") else k) or ["", "", "", 0])[:3] for k in order if not k.endswith("|t")}
    return {"updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "cols": order, "lab": lab,
            "head": ["n", "t", "lg", "pos", "g", "min", "rat", "y", "r", "l5g", "l5min", "l5y", "l5r", "s", "l5"], "rows": rows}


# ---------- squadre ----------
def teams(matches):
    T = {}      # lg -> team -> key -> [ [for tot, home, away], [vs ...] ] come somme/conteggi
    labels = {}

    def put(lg, team, key, side, mine, theirs):
        cell = T.setdefault(lg, {}).setdefault(team, {}).setdefault(key, [[[0, 0], [0, 0], [0, 0]], [[0, 0], [0, 0], [0, 0]]])
        for w in (0, 1 if side == "h" else 2):
            cell[0][w][0] += mine; cell[0][w][1] += 1
            cell[1][w][0] += theirs; cell[1][w][1] += 1

    for d in matches:
        gs = (d.get("st") or {}).get("all") or []
        if not gs:
            continue
        lg = d["lg"]
        vals = {}
        for g in gs:
            for t, h, a, k in g["i"]:
                labels.setdefault(k, t)
                hv, av = num(h), num(a)
                if hv is None or av is None:
                    continue
                vals[k] = (hv, av)
                ph, pa = PCT.search(str(h)), PCT.search(str(a))
                if ph and pa:
                    vals[k + "%"] = (float(ph.group(1)), float(pa.group(1)))
        if "accurate_passes" in vals and "passes" in vals and vals["passes"][0] > 0 and vals["passes"][1] > 0:
            vals["passes%"] = (100 * vals["accurate_passes"][0] / vals["passes"][0], 100 * vals["accurate_passes"][1] / vals["passes"][1])
        if d.get("sh") is not None and d.get("sa") is not None:
            vals["goals"] = (float(d["sh"]), float(d["sa"]))
        for k, (hv, av) in vals.items():
            put(lg, d["h"], k, "h", hv, av)
            put(lg, d["a"], k, "a", av, hv)
    out = {}
    for lg, tm in T.items():
        for team, ks in tm.items():
            o = {}
            for k, cell in ks.items():
                o[k] = [[[round(c[0] / c[1], 2), c[1]] if c[1] else None for c in cell[s]] for s in (0, 1)]
            out.setdefault(lg, {})[team] = o
    return out, labels


def main():
    meta = json.load(open(META_FILE)) if os.path.exists(META_FILE) else {}
    matches = load_matches()
    st, su = role_map(matches)
    P, cols = players(matches, meta)
    px = players_out(P, cols, meta, st, su)
    json.dump(px, open("stats_ex.json", "w"), ensure_ascii=False, separators=(",", ":"))
    tm, labels = teams(matches)
    json.dump({"updated_at": px["updated_at"], "lab": labels, "lg": tm}, open("squadre_ex.json", "w"), ensure_ascii=False, separators=(",", ":"))
    # ruoli per chi non e' nelle partite con 'ps' (solo ruoli): salvati dentro stats_ex come mappa nome|squadra
    roles = {}
    for key in set(list(st.keys()) + list(su.keys())):
        p = pos_of(key, st, su)
        if p:
            roles[key[0] + "|" + nk(key[1])] = p
    json.dump(roles, open("ruoli.json", "w"), ensure_ascii=False, separators=(",", ":"))
    print("giocatori:", len(px["rows"]), "colonne:", len(px["cols"]), "- squadre:", sum(len(v) for v in tm.values()), "- ruoli:", len(roles))


if __name__ == "__main__":
    main()
