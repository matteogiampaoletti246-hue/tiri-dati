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
        seen[key(fm, sk)] = v   # una sola volta per chiave (Cloudflare rifiuta lotti con chiavi doppie)
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
        if not m.get("p"):
            m.update(v)
    return d
