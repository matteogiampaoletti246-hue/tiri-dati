"""Rose da LiveScore per TUTTI i campionati dell'indice (arch/index.json). Una chiave KV per campionato: idx:lg/<paese>/<campionato>.
I dati NON vanno nel repository (e' pubblico): solo su Cloudflare KV. Uso: rose_livescore_all.py [OFFSET] [LIMIT]"""
import json, os, re, sys, time
sys.path.insert(0, os.path.dirname(__file__))
from rose_livescore import get, nxt, slug, kv_put, kv_get, BASE
from concurrent.futures import ThreadPoolExecutor

ALIAS = {'usa': ['usa', 'united-states'], 'united-states': ['usa', 'united-states'], 'south-korea': ['south-korea', 'korea-republic'], 'czech-republic': ['czech-republic', 'czechia'],
         'turkey': ['turkey', 'turkiye'], 'ivory-coast': ['ivory-coast', 'cote-d-ivoire'], 'bosnia-and-herzegovina': ['bosnia-and-herzegovina', 'bosnia-herzegovina']}


def teams_of(country, comp):
    found = {}
    for suf in ('', 'table/'):
        pg = nxt(get(f'{BASE}/{country}/{comp}/{suf}'))
        d = (pg or {}).get('initialData') or {}
        if not d: return None
        for grp in ((d.get('tables') or {}).get('league') or {}).values():
            for tb in (grp if isinstance(grp, list) else []):
                for t in tb.get('teams', []):
                    found.setdefault(str(t['id']), {'id': str(t['id']), 'name': t['name'], 'teamBadge': t.get('teamBadge')})
        for sec in d.get('sections') or []:
            for e in sec.get('events', []):
                for side in ('home', 'away'):
                    i, n = e.get(side + 'TeamId'), e.get(side + 'TeamName')
                    if i and n: found.setdefault(str(i), {'id': str(i), 'name': n, 'teamBadge': e.get(side + 'TeamBadge')})
        if found and suf == '' and len(found) >= 10: break
    return list(found.values())


def squad(t):
    pg = nxt(get(f'{BASE}/team/{slug(t["name"])}/{t["id"]}/squad/'))
    sq = ((pg or {}).get('initialData') or {}).get('squad') or {}
    pl = []
    for role, lst in sq.items():
        if role == 'coach' or not isinstance(lst, list): continue
        for p in lst: pl.append([p.get('id'), p.get('name'), role, p.get('shirtNumber'), p.get('countryName')])
    fm = re.search(r'enet/(\d+)', t.get('teamBadge') or '')
    co = [c.get('name') for c in (sq.get('coach') or []) if isinstance(c, dict)]
    return {'lsId': t['id'], 'n': t['name'], 'fm': int(fm.group(1)) if fm else None, 'co': co, 'p': pl}


CATALOG = {}


def catalog():
    # elenco ufficiale dei campionati di calcio di LiveScore (sitemap): paese -> {slug campionato}
    x = get(f'{BASE}/competitions/sitemap.xml') or ''
    urls = re.findall(r'<loc>https://www\.livescore\.com/en/football/([a-z0-9-]+)/([a-z0-9-]+)/?</loc>', x)
    for c, n in urls:
        if c in ('team', 'competitions', 'player'): continue
        CATALOG.setdefault(c, set()).add(n)
    print('catalogo LiveScore:', len(urls), 'campionati in', len(CATALOG), 'paesi', flush=True)


import difflib
TEAMS = {}
STOP = {'fc', 'cf', 'sc', 'ac', 'afc', 'club', 'de', 'the', 'cd', 'sk', 'fk', 'if', 'bk', 'ud', 'sd', 'as', 'us', 'ss', 'cs', 'ca'}


def norm(n):
    return ' '.join(w for w in slug(n).split('-') if w and w not in STOP)


def fm_teams(k, e):
    for sk in e['s']:
        f = f'arch/{k}/{sk}.json'
        if os.path.exists(f):
            t = json.load(open(f)).get('teams') or {}
            if t: return {int(i): n for i, n in t.items()}
    return {}


def ls_teams(c, nm):
    if (c, nm) not in TEAMS: TEAMS[(c, nm)] = teams_of(c, nm) or []
    return TEAMS[(c, nm)]


def countries(cn):
    out = list(ALIAS.get(cn, [cn]))
    if not any(c in CATALOG for c in out):
        out = difflib.get_close_matches(cn, list(CATALOG), n=2, cutoff=0.75)
    return [c for c in out if c in CATALOG]


def score(ts, fmt):
    if not ts or not fmt: return 0.0
    ids = set(fmt); names = {norm(n) for n in fmt.values()}
    hit = 0
    for t in ts:
        m = re.search(r'enet/(\d+)', t.get('teamBadge') or '')
        if (m and int(m.group(1)) in ids) or norm(t['name']) in names: hit += 1
    return hit / max(1, min(len(ts), len(fmt)))


BADGE = {}   # id FotMob (dallo stemma enet/<id>.png) -> {(paese, campionato LiveScore)}
GL = {}


def crawl():
    """Tutti i campionati dell'elenco LiveScore: squadre e id stemma. L'abbinamento si fa dagli stemmi (id FotMob), senza fidarsi dei nomi."""
    pairs = [(c, n) for c, ns in CATALOG.items() for n in sorted(ns)]
    def one_ls(cn):
        try: return cn, teams_of(*cn) or []
        except Exception: return cn, []
    with ThreadPoolExecutor(6) as ex:
        for cn, ts in ex.map(one_ls, pairs):
            GL[cn] = ts
            for t in ts:
                m = re.search(r'enet/(\d+)', t.get('teamBadge') or '')
                if m: BADGE.setdefault(int(m.group(1)), set()).add(cn)
    print(f'crawl: {len(GL)} campionati LiveScore, {len(BADGE)} stemmi', flush=True)


def one(k_e):
    k, e = k_e
    cn = slug(e.get('cn') or ''); nm = slug(e['n'])
    fmt = fm_teams(k, e)
    votes = {}
    for i in fmt:
        for c in BADGE.get(int(i), ()): votes[c] = votes.get(c, 0) + 1
    best, bs = None, 0.0
    for c, v in votes.items():
        ts = GL.get(c) or []
        sc = v / max(1, min(len(ts), len(fmt)))
        sc += 0.05 * (c[0] in countries(cn)) + 0.05 * (c[1] == nm) - 0.05 * bool(re.search(r'\d{2}$', c[1]))
        if v >= 3 and sc > bs: best, bs = c, sc
    if best is None or bs < 0.5:  # senza stemmi in comune: abbinamento per nome nello stesso paese (come prima)
        for c in countries(cn):
            for cand in sorted(CATALOG[c]):
                sc = score(GL.get((c, cand)) or [], fmt) + (0.05 if cand == nm else 0)
                if sc > bs: best, bs = (c, cand), sc
        if bs < 0.4: return k, None, nm, []
    with ThreadPoolExecutor(3) as ex: sq = list(ex.map(squad, GL[best]))
    return k, best[0], best[1], [t for t in sq if t['p']]


SEEN = set()


def main(off, lim):
    catalog()
    crawl()
    idx = json.load(open('arch/index.json'))
    items = [(k, e) for k, e in idx.items() if e.get('cn') not in ('Internazionale',) and e.get('s') and e['s'][0][:4] in ('2026', '2025')]
    items = items[off:off + lim]
    out, rep = [], []
    mapL, mapT = {}, {}
    for it in items:
        try:
            k, c, nm, sq = one(it)
        except Exception as ex:  # un campionato che fallisce non ferma gli altri
            print('ERRORE', idx[it[0]]['cn'], idx[it[0]]['n'], str(ex)[:80], flush=True); continue
        if sq:
            if any(o[0] == f'idx:lg/{c}/{nm}' for o in out) or f'{c}/{nm}' in SEEN:
                mapL[str(k)] = f'{c}/{nm}'; continue  # stessa competizione LiveScore gia' salvata (coppa con le stesse squadre)
            SEEN.add(f'{c}/{nm}')
            mapL[str(k)] = f'{c}/{nm}'
            for t in sq:
                if t.get('fm'): mapT[str(t['fm'])] = f'{c}/{nm}'
            out.append((f'idx:lg/{c}/{nm}', {'fmLeague': int(k), 'at': int(time.time()), 't': sq}))
            rep.append(f'OK {c}/{nm}: {len(sq)} squadre, {sum(len(s["p"]) for s in sq)} giocatori')
        else:
            rep.append(f'NO {idx[k]["cn"]}/{idx[k]["n"]}')
        print(rep[-1], flush=True)
        if len(out) >= 10: kv_put(out); out = []
        time.sleep(0.5)
    if out: kv_put(out)
    old = kv_get('idx:fmmap') or {'l': {}, 't': {}}
    old['l'].update(mapL); old['t'].update(mapT)
    kv_put([('idx:fmmap', old)])
    print('mappa:', len(old['l']), 'campionati,', len(old['t']), 'squadre', flush=True)
    print('totale OK', sum(r.startswith('OK') for r in rep), 'NO', sum(r.startswith('NO') for r in rep))


if __name__ == '__main__':
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 0, int(sys.argv[2]) if len(sys.argv) > 2 else 400)
