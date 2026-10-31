#!/usr/bin/env python3
"""Sonda PitchAPI: per le competizioni dove FotMob non da' statistiche dei giocatori (FA Cup, Copa del Rey, Championship, Scottish Premiership...)
controlla se PitchAPI le ha (partite finite con /players pieno di tiri). Scrive sonda_giocatori.json."""
import json, sys, time, urllib.parse
from update_data import api, PAUSE, KEY

# competizioni di prova: (etichetta, paese, regex nome)
PROVE = [("FA Cup", "ENG", r"fa cup"), ("EFL Championship", "ENG", r"^championship$|efl championship"), ("League One", "ENG", r"league one"),
         ("Copa del Rey", "ESP", r"copa del rey"), ("Coupe de France", "FRA", r"coupe de france"), ("DFB Pokal", "GER", r"dfb"),
         ("Coppa Italia", "ITA", r"coppa italia"), ("Scottish Premiership", "SCO", r"premiership"), ("MLS", "USA", r"^mls$|major league soccer"),
         ("Brasileirao", "BRA", r"serie a|brasileir"), ("Liga Argentina", "ARG", r"liga profesional|primera"), ("Conference League", None, r"conference league")]


def main():
    if not KEY:
        sys.exit("Manca PITCHAPI_KEY")
    import re
    out = {"leghe_totali": 0, "prove": {}}
    leagues = (api("/v1/leagues") or {}).get("leagues", [])
    out["leghe_totali"] = len(leagues)
    out["esempio_lega"] = leagues[0] if leagues else None
    for lab, cc, rx in PROVE:
        c = [l for l in leagues if (cc is None or l.get("country_code") == cc) and re.search(rx, l.get("name", ""), re.I) and not re.search(r"women|u\d\d|youth", l.get("name", ""), re.I)]
        e = {"trovate": [(l.get("id"), l.get("name")) for l in c[:4]]}
        if c:
            lg = c[0]
            try:
                seasons = lg.get("seasons") or lg.get("available_seasons")
                e["stagioni"] = str(seasons)[:200]
                ms = (api(f"/v1/leagues/{lg['id']}/matches") or {}).get("matches", [])
                fin = [m for m in ms if m.get("status") == "finished"]
                e["partite"] = len(ms); e["finite"] = len(fin)
                if fin:
                    mid = fin[-1]["id"]
                    pl = api(f"/v1/matches/{mid}/players"); time.sleep(PAUSE)
                    lst = pl.get("players") if isinstance(pl, dict) else pl
                    e["giocatori_partita"] = len(lst or [])
                    if lst:
                        first = lst[0]
                        st = first.get("stats") or first.get("statistics") or first
                        e["esempio"] = json.dumps(st, ensure_ascii=False)[:900]
                        txt = json.dumps(lst)
                        e["ha_tiri"] = ("total_shots" in txt) or ("shots" in txt.lower())
            except Exception as ex:
                e["errore"] = str(ex)[:200]
        out["prove"][lab] = e
        print(lab, e.get("trovate"), e.get("finite"), e.get("giocatori_partita"), e.get("ha_tiri"))
        time.sleep(PAUSE)
    json.dump(out, open("sonda_giocatori.json", "w"), ensure_ascii=False, indent=1)


main()
