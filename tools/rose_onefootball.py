"""Rose da OneFootball per i campionati che LiveScore non ha abbinato (seconda fonte). Solo su Cloudflare KV, niente nel repository.
Squadre: elenco ufficiale (sitemap) -> abbinamento per nome (solo se univoco e se almeno meta' delle squadre del campionato combacia).
Chiavi: idx:lg/of/<id FotMob campionato>; mappa idx:fmmap (l, t) aggiornata. Uso: rose_onefootball.py [LIMITE]"""
import json, os, re, sys, time, unicodedata
sys.path.insert(0, os.path.dirname(__file__))
from rose_livescore import get, slug, kv_put, kv_get
from concurrent.futures import ThreadPoolExecutor

OF = 'https://onefootball.com'
STOP = {'fc', 'cf', 'sc', 'ac', 'afc', 'club', 'de', 'the', 'cd', 'sk', 'fk', 'if', 'bk', 'ud', 'sd', 'as', 'us', 'ss', 'cs', 'ca', 'cp', 'sv', 'fsv', 'tsv', 'vfl', 'vfb', 'sg', 'rc', 'rcd', 'real'}
ROLE = {'goalkeeper': 'goalkeeper', 'defender': 'defender', 'defence': 'defender', 'midfielder': 'midfielder', 'midfield': 'midfielder', 'forward': 'forward', 'attacker': 'forward', 'striker': 'forward'}


def norm(n):
    return ' '.join(w for w in slug(n).split('-') if w and w not in STOP)


def teams_index():
    root = get(f'{OF}/sitemaps/teams.xml') or ''
    shards = [u for u in re.findall(r'<loc>([^<]+)</loc>', root) if '/en_' in u]
    idx = {}
    n = 0
    for u in shards:
        x = get(u) or ''
        for url in re.findall(r'<loc>https://onefootball\.com/en/team/([a-z0-9-]+-\d+)(?:/[^<]*)?</loc>', x):
            n += 1
            sl, tid = url.rsplit('-', 1)
            idx.setdefault(norm(sl.replace('-', ' ')), set()).add((url, tid))
    print(f'OneFootball: {n} squadre in elenco, {len(idx)} nomi', flush=True)
    return idx


DBG = {'nopage': 0, 'nonext': 0, 'nolinks': 0, 'ok': 0}


def squad(url):
    h = get(f'{OF}/en/team/{url}/squad')
    if not h: DBG['nopage'] += 1; return []
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', h, re.S)
    if not m: DBG['nonext'] += 1; return []
    out = []
    for c in json.loads(m.group(1))['props']['pageProps'].get('containers', []):
        nav = (((c.get('type') or {}).get('fullWidth') or {}).get('component') or {}).get('contentType') or {}
        links = (nav.get('entityNavigation') or {}).get('links') or []
        for l in links:
            role = ROLE.get(str(l.get('subtitle', '')).strip().lower())
            mm = re.match(r'^(.*?)(?: \((\d+)\))?$', l.get('title', ''))
            pid = re.search(r'-(\d+)$', l.get('urlPath', ''))
            if role and mm and mm.group(1): out.append([int(pid.group(1)) if pid else None, mm.group(1), role, int(mm.group(2)) if mm.group(2) else None, None])
    DBG['ok' if out else 'nolinks'] += 1
    return out


def fm_teams(k, e):
    for sk in e['s']:
        f = f'arch/{k}/{sk}.json'
        if os.path.exists(f):
            t = json.load(open(f)).get('teams') or {}
            if t: return {int(i): n for i, n in t.items()}
    return {}


def main(limit):
    mp = kv_get('idx:fmmap') or {'l': {}, 't': {}}
    idx = json.load(open('arch/index.json'))
    todo = [(k, e) for k, e in idx.items() if e.get('cn') != 'Internazionale' and e.get('s') and e['s'][0][:4] in ('2026', '2025') and str(k) not in mp['l']][:limit]
    print(f'campionati senza rose: {len(todo)}', flush=True)
    tix = teams_index()
    out, ok, no = [], 0, 0
    for k, e in todo:
        fmt = fm_teams(k, e)
        hit = {}
        for i, n in fmt.items():
            c = tix.get(norm(n))
            if c and len(c) == 1: hit[i] = (n, next(iter(c)))
        if not fmt or len(hit) < max(3, len(fmt) // 2):
            no += 1; print(f'NO {e["cn"]}/{e["n"]} ({len(hit)}/{len(fmt)} nomi univoci)', flush=True); continue
        with ThreadPoolExecutor(3) as ex: sq = list(ex.map(lambda it: squad(it[1][0]), hit.items()))
        teams = []
        for (i, (n, (url, tid))), p in zip(hit.items(), sq):
            if p: teams.append({'lsId': None, 'ofId': tid, 'n': n, 'fm': i, 'co': [], 'p': p})
        if not teams: no += 1; print(f'NO {e["cn"]}/{e["n"]} (rose vuote) {DBG}', flush=True); continue
        key = f'of/{k}'
        out.append((f'idx:lg/{key}', {'fmLeague': int(k), 'src': 'onefootball', 'at': int(time.time()), 't': teams}))
        mp['l'][str(k)] = key
        for t in teams: mp['t'].setdefault(str(t['fm']), key)
        ok += 1
        print(f'OK {e["cn"]}/{e["n"]}: {len(teams)} squadre, {sum(len(t["p"]) for t in teams)} giocatori', flush=True)
        if len(out) >= 10: kv_put(out); out = []
        time.sleep(0.5)
    if out: kv_put(out)
    kv_put([('idx:fmmap', mp)])
    print(f'totale OK {ok} NO {no}; mappa: {len(mp["l"])} campionati, {len(mp["t"])} squadre', flush=True)


if __name__ == '__main__':
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 400)
