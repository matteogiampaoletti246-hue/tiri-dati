#!/usr/bin/env python3
"""Cerca su Wikipedia la foto degli arbitri (campionati + coppe) e salva refphoto.json {nome: url}."""
import json, os, re, time, urllib.request, urllib.parse

UA = {"User-Agent": "ScalperLab/1.0 (https://github.com/matteogiampaoletti246-hue/tiri-dati)", "Accept": "application/json"}
OK = re.compile(r"referee|arbitro|schiedsrichter|árbitro|arbitre|football official|match official|scheidsrechter", re.I)


def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25) as r:
            return json.loads(r.read().decode("utf-8", "replace"))
    except Exception:
        return None


def norm(s):
    import unicodedata
    return re.sub(r"[^a-z ]", "", unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()).strip()


def find(name):
    last = norm(name).split()[-1] if norm(name) else ""
    for lang in ("it", "en", "de", "es", "fr"):
        q = urllib.parse.quote(name + " arbitro calcio" if lang == "it" else name + " football referee")
        j = get("https://%s.wikipedia.org/w/api.php?action=query&list=search&srsearch=%s&srlimit=3&format=json" % (lang, q))
        for hit in ((j or {}).get("query") or {}).get("search") or []:
            t = hit.get("title", "")
            if last and last not in norm(t):
                continue
            s = get("https://%s.wikipedia.org/api/rest_v1/page/summary/%s" % (lang, urllib.parse.quote(t.replace(" ", "_"))))
            if not s or s.get("type") == "disambiguation":
                continue
            txt = (s.get("description") or "") + " " + (s.get("extract") or "")[:300]
            th = (s.get("thumbnail") or {}).get("source")
            if th and OK.search(txt):
                return th
        time.sleep(0.2)
    return None


def main():
    names = set()
    try:
        names |= set((json.load(open("arbitri.json")).get("ref") or {}).keys())
    except Exception:
        pass
    try:
        names |= set((json.load(open("refcc.json")).get("r") or {}).keys())
    except Exception:
        pass
    old = {}
    if os.path.exists("refphoto.json"):
        try:
            old = json.load(open("refphoto.json"))
        except Exception:
            old = {}
    out = {"p": dict(old.get("p") or {}), "n": dict(old.get("n") or {})}
    for nm in sorted(names):
        if nm in out["p"]:
            continue
        if time.time() - (out["n"].get(nm) or 0) < 14 * 86400:
            continue
        u = find(nm)
        if u:
            out["p"][nm] = u
        else:
            out["n"][nm] = int(time.time())
        time.sleep(0.2)
    json.dump(out, open("refphoto.json", "w"), ensure_ascii=False, separators=(",", ":"))
    print("arbitri:", len(names), "con foto:", len(out["p"]))


main()
