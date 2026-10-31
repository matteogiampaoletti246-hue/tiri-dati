"""Rose da LiveScore per i campionati dove FotMob non le ha. NON scrive nel repository: carica su Cloudflare KV (spazio `rose`).
Uso: python3 tools/rose_livescore.py <paese> <campionato>   (es. algeria ligue-1)"""
import json, os, re, sys, time, urllib.request, urllib.error, unicodedata

UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1'
BASE = 'https://www.livescore.com/en/football'


def get(url):
    for i in range(3):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'en'}), timeout=25)
            b = r.read()
            if b[:2] == b'\x1f\x8b':
                import gzip; b = gzip.decompress(b)
            return b.decode('utf8', 'ignore')
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
        except Exception:
            pass
        time.sleep(2)
    return None


def nxt(html):
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html or '', re.S)
    return json.loads(m.group(1))['props']['pageProps'] if m else None


def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def kv_get(key):
    acc, ns, tok = os.environ['CF_ACCOUNT'], os.environ['CF_NAMESPACE'], os.environ['CLOUDFLARE_API_TOKEN']
    from urllib.parse import quote
    req = urllib.request.Request(f'https://api.cloudflare.com/client/v4/accounts/{acc}/storage/kv/namespaces/{ns}/values/{quote(key, safe="")}', headers={'Authorization': 'Bearer ' + tok})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=60).read())
    except Exception:
        return None


def kv_put(items):
    acc, ns, tok = os.environ['CF_ACCOUNT'], os.environ['CF_NAMESPACE'], os.environ['CLOUDFLARE_API_TOKEN']
    body = json.dumps([{'key': k, 'value': json.dumps(v, ensure_ascii=False, separators=(',', ':'))} for k, v in items]).encode()
    req = urllib.request.Request(f'https://api.cloudflare.com/client/v4/accounts/{acc}/storage/kv/namespaces/{ns}/bulk', data=body, method='PUT',
                                 headers={'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json'})
    for i in range(3):
        try:
            r = json.loads(urllib.request.urlopen(req, timeout=60).read())
            if r.get('success'): return True
            print('KV risposta:', json.dumps(r)[:300], flush=True)
        except urllib.error.HTTPError as e:
            print('KV HTTP', e.code, e.read()[:300], flush=True)
        except Exception as e:
            print('KV errore', str(e)[:200], flush=True)
        time.sleep(3)
    return False


def main(country, comp):
    found = {}
    for suf in ('', 'table/', 'fixtures/', 'results/'):
        pg0 = nxt(get(f'{BASE}/{country}/{comp}/{suf}'))
        d = (pg0 or {}).get('initialData') or {}
        lg = (d.get('tables') or {}).get('league') or {}
        for grp in lg.values():
            for tb in (grp if isinstance(grp, list) else []):
                for t in tb.get('teams', []):
                    found.setdefault(str(t['id']), {'id': str(t['id']), 'name': t['name'], 'teamBadge': t.get('teamBadge')})
        for sec in d.get('sections') or []:
            for e in sec.get('events', []):
                for side in ('home', 'away'):
                    i, n = e.get(side + 'TeamId'), e.get(side + 'TeamName')
                    if i and n: found.setdefault(str(i), {'id': str(i), 'name': n, 'teamBadge': e.get(side + 'TeamBadge')})
        print(f'pagina "{suf}": squadre finora {len(found)}')
    teams = list(found.values())
    out, idx, miss = [], [], []
    for t in teams:
        tid, name = t['id'], t['name']
        fm = re.search(r'enet/(\d+)', t.get('teamBadge') or '')
        h = get(f'{BASE}/team/{slug(name)}/{tid}/squad/')
        pg = nxt(h)
        sq = ((pg or {}).get('initialData') or {}).get('squad') or {}
        players = []
        for role, lst in sq.items():
            if role == 'coach' or not isinstance(lst, list): continue
            for p in lst:
                players.append([p.get('id'), p.get('name'), role, p.get('shirtNumber'), p.get('countryName')])
        coach = (sq.get('coach') or [])
        if not players: miss.append(name); print('SENZA ROSA', name, tid); continue
        rec = {'src': 'livescore', 'lsId': tid, 'fm': int(fm.group(1)) if fm else None, 'n': name, 'co': [c.get('name') for c in coach if isinstance(c, dict)], 'p': players, 'at': int(time.time())}
        out.append((f'ls:{tid}', rec)); idx.append([tid, name, rec['fm'], len(players)])
        print(f'{name}: {len(players)} giocatori (FotMob id {rec["fm"]})')
        time.sleep(1)
    if out:
        out.append((f'idx:{country}/{comp}', idx))
        kv_put(out)
    print(f'caricate {len(idx)} squadre; senza rosa: {miss}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
