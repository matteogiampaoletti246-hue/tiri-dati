import json, urllib.request, urllib.parse, gzip
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*"}
def get(u):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40).read()
        try: r = gzip.decompress(r)
        except Exception: pass
        return json.loads(r)
    except Exception as e: return {"err": str(e)}
out = {}
for s in ["2025/2026", "2023/2024", "2026/2027"]:
    d = get(f"https://www.fotmob.com/api/data/leagues?id=55&season={urllib.parse.quote(s)}&ccode3=ITA")
    st = d.get("stats") or {}
    out[s] = {"keys": list(d.keys())[:30], "stats_keys": list(st.keys()), "links": st.get("seasonStatLinks"), "players": [(x.get("fetchAllUrl")) for x in (st.get("players") or [])][:4], "details": d.get("details", {}).get("selectedSeason"), "all": d.get("allAvailableSeasons")}
    ls = st.get("seasonStatLinks") or []
    for l in ls[:3]:
        tid = l.get("TournamentId")
        j = get(f"https://data.fotmob.com/stats/55/season/{tid}/goals.json")
        tl = (j.get("TopLists") or [{}])[0].get("StatList", [{}])[:2] if isinstance(j, dict) else None
        out[s].setdefault("probe", {})[str(tid)] = [(r.get("ParticipantName"), r.get("StatValue")) for r in tl or []]
json.dump(out, open("diag_stats.json", "w"), ensure_ascii=False, indent=1)
