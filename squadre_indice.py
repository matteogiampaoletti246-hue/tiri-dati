"""Indice squadre: per ogni squadra FotMob, tutte le competizioni e stagioni giocate (dal 2010).
Legge arch/<fm>/<stagione>.json di tutte le competizioni in FM_ID (aurora-src/src/data/archive.js)
e scrive tidx/<tid%100>.json = {tid: [nome, [fm, [stagioni dalla piu' recente], [stagioni senza statistiche giocatori], [stagioni senza Casa/Trasferta]], ...]}
(le ultime due liste si omettono se vuote). Statistiche giocatori con le stesse regole dell'app (loadTeamPlayerStats): classifiche ufficiali v2 senza
le liste "_", altrimenti le partite archiviate (minuti + formazione, la squadra e' quella della formazione). Casa/Trasferta esistono solo dalle partite."""
import gzip, json, os, re
from femminili import is_women_comp, is_women_name, women_name
ROOT = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(ROOT, 'aurora-src/src/data/archive.js'), encoding='utf-8').read()
FMS = sorted({int(x) for x in re.findall(r"'?[\w-]+'?:\s*(\d+)", re.search(r'FM_ID\s*=\s*\{(.*?)\}', src, re.S).group(1))})
# tutte le competizioni scaricate in arch/ (anche quelle solo d'archivio, fm-<id> nell'app)
FMS = sorted(set(FMS) | {int(d) for d in os.listdir(os.path.join(ROOT, 'arch')) if d.isdigit()})
# stagione: "2025-2026", "2025", anche con suffisso ("2026-2027 - Apertura", "2026 - Clausura")
SEASON = re.compile(r'^((?:\d{4}-\d{4}|\d{4})(?: - [^_/]+)?)\.json$')
idx = {}
names = {}
with_pl = {}  # (tid, fm, stagione) con statistiche giocatori
with_split = {}  # (tid, fm, stagione) con statistiche per partita (Casa/Trasferta)

def player_teams(fm, d, sk):
    """Squadre con statistiche giocatori in una stagione: (ufficiali + dalle partite, solo dalle partite)."""
    off = set()
    sp = os.path.join(d, sk + '_s.json')
    if os.path.exists(sp):
        try:
            sj = json.load(open(sp, encoding='utf-8'))
            if sj.get('v') == 2:
                for key, rows in (sj.get('players') or {}).items():
                    if str(key).startswith('_'): continue
                    for r in rows or []:
                        if len(r) > 2 and r[2] is not None: off.add(str(r[2]))
        except Exception: pass
    fromm = set()
    mp = os.path.join(ROOT, 'partite', str(fm), sk + '.json.gz')
    if os.path.exists(mp):
        try: det = json.load(gzip.open(mp, 'rt', encoding='utf-8')).get('m') or {}
        except Exception: det = {}
        who, played = {}, set()
        for m in det.values():
            if not m: continue
            for side in (m.get('h') or {}, m.get('a') or {}):
                if not side.get('id'): continue
                for v in side.values():
                    if isinstance(v, list):
                        for r in v:
                            if isinstance(r, list) and r and r[0] is not None: who[str(r[0])] = str(side['id'])
            for pid, v in (m.get('p') or {}).items():
                if (v or {}).get('minutes_played'): played.add(str(pid))
        # statsFromMatches: stessa soglia (almeno 3 giocatori con minuti nella stagione)
        if len(played) >= 3:
            fromm = {who[p] for p in played if p in who}
    return off | fromm, fromm
for fm in FMS:
    d = os.path.join(ROOT, 'arch', str(fm))
    if not os.path.isdir(d): continue
    for f in sorted(os.listdir(d)):
        m = SEASON.match(f)
        if not m: continue
        sk = m.group(1)
        pl_ok, split_ok = player_teams(fm, d, sk)
        try: teams = (json.load(open(os.path.join(d, f), encoding='utf-8')) or {}).get('teams') or {}
        except Exception: continue
        for tid, name in teams.items():
            if not str(tid).isdigit(): continue
            tid = int(tid)
            idx.setdefault(tid, {}).setdefault(fm, set()).add(sk)
            if str(tid) in pl_ok: with_pl[(tid, fm, sk)] = 1
            if str(tid) in split_ok: with_split[(tid, fm, sk)] = 1
            # nome piu' recente
            if sk >= names.get(tid, ('', ''))[0]: names[tid] = (sk, name)
# squadre che giocano solo competizioni femminili: "Nome F" (stessa regola dell'app, mai il nome della maschile)
ALL_IDX = json.load(open(os.path.join(ROOT, 'arch', 'index.json'), encoding='utf-8'))
for tid, comps in idx.items():
    sk, name = names.get(tid, ('', ''))
    if is_women_name(name) or all(is_women_comp(fm, (ALL_IDX.get(str(fm)) or {}).get('n')) for fm in comps):
        names[tid] = (sk, women_name(name))
out = os.path.join(ROOT, 'tidx'); os.makedirs(out, exist_ok=True)
sh = {}
for tid, comps in idx.items():
    rows = []
    for fm, sks in comps.items():
        ord_sk = sorted(sks, reverse=True)
        no_pl = [x for x in ord_sk if (tid, fm, x) not in with_pl]
        no_split = [x for x in ord_sk if (tid, fm, x) in with_pl and (tid, fm, x) not in with_split]
        rows.append([fm, ord_sk] + ([no_pl, no_split] if no_split else [no_pl] if no_pl else []))
    rows.sort(key=lambda r: (r[1][0], r[0]), reverse=True)  # competizione giocata piu' di recente per prima
    sh.setdefault(tid % 100, {})[str(tid)] = [names[tid][1]] + rows
for i in range(100):
    json.dump(dict(sorted(sh.get(i, {}).items(), key=lambda x: int(x[0]))), open(os.path.join(out, f'{i}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(idx), 'squadre,', sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)) // 1024, 'KB')
