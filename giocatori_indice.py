"""Indice giocatori: per ogni giocatore FotMob, tutte le competizioni/stagioni in cui ha giocato.
Legge arch/<fm>/<stagione>_s.json e scrive pidx/<pid%100>.json = {pid: [[fm, stagione, tid, presenze, minuti, nome?]]}."""
import json, os, re, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(ROOT, 'aurora-src/src/data/archive.js'), encoding='utf-8').read()
FMS = sorted({int(x) for x in re.findall(r"'?[\w-]+'?:\s*(\d+)", re.search(r'FM_ID\s*=\s*\{(.*?)\}', src, re.S).group(1))})
idx = {}
for fm in FMS:
    d = os.path.join(ROOT, 'arch', str(fm))
    if not os.path.isdir(d): continue
    for f in sorted(os.listdir(d)):
        # anche le stagioni con suffisso (Messico/Argentina: "2026-2027 - Apertura", "2026 - Clausura")
        m = re.match(r'((?:\d{4}-\d{4}|\d{4})(?: - [^_/]+)?)_s\.json$', f)
        if not m: continue
        sk = m.group(1)
        try: pl = json.load(open(os.path.join(d, f), encoding='utf-8')).get('players') or {}
        except Exception: continue
        best = {}
        for rows in pl.values():
            for r in rows:
                if len(r) < 6: continue
                pid = int(r[0]); a = best.setdefault(pid, [r[1], r[2], 0, 0])
                a[2] = max(a[2], r[5] or 0); a[3] = max(a[3], r[4] or 0)
        for pid, (name, tid, apps, mins) in best.items():
            idx.setdefault(pid, []).append([fm, sk, tid, apps, mins, name])
out = os.path.join(ROOT, 'pidx'); os.makedirs(out, exist_ok=True)
sh = {}
for pid, rows in idx.items():
    rows.sort(key=lambda r: (r[1], r[0]), reverse=True)
    name = rows[0][5]
    sh.setdefault(pid % 100, {})[pid] = [name] + [r[:5] for r in rows]
for i in range(100):
    json.dump(sh.get(i, {}), open(os.path.join(out, f'{i}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(idx), 'giocatori,', sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)) // 1024, 'KB')
