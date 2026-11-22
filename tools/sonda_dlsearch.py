import json, urllib.request, urllib.parse
UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Referer": "https://www.diretta.it/", "Origin": "https://www.diretta.it"}
for q in ["Mamadou Kone", "Bamba Dieng"]:
    for u in ["https://s.livesport.services/api/v2/search/?q=%s&lang-id=6&type-ids=2&project-id=400&project-type-id=1&sport-ids=1",
              "https://s.livesport.services/api/v2/search/?q=%s&lang-id=1&type-ids=1,2,3,4&project-id=2&project-type-id=1&sport-ids=1"]:
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request(u % urllib.parse.quote(q), headers=UA), timeout=20))
            print("OK", q, u[:60], type(j).__name__, len(j))
            for x in (j if isinstance(j, list) else j.get("results", []))[:3]:
                print("  ", json.dumps({k: x.get(k) for k in ("id", "name", "type", "images", "defaultCountry", "teams", "participantTypes", "gender")}, ensure_ascii=False)[:600])
        except Exception as e:
            print("NO", q, u[:60], getattr(e, "code", str(e)[:60]))
