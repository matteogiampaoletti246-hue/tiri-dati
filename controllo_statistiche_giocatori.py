"""Controllo Statistiche giocatore: per un campione di giocatori dell'indice pidx e OGNI loro competizione/stagione verifica se l'app
trova le statistiche, con la stessa logica di data/archive.js (loadPlayerStatsFor: classifiche ufficiali v2, altrimenti statsFromMatches
con gli stessi filtri). Per le righe senza statistiche scrive il motivo. Scrive controllo_statistiche_giocatori.json.
Uso: python controllo_statistiche_giocatori.py [n giocatori, default 600] [--app-vecchia]"""
import gzip
import json
import os
import random
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
N = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 600
OLD = '--app-vecchia' in sys.argv  # filtri di statsFromMatches prima della correzione (per i numeri "prima")
SKIP = re.compile(r'_t$|^physical_|^minutes_played$|^goals_prevented$|^xg_and_xa$|^shot_accuracy$|variant$|_team_title$|^player_throws$|^punches$')
HIDDEN = re.compile(r'^poss_?won_?att_?3rd', re.I)
CS = {}


def load(p, gz=False):
    try:
        return json.load(gzip.open(p, 'rt', encoding='utf-8') if gz else open(p, encoding='utf-8'))
    except Exception:
        return None


def official(fm, sk):
    k = ('o', fm, sk)
    if k not in CS:
        d = load(os.path.join(ROOT, 'arch', str(fm), sk + '_s.json'))
        ok = d and d.get('v') == 2 and d.get('players')
        CS[k] = {str(r[0]) for key, rows in (d.get('players') or {}).items() if not key.startswith('_') for r in rows} if ok else None
    return CS[k]


def from_matches(fm, sk):
    """giocatori presenti nelle statistiche calcolate dalle partite (statsFromMatches) e giocatori con minuti nelle partite"""
    k = ('m', fm, sk)
    if k in CS:
        return CS[k]
    d = load(os.path.join(ROOT, 'partite', str(fm), sk + '.json.gz'), True)
    if not d or not d.get('m'):
        CS[k] = None
        return None
    tot, acc = {}, {}
    for m in d['m'].values():
        for pid, v in ((m or {}).get('p') or {}).items():
            mins = (v or {}).get('minutes_played') or 0
            if not isinstance(mins, (int, float)) or not mins:
                continue
            t = tot.setdefault(pid, [0, 0]); t[0] += mins; t[1] += 1
            for key, val in v.items():
                if isinstance(val, bool) or not isinstance(val, (int, float)) or SKIP.search(key) or HIDDEN.search(key):
                    continue
                a = acc.setdefault(key, {}).setdefault(pid, [0, 0]); a[0] += val; a[1] += 1
    shown = set()
    for key, per in acc.items():
        rat = key == 'rating_title'
        rows = [pid for pid, a in per.items() if (tot[pid][0] >= 90 if rat else a[0] > 0)]
        if len(rows) < 3:
            continue
        shown.update(rows)
    if not OLD:
        # correzione: presenze e minuti per chiunque abbia giocato (anche chi ha tutti i valori a zero)
        shown.update(tot.keys())
    CS[k] = (shown, set(tot.keys()))
    return CS[k]


def main():
    pidx = {}
    for i in range(100):
        pidx.update(load(os.path.join(ROOT, 'pidx', f'{i}.json')) or {})
    random.seed(7)
    ids = random.sample(sorted(pidx), N)
    rows = 0
    ok = 0
    why = {}
    per_player_none = 0
    cur_missing = 0
    examples = {}
    for pid in ids:
        e = pidx[pid]
        got = 0
        for r in e[1:]:
            fm, sk = r[0], r[1]
            rows += 1
            o = official(fm, sk)
            if o is not None and pid in o:
                ok += 1; got += 1
                continue
            m = from_matches(fm, sk)
            if m and pid in m[0]:
                ok += 1; got += 1
                continue
            if m is None and o is None:
                w = 'nessun file (ne\' classifiche ne\' partite archiviate)'
            elif m is None:
                w = 'non nelle classifiche ufficiali e partite della stagione non archiviate'
            elif pid in m[1]:
                w = 'ha giocato ma tutti i valori sono zero (filtro statsFromMatches)'
            else:
                w = 'non nelle classifiche ne\' nelle statistiche delle partite'
            why[w] = why.get(w, 0) + 1
            examples.setdefault(w, []).append([pid, fm, sk])
            if str(sk)[:4] in ('2025', '2026') and r is e[1]:
                cur_missing += 1
        if not got:
            per_player_none += 1
    out = {'giocatori': N, 'righe_competizione_stagione': rows, 'con_statistiche': ok, 'senza': rows - ok,
           'giocatori_senza_nessuna_statistica': per_player_none, 'stagione_piu_recente_senza': cur_missing,
           'motivi': why, 'esempi': {k: v[:8] for k, v in examples.items()}}
    json.dump(out, open(os.path.join(ROOT, 'controllo_statistiche_giocatori.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print({k: v for k, v in out.items() if k != 'esempi'})


if __name__ == '__main__':
    main()
