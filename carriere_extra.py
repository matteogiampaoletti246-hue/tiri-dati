#!/usr/bin/env python3
"""Carriere di TUTTI i giocatori: rose (campionati minori, coppe, campionati aggiunti), top 5 e indice pidx (137.906 id), da FotMob.
Ordine: prima rose e carriere.json, poi chi ha giocato la stagione in corso, poi tutti gli altri raggruppati per shard
(ogni esecuzione completa pochi file car/: pochi commit grandi, il repository non si gonfia). car/.stato.json = quanti mancano.
Scrive car/<id FotMob % 100>.json = {id FotMob: {b, h, n, f, c, cc, mv, ce, ps, car:[...], yo:[...], nt:[...]}}.
  car = squadre senior (con prestiti), yo = giovanili, nt = nazionali; ogni riga:
  [squadra, inizio 'AAAA-MM', fine 'AAAA-MM' o '', presenze, gol, assist, tipo trasferimento (0/1), attiva (0/1), id squadra]
Riprende da dove si era fermato (salta gli id gia' presenti). Mai dati inventati: se FotMob non ha la carriera il giocatore resta senza.
Uso: python carriere_extra.py [minuti massimi, default 45]"""
import json, os, sys, threading, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'car')
MAX_MIN = float(sys.argv[1]) if len(sys.argv) > 1 else float(os.environ.get('MAX_MIN', '45'))
WORKERS = int(os.environ.get('WORKERS', '6'))
UA = {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1', 'Accept': 'application/json,*/*', 'Accept-Language': 'en-US,en;q=0.9'}
T0 = time.time()
lock = threading.Lock()
stop = threading.Event()
fails = [0]
http_err = {}  # codice -> quante volte (403/429 = limiti FotMob)


def get(url):
    for i in range(3):
        if stop.is_set():
            return None
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                fails[0] = 0
                return json.load(r)
        except urllib.error.HTTPError as e:
            with lock:
                http_err[str(e.code)] = http_err.get(str(e.code), 0) + 1
            if e.code == 404:
                return {}
            if e.code in (403, 429):
                time.sleep(8 + i * 8)
        except Exception:
            time.sleep(2 + i * 2)
    with lock:
        fails[0] += 1
        if fails[0] >= 40:  # fonte che non risponde: ci si ferma, si riprende alla prossima esecuzione
            stop.set()
    return None


def rows(items):
    out = []
    for e in (items or {}).get('teamEntries') or []:
        out.append([e.get('team'), str(e.get('startDate') or '')[:7], str(e.get('endDate') or '')[:7], e.get('appearances'), e.get('goals'), e.get('assists'),
                    1 if e.get('transferType') else 0, 1 if e.get('active') else 0, e.get('teamId')])
    return out


def slim(j):
    r = {}
    bd = (j.get('birthDate') or {}).get('utcTime')
    if bd: r['b'] = bd[:10]
    for i in j.get('playerInformation') or []:
        k = i.get('translationKey'); v = i.get('value') or {}
        if k == 'height_sentencecase': r['h'] = v.get('numberValue')
        elif k == 'shirt': r['n'] = v.get('numberValue')
        elif k == 'preferred_foot': r['f'] = v.get('key')
        elif k == 'country_sentencecase': r['c'] = v.get('fallback'); r['cc'] = i.get('countryCode')
        elif k == 'transfer_value': r['mv'] = v.get('numberValue')
        elif k == 'contract_end': r['ce'] = v.get('dateValue')
    ps = ((j.get('positionDescription') or {}).get('positions')) or []
    if ps: r['ps'] = (ps[0].get('strPosShort') or {}).get('label')
    ci = (j.get('careerHistory') or {}).get('careerItems') or {}
    r['car'] = rows(ci.get('senior'))
    yo = rows(ci.get('youth'))
    nt = rows(ci.get('national team'))
    if yo: r['yo'] = yo
    if nt: r['nt'] = nt
    return r


def main():
    os.makedirs(OUT, exist_ok=True)
    shards = {}
    for i in range(100):
        p = os.path.join(OUT, f'{i}.json')
        try: shards[i] = json.load(open(p, encoding='utf-8'))
        except Exception: shards[i] = {}
    have = {k for s in shards.values() for k in s}
    ids = set()
    base = set()
    rose = json.load(open(os.path.join(ROOT, 'rose.json'), encoding='utf-8'))
    for v in rose.values():
        for p in v.get('p', []):
            if p and p[0]: ids.add(str(p[0])); base.add(str(p[0]))
    try:
        for v in json.load(open(os.path.join(ROOT, 'carriere.json'), encoding='utf-8')).values():
            if v.get('fm'): ids.add(str(v['fm'])); base.add(str(v['fm']))
    except Exception:
        pass
    # indice giocatori: chi ha giocato una stagione in corso (2026, 2025-2026, 2026-2027...) prima degli altri
    recent = set()
    for i in range(100):
        try:
            px = json.load(open(os.path.join(ROOT, 'pidx', f'{i}.json'), encoding='utf-8'))
        except Exception:
            continue
        for pid, v in px.items():
            ids.add(str(pid))
            if any(isinstance(c, list) and len(c) > 1 and str(c[1])[:4] in ('2025', '2026') for c in v[1:]):
                recent.add(str(pid))
    prio = lambda k: (0 if k in base else 1 if k in recent else 2, int(k) % 100 if k not in base and k not in recent else 0, int(k))
    todo = sorted(ids - have, key=prio)
    print(len(ids), 'giocatori,', len(have), 'gia\' presenti,', len(todo), 'da scaricare', flush=True)
    done = [0]

    def save():
        with lock:
            for i, s in shards.items():
                json.dump(dict(sorted(s.items(), key=lambda x: int(x[0]))), open(os.path.join(OUT, f'{i}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

    def work(pid):
        if stop.is_set() or (time.time() - T0) / 60 > MAX_MIN:
            return
        j = get('https://www.fotmob.com/api/data/playerData?id=%s' % pid)
        if j is None:
            return
        rec = slim(j) if j else {'car': []}
        with lock:
            shards[int(pid) % 100][pid] = rec
            done[0] += 1
            n = done[0]
        if n % 500 == 0:
            save(); print(n, 'scaricati,', round((time.time() - T0) / 60, 1), 'min', flush=True)
        time.sleep(0.12)

    with ThreadPoolExecutor(WORKERS) as ex:
        list(ex.map(work, todo))
    save()
    withcar = sum(1 for s in shards.values() for v in s.values() if v.get('car'))
    left = len(todo) - done[0]
    json.dump({'mancano': left, 'nuovi': done[0], 'con_carriera': withcar, 'in_archivio': sum(len(s) for s in shards.values()),
               'fermato': bool(stop.is_set()), 'errori_http': http_err, 'quando': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())},
              open(os.path.join(OUT, '.stato.json'), 'w', encoding='utf-8'))
    print('fine:', done[0], 'nuovi,', withcar, 'con carriera,', sum(len(s) for s in shards.values()), 'in archivio,', left, 'mancano', flush=True)


if __name__ == '__main__':
    main()
