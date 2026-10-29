"""Stadi delle squadre di tutte le competizioni in FM_ID (per il meteo): nome dello stadio dalle partite in casa archiviate
(partite/<fm>/<stagione>.json.gz, campo i.st), coordinate dal geocoding di Open-Meteo (gratis, senza chiave) filtrato per il paese
del campionato; se lo stadio non si trova si usa la citta'/nome della squadra. Scrive stadi_ex.json = {id FotMob: {s, lat, lon}}.
Le squadre gia' trovate non si cercano di nuovo."""
import collections, gzip, json, os, re, time, unicodedata, urllib.parse, urllib.request
ROOT = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(ROOT, 'aurora-src/src/data/archive.js'), encoding='utf-8').read()
FMS = sorted({int(x) for x in re.findall(r"'?[\w-]+'?:\s*(\d+)", re.search(r'FM_ID\s*=\s*\{(.*?)\}', src, re.S).group(1))})
idx = json.load(open(os.path.join(ROOT, 'arch', 'index.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'stadi_ex.json')
try: known = json.load(open(OUT, encoding='utf-8'))
except Exception: known = {}
miss = known.pop('_miss', {})  # ricerche fallite: si riprovano dopo una settimana
TODAY = time.strftime('%Y-%m-%d')
WEEK_AGO = time.strftime('%Y-%m-%d', time.gmtime(time.time() - 7 * 86400))
# squadre con lo stadio FotMob gia' nella rosa (update_rose.py): non serve cercarle
try: in_rose = {str(v.get('id')) for v in json.load(open(os.path.join(ROOT, 'rose.json'), encoding='utf-8')).values() if isinstance(v, dict) and v.get('v')}
except Exception: in_rose = set()
CUPS_INTL = {42, 73, 10216}

def plain(s):
    s = unicodedata.normalize('NFD', str(s or '').lower())
    return ''.join(c for c in s if not unicodedata.combining(c))

def geo(q, country):
    url = 'https://geocoding-api.open-meteo.com/v1/search?' + urllib.parse.urlencode({'name': q, 'count': 10, 'language': 'en'})
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'scalperlab'}), timeout=20))
    except Exception:
        return None
    for r in d.get('results') or []:
        if not country or plain(r.get('country')) == plain(country):
            return {'lat': round(r['latitude'], 4), 'lon': round(r['longitude'], 4)}
    return None

# stadio piu' usato in casa da ogni squadra (stagione in corso, altrimenti la precedente)
want = {}
for fm in FMS:
    e = idx.get(str(fm)) or {}
    country = None if fm in CUPS_INTL else e.get('cn')
    for sk in sorted(e.get('s') or [], reverse=True)[:2]:
        p = os.path.join(ROOT, 'partite', str(fm), f'{sk}.json.gz')
        if not os.path.exists(p): continue
        try: det = json.load(gzip.open(p, 'rt', encoding='utf-8'))
        except Exception: continue
        season = {}
        try: season = json.load(open(os.path.join(ROOT, 'arch', str(fm), f'{sk}.json'), encoding='utf-8'))
        except Exception: pass
        names = season.get('teams') or {}
        cnt = collections.defaultdict(collections.Counter)
        for m in (det.get('m') or {}).values():
            h = (m or {}).get('h') or {}
            st = ((m or {}).get('i') or {}).get('st')
            if h.get('id') is not None and st: cnt[str(h['id'])][st] += 1
        for tid, c in cnt.items():
            if tid not in want: want[tid] = (c.most_common(1)[0][0], names.get(tid, ''), country)
new = 0
for tid, (stadium, team, country) in want.items():
    if tid in known or tid in in_rose or miss.get(tid, '') > WEEK_AGO: continue
    hit = geo(stadium, country)
    if not hit:
        short = re.sub(r'\b(stadium|stadion|stadio|arena|park|ground|estadio|estádio|stade|stadionul|municipal|de|do|da|del)\b', ' ', stadium, flags=re.I).strip()
        hit = (short and short != stadium and geo(short, country)) or None
    if not hit and team:
        city = re.sub(r'\b(fc|cf|sc|ac|afc|fk|sk|cd|ud|sd|club|deportivo|real|atletico|sporting|united|city|b|ii)\b', ' ', team, flags=re.I).strip()
        hit = geo(city, country) if city else None
    if hit:
        known[tid] = {'s': stadium, **hit}
        new += 1
        miss.pop(tid, None)
    else:
        miss[tid] = TODAY
    time.sleep(0.15)
known_out = dict(sorted(known.items(), key=lambda x: int(x[0])))
known_out['_miss'] = miss
json.dump(known_out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(want), 'squadre con stadio,', len(known), 'con coordinate,', new, 'nuove')
