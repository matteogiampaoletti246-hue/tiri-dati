"""Indice squadre: per ogni squadra FotMob, tutte le competizioni e stagioni giocate (dal 2010).
Legge arch/<fm>/<stagione>.json di tutte le competizioni in FM_ID (aurora-src/src/data/archive.js)
e scrive tidx/<tid%100>.json = {tid: [nome, [fm, [stagioni dalla piu' recente]], ...]}."""
import json, os, re
ROOT = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(ROOT, 'aurora-src/src/data/archive.js'), encoding='utf-8').read()
FMS = sorted({int(x) for x in re.findall(r"'?[\w-]+'?:\s*(\d+)", re.search(r'FM_ID\s*=\s*\{(.*?)\}', src, re.S).group(1))})
# tutte le competizioni scaricate in arch/ (anche quelle solo d'archivio, fm-<id> nell'app)
FMS = sorted(set(FMS) | {int(d) for d in os.listdir(os.path.join(ROOT, 'arch')) if d.isdigit()})
# stagione: "2025-2026", "2025", anche con suffisso ("2026-2027 - Apertura", "2026 - Clausura")
SEASON = re.compile(r'^((?:\d{4}-\d{4}|\d{4})(?: - [^_/]+)?)\.json$')
idx = {}
names = {}
for fm in FMS:
    d = os.path.join(ROOT, 'arch', str(fm))
    if not os.path.isdir(d): continue
    for f in sorted(os.listdir(d)):
        m = SEASON.match(f)
        if not m: continue
        sk = m.group(1)
        try: teams = (json.load(open(os.path.join(d, f), encoding='utf-8')) or {}).get('teams') or {}
        except Exception: continue
        for tid, name in teams.items():
            if not str(tid).isdigit(): continue
            tid = int(tid)
            idx.setdefault(tid, {}).setdefault(fm, set()).add(sk)
            # nome piu' recente
            if sk >= names.get(tid, ('', ''))[0]: names[tid] = (sk, name)
out = os.path.join(ROOT, 'tidx'); os.makedirs(out, exist_ok=True)
sh = {}
for tid, comps in idx.items():
    rows = [[fm, sorted(sks, reverse=True)] for fm, sks in comps.items()]
    rows.sort(key=lambda r: (r[1][0], r[0]), reverse=True)  # competizione giocata piu' di recente per prima
    sh.setdefault(tid % 100, {})[str(tid)] = [names[tid][1]] + rows
for i in range(100):
    json.dump(dict(sorted(sh.get(i, {}).items(), key=lambda x: int(x[0]))), open(os.path.join(out, f'{i}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(idx), 'squadre,', sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)) // 1024, 'KB')
