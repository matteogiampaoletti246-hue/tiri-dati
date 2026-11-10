#!/usr/bin/env python3
"""Arbitri designati dalla UEFA (fonte piu' veloce: li pubblica prima di FotMob, ESPN, LiveScore, 365Scores).
match.uefa.com (API pubblica del sito UEFA, nessuna chiave) per oggi e i 7 giorni dopo: Nations League, qualificazioni, amichevoli tra
nazionali europee, Champions/Europa/Conference League (anche femminili e giovanili). Ogni partita UEFA si abbina a una partita dell'archivio FotMob
(arch/<fm>/<stagione>.json) con lo stesso orario di inizio e squadre con lo stesso nome (nomi uguali, o tutte le parole di uno dentro l'altro, o
stesso inizio di parola: mai "Niger"/"Nigeria"). Scrive arbitri_uefa.json = {id partita FotMob: {n: arbitro, src: 'uefa', at}}.
Mai nomi inventati: senza arbitro UEFA (ruolo REFEREE) o senza abbinamento sicuro la partita resta fuori. Se la UEFA non risponde il file non si tocca."""
import json, os, re, sys, unicodedata, urllib.request
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)
OUT = "arbitri_uefa.json"
DAYS = 7
HDR = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1",
       "Origin": "https://www.uefa.com", "Referer": "https://www.uefa.com/", "Accept": "application/json"}
STOP = {"fc", "cf", "sc", "ac", "afc", "fk", "sk", "cd", "ud", "sd", "sv", "kv", "club", "de", "cp", "ssc", "us", "as", "the", "of", "and", "ca"}


def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=HDR), timeout=40))


def words(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return [w for w in re.sub(r"[^a-z0-9]+", " ", s).split() if w and w not in STOP]


def same_team(a, b):
    wa, wb = words(a), words(b)
    if not wa or not wb:
        return False
    if wa == wb:
        return True
    sa, sb = set(wa), set(wb)
    if sa <= sb or sb <= sa:
        return True
    # Bayern Munchen / Bayern Munich: stesse prime 5 lettere di ogni parola del nome piu' corto
    short, long_ = (wa, wb) if len(wa) <= len(wb) else (wb, wa)
    return all(any(t[:5] == u[:5] for u in long_) for t in short) and all(len(t) >= 4 for t in short)


def person_name(p):
    tr = (p.get("translations") or {}).get("name") or {}
    return tr.get("EN") or p.get("name") or next(iter(tr.values()), "") or " ".join(x for x in (p.get("firstName"), p.get("lastName")) if x)


def referee_of(m):
    for r in m.get("referees") or []:
        if str(r.get("role", "")).upper() == "REFEREE":
            n = person_name(r.get("person") or {}).strip()
            if n:
                return n
    return None


def uefa_matches(day):
    out, off = [], 0
    while True:
        data = get(f"https://match.uefa.com/v5/matches?fromDate={day}&toDate={day}&limit=100&offset={off}")
        ms = data if isinstance(data, list) else data.get("matches") or data.get("data") or []
        out += ms
        if len(ms) < 100:
            return out
        off += 100


def fixtures_window(lo, hi):
    """Partite FotMob da giocare nella finestra: (utc 'YYYY-MM-DDTHH:MM', id, casa, ospite)."""
    idx = json.load(open("arch/index.json", encoding="utf-8"))
    res = []
    for fm, e in idx.items():
        for sk in (e.get("s") or [])[:2]:
            p = f"arch/{fm}/{sk}.json"
            if not os.path.exists(p):
                continue
            try:
                cal = json.load(open(p, encoding="utf-8"))
            except Exception:
                continue
            teams = cal.get("teams") or {}
            for r in cal.get("fix") or []:
                if len(r) < 5 or not r[4] or r[5]:
                    continue
                d = r[4][:10]
                if lo <= d <= hi:
                    res.append((r[4][:16], str(r[0]), teams.get(str(r[2]), ""), teams.get(str(r[3]), "")))
    return res


def main():
    today = datetime.now(timezone.utc).date()
    lo, hi = str(today - timedelta(days=1)), str(today + timedelta(days=DAYS + 1))
    fx = fixtures_window(lo, hi)
    by_time = {}
    for t, mid, h, a in fx:
        by_time.setdefault(t, []).append((mid, h, a))
    old = {}
    if os.path.exists(OUT):
        try:
            old = json.load(open(OUT, encoding="utf-8"))
        except Exception:
            old = {}
    out, seen, nomatch = {}, 0, []
    for k in range(-1, DAYS + 1):
        day = str(today + timedelta(days=k))
        for m in uefa_matches(day):
            seen += 1
            name = referee_of(m)
            if not name and m.get("id") and k <= 4:
                try:
                    full = get(f"https://match.uefa.com/v5/matches/{m['id']}")
                    name = referee_of(full[0] if isinstance(full, list) else full)
                except Exception:
                    name = None
            if not name:
                continue
            ko = ((m.get("kickOffTime") or {}).get("dateTime") or "")[:16]
            hn = (m.get("homeTeam") or {}).get("internationalName") or ""
            an = (m.get("awayTeam") or {}).get("internationalName") or ""
            hits = [c for c in by_time.get(ko, []) if same_team(hn, c[1]) and same_team(an, c[2])]
            if len(hits) == 1:
                prev = old.get(hits[0][0])
                out[hits[0][0]] = {"n": name, "src": "uefa", "at": (prev or {}).get("at") if prev and prev.get("n") == name else datetime.now(timezone.utc).isoformat(timespec="seconds")}
            else:
                nomatch.append(f"{day} {hn}-{an} ({len(hits)} abbinamenti)")
    if not seen:
        print("la UEFA non ha dato partite: file invariato")
        sys.exit(1)
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"{OUT}: {len(out)} arbitri su {seen} partite UEFA; senza abbinamento: {len(nomatch)}")
    for x in nomatch[:30]:
        print("  senza abbinamento:", x)


if __name__ == "__main__":
    main()
