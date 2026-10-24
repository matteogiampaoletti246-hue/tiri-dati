#!/usr/bin/env python3
"""Prova API-Football: piano, stagioni accessibili, arbitro delle prossime partite. Scrive diag_apifootball.json (poche richieste)."""
import json, os, sys, urllib.request

KEY = os.environ.get("API_FOOTBALL_KEY", "")
BASE = "https://v3.football.api-sports.io"


def get(path):
    req = urllib.request.Request(BASE + path, headers={"x-apisports-key": KEY})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"errore": str(e)[:200]}


def main():
    if not KEY:
        sys.exit("Manca il secret API_FOOTBALL_KEY")
    out = {"status": get("/status")}
    for nome, lid in (("serie-a", 135), ("premier-league", 39), ("la-liga", 140), ("bundesliga", 78), ("ligue-1", 61)):
        for season in (2026, 2025):
            j = get(f"/fixtures?league={lid}&season={season}&next=6")
            fx = j.get("response") or []
            out[f"{nome}_{season}"] = {
                "errori": j.get("errors"), "n": len(fx),
                "partite": [{"data": (x.get("fixture") or {}).get("date"), "match": ((x.get("teams") or {}).get("home") or {}).get("name", "") + " - " + ((x.get("teams") or {}).get("away") or {}).get("name", ""), "arbitro": (x.get("fixture") or {}).get("referee")} for x in fx],
            }
            if fx:
                break
    json.dump(out, open("diag_apifootball.json", "w"), ensure_ascii=False, indent=1)
    print("scritto diag_apifootball.json")


if __name__ == "__main__":
    main()
