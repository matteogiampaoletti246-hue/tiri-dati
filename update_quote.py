#!/usr/bin/env python3
"""Quote Bet365 dei giocatori (tiri e tiri in porta) via Apify -> quote.json.
1) sceglie un piccolo gruppo di giocatori (pool) con un calcolo semplificato, per spendere poco;
2) chiede a Apify le quote solo per quei nomi, con un tetto di spesa per esecuzione;
3) collega le quote ai giocatori dell'app. Serve il segreto APIFY_TOKEN."""
import json, math, os, re, sys, time, unicodedata, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

TOKEN = os.environ.get("APIFY_TOKEN", "")
ACTOR = "zen-studio~bet365-player-props"
MAX_CHARGE = os.environ.get("MAX_CHARGE", "0.15")         # tetto di spesa per esecuzione (dollari)
PER_LINE = int(os.environ.get("PER_LINE", "3"))            # giocatori scelti per linea e per giorno
DAYS = int(os.environ.get("DAYS", "2"))                    # oggi + domani
MAX_P = float(os.environ.get("MAX_P", "0.75"))             # sopra questa probabilita' la quota sara' quasi di sicuro < 1,44
LINES = (0.5, 1.5, 2.5)
LEAGUES = ["Serie A", "Premier League", "La Liga", "Bundesliga", "Ligue 1", "Champions League", "Europa League"]
CUPS = {"champions-league", "europa-league"}
ROME = ZoneInfo("Europe/Rome")


def norm(x):
    x = unicodedata.normalize("NFD", str(x or "").lower())
    return re.sub(r"[^a-z0-9 ]", "", "".join(c for c in x if unicodedata.category(c) != "Mn")).strip()


def rome_day(iso):
    return datetime.fromisoformat(str(iso).replace("Z", "+00:00")).astimezone(ROME).strftime("%Y-%m-%d")


def pois_cdf(k, lam):
    s, t = 0.0, math.exp(-lam)
    for i in range(k + 1):
        s += t
        t = t * lam / (i + 1)
    return s


# ---------- dati di squadra (come nell'app, versione semplificata) ----------
DATA = json.load(open("data.json"))["leagues"]


def dom_key(name):
    for k, v in DATA.items():
        if k in CUPS or k == "nazionali":
            continue
        if name in v.get("teams", {}):
            return k
    return None


def lg_val(key, name, field):
    L = DATA.get(key)
    if not L or name not in L.get("teams", {}):
        return None
    h = L.get("handicap")
    v = L["teams"][name][field]
    if h:
        v = v * h if field.endswith("For") else v / h
    avg = (L.get("league_avg") or {}).get(field)
    if avg is None:
        vals = [t[field] for t in L["teams"].values()]
        avg = sum(vals) / len(vals)
    return v, avg


def team_val(comp, name, field):
    if comp in CUPS:
        c = lg_val(comp, name, field)
        dk = dom_key(name)
        d = lg_val(dk, name, field) if dk else None
        if c and d:
            return (c[0] + d[0]) / 2, (c[1] + d[1]) / 2
        return c or d
    r = lg_val(comp, name, field) if comp in DATA else None
    if r:
        return r
    dk = dom_key(name)
    return lg_val(dk, name, field) if dk else None


def last_rows(p):
    h = p.get("h") or []
    return (h if len(h) >= 5 else (p.get("r") or []))[:5]


def prob(p, f, line):
    """Probabilita' (modello, senza hit rate) di fare piu' di `line` tiri totali."""
    g = p["l"][0] + p["c"][0]
    mi = p["l"][3] + p["c"][3]
    lr = last_rows(p)
    if g < 3 or mi <= 0 or len(lr) < 3:
        return None
    mn = sum(x[2] for x in lr)
    if mn / len(lr) < 25 or mn <= 0:
        return None
    season = (p["l"][1] + p["c"][1]) / mi * 90
    l5 = sum(x[0] for x in lr) / mn * 90
    rate = (season + l5) / 2
    comp, opp = f[3], f[1]
    own = team_val(comp, p["t"], "totalFor")
    ag = team_val(comp, opp, "totalAgainst")
    if not own or not ag:
        return None
    ro = ag[0] / ag[1] if ag[0] > 0 and ag[1] > 0 else 1
    rc = own[0] / own[1] if own[0] > 0 and own[1] > 0 else 1
    lam = rate * ro ** 0.85 * rc ** 0.35 * (1.06 if f[2] == 1 else 0.94) * min(1.0, mn / len(lr) / 90)   # minuti attesi
    if lam <= 0:
        return None
    return max(0.0, min(1.0, 1 - pois_cdf(int(math.floor(line)), lam)))


# ---------- Apify ----------
def http(method, url, body=None):
    req = urllib.request.Request(url, method=method, headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"},
                                 data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())


def run_actor(names):
    inp = {"leagues": LEAGUES, "statTypes": "Shots", "includeAlternateLines": True, "playerNames": ", ".join(names)}
    j = http("POST", f"https://api.apify.com/v2/acts/{ACTOR}/runs?maxTotalChargeUsd={MAX_CHARGE}", inp)["data"]
    rid, t0 = j["id"], time.time()
    print("Run Apify avviata:", rid)
    while time.time() - t0 < 25 * 60:
        time.sleep(10)
        st = http("GET", f"https://api.apify.com/v2/actor-runs/{rid}")["data"]
        if st["status"] in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
            print("Stato:", st["status"], "- costo (USD):", st.get("usageTotalUsd"), st.get("chargedEventCounts"))
            ds = st["defaultDatasetId"]
            return http("GET", f"https://api.apify.com/v2/datasets/{ds}/items?clean=1&format=json&limit=5000")
    print("Tempo scaduto: run non terminata")
    return []


def main():
    if not TOKEN:
        sys.exit("Manca il segreto APIFY_TOKEN.")
    g = json.load(open("giocatori.json"))
    players, fix = g["players"], g["fix"]
    today = datetime.now(ROME).date()
    days = [(today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(DAYS)]
    pool, fday = {}, {}
    for day in days:
        cand = {l: [] for l in LINES}
        for p in players:
            f = next((x for x in fix.get(p["t"], []) if rome_day(x[0]) == day), None)
            if not f:
                continue
            for l in LINES:
                pr = prob(p, f, l)
                if pr is not None and pr <= MAX_P:
                    cand[l].append((pr, p["i"]))
        for l in LINES:
            for pr, pid in sorted(cand[l], reverse=True)[:PER_LINE]:
                pool.setdefault(pid, day)
    byid = {p["i"]: p for p in players}
    print("Giocatori scelti:", len(pool), [byid[i]["n"] for i in pool])
    if not pool:
        print("Nessun giocatore: niente richiesta a Apify.")
        return
    items = run_actor([byid[i]["n"] for i in pool])
    print("Quote ricevute:", len(items))

    idx = {}
    for pid in pool:
        idx.setdefault(norm(byid[pid]["n"]), []).append(pid)

    def match(name, team):
        n = norm(name)
        if n in idx:
            return idx[n][0]
        tk = set(n.split())
        for k, ids in idx.items():
            kt = set(k.split())
            if (tk <= kt or kt <= tk) and tk & kt and any(x for x in ids if norm(byid[x]["t"])[:4] == norm(team)[:4]):
                return ids[0]
        return None

    out = {}
    for it in items:
        if it.get("book") != "bet365" or it.get("is_live") or it.get("suspended"):
            continue
        mk = it.get("market_name")
        if mk not in ("Shots", "Shots On Target") or it.get("line") is None or not it.get("decimal_odds"):
            continue
        pid = match(it.get("player_name"), it.get("player_team"))
        if not pid or rome_day(it["game_start"]) != pool[pid]:
            continue
        e = out.setdefault(pid, {"d": pool[pid], "s": {}, "o": {}, "u": it.get("updated_at")})
        e["s" if mk == "Shots" else "o"][str(it["line"])] = round(float(it["decimal_odds"]), 3)
    json.dump({"updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "book": "bet365", "q": out},
              open("quote.json", "w"), ensure_ascii=False, separators=(",", ":"))
    print("Scritto quote.json - giocatori con quote:", len(out), "su", len(pool))


if __name__ == "__main__":
    main()
