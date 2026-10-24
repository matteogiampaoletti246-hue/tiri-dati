#!/usr/bin/env python3
"""Nazionalita' degli arbitri delle coppe europee da FotMob -> refcc.json {"r": {nome: codice}, "_m": [id partite finite gia' lette]}.
Legge le partite di Champions, Europa e Conference League (FotMob 42, 73, 10216); per ogni partita finita (o in programma nei prossimi giorni) legge l'arbitro."""
import json, os, time, urllib.request
from datetime import datetime, timezone, timedelta

UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*", "Accept-Language": "en-US,en;q=0.9"}
OUT = "refcc.json"
IDS = [42, 73, 10216]
MAX_MIN = float(os.environ.get("MAX_MIN", "25"))
T0 = time.time()


def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.load(r)
        except Exception as e:
            print("  errore", url[-40:], str(e)[:80]); time.sleep(2 + i * 2)
    return None


def main():
    d = json.load(open(OUT)) if os.path.exists(OUT) else {}
    refs = d.get("r", {}); done = set(d.get("_m", []))
    now = datetime.now(timezone.utc)
    todo = []
    for lid in IDS:
        j = get("https://www.fotmob.com/api/data/leagues?id=%d&ccode3=ITA&timezone=Europe%%2FRome" % lid)
        fx = ((j or {}).get("fixtures") or {}).get("allMatches") or []
        print(lid, len(fx), "partite")
        for x in fx:
            st = x.get("status") or {}
            if st.get("cancelled") or x["id"] in done:
                continue
            try:
                t = datetime.fromisoformat(str(st.get("utcTime")).replace("Z", "+00:00"))
            except Exception:
                continue
            if st.get("finished") or (t - now) < timedelta(days=10):
                todo.append((x["id"], bool(st.get("finished"))))
    print(len(todo), "da leggere")
    for mid, fin in todo:
        if (time.time() - T0) / 60 > MAX_MIN:
            break
        j = get("https://www.fotmob.com/api/data/matchDetails?matchId=%s" % mid)
        rf = (((j or {}).get("content") or {}).get("matchFacts") or {}).get("infoBox", {}).get("Referee") if j else None
        if rf and rf.get("text"):
            refs[rf["text"]] = rf.get("countryCode") or refs.get(rf["text"])
            if fin:
                done.add(mid)
        elif fin and j:
            done.add(mid)
        time.sleep(0.6)
    json.dump({"r": refs, "_m": sorted(done)}, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print("arbitri", len(refs))


main()
