"""Nomi dei giocatori come li scrive FotMob (regola fissa 22/11/2026, richiesta utente: "i nomi scaricali tutti da FotMob").
Controllo a tappeto: per ogni giocatore con id FotMob confronta i nomi delle nostre fonti (giocatori.json, calc_extra.json, calc_tutte.json,
rose rosa/, nomi.json del vecchio "nome vero"); dove non coincidono legge la scheda FotMob (playerData) e salva il nome di FotMob.
Scrive nomi_fm.json = {id FotMob: nome FotMob} SOLO per chi ha un nome diverso in qualche fonte. L'app (data/realNames.js) mostra sempre quel
nome; gli abbinamenti restano sugli id e sui nomi delle fonti, quindi niente schede doppie e formazioni invariate.
Chi non ha id FotMob tiene il nome della fonte che lo ha (diretta.it, poi LiveScore...). A tempo: riprende da dove si e' fermato."""
import glob, json, os, time, unicodedata, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "nomi_fm.json")
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*", "Accept-Language": "en-US,en;q=0.9"}
MIN_RUN = float(os.environ.get("NOMI_MIN", "40"))
T0 = time.time()


def nk(s):
    return " ".join("".join(c for c in unicodedata.normalize("NFD", str(s or "")) if not unicodedata.combining(c)).lower().split())


def get(url):
    for i in range(3):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25))
        except Exception:
            time.sleep(1 + i * 2)
    return None


def load(p):
    try:
        return json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
    except Exception:
        return None


names = {}  # id -> set di nomi visti nelle fonti


def see(fid, n):
    try:
        fid = int(fid)
    except (TypeError, ValueError):
        return
    if fid > 0 and n:
        names.setdefault(fid, set()).add(str(n))


g = load("giocatori.json") or {}
for p in g.get("players") or []:
    see(p.get("f") or p.get("fm"), p.get("n"))
for x in ("calc_extra.json", "calc_tutte.json"):
    d = load(x) or {}
    for p in (d.get("players") or []) + (d.get("nat") or []):
        see(p.get("f") or p.get("fm"), p.get("n"))
for f in glob.glob(os.path.join(ROOT, "rosa", "[0-9]*.json")):
    for v in (load(os.path.relpath(f, ROOT)) or {}).values():
        for r in v.get("p") or []:
            see(r[0], r[1])
old_real = load("nomi.json") or {}
for k, r in old_real.items():
    if isinstance(r, list) and r and r[0]:
        see(k, r[0])
        if len(r) > 3:
            see(k, r[3])

out = load("nomi_fm.json") or {}
done = {k for k, v in out.items() if not k.startswith("_")}
# candidati: nomi diversi tra le fonti, o un vecchio "nome vero" (Koke -> Jorge Resurreccion)
cand = [fid for fid, s in names.items() if len({nk(x) for x in s}) > 1 or (str(fid) in old_real and (old_real[str(fid)] or [None])[0])]
todo = [fid for fid in cand if str(fid) not in done]
print("giocatori con id FotMob", len(names), "con nomi diversi", len(cand), "da leggere", len(todo), flush=True)
n = 0
for fid in todo:
    if time.time() - T0 > MIN_RUN * 60:
        print("tempo finito, riprende al prossimo giro", flush=True)
        break
    j = get("https://www.fotmob.com/api/data/playerData?id=%d" % fid)
    nm = j and j.get("name")
    if nm:
        out[str(fid)] = nm
        n += 1
    time.sleep(0.15)
out["_at"] = time.strftime("%Y-%m-%dT%H:%M", time.gmtime())
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("nomi FotMob letti", n, "totale", len(out) - 1, flush=True)
