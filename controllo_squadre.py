"""Controllo automatico: per ogni competizione in FM_ID (aurora-src/src/data/archive.js) e ogni squadra della stagione in corso,
le schede Statistiche e Giocatori hanno dati? Usa le stesse fonti dell'app: statistiche ufficiali (arch/<fm>/<stagione>_s.json)
oppure, se mancano, quelle calcolate dalle partite archiviate (partite/<fm>/<stagione>.json.gz).
Scrive controllo_squadre.json con le squadre senza dati e il motivo."""
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
json.dump(report, open(os.path.join(ROOT, 'controllo_squadre.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(tot, 'squadre controllate,', len(report['vuote']), 'senza dati,', len(report['competizioni_senza_dati']), 'competizioni senza stagione')
for r in report['vuote'][:60]: print(' -', r['lega'], r['stagione'], r['squadra'], '|', '; '.join(r['motivo']))
for r in report['competizioni_senza_dati']: print(' !', r)
