#!/usr/bin/env python3
"""Sonda 3: statistiche stagionali passate (FotMob), dettagli partita storici, elenco file football-data. Scrive sonda3.json."""
import json, gzip, re, urllib.request, time
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*", "Accept-Language": "en-US,en;q=0.9"}
OUT = {}

def raw(url, text=False):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40)
        b = r.read()
        if b[:2] == b"\x1f\x8b":
            b = gzip.decompress(b)
        return b.decode("utf8", "replace") if text else json.loads(b)
    except Exception as e:
        return {"__err": str(e)[:200]} if not text else "ERR " + str(e)[:200]

def shape(o, d=0, maxd=3):
    if isinstance(o, dict):
        if d >= maxd: return "{...%d}" % len(o)
        return {k: shape(v, d + 1, maxd) for k, v in list(o.items())[:40]}
    if isinstance(o, list):
        return [shape(o[0], d + 1, maxd), "len=%d" % len(o)] if o else []
    return o if not isinstance(o, str) else o[:80]

def main():
    L = raw("https://www.fotmob.com/api/data/leagues?id=47&ccode3=ITA")
    st = L.get("stats") or {}
    OUT["stats_keys"] = list(st.keys())
    OUT["seasonStatLinks"] = st.get("seasonStatLinks")
    OUT["seasonsWithLinks"] = shape(st.get("seasonsWithLinks"), 0, 3)
    OUT["players_first2"] = (st.get("players") or [])[:2]
    OUT["teams_first2"] = (st.get("teams") or [])[:2]
    sw = st.get("seasonsWithLinks") or st.get("seasonStatLinks") or []
    OUT["sw_head"] = json.dumps(sw)[:1500]
    # prova a leggere una stat di stagione passata
    for it in (st.get("players") or [])[:1] + (st.get("teams") or [])[:1]:
        u = it.get("fetchAllUrl")
        if u:
            OUT["fetch_" + str(it.get("name"))] = json.dumps(raw(u))[:1200]
            m = re.search(r"season/(\d+)", u)
            OUT["url_example"] = u
    # partita storica
    M = raw("https://www.fotmob.com/api/data/matchDetails?matchId=1987037")
    OUT["match_old_keys"] = list(M.keys()) if "__err" not in M else M
    c = M.get("content") or {}
    OUT["match_old_content_keys"] = list(c.keys())
    OUT["match_old_stats"] = json.dumps((c.get("stats") or {}))[:1800]
    OUT["match_old_lineup"] = json.dumps(shape(c.get("lineup"), 0, 4))[:1500]
    OUT["match_old_shotmap"] = json.dumps(shape(c.get("shotmap"), 0, 3))[:800]
    M2 = raw("https://www.fotmob.com/api/data/matchDetails?matchId=4506555")
    OUT["match_2425_stats_head"] = json.dumps((M2.get("content") or {}).get("stats") or {})[:1200]
    # file football-data
    OUT["fd_data_page"] = raw("https://www.football-data.co.uk/data.php", True)[:200]
    h = raw("https://www.football-data.co.uk/data.php", True)
    OUT["fd_csv_links"] = sorted(set(re.findall(r'href="([^"]+\.csv)"', h)))[:200]
    h2 = raw("https://www.football-data.co.uk/downloadm.php", True)
    OUT["fd_downloadm"] = h2[:200]
    OUT["fd_all_links"] = sorted(set(re.findall(r'href="(mmz4281[^"]+|new/[^"]+|[A-Za-z]+m\.php)"', h)))[:120]
    json.dump(OUT, open("sonda3.json", "w"), ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main()
