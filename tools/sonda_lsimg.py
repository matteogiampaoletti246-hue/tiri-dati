import urllib.request, json, datetime
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "image/*,*/*", "Referer": "https://www.livescore.com/"}
B = "https://prod-cdn-public-api.livescore.com/v1/api/app/"
ymd = datetime.datetime.utcnow().strftime("%Y%m%d")
day = json.load(urllib.request.urlopen(urllib.request.Request(B + "date/soccer/" + ymd + "/1?countryCode=GB&locale=en&MD=1", headers={"User-Agent": "Mozilla/5.0"}), timeout=20))
img = None
for st in day.get("Stages", []):
    for x in st.get("Events", []):
        ln = json.load(urllib.request.urlopen(urllib.request.Request(B + "lineups/soccer/" + str(x["Eid"]) + "?locale=en", headers={"User-Agent": "Mozilla/5.0"}), timeout=20))
        for t in ln.get("Lu") or []:
            for p in t.get("Ps") or []:
                if p.get("imageUrl"): img = p["imageUrl"]; break
            if img: break
        if img: break
    if img: break
print("img", img)
for b in ["https://lsm-static-prod.livescore.com/high/enet/", "https://lsm-static-prod.livescore.com/medium/enet/", "https://lsm-static-prod.livescore.com/high/", "https://lsm-static-prod.livescore.com/medium/",
          "https://lsm-static-prod.livescore.com/players/", "https://lsm-static-prod.livescore.com/high/players/", "https://lsm-static-prod.livescore.com/medium/players/",
          "https://lsm-static-prod.livescore.com/high/enet/players/", "https://storage.livescore.com/images/player/high/", "https://lsm-static-prod.livescore.com/players/high/",
          "https://lsm-static-prod.livescore.com/players/medium/", "https://static.livescore.com/players/", "https://lsm-static-prod.livescore.com/v1/players/", "https://lsm-static-prod.livescore.com/high/player/"]:
    try:
        r = urllib.request.urlopen(urllib.request.Request(b + img, headers=UA), timeout=15); bb = r.read()
        print("OK", r.status, len(bb), r.headers.get("Content-Type"), b)
    except Exception as e:
        print("NO", getattr(e, "code", str(e)[:30]), b)
