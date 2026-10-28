#!/usr/bin/env python3
"""Cancello per l'aggiornamento rapido: guarda il feed live (Worker) di ieri/oggi/domani e dice se c'e' una partita
appena finita che non abbiamo ancora elaborato. Scrive "go=1" su GITHUB_OUTPUT quando conviene lanciare la catena.
Stato in dopo_partita.json: {"n": {id: volte}} (ultimi 600)."""
import json, os, sys, urllib.request
from datetime import datetime, timezone, timedelta

W = "https://scalperlab-live.matteo-giampaoletti04.workers.dev"
STATE = "dopo_partita.json"


def feed(day):
    try:
        req = urllib.request.Request(f"{W}/f?date={day:%Y%m%d}", headers={"User-Agent": "scalperlab-ci"})
        return json.load(urllib.request.urlopen(req, timeout=25)).get("m") or []
    except Exception as ex:
        print("feed non letto", day, str(ex)[:100])
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
    st["ts"] = now.isoformat()
    if go:
        json.dump(st, open(STATE, "w"))
    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        open(out, "a").write(f"go={'1' if go else '0'}\n")
    print("go =", int(go))


if __name__ == "__main__":
    main()
