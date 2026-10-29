"""Controllo automatico: per ogni competizione in FM_ID (aurora-src/src/data/archive.js) e ogni squadra della stagione in corso,
le schede Statistiche e Giocatori hanno dati? Usa le stesse fonti dell'app: statistiche ufficiali (arch/<fm>/<stagione>_s.json)
oppure, se mancano, quelle calcolate dalle partite archiviate (partite/<fm>/<stagione>.json.gz).
Scrive controllo_squadre.json con le squadre senza dati e il motivo.
Rose (pannello "Squadra"): per TUTTE le competizioni dell'indice (anche quelle d'archivio, squadre fm-<id>) ogni squadra della stagione
in corso ha una rosa? Prima rose.json (id FotMob) o i giocatori dell'app; poi, come seasonRoster (data/rose.js), chi ha giocato la
stagione: minuti e formazioni delle partite, classifiche ufficiali dei giocatori, gol e cartellini. "prima" = solo rose.json e app."""
import gzip, json, os, re, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(ROOT, 'aurora-src/src/data/archive.js'), encoding='utf-8').read()
FM_ID = {k.strip("'"): int(v) for k, v in re.findall(r"('?[\w-]+'?):\s*(\d+)", re.search(r'FM_ID\s*=\s*\{(.*?)\}', src, re.S).group(1))}
idx = json.load(open(os.path.join(ROOT, 'arch', 'index.json'), encoding='utf-8'))
extra = {}
try: extra = (json.load(open(os.path.join(ROOT, 'partite_extra.json'), encoding='utf-8')).get('sk') or {})
except Exception: pass

def load(p, gz=False):
    try:
        return json.load(gzip.open(p, 'rt', encoding='utf-8') if gz else open(p, encoding='utf-8'))
    except Exception:
        return None

report = {'stagioni': {}, 'vuote': [], 'competizioni_senza_dati': []}
tot = 0
for lid, fm in sorted(FM_ID.items(), key=lambda x: x[1]):
    seasons = sorted((idx.get(str(fm)) or {}).get('s') or [], reverse=True)
    sk = extra.get(str(fm)) or (seasons[0] if seasons else None)
    if not sk:
        report['competizioni_senza_dati'].append({'lega': lid, 'fm': fm, 'motivo': 'nessuna stagione in arch/index.json'}); continue
    season = load(os.path.join(ROOT, 'arch', str(fm), f'{sk}.json'))
    if not season or not season.get('teams'):
        report['competizioni_senza_dati'].append({'lega': lid, 'fm': fm, 'stagione': sk, 'motivo': 'file della stagione mancante o senza squadre'}); continue
    report['stagioni'][lid] = sk
    st = load(os.path.join(ROOT, 'arch', str(fm), f'{sk}_s.json')) or {}
    det = load(os.path.join(ROOT, 'partite', str(fm), f'{sk}.json.gz'), gz=True) or {}
    # squadre con statistiche ufficiali / giocatori ufficiali
    st_team = {str(r[2]) for rows in (st.get('teams') or {}).values() for r in rows if len(r) > 2}
    st_play = {str(r[2]) for rows in (st.get('players') or {}).values() for r in rows if len(r) > 2}
    # dalle partite: statistiche di squadra (m.s) e giocatori (m.p + formazioni)
    m_team, m_play, m_any = set(), set(), set()
    for m in (det.get('m') or {}).values():
        if not m: continue
        h, a = m.get('h') or {}, m.get('a') or {}
        for side in (h, a):
            if side.get('id') is not None: m_any.add(str(side['id']))
        if m.get('s'):
            for side in (h, a):
                if side.get('id') is not None: m_team.add(str(side['id']))
        who = {}
        for side in (h, a):
            for v in side.values():
                if isinstance(v, list):
                    for r in v:
                        if isinstance(r, list) and r and r[0] is not None: who[str(r[0])] = str(side.get('id'))
        for pid, v in (m.get('p') or {}).items():
            if (v or {}).get('minutes_played') and who.get(str(pid)): m_play.add(who[str(pid)])
    for tid, name in season['teams'].items():
        tot += 1
        why = []
        if tid not in st_team and tid not in m_team:
            why.append('Statistiche: ' + ('nessuna partita archiviata' if tid not in m_any else 'partite senza statistiche di squadra'))
        if tid not in st_play and tid not in m_play:
            why.append('Giocatori: ' + ('nessuna partita archiviata' if tid not in m_any else 'partite senza statistiche dei giocatori'))
        if why: report['vuote'].append({'lega': lid, 'fm': fm, 'stagione': sk, 'squadra': name, 'id': tid, 'motivo': why})
report['squadre_controllate'] = tot

# ---- rose: tutte le competizioni dell'indice, squadre della stagione in corso (una squadra conta una volta: basta una competizione con dati)
rose = load(os.path.join(ROOT, 'rose.json')) or {}
rose_ids = {str(v.get('id')) for v in rose.values() if v and v.get('p')}
app_names = {p.get('t') for p in ((load(os.path.join(ROOT, 'giocatori.json')) or {}).get('players') or [])}
seen = {}
for fm, e in idx.items():
    if not e or e.get('skip') or not e.get('s'): continue
    sk = extra.get(str(fm)) or sorted(e['s'], reverse=True)[0]
    season = load(os.path.join(ROOT, 'arch', str(fm), f'{sk}.json'))
    if not season or not season.get('teams'): continue
    st = load(os.path.join(ROOT, 'arch', str(fm), f'{sk}_s.json')) or {}
    det = load(os.path.join(ROOT, 'partite', str(fm), f'{sk}.json.gz'), gz=True) or {}
    have, played = set(), set()
    for k, rows in (st.get('players') or {}).items():
        if not k.startswith('_'):
            for r in rows or []:
                if len(r) > 2: have.add(str(r[2]))
    sides = {str(f[0]): (str(f[2]), str(f[3])) for f in season.get('fix') or [] if len(f) > 3}
    for mid, m in (det.get('m') or {}).items():
        if not m: continue
        sd = sides.get(str(mid))
        if sd: played.update(sd)
        for side in (m.get('h') or {}, m.get('a') or {}):
            if side.get('id') is not None and any(isinstance(v, list) and v for v in side.values()): have.add(str(side['id']))
        for ev in m.get('e') or []:
            if sd and isinstance(ev, dict) and isinstance(ev.get('p'), list): have.add(sd[0] if ev.get('isHome') else sd[1])
    for f in season.get('fix') or []:
        if len(f) > 6 and f[6]: played.update((str(f[2]), str(f[3])))
    for tid, name in season['teams'].items():
        before = tid in rose_ids or name in app_names
        r = seen.setdefault(tid, {'squadra': name, 'id': tid, 'prima': False, 'dopo': False, 'comp': []})
        r['prima'] = r['prima'] or before
        r['dopo'] = r['dopo'] or before or tid in have
        r['comp'].append({'fm': int(fm), 'nome': e.get('n'), 'stagione': sk, 'giocate': tid in played})
senza = []
for r in seen.values():
    if r['dopo']: continue
    gioc = any(c['giocate'] for c in r['comp'])
    senza.append({'squadra': r['squadra'], 'id': r['id'], 'competizioni': [f"{c['nome']} {c['stagione']}" for c in r['comp']][:4],
                  'motivo': "partite giocate ma l'archivio non ha formazioni, minuti, classifiche giocatori ne' marcatori della squadra" if gioc else 'nessuna partita giocata nella stagione in corso'})
report['rose'] = {'squadre': len(seen), 'senza_rosa_prima': sum(1 for r in seen.values() if not r['prima']), 'senza_rosa_dopo': len(senza), 'senza_rosa': sorted(senza, key=lambda x: x['squadra'])}
# ---- partite della stagione in corso (pannello Partite) e forma recente (Panoramica pre-partita), per tutte le squadre.
# Prima: l'app mostrava solo le partite in memoria (competizioni dell'app); le competizioni d'archivio mancavano.
# Dopo: si aggiungono le competizioni della stagione in corso dall'indice tidx (+ campionato della squadra); la forma unisce le stesse fonti.
app_fms = set(FM_ID.values())
tidx = {}
for f in os.listdir(os.path.join(ROOT, 'tidx')):
    if f.endswith('.json'): tidx.update(load(os.path.join(ROOT, 'tidx', f)) or {})
p_prima, p_dopo, f_prima, f_dopo, nessuna = [], [], 0, 0, 0
for tid, r in seen.items():
    arch_comps = [c for c in r['comp'] if c['fm'] not in app_fms]
    e = tidx.get(str(tid)) or []
    have = {int(x[0]): set(x[1]) for x in e[1:] if isinstance(x, list) and len(x) > 1}
    miss = [c for c in r['comp'] if c['stagione'] not in have.get(c['fm'], set())]
    if arch_comps: p_prima.append(r['squadra'])
    if miss: p_dopo.append({'squadra': r['squadra'], 'id': tid, 'competizioni': [f"{c['nome']} {c['stagione']}" for c in miss][:4], 'motivo': "indice tidx senza questa competizione/stagione (si aggiorna ogni giorno)"})
    gioc = any(c['giocate'] for c in r['comp'])
    if not gioc: nessuna += 1
    if gioc and not any(c['giocate'] for c in r['comp'] if c['fm'] in app_fms): f_prima += 1
report['partite_stagione'] = {'squadre_con_partite_mancanti_prima': len(p_prima), 'squadre_con_partite_mancanti_dopo': len(p_dopo), 'mancanti_dopo': p_dopo[:300]}
report['forma'] = {'squadre_senza_forma_prima': f_prima + nessuna, 'squadre_senza_forma_dopo': nessuna, 'motivo_dopo': 'nessuna partita giocata nella stagione in corso: niente riquadro'}
print('partite:', len(p_prima), 'squadre con partite mancanti prima,', len(p_dopo), 'dopo; forma:', f_prima + nessuna, 'senza forma prima,', nessuna, 'dopo')
print('rose:', len(seen), 'squadre,', report['rose']['senza_rosa_prima'], 'senza rosa prima,', len(senza), 'dopo')
print(tot, 'squadre controllate,', len(report['vuote']), 'senza dati,', len(report['competizioni_senza_dati']), 'competizioni senza stagione')
for r in report['vuote'][:60]: print(' -', r['lega'], r['stagione'], r['squadra'], '|', '; '.join(r['motivo']))
for r in report['competizioni_senza_dati']: print(' !', r)
json.dump(report, open(os.path.join(ROOT, 'controllo_squadre.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
