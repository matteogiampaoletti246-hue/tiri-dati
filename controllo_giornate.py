"""Controllo giornate: per ogni competizione di arch/ (stagione piu' recente) segnala i turni numerici che durano
piu' di ~10 giorni. "prima" = raggruppati per solo numero di turno; "dopo" = con la stessa regola dell'app
(data/rounds.js: gruppi di date del turno, recuperi a parte). Scrive controllo_giornate.json."""
import json
import os
import re
from datetime import datetime

ARCH = 'arch'
DAY = 86400
GAP = 3 * DAY
LIMIT = 10 * DAY
TOP = {'47', '87', '54', '55', '53'}  # top 5: giornate calcolate altrove


def ts(m):
    try:
        return datetime.fromisoformat(str(m[4]).replace('Z', '+00:00')).timestamp()
    except Exception:
        return None


def split_round(s):
    """gruppi di date: quelli con >= 20% delle partite (almeno 3) sono riquadri, gli altri recuperi"""
    cl = []
    for m in s:
        if cl and ts(m) - ts(cl[-1][-1]) <= GAP:
            cl[-1].append(m)
        else:
            cl.append([m])
    cores = [c for c in cl if len(c) >= max(3, len(s) * 0.2)] or [max(cl, key=len)]
    return cores


def latest(fm):
    ss = [f[:-5] for f in os.listdir(os.path.join(ARCH, fm)) if f.endswith('.json') and not f.endswith('_s.json')]
    return max(ss) if ss else None


def main():
    out = {'competizioni': 0, 'con_errori_prima': 0, 'giornate_lunghe_prima': 0, 'giornate_lunghe_dopo': 0, 'dettaglio': {}}
    for fm in sorted(os.listdir(ARCH)):
        if fm in TOP or not os.path.isdir(os.path.join(ARCH, fm)):
            continue
        sk = latest(fm)
        if not sk:
            continue
        try:
            d = json.load(open(os.path.join(ARCH, fm, sk + '.json'), encoding='utf-8'))
        except Exception:
            continue
        fix = [m for m in d.get('fix') or [] if ts(m) is not None]
        if not fix:
            continue
        out['competizioni'] += 1
        by = {}
        for m in fix:
            by.setdefault(str(m[1]), []).append(m)
        bad = []
        after = 0
        for r, lst in by.items():
            if not re.fullmatch(r'\d+', r):
                continue
            s = sorted(lst, key=ts)
            if ts(s[-1]) - ts(s[0]) > LIMIT:
                cores = split_round(s)
                ok = all(ts(c[-1]) - ts(c[0]) <= LIMIT for c in cores)
                after += 0 if ok else 1
                bad.append({'turno': r, 'giorni': round((ts(s[-1]) - ts(s[0])) / DAY), 'riquadri': len(cores),
                            'recuperi': len(s) - sum(map(len, cores)), 'corretta': ok})
        if bad:
            out['con_errori_prima'] += 1
            out['giornate_lunghe_prima'] += len(bad)
            out['giornate_lunghe_dopo'] += after
            out['dettaglio'][fm] = {'stagione': sk, 'turni': bad}
    json.dump(out, open('controllo_giornate.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print({k: v for k, v in out.items() if k != 'dettaglio'})


if __name__ == '__main__':
    main()
