#!/usr/bin/env python3
"""Tiri con posizione da ESPN per le partite dove FotMob non ha la mappa tiri (regola: dove la prima fonte non arriva si vede la seconda).
Per ogni partita di `partite/<fm>/<stagione>.json.gz` con tiri nelle statistiche dei giocatori ma `sx` vuota, cerca la partita su ESPN (data + nomi squadre,
come `falli_coppie.py`), legge la cronaca (tiri con X/Y, parato/fuori/murato/gol/palo, piede/testa, situazione dal testo) e la salva nello stesso formato di `sx`:
  sxe/<id FotMob>/<stagione>.json.gz = { "<id partita>": [[min, recupero, idSquadra, idGiocatore, x, y, tipo, murato, inPorta, bx, by, gy, gz, xG, xGOT, parte, situazione, 0, tempo, idGiocatore], ...] }
Si salvano solo id e numeri (mai il testo della cronaca). Una partita entra solo se ESPN ha quasi tutti i tiri (>= 85% di quelli delle statistiche FotMob):
altrimenti resta `[]` (gia' provata) e la mappa non disegna nulla, mai tiri inventati o a meta'. xG/xGOT e zona del gol ESPN non li da: restano vuoti (l'app non mostra la voce).
Coordinate: ESPN ha due versioni. A) 0-100, X=100 sulla porta attaccata, Y basso = destra di chi tira (partite dal 2026); B) 0-1, X = distanza dalla porta attaccata in mezzi campi (0 = porta), Y alto = destra
(partite fino al 2025). Verificate su centinaia di tiri ("from the right side of the box", gol di testa dal centro area: mediana X gol 90 in A, 0,16 in B).
Uso: python tiri_espn.py [id FotMob,id FotMob...]"""
import gzip, json, os, re, sys, time
from falli_coppie import get, sim, trova, ESPN

PAUSA = float(os.environ.get("PAUSA", "0.15"))
BUDGET = float(os.environ.get("TIRI_BUDGET_MIN", "100")) * 60
DA_ANNO = int(os.environ.get("TIRI_DA", "2019"))
SOGLIA = 0.85
# id FotMob -> codice ESPN (verificati a campione il 13/11/2026: sonda in `docs/regole/giocatori-dati.md`); dove ESPN ha solo i gol la regola della soglia scarta la partita
CODICI = {111: "ned.2", 140: "esp.2", 86: "ita.2", 274: "col.1", 8814: "bra.2", 110: "fra.2", 273: "chi.1", 120: "chn.1", 268: "bra.1", 63: "rus.1", 71: "tur.1",
          109: "eng.4", 131: "per.1", 112: "arg.1", 299: "conmebol.sudamericana", 85: "den.1", 135: "gre.1", 223: "jpn.1", 536: "ksa.1", 146: "ger.2", 48: "eng.2",
          108: "eng.3", 9441: "usa.open", 189: "rou.1", 130: "usa.1", 230: "mex.1", 9067: "bra.copa_do_brazil", 87: "esp.1", 55: "ita.1", 47: "eng.1", 61: "por.1",
          54: "ger.1", 53: "fra.1", 45: "conmebol.libertadores", 59: "nor.1", 57: "ned.1", 40: "bel.1", 9305: "arg.copa", 73: "uefa.europa", 235: "ned.cup", 38: "aut.1",
          114: "fifa.friendly", 209: "ger.dfb_pokal", 132: "eng.fa", 138: "esp.copa_del_rey", 10199: "fifa.worldq.conmebol", 10198: "fifa.worldq.concacaf",
          134: "fra.coupe_de_france", 42: "uefa.champions", 289: "caf.nations", 133: "eng.league_cup", 141: "ita.coppa_italia", 10196: "fifa.worldq.caf",
          123: "sco.2", 67: "swe.1", 113: "aus.1", 142: "eng.trophy", 10197: "fifa.worldq.afc", 10607: "uefa.euroq", 126: "irl.1", 246: "ecu.1", 199: "par.1", 144: "bol.1",
          339: "ven.1", 127: "isr.1", 69: "sui.1", 9080: "kor.1", 77: "fifa.world"}
TIPO = {"shot-off-target": ("Miss", 0), "shot-on-target": ("AttemptSaved", 1), "shot-blocked": ("Blocked", 0), "shot-hit-woodwork": ("Post", 1),
        "goal": ("Goal", 1), "goal---header": ("Goal", 1), "goal---volley": ("Goal", 1), "goal---free-kick": ("Goal", 1), "penalty---scored": ("Goal", 1),
        "penalty---missed": ("Miss", 0), "penalty---saved": ("AttemptSaved", 1)}


def parte(testo, t):
    if "header" in testo.lower() or t == "goal---header":
        return "Header"
    if "right footed" in testo:
        return "RightFoot"
    if "left footed" in testo:
        return "LeftFoot"
    return "OtherBodyParts"


def situazione(testo, t):
    x = testo.lower()
    if t.startswith("penalty"):
        return "Penalty"
    if "following a corner" in x:
        return "FromCorner"
    if "free kick" in x and ("direct" in x or "from a free kick" in x or t == "goal---free-kick"):
        return "FreeKick"
    if "set piece" in x:
        return "SetPiece"
    if "fast break" in x:
        return "FastBreak"
    if "throw" in x:
        return "ThrowInSetPiece"
    return "RegularPlay"


def tiri_partita(summ, m, nomi):
    """Righe `sx` della partita da una cronaca ESPN, o None se ESPN non ha (quasi) tutti i tiri."""
    h, a = m["h"], m["a"]
    lista = {"h": [(p[0], p[1]) for k in ("st", "sb") for p in (h.get(k) or [])], "a": [(p[0], p[1]) for k in ("st", "sb") for p in (a.get(k) or [])]}
    hn, an = nomi.get(str(h["id"]), ""), nomi.get(str(a["id"]), "")
    plays = []
    for c in summ.get("commentary") or []:
        pl = c.get("play") or {}
        t = (pl.get("type") or {}).get("type")
        if t not in TIPO or not isinstance(pl.get("fieldPositionX"), (int, float)) or not isinstance(pl.get("fieldPositionY"), (int, float)):
            continue
        plays.append((c, pl, t))
    tot_fm = sum(int((v or {}).get("total_shots") or 0) for v in (m.get("p") or {}).values())
    if not tot_fm or len(plays) < SOGLIA * tot_fm:
        return None
    # versione delle coordinate: B (0-1) se in tutta la partita nessun valore supera 1
    B = max(max(abs(pl["fieldPositionX"]), abs(pl["fieldPositionY"])) for _, pl, _ in plays) <= 1.0
    rows, mancati = [], 0
    for c, pl, t in plays:
        tn = (pl.get("team") or {}).get("displayName") or ""
        lato = "h" if sim(tn, hn) >= sim(tn, an) else "a"
        parts = [(x.get("athlete") or {}).get("displayName") for x in pl.get("participants") or []]
        pid = trova(parts[0], lista[lato]) if parts and parts[0] else None
        if not pid:
            mancati += 1
            continue

        def xy(X, Y):
            # campo 0-105 x 0-68 come FotMob (attacca a destra); `y` come `sx` (poi `mapShots` la specchia): y = 68 - posizione dall'alto
            if B:
                px, py = 105 - X * 52.5, Y * 68
            else:
                px, py = X * 1.05, (100 - Y) * 0.68
            return round(min(105.0, px + 1.0), 1), round(68 - py, 1)   # +1 m: scarto medio costante misurato contro FotMob (mediana -1,0 su 800 tiri)
        x, y = xy(pl["fieldPositionX"], pl["fieldPositionY"])
        tipo, inporta = TIPO[t]
        bx = by = None
        if tipo == "Blocked" and isinstance(pl.get("fieldPosition2X"), (int, float)) and isinstance(pl.get("fieldPosition2Y"), (int, float)):
            bx, by = xy(pl["fieldPosition2X"], pl["fieldPosition2Y"])
        mn = re.match(r"(\d+)'(?:\s*\+\s*(\d+))?", (c.get("time") or {}).get("displayValue") or "")
        minuto, extra = (int(mn.group(1)), int(mn.group(2)) if mn.group(2) else None) if mn else (0, None)
        testo = c.get("text") or ""
        rows.append([minuto, extra, int((h if lato == "h" else a)["id"]), int(pid), x, y, tipo, 1 if tipo == "Blocked" else 0, 1 if inporta else 0, bx, by, None, None,
                     None, None, parte(testo, t), situazione(testo, t), 0, (pl.get("period") or {}).get("number"), int(pid)])
    if mancati > 0.15 * len(plays):
        return None
    return rows


def main():
    cod = {int(k): CODICI[int(k)] for k in (sys.argv[1].split(",") if len(sys.argv) > 1 else CODICI) if int(k) in CODICI}
    t_ini = time.time()
    resta = False
    unita = []
    for fm in cod:
        pdir = f"partite/{fm}"
        if not os.path.isdir(pdir):
            continue
        for f in os.listdir(pdir):
            if f.endswith(".json.gz") and int(f[:4]) >= DA_ANNO:
                unita.append((f[:-8], fm))
    unita.sort(key=lambda u: u[0], reverse=True)   # prima le stagioni piu' recenti
    for sk, fm in unita:
        if time.time() - t_ini > BUDGET:
            print("tempo finito: si riprende col giro dopo", flush=True)
            resta = True
            break
        d = json.load(gzip.open(f"partite/{fm}/{sk}.json.gz")).get("m") or {}
        out_f = f"sxe/{fm}/{sk}.json.gz"
        try:
            ris = json.load(gzip.open(out_f))
        except Exception:
            ris = {}
        todo = [mid for mid, m in d.items() if m and m.get("h") and m.get("a") and m.get("sx") == [] and mid not in ris
                and any(((v or {}).get("total_shots") or 0) > 0 for v in (m.get("p") or {}).values())]
        if not todo:
            continue
        try:
            fix = json.load(open(f"arch/{fm}/{sk}.json"))
        except Exception:
            continue
        nomi = fix.get("teams") or {}
        quando = {r[0]: r[4] for r in fix.get("fix") or []}
        anni = sorted({a for a in (sk[:4], sk[5:9]) if a})
        eventi = []
        for an in anni:
            sb = get(f"{ESPN}{cod[fm]}/scoreboard?dates={an}&limit=1000")
            eventi += (sb or {}).get("events") or []
        n_ok = n_no = di_fila = 0
        for mid in todo:
            if time.time() - t_ini > BUDGET:
                resta = True
                break
            if not n_ok and di_fila >= 8:
                break   # ESPN non ha i tiri di questa competizione/stagione: non si insiste
            m = d[mid]
            t0 = quando.get(mid, "")
            hn, an_ = nomi.get(str(m["h"]["id"]), ""), nomi.get(str(m["a"]["id"]), "")
            best, bs = None, 0.0
            for ev in eventi:
                if ev["status"]["type"]["state"] != "post" or ev["date"][:10] != t0[:10]:
                    continue
                cs = {c["homeAway"]: c["team"]["displayName"] for c in ev["competitions"][0]["competitors"]}
                s = sim(hn, cs.get("home")) + sim(an_, cs.get("away"))
                if s > bs:
                    best, bs = ev, s
            if not best or bs < 1.2:
                continue
            summ = get(f"{ESPN}{cod[fm]}/summary?event={best['id']}")
            time.sleep(PAUSA)
            if not summ:
                continue
            rows = tiri_partita(summ, m, nomi)
            if rows:
                ris[mid] = rows
                n_ok += 1
                di_fila = 0
            else:
                n_no += 1
                di_fila += 1
                # scartata: si segna (non si riprova) solo se la partita non e' recentissima (ESPN completa la cronaca dopo)
                if t0 and time.time() - time.mktime(time.strptime(t0[:10], "%Y-%m-%d")) > 3 * 86400:
                    ris[mid] = []
        if n_ok or n_no:
            os.makedirs(os.path.dirname(out_f), exist_ok=True)
            with gzip.open(out_f, "wt", encoding="utf-8") as fh:
                json.dump(ris, fh, separators=(",", ":"))
            print(f"{fm} {sk}: {n_ok} partite con tiri ESPN, {n_no} scartate (ESPN senza tutti i tiri)", flush=True)
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as fh:
            fh.write(f"resta={'1' if resta else '0'}\n")


if __name__ == "__main__":
    main()
