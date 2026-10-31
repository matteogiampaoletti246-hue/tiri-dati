"""Rose da LiveScore per TUTTI i campionati dell'indice (arch/index.json). Una chiave KV per campionato: idx:lg/<paese>/<campionato>.
I dati NON vanno nel repository (e' pubblico): solo su Cloudflare KV. Uso: rose_livescore_all.py [OFFSET] [LIMIT]"""
import json, os, re, sys, time
sys.path.insert(0, os.path.dirname(__file__))
from rose_livescore import get, nxt, slug, kv_put, BASE
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


def pick(cn, nm):
    toks = lambda t: set(t.split('-')) - {'league', 'liga', 'division', 'de', 'la', 'the'}
    for c in ALIAS.get(cn, [cn]):
        cands = CATALOG.get(c)
        if not cands: continue
        if nm in cands: return c, nm
        best = max(cands, key=lambda k: len(toks(k) & toks(nm)) / max(1, len(toks(k) | toks(nm))))
        sc = len(toks(best) & toks(nm)) / max(1, len(toks(best) | toks(nm)))
        if sc >= 0.5: return c, best
    return None, nm


def one(k_e):
    k, e = k_e
    cn = slug(e.get('cn') or ''); nm = slug(e['n'])
    c, nm2 = pick(cn, nm)
    if c:
        ts = teams_of(c, nm2)
        if ts:
            with ThreadPoolExecutor(3) as ex: sq = list(ex.map(squad, ts))
            return k, c, nm2, [t for t in sq if t['p']]
    return k, None, nm, []


def main(off, lim):
    catalog()
    idx = json.load(open('arch/index.json'))
    items = [(k, e) for k, e in idx.items() if e.get('cn') not in ('Internazionale',) and e.get('s') and e['s'][0].startswith('2026') and 'table' in (e.get('tabs') or [])]
    items = items[off:off + lim]
    out, rep = [], []
    for it in items:
        k, c, nm, sq = one(it)
        if sq:
            out.append((f'idx:lg/{c}/{nm}', {'fmLeague': int(k), 'at': int(time.time()), 't': sq}))
            rep.append(f'OK {c}/{nm}: {len(sq)} squadre, {sum(len(s["p"]) for s in sq)} giocatori')
        else:
            rep.append(f'NO {idx[k]["cn"]}/{idx[k]["n"]}')
        print(rep[-1], flush=True)
        if len(out) >= 10: kv_put(out); out = []
        time.sleep(0.5)
    if out: kv_put(out)
    print('totale OK', sum(r.startswith('OK') for r in rep), 'NO', sum(r.startswith('NO') for r in rep))


if __name__ == '__main__':
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 0, int(sys.argv[2]) if len(sys.argv) > 2 else 400)
