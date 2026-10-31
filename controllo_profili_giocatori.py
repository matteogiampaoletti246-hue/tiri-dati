"""Controllo profili giocatore: per ogni giocatore dell'app (stats.json: top campionati + campionati aggiunti con statistiche) simula
la ricerca dell'id FotMob come data/playerIndex.js (resolvePid: carriere.json, rose.json, rosa/, classifiche della stagione in corso)
e verifica che il profilo abbia anagrafica (car/: nascita, nazione, altezza, piede, numero, ruolo), righe stagioni (pidx/) e carriera.
Scrive controllo_profili_giocatori.json (per campionato: totali, senza id, senza anagrafica, senza stagioni; elenco dei primi 40 casi).
Uso: python controllo_profili_giocatori.py"""
import json, os, re, unicodedata, collections

ROOT = os.path.dirname(os.path.abspath(__file__))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding='utf-8'))
nm = lambda s: re.sub(r'[^a-z0-9]+', ' ', ''.join(c for c in unicodedata.normalize('NFD', str(s or '').lower().replace('ı','i').replace('ø','o').replace('ł','l').replace('đ','d').replace('ß','ss')) if unicodedata.category(c) != 'Mn')).strip()
SH = {}
def shard(d, n):
    k = (d, n)
    if k not in SH:
        try: SH[k] = J(f'{d}/{n}.json')
        except Exception: SH[k] = {}
    return SH[k]

stats = J('stats.json')
cols = stats['cols']; ix = {c: i for i, c in enumerate(cols)}
carriere = J('carriere.json')
rose = J('rose.json')
idx = J('arch/index.json') if os.path.exists(os.path.join(ROOT, 'arch/index.json')) else {}
LG_FM = {}
try:
    for line in open(os.path.join(ROOT, 'aurora-src/src/data/archive.js'), encoding='utf-8'):
        pass
    txt = open(os.path.join(ROOT, 'aurora-src/src/data/archive.js'), encoding='utf-8').read()
    m = re.search(r'export const FM_ID\s*=\s*\{([^}]*)\}', txt)
    for k, v in re.findall(r"'?([\w-]+)'?\s*:\s*(\d+)", m.group(1)): LG_FM[k] = int(v)
except Exception: pass

team_fm = {}
for t, v in rose.items():
    if v.get('id'): team_fm[nm(t)] = v['id']
def team_id(name):
    n = nm(name)
    if n in team_fm: return team_fm[n]
    for k, v in team_fm.items():
        if k.startswith(n) or n.startswith(k): return v
    return None

def season_cur(fm):
    try: return sorted([f[:-7] for f in os.listdir(os.path.join(ROOT, 'arch', str(fm))) if f.endswith('_s.json')])[-1]
    except Exception: return None

def board(fm):
    sk = season_cur(fm)
    try: return J(f'arch/{fm}/{sk}_s.json').get('players', {}) if sk else {}
    except Exception: return {}
BOARD = {}

def resolve(pid_app, name, team, lg):
    c = carriere.get(pid_app)
    if c and c.get('fm'): return str(c['fm']), 'carriere'
    n = nm(name)
    r = rose.get(team) or next((v for k, v in rose.items() if nm(k) == nm(team)), None)
    if r:
        for p in r.get('p', []):
            if nm(p[1]) == n: return str(p[0]), 'rose'
    tid = team_id(team)
    if tid:
        ro = shard('rosa', tid % 100).get(str(tid)) or {}
        for p in ro.get('p', []):
            if nm(p[1]) == n and p[0] > 0: return str(p[0]), 'rosa'
        w = ' '.join(sorted(n.split()))
        for p in ro.get('p', []):
            if ' '.join(sorted(nm(p[1]).split())) == w and p[0] > 0: return str(p[0]), 'rosa'
        last = n.split()[-1] if n else ''
        c = [p for p in ro.get('p', []) if last in nm(p[1]).split() and p[0] > 0]
        if len(c) == 1 and len(last) > 3: return str(c[0][0]), 'rosa'
    fm = LG_FM.get(lg)
    if fm:
        if fm not in BOARD: BOARD[fm] = board(fm)
        for k, rows in BOARD[fm].items():
            if k.startswith('_'): continue
            for x in rows:
                if nm(x[1]) == n: return str(x[0]), 'classifiche'
    return None, None

out = collections.defaultdict(lambda: {'tot': 0, 'senza_id': 0, 'senza_anagrafica': 0, 'senza_stagioni': 0, 'senza_carriera': 0})
casi = []
for r in stats['players']:
    lg = r[ix['lg']]; o = out[lg]; o['tot'] += 1
    pid, via = resolve(r[ix['id']], r[ix['n']], r[ix['t']], lg)
    why = []
    if not pid:
        o['senza_id'] += 1; why.append('id FotMob non trovato')
    else:
        rec = shard('car', int(pid) % 100).get(pid) or {}
        old = carriere.get(r[ix['id']]) or {}
        bio = rec.get('b') and rec.get('c') or old.get('ok')
        if not bio: o['senza_anagrafica'] += 1; why.append('senza anagrafica')
        if not (rec.get('car') or old.get('car')): o['senza_carriera'] += 1; why.append('senza carriera')
        if len(shard('pidx', int(pid) % 100).get(pid) or []) < 2: o['senza_stagioni'] += 1; why.append('senza stagioni (pidx)')
    if why and len(casi) < 400: casi.append([lg, r[ix['n']], r[ix['t']], why])
# ---- campionati dal 6 al 20 e coppe europee: giocatori dalle classifiche della stagione in corso + rose delle loro squadre ----
EXT = {40: 'pro-league', 57: 'eredivisie', 61: 'liga-portugal', 71: 'super-lig', 64: 'scottish-premiership', 38: 'aut-bundesliga', 59: 'nor-eliteserien',
       135: 'gre-super-league-1', 48: 'championship', 86: 'serie-b', 146: 'bundesliga-2', 140: 'laliga-2', 110: 'ligue-2', 185: 'liga-portugal-2',
       111: 'eerste-divisie', 268: 'brasileirao', 112: 'arg-liga-profesional', 130: 'mls', 230: 'liga-mx', 42: 'champions-league', 73: 'europa-league', 10216: 'conference-league'}
ext = {}
casi2 = []
for fm, lid in EXT.items():
    o = ext[lid] = {'tot': 0, 'senza_anagrafica': 0, 'senza_stagioni': 0, 'senza_carriera': 0}
    seen = {}; teams = set()
    for k, rows in board(fm).items():
        if k.startswith('_'): continue
        for x in rows:
            seen[str(x[0])] = x[1]
            if len(x) > 2 and isinstance(x[2], int): teams.add(x[2])
    for t in teams:
        for q in (shard('rosa', t % 100).get(str(t)) or {}).get('p', []):
            if q[0] > 0: seen.setdefault(str(q[0]), q[1])
    for pid, name in seen.items():
        o['tot'] += 1
        rec = shard('car', int(pid) % 100).get(pid) or {}
        why = []
        if not (rec.get('b') and rec.get('c')): o['senza_anagrafica'] += 1; why.append('senza anagrafica')
        if not rec.get('car'): o['senza_carriera'] += 1
        if len(shard('pidx', int(pid) % 100).get(pid) or []) < 2: o['senza_stagioni'] += 1; why.append('senza stagioni (pidx)')
        if why and len(casi2) < 40: casi2.append([lid, name, why])
res = {'campionati_6_20_e_coppe': ext, 'campionati': out, 'totale': sum(v['tot'] for v in out.values()),
       'problemi': {k: sum(v[k] for v in out.values()) for k in ('senza_id', 'senza_anagrafica', 'senza_stagioni', 'senza_carriera')}, 'casi': casi[:40], 'casi_6_20': casi2}
json.dump(res, open(os.path.join(ROOT, 'controllo_profili_giocatori.json'), 'w'), ensure_ascii=False, indent=1)
print(res['totale'], res['problemi'])
print('--- 6-20 + coppe'); [print(l, v) for l, v in ext.items()]
for lg, v in sorted(out.items(), key=lambda x: -x[1]['senza_id'])[:12]: print(lg, dict(v))
