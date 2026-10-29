#!/usr/bin/env python3
"""Quali giocatori non hanno la foto su FotMob (images.fotmob.com/.../playerimages/<id>.png).
Controlla tutti gli id delle rose, dei top 5 (carriere.json) e delle formazioni salvate in foto.json, e scrive foto_mancanti.json
(lista ordinata degli id senza foto: l'app mostra subito l'omino senza richiedere un'immagine che non esiste).
Un id gia' controllato non si ricontrolla (foto_check_cache.json); gli id senza foto si riprovano ogni 30 giorni."""
import json, os, sys, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(ROOT, 'foto_check_cache.json')
OUT = os.path.join(ROOT, 'foto_mancanti.json')
extra = [a for a in sys.argv[1:] if a.isdigit()]


def ids_all():
    ids = set()
    try:
        for v in json.load(open(os.path.join(ROOT, 'rose.json'), encoding='utf-8')).values():
            for p in v.get('p', []):
                if p and p[0]: ids.add(str(p[0]))
    except Exception: pass
    try:
        for v in json.load(open(os.path.join(ROOT, 'carriere.json'), encoding='utf-8')).values():
            if v.get('fm'): ids.add(str(v['fm']))
    except Exception: pass
    for i in range(100):
        try: ids.update(json.load(open(os.path.join(ROOT, 'pidx', f'{i}.json'), encoding='utf-8')).keys())
        except Exception: pass
    ids.update(extra)
    return ids


def chk(i):
    for k in range(3):
        try:
            q = urllib.request.Request('https://images.fotmob.com/image_resources/playerimages/%s.png' % i, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(q, timeout=15) as x:
                return i, True
        except urllib.error.HTTPError as e:
            if e.code in (403, 404):
                return i, False
            time.sleep(1 + k)
        except Exception:
            time.sleep(1 + k)
    return i, None


def main():
    try: cache = json.load(open(CACHE, encoding='utf-8'))
    except Exception: cache = {}
    now = int(time.time())
    todo = [i for i in sorted(ids_all(), key=int) if i not in cache or (cache[i][0] == 0 and now - cache[i][1] > 30 * 86400)]
    print(len(todo), 'da controllare', flush=True)
    with ThreadPoolExecutor(10) as ex:
        for n, (i, ok) in enumerate(ex.map(chk, todo)):
            if ok is not None: cache[i] = [1 if ok else 0, now]
            if n % 2000 == 1999: json.dump(cache, open(CACHE, 'w'), separators=(',', ':')); print(n + 1, flush=True)
    json.dump(cache, open(CACHE, 'w'), separators=(',', ':'))
    miss = sorted((int(i) for i, v in cache.items() if v[0] == 0))
    json.dump(miss, open(OUT, 'w'), separators=(',', ':'))
    print(len(cache), 'controllati,', len(miss), 'senza foto', flush=True)


if __name__ == '__main__':
    main()
