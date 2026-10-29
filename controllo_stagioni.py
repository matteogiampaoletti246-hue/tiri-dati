#!/usr/bin/env python3
"""Controllo completo delle statistiche: per ogni competizione in FM_ID e ogni stagione archiviata verifica che Statistiche squadre e
Giocatori abbiano dati quando esistono in arch/ e partite/. Per le stagioni dove le partite hanno poche statistiche (<60%) chiede a
FotMob tre partite a campione: se oggi le statistiche ci sono la stagione e' "dimenticata" e va riscaricata (archivio.py / partite.py).
Scrive controllo_stagioni.json = {stagioni:[...], dimenticate:[...], senza_fonte:[...]} e stampa il riepilogo.
Uso: python controllo_stagioni.py [--no-rete]"""
import gzip, json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
NET = '--no-rete' not in sys.argv
src = open(os.path.join(ROOT, 'aurora-src/src/data/archive.js'), encoding='utf-8').read()
FM = {k.strip("'"): int(v) for k, v in re.findall(r"('?[\w-]+'?):\s*(\d+)", re.search(r'FM_ID\s*=\s*\{(.*?)\}', src, re.S).group(1))}
INV = {v: k for k, v in FM.items()}
H = {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mobile/15E148) AppleWebKit/605.1.15 Mobile Safari/604.1', 'Accept': 'application/json'}


def load(p, gz=False):
    try:
        return json.load(gzip.open(p, 'rt', encoding='utf-8') if gz else open(p, encoding='utf-8'))
    except Exception:
        return None


def fotmob_has_stats(mid):
    try:
        with urllib.request.urlopen(urllib.request.Request('https://www.fotmob.com/api/data/matchDetails?matchId=%s' % mid, headers=H), timeout=30) as r:
            j = json.load(r)
        c = j.get('content') or {}
        return bool(((c.get('stats') or {}).get('Periods') or {}).get('All')), bool(c.get('playerStats'))
    except Exception:
        return None, None


rep = {'stagioni': [], 'dimenticate': [], 'senza_fonte': []}
for fm in sorted(INV):
    d = os.path.join(ROOT, 'arch', str(fm))
    for f in sorted(os.listdir(d)):
        m = re.match(r'^(\d{4}(?:-\d{4})?(?: - [^_]+)?)\.json$', f)
        if not m: continue
        sk = m.group(1)
        s = load(os.path.join(d, f)) or {}
        played = [x for x in (s.get('fix') or []) if x[6] and not x[8]]
        if not played: continue
        st = load(os.path.join(d, sk + '_s.json')) or {}
        off_pl = len(st.get('players') or {}) if st.get('v') == 2 else 0
        off_te = len(st.get('teams') or {}) if st.get('v') == 2 else 0
        det = (load(os.path.join(ROOT, 'partite', str(fm), sk + '.json.gz'), gz=True) or {}).get('m') or {}
        n_m = len(det)
        n_s = sum(1 for v in det.values() if v and v.get('s'))
        n_p = sum(1 for v in det.values() if v and v.get('p'))
        row = {'lega': INV[fm], 'fm': fm, 'stagione': sk, 'giocate': len(played), 'partite_scaricate': n_m, 'con_stat_squadra': n_s, 'con_stat_giocatori': n_p, 'ufficiali_giocatori': off_pl, 'ufficiali_squadre': off_te}
        why = []
        if n_m < len(played) * 0.9: why.append('partite scaricate %d su %d' % (n_m, len(played)))
        if off_pl == 0 and n_p == 0: why.append('giocatori: nessuna fonte')
        if off_te == 0 and n_s == 0: why.append('squadre: nessuna fonte')
        row['motivo'] = why
        if n_m and n_s < n_m * 0.6 and NET and int(sk[:4]) >= 2010:
            missing = [mid for mid, v in det.items() if not (v and v.get('s'))][:3]
            res = [fotmob_has_stats(mid) for mid in missing]
            row['campione_fotmob'] = res
            if any(r[0] or r[1] for r in res):
                rep['dimenticate'].append(row)
        if why: rep['senza_fonte'].append(row)
        rep['stagioni'].append(row)
json.dump(rep, open(os.path.join(ROOT, 'controllo_stagioni.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(rep['stagioni']), 'stagioni controllate;', len(rep['dimenticate']), 'dimenticate (FotMob ora ha le statistiche);', len(rep['senza_fonte']), 'senza fonte o incomplete')
for r in rep['dimenticate'][:40]: print('  DA RISCARICARE', r['lega'], r['stagione'], r['con_stat_squadra'], '/', r['partite_scaricate'])
