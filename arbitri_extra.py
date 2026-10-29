"""Arbitri designati per le partite dei campionati e coppe aggiunti (quando FotMob non li da' ancora).
Fonte: API-Football (segreto API_FOOTBALL_KEY), partite di oggi e dei 3 giorni successivi; si abbinano alle nostre (partite_extra.json)
per data e nomi delle squadre (mai una squadra B con la prima squadra). Scrive arbitri_extra.json = {id partita FotMob: {n, src, at}}.
Mai nomi inventati: senza fonte la partita resta senza arbitro. Gli errori della fonte (piano, limiti) finiscono in "_err"."""
import datetime, json, os, re, unicodedata, urllib.request
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'arbitri_extra.json')
KEY = os.environ.get('API_FOOTBALL_KEY', '')
RESERVE = {'b', 'ii', 'iii', '2', 'u17', 'u18', 'u19', 'u20', 'u21', 'u22', 'u23', 'sub', 'reserves', 'reserve', 'res', 'castilla', 'jong',
           'promesas', 'youth', 'academy', 'primavera', 'amateure', 'women', 'femenino', 'feminino', 'femminile', 'feminine', 'ladies', 'frauen', 'vrouwen'}
STOP = {'fc', 'cf', 'sc', 'ac', 'afc', 'fk', 'sk', 'cd', 'ud', 'sd', 'sv', 'kv', 'club', 'de', 'cp', 'ssc', 'us', 'as'}


def words(s):
    s = unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return [w for w in re.sub(r'[^a-z0-9]+', ' ', s).split() if w]


def same(a, b):
    wa, wb = words(a), words(b)
    if sorted(x for x in wa if x in RESERVE) != sorted(x for x in wb if x in RESERVE):
        return False
    ca, cb = ' '.join(x for x in wa if x not in STOP), ' '.join(x for x in wb if x not in STOP)
    if not ca or not cb:
        return False
    if ca == cb or ca in cb or cb in ca:
        return True
    return any(len(t) > 3 and t in cb.split() for t in ca.split())


def get(path):
    req = urllib.request.Request('https://v3.football.api-sports.io' + path, headers={'x-apisports-key': KEY})
    return json.load(urllib.request.urlopen(req, timeout=30))


try:
    old = json.load(open(OUT, encoding='utf-8'))
except Exception:
    old = {}
px = json.load(open(os.path.join(ROOT, 'partite_extra.json'), encoding='utf-8'))
now = datetime.datetime.now(datetime.timezone.utc)
todo = {}
for r in px.get('m') or []:
    mid, fm, utc, hn, an, st = r[0], r[1], r[2], r[3], r[4], r[9]
    if st != 'n':
        continue
    try:
        ts = datetime.datetime.fromisoformat(str(utc).replace('Z', '+00:00'))
    except Exception:
        continue
    if now - datetime.timedelta(hours=3) <= ts <= now + datetime.timedelta(days=3):
        todo.setdefault(ts.date().isoformat(), []).append((str(mid), hn, an))
out = {k: v for k, v in old.items() if not k.startswith('_')}
# si tengono solo le partite ancora recenti (ultimi 5 giorni)
keep = {str(r[0]) for r in px.get('m') or [] if r[2] and str(r[2])[:10] >= (now - datetime.timedelta(days=5)).date().isoformat()}
out = {k: v for k, v in out.items() if k in keep}
err, found = [], 0
if not KEY:
    err.append('manca il segreto API_FOOTBALL_KEY')
else:
    for day, rows in sorted(todo.items()):
        try:
            d = get('/fixtures?date=' + day)
        except Exception as e:
            err.append(f'{day}: {str(e)[:120]}')
            continue
        if d.get('errors'):
            err.append(f'{day}: {json.dumps(d.get("errors"))[:200]}')
        fx = d.get('response') or []
        for mid, hn, an in rows:
            if mid in out:
                continue
            hit = next((f for f in fx if (f.get('fixture') or {}).get('referee') and same(hn, ((f.get('teams') or {}).get('home') or {}).get('name')) and same(an, ((f.get('teams') or {}).get('away') or {}).get('name'))), None)
            if hit:
                ref = str(hit['fixture']['referee']).split(',')[0].strip()
                if ref:
                    out[mid] = {'n': ref, 'src': 'api-football', 'at': now.isoformat(timespec='minutes')}
                    found += 1
out['_err'] = err
out['_at'] = now.isoformat(timespec='minutes')
json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(sum(len(v) for v in todo.values()), 'partite da cercare,', found, 'arbitri nuovi,', len([k for k in out if not k.startswith('_')]), 'in archivio; errori:', err[:3])
