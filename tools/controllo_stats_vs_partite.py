"""Controllo a tappeto: classifiche ufficiali (arch/<fm>/<stagione>_s.json) contro le partite FotMob archiviate (partite/<fm>/<stagione>.json.gz).
Per ogni giocatore con riga ufficiale: presenze e minuti delle partite > quelli ufficiali = classifica rimasta indietro (l'app, da loadPlayerStatsFor0 in
aurora-src/src/data/archive.js, usa allora le partite); classifica > partite = partite mancanti nel file (resta la classifica).
Scrive controllo_stats_vs_partite.json. Uso: python3 tools/controllo_stats_vs_partite.py"""
import collections, gzip, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
def load(p, gz=False):
    try: return json.load(gzip.open(p, 'rt', encoding='utf-8') if gz else open(p, encoding='utf-8'))
    except Exception: return None
tot = collections.Counter(); per_sk = collections.Counter(); per_comp = collections.Counter(); esempi = []
for fm in sorted(d for d in os.listdir('arch') if d.isdigit()):
    for f in sorted(os.listdir(f'arch/{fm}')):
        m = re.match(r'(.+)_s\.json$', f)
        if not m: continue
        sk = m.group(1)
        s = load(f'arch/{fm}/{f}'); d = load(f'partite/{fm}/{sk}.json.gz', True)
        if not s or s.get('v') != 2 or not d or not d.get('m'): continue
        off = {}
        for k, rows in (s.get('players') or {}).items():
            if k.startswith('_'): continue
            for r in rows:
                if len(r) >= 6:
                    o = off.setdefault(str(r[0]), [r[1], 0, 0]); o[1] = max(o[1], r[5] or 0); o[2] = max(o[2], r[4] or 0)
        calc = {}
        for x in d['m'].values():
            for pid, v in ((x or {}).get('p') or {}).items():
                mi = (v or {}).get('minutes_played') or 0
                if mi:
                    c = calc.setdefault(pid, [0, 0]); c[0] += 1; c[1] += mi
        tot['righe'] += 1
        for pid, (nome, n, mn) in off.items():
            c = calc.get(pid)
            if not c: tot['ufficiali_senza_partite'] += 1; continue
            tot['confrontati'] += 1
            if c[0] > n or c[1] > mn + 30:
                tot['classifica_indietro'] += 1; per_sk[sk] += 1; per_comp[fm] += 1
                if len(esempi) < 25 and sk.startswith('2026'): esempi.append({'fm': fm, 'stagione': sk, 'giocatore': nome, 'ufficiale': [n, mn], 'partite': c})
            elif n > c[0] or mn > c[1] + 30: tot['classifica_avanti_partite_mancanti'] += 1
out = dict(tot); out['per_stagione'] = per_sk.most_common(12); out['per_competizione'] = per_comp.most_common(15); out['esempi'] = esempi
json.dump(out, open('controllo_stats_vs_partite.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print({k: v for k, v in out.items() if isinstance(v, int)}); print(out['per_stagione'])
