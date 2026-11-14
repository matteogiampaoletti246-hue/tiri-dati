#!/usr/bin/env python3
"""Cancello per l'aggiornamento rapido: guarda il feed live (Worker) di ieri/oggi/domani e dice se c'e' una partita
appena finita che non abbiamo ancora elaborato. Scrive "go=1" su GITHUB_OUTPUT quando conviene lanciare la catena.
Stato in dopo_partita.json: {"n": {id: volte}} (ultimi 600)."""
import json, os, sys, urllib.request
from datetime import datetime, timezone, timedelta

W = "https://scalperlab-live.matteo-giampaoletti04.workers.dev"
STATE = "dopo_partita.json"


DIAG = []


def feed(day):
    try:
        req = urllib.request.Request(f"{W}/f?date={day:%Y%m%d}", headers={"User-Agent": "scalperlab-ci"})
        return json.load(urllib.request.urlopen(req, timeout=25)).get("m") or []
    except Exception as ex:
        print("feed non letto", day, str(ex)[:100])
        DIAG.append(f"{day:%Y%m%d}: {str(ex)[:160]}")
        return []


def main():
    now = datetime.now(timezone.utc)
    st = json.load(open(STATE)) if os.path.exists(STATE) else {"n": {}}
    cnt = st.get("n") or {}
    fin = {}
    for k in (-1, 0, 1):
        for m in feed(now + timedelta(days=k)):
            if m.get("f"):
                fin[str(m["id"])] = m
    # ogni partita finita fa partire la catena fino a 3 volte (i dati dei fornitori possono arrivare con qualche minuto di ritardo)
    todo = [i for i in fin if cnt.get(i, 0) < 3]
    print(f"finite nel feed: {len(fin)}, da elaborare: {len(todo)}")
    go = bool(todo)
    for i in todo:
        cnt[i] = cnt.get(i, 0) + 1
    st["n"] = {i: cnt[i] for i in sorted(cnt, key=int)[-600:]}
    # TUTTE le competizioni (Nations League, nazionali, campionati aggiunti, coppe): il feed del Worker ne ha solo 8, ma giorni/<data>.json
    # (risultati.py, ogni 10 min) le ha tutte. Ogni partita finita nuova avvia l'aggiornamento completo (dopo_partita_dati.yml): calendario,
    # archivio partite, profili e hit rate, indici; fino a 3 giri per partita (i fornitori mandano i dati con qualche minuto di ritardo).
    dcnt = st.get("d") or {}
    fin2 = {}
    for k in (-1, 0, 1):
        pg = f"giorni/{(now + timedelta(days=k)).date().isoformat()}.json"
        try:
            for r in (json.load(open(pg, encoding="utf-8")).get("m") or []):
                if len(r) > 8 and r[8] == "f":
                    fin2[str(r[0])] = str(r[1])
        except Exception:
            pass
    todo2 = [i for i in fin2 if dcnt.get(i, 0) < 3]
    go2 = bool(todo2)
    lg = sorted({fin2[i] for i in todo2})[:25]
    for i in todo2:
        dcnt[i] = dcnt.get(i, 0) + 1
    st["d"] = {i: dcnt[i] for i in sorted(dcnt, key=int)[-1500:]}
    st["ts"] = now.isoformat()
    if go or go2:
        json.dump(st, open(STATE, "w"))
    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        open(out, "a").write(f"go={'1' if go else '0'}\ngo2={'1' if go2 else '0'}\nlg={','.join(lg)}\n")
    print("go =", int(go), "go2 =", int(go2), "competizioni:", ",".join(lg))
    try:
        json.dump({"ts": now.isoformat(), "finite": len(fin), "da_elaborare": len(todo), "errori": DIAG}, open("dopo_partita_diag.json", "w"))
    except Exception:
        pass


if __name__ == "__main__":
    main()
