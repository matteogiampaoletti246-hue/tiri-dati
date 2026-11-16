"""Statistiche giocatore di fonti terze (PitchAPI, LiveScore): NON stanno nel repository (e' pubblico) ma su Cloudflare KV (spazio `rose`).
Una chiave per competizione-stagione: `idx:ps/<fm>/<stagione-slug>` -> {id partita FotMob: {p, px, pn?}} (stesso formato di partite/<fm>/<stagione>.json.gz).
Indice `idx:ps/index` -> ["<fm>/<stagione-slug>", ...] (l'app legge il KV solo per quelle). Il worker serve gia' `idx:` con `/r?k=` (nessuna modifica al worker).
Serve CLOUDFLARE_API_TOKEN (+ CF_ACCOUNT, CF_NAMESPACE) negli env; senza, ogni funzione fa nulla (prove locali)."""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "tools"))

ON = bool(os.environ.get("CLOUDFLARE_API_TOKEN") and os.environ.get("CF_ACCOUNT") and os.environ.get("CF_NAMESPACE"))
INDEX = "idx:ps/index"


def slug(sk):
    return re.sub(r"[^a-z0-9]+", "-", str(sk).lower()).strip("-")


def key(fm, sk):
    return f"idx:ps/{fm}/{slug(sk)}"


def load(fm, sk):
    if not ON:
        return {}
    from rose_livescore import kv_get
    return kv_get(key(fm, sk)) or {}


def save(items):
    """items: [(fm, sk, {mid: {p, px, pn?}})] -> scrive i dati e aggiorna l'indice. Ritorna True se tutto e' stato scritto."""
    if not ON or not items:
        return False
    from rose_livescore import kv_get, kv_put
    seen = {}
    for fm, sk, v in items:
        k = key(fm, sk)
        # unione con quanto c'e' ora sul KV (16/11/2026): piu' programmi (PitchAPI, LiveScore, diretta.it, eventi, statistiche di squadra) scrivono la stessa
        # chiave; si riscrivono solo i campi delle partite di questo giro, quelli scritti nel frattempo dagli altri restano
        cur = kv_get(k) or {}
        for mid, rec in (v or {}).items():
            if isinstance(rec, dict):
                cur.setdefault(mid, {}).update(rec)
        seen[k] = cur   # una sola volta per chiave (Cloudflare rifiuta lotti con chiavi doppie)
    ok = True
    ks = list(seen.items())
    for i in range(0, len(ks), 40):
        ok = kv_put(ks[i:i + 40]) and ok
    if ok:
        idx = set(kv_get(INDEX) or [])
        idx |= {k[len("idx:ps/"):] for k in seen}
        ok = kv_put([(INDEX, sorted(idx))]) and ok
    return bool(ok)


def overlay(fm, sk, d):
    """Unisce al file partite (d = {'m': {...}}) i dati del KV dove FotMob non ha `p` (per gli script di indice e controllo)."""
    for mid, v in load(fm, sk).items():
        m = d.setdefault("m", {}).setdefault(mid, {})
        if not m.get("p") and v.get("p"):
            m.update({k: x for k, x in v.items() if k not in ("e", "s", "sh", "hi")})
        if not m.get("e") and v.get("e"):
            m["e"] = v["e"]
        if not m.get("s") and v.get("s"):
            m["s"] = v["s"]
    return synth_p(d)


def synth_p(d):
    """Partite senza statistiche per giocatore (campionati minori) ma con formazioni ed eventi: presenza, minuti, gol e assist da titolari/panchina,
    sostituzioni (swap[0] entra, swap[1] esce), rossi e gol (autogol esclusi). Stessa regola di `synthP` in aurora-src/src/data/archive.js."""
    import re
    for m in (d.get("m") or {}).values():
        if not m or m.get("p") or not m.get("h") or not m.get("a") or not (m["h"].get("st")) or not (m["a"].get("st")): continue
        ev = m.get("e") if isinstance(m.get("e"), list) else []
        ev = [e for e in ev if isinstance(e, dict) and isinstance(e.get("time"), (int, float))]   # eventi di altre fonti: solo quelli con minuto
        end = max([90] + [int(e["time"]) for e in ev])
        off, on = {}, {}
        for e in ev:
            if e.get("type") == "Substitution" and isinstance(e.get("swap"), list) and len(e["swap"]) == 2 and all(isinstance(x, dict) and x.get("id") is not None for x in e["swap"]):
                on[str(e["swap"][0]["id"])] = e.get("time"); off[str(e["swap"][1]["id"])] = e.get("time")
            elif e.get("type") == "Card" and e.get("card") in ("Red", "YellowRed") and isinstance(e.get("p"), list) and e["p"]:
                k = str(e["p"][0]); off[k] = min(off.get(k, 999), e.get("time") or 0)
        p, named = {}, {}
        for side in (m["h"], m["a"]):
            for r in side.get("st") or []:
                if not isinstance(r, list) or len(r) < 2: continue
                k = str(r[0]); named[str(r[1]).lower()] = k
                p[k] = {"minutes_played": max(1, round(off.get(k, end))), "goals": 0, "assists": 0}
            for r in side.get("sb") or []:
                if not isinstance(r, list) or len(r) < 2: continue
                k = str(r[0]); named[str(r[1]).lower()] = k
                if k not in on: continue
                p[k] = {"minutes_played": max(1, round(off.get(k, end) - on[k])), "goals": 0, "assists": 0}
        for e in ev:
            if e.get("type") != "Goal" or not isinstance(e.get("p"), list) or not e["p"] or re.search("own", e.get("goalDescription") or "", re.I): continue
            g = p.get(str(e["p"][0]))
            if g: g["goals"] += 1
            nm = re.sub(r"^assist by\s+", "", e.get("assistStr") or "", flags=re.I).strip().lower()
            if not nm: continue
            k = named.get(nm)
            if not k:
                c = [x for x in named if nm in x]
                k = named[c[0]] if len(c) == 1 else None
            if k and k in p: p[k]["assists"] += 1
        m["p"] = p; m["ps"] = 1
    return d
