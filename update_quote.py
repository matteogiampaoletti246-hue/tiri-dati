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
MAX_CHARGE = os.environ.get("MAX_CHARGE", "0.18")         # tetto di spesa per esecuzione (dollari)
MAX_PLAYERS = int(os.environ.get("MAX_PLAYERS", "30"))      # massimo giocatori per giorno
MIN_VOTO = float(os.environ.get("MIN_VOTO", "8.0"))        # voto minimo per chiedere le quote
MIN_MIN = float(os.environ.get("MIN_MIN", "35"))            # minuti medi minimi nelle ultime 5 partite
REF_LINE = float(os.environ.get("REF_LINE", "1.5"))       # linea usata per scegliere i giocatori di cui chiedere le quote        # tiri attesi che valgono voto 10
DAYS = int(os.environ.get("DAYS", "1"))                    # 1 = solo oggi
LEAGUES = ["Serie A", "Premier League", "La Liga", "Bundesliga", "Ligue 1", "Champions League", "Europa League"]
CUPS = {"champions-league", "europa-league"}
ROME = ZoneInfo("Europe/Rome")


def norm(x):
    x = unicodedata.normalize("NFD", str(x or "").lower())
    return re.sub(r"[^a-z0-9 ]", "", "".join(c for c in x if unicodedata.category(c) != "Mn")).strip()


def rome_day(iso):
    d = datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(ROME).strftime("%Y-%m-%d")


def pois_cdf(k, lam):
    s, t = 0.0, math.exp(-lam)
    for i in range(k + 1):
        s += t
        t = t * lam / (i + 1)
    return s


# ---------- dati di squadra (stesso calcolo dell'app) ----------
DATA = json.load(open("data.json"))["leagues"]
STRENGTH = {"eredivisie": 0.85, "super-lig": 0.85, "liga-portugal": 0.85}      # campionati meno prestigiosi (come in app.html)
TOP = ["serie-a", "premier-league", "bundesliga", "la-liga", "ligue-1"]
KEEP = TOP + ["champions-league", "europa-league"]


def lg_val(key, name, field):
    """(valore squadra, media campionato, peso campionato) come nell'app."""
    L = DATA.get(key)
    if not L or name not in L.get("teams", {}):
        return None
    h = L.get("handicap")
    v = L["teams"][name][field]
    if h:
        v = v * h if field.endswith("For") else v / h
        avg = (L.get("league_avg") or {}).get(field)
        st = 1.0
    else:
        vals = [t[field] for t in L["teams"].values()]
        avg = sum(vals) / len(vals)
        st = STRENGTH.get(key, 1.0)
    return v, avg, st


def adj(v, avg, s):
    return avg + (v - avg) * s if s < 1 and avg > 0 else v


def pick_key(name, prefer):
    order = ([prefer] if prefer else []) + [k for k in TOP] + ["champions-league", "europa-league"]
    return next((k for k in order if k in DATA and name in DATA[k].get("teams", {})), None)


def team_val(comp, name, field):
    cup = comp in CUPS
    key = pick_key(name, comp if cup else None)
    if not key:
        return None
    r = lg_val(key, name, field)
    if key not in CUPS:
        return r
    dk = next((k for k, v in DATA.items() if k not in CUPS and k != "nazionali" and name in v.get("teams", {})), None)
    if not dk:
        return r[0], r[1], 1.0
    d = lg_val(dk, name, field)
    return (adj(d[0], d[1], d[2]) + r[0]) / 2, (d[1] + r[1]) / 2, 1.0


def last_rows(p):
    h = p.get("h") or []
    return (h if len(h) >= 5 else (p.get("r") or []))[:5]


def lam_of(p, f, idx=0):
    """Media di tiri attesa a 90' (idx 0 = tiri totali, 1 = in porta): tasso del giocatore x matchup x casa/trasferta (come il calcolatore)."""
    g = p["l"][0] + p["c"][0]
    mi = p["l"][3] + p["c"][3]
    lr = last_rows(p)
    if g < 3 or mi <= 0 or len(lr) < 3:
        return None
    mn = sum(x[2] for x in lr)
    if mn / len(lr) < MIN_MIN or mn <= 0:
        return None
    season = (p["l"][1 + idx] + p["c"][1 + idx]) / mi * 90
    l5 = sum(x[idx] for x in lr) / mn * 90
    rate = (season + l5) / 2
    comp, opp = f[3], f[1]
    fo, ag = ("sotFor", "sotAgainst") if idx else ("totalFor", "totalAgainst")
    own = team_val(comp, p["t"], fo)
    op = team_val(comp, opp, ag)
    if not own or not op:
        return None
    ro = op[0] / op[1] if op[0] > 0 and op[1] > 0 else 1
    if 0 < op[2] < 1:
        ro = 1 + (ro - 1) * op[2]
    rc = own[0] / own[1] if own[0] > 0 and own[1] > 0 else 1
    if 0 < own[2] < 1:
        rc = 1 + (rc - 1) * own[2]
    lam = rate * ro ** 0.85 * rc ** 0.35 * (1.06 if f[2] == 1 else 0.94)
    return lam if lam > 0 else None


def voto_of(lam):
    """Voto = probabilita' del modello (senza hit rate) di fare piu' di REF_LINE tiri, x 10."""
    return max(0.0, min(1.0, 1 - pois_cdf(int(math.floor(REF_LINE)), lam))) * 10


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
    pool = {}
    for day in days:
        cand = []
        for p in players:
            fl = [x for x in fix.get(p["t"], []) if rome_day(x[0]) == day]
            if not fl:
                continue
            lam = lam_of(p, fl[-1])
            if lam is not None and voto_of(lam) >= MIN_VOTO:
                cand.append((lam, p["i"]))
        for lam, pid in sorted(cand, reverse=True)[:MAX_PLAYERS]:
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
