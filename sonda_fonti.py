#!/usr/bin/env python3
"""Sonda: quali fonti dati sono raggiungibili dai server GitHub e cosa forniscono. Scrive sonda_fonti.json."""
import json, time, urllib.request, re

UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,text/html,*/*", "Accept-Language": "en-US,en;q=0.9"}
OUT = {}


def fetch(name, url, headers=None, keep=400, parse=None):
    t = time.time()
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={**UA, **(headers or {})}), timeout=30)
        body = r.read()
        e = {"status": r.status, "bytes": len(body), "ctype": r.headers.get("content-type"), "sec": round(time.time() - t, 1), "head": body[:keep].decode("utf8", "replace")}
        if parse:
            try:
                e["info"] = parse(body)
            except Exception as ex:
                e["info_err"] = str(ex)[:200]
    except Exception as ex:
        e = {"errore": str(ex)[:200], "sec": round(time.time() - t, 1)}
    OUT[name] = e
    print(name, e.get("status"), e.get("errore", ""), e.get("bytes"))
    return e


def fm_all(b):
    j = json.loads(b)
    pop = j.get("popular") or []
    cs = j.get("countries") or []
    n = sum(len(c.get("leagues") or []) for c in cs)
    return {"chiavi": list(j.keys()), "popolari": len(pop), "paesi": len(cs), "campionati_totali": n, "esempio_paese": [(c.get("ccode"), c.get("name"), len(c.get("leagues") or [])) for c in cs[:6]]}


def fm_league(b):
    j = json.loads(b)
    d = {"chiavi": list(j.keys())}
    det = j.get("details") or {}
    d["nome"] = det.get("name"); d["stagione_sel"] = det.get("selectedSeason")
    d["stagioni"] = [s if isinstance(s, str) else s.get("name") for s in (j.get("allAvailableSeasons") or j.get("seasons") or [])][:30]
    fx = (j.get("fixtures") or {}).get("allMatches") or []
    d["partite"] = len(fx)
    d["stats_chiavi"] = list((j.get("stats") or {}).keys())
    return d


def csvinfo(b):
    t = b.decode("latin1").splitlines()
    return {"righe": len(t), "colonne": t[0][:400]}


def main():
    fetch("fotmob_allLeagues", "https://www.fotmob.com/api/allLeagues?locale=en&country=ITA", parse=fm_all)
    fetch("fotmob_league_2425", "https://www.fotmob.com/api/data/leagues?id=47&season=2024%2F2025&ccode3=ITA", parse=fm_league)
    fetch("fotmob_league_brasileirao", "https://www.fotmob.com/api/data/leagues?id=268&ccode3=ITA", parse=fm_league)
    fetch("fotmob_league_mls", "https://www.fotmob.com/api/data/leagues?id=130&ccode3=ITA", parse=fm_league)
    fetch("fotmob_league_wc", "https://www.fotmob.com/api/data/leagues?id=77&ccode3=ITA", parse=fm_league)
    fetch("fotmob_matchDetails", "https://www.fotmob.com/api/data/matchDetails?matchId=4506555")
    fetch("fotmob_stats_team_season", "https://data.fotmob.com/stats/47/season/23685/expected_goals_team.json")
    for sl, u in [("football_data_co_uk_E0", "https://www.football-data.co.uk/mmz4281/2425/E0.csv"), ("football_data_co_uk_BRA", "https://www.football-data.co.uk/new/BRA.csv"), ("football_data_co_uk_USA", "https://www.football-data.co.uk/new/USA.csv"), ("football_data_co_uk_E1_9394", "https://www.football-data.co.uk/mmz4281/9394/E0.csv")]:
        fetch(sl, u, parse=csvinfo, keep=150)
    fetch("espn_leagues", "https://sports.core.api.espn.com/v2/sports/soccer/leagues?limit=400", keep=300)
    fetch("espn_scoreboard_arg", "https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard", keep=300)
    fetch("espn_standings_mls", "https://site.api.espn.com/apis/v2/sports/soccer/usa.1/standings", keep=300)
    fetch("espn_scoreboard_2425", "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=20250118", keep=300)
    fetch("sofascore_tournaments", "https://api.sofascore.com/api/v1/unique-tournament/17/seasons")
    fetch("sofascore_app", "https://www.sofascore.com/api/v1/unique-tournament/17/seasons")
    fetch("onefootball", "https://onefootball.com/en/competition/premier-league-9/table")
    fetch("livescore", "https://prod-cdn-public-api.livescore.com/v1/api/app/date/soccer/20261026/1?countryCode=IT&locale=en")
    fetch("understat", "https://understat.com/getLeagueData/EPL/2025", headers={"X-Requested-With": "XMLHttpRequest", "Referer": "https://understat.com/league/EPL/2025"})
    fetch("fbref", "https://fbref.com/en/comps/9/Premier-League-Stats")
    fetch("transfermarkt", "https://www.transfermarkt.com/premier-league/startseite/wettbewerb/GB1")
    fetch("openfootball", "https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/en.1.json", keep=150)
    fetch("thesportsdb", "https://www.thesportsdb.com/api/v1/json/3/all_leagues.php", keep=200)
    json.dump(OUT, open("sonda_fonti.json", "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
