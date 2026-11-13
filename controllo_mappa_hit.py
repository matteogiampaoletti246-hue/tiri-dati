#!/usr/bin/env python3
"""Controllo a tappeto 13/11/2026: per ogni giocatore e competizione, le ultime 5 partite (>=50) = colonne del grafico Hit Rate (tiri dalle statistiche)
confrontate con i tiri con posizione (`sx`) della mappa tiri. Categorie: coincide / sx assente (stagione passata non ancora scaricata: l app li prende dalla partita) /
nessuna shotmap FotMob (campionati minori: dato che non esiste) / shotmap parziale. Uso: python3 controllo_mappa_hit.py"""
import gzip,json,os,glob,collections,sys
# per ogni competizione: le ultime 5 partite (>=50') di ogni giocatore nelle 2 stagioni piu' recenti = pagina del grafico Hit Rate
def sortk(s): return s
res=collections.Counter(); pl_bad=collections.defaultdict(list); lg_bad=collections.Counter(); lg_n=collections.Counter()
for fmdir in sorted(os.listdir('partite')):
    fs=sorted([f[:-8] for f in os.listdir(f'partite/{fmdir}') if f.endswith('.json.gz')],reverse=True)[:2]
    games=collections.defaultdict(list)
    for sk in fs:
        try:
            a=json.load(open(f'arch/{fmdir}/{sk}.json')); d=json.load(gzip.open(f'partite/{fmdir}/{sk}.json.gz'))
        except Exception: continue
        when={str(r[0]):r[4] for r in a['fix']}
        for mid,m in d['m'].items():
            if not m or not m.get('p') or mid not in when: continue
            sx=m.get('sx')
            cnt=collections.Counter(str(x[19]) for x in sx) if isinstance(sx,list) else None
            sxn=len(sx) if isinstance(sx,list) else None
            for pid,v in m['p'].items():
                if not (v.get('minutes_played') or 0)>=50: continue
                games[pid].append((when[mid],int(v.get('total_shots') or 0),None if cnt is None else cnt.get(pid,0),sxn,mid,sk))
    for pid,g in games.items():
        g.sort(reverse=True); g=g[:5]
        chart=sum(x[1] for x in g)
        if chart==0 and all(x[2] is None for x in g): pass
        lg_n[fmdir]+=1
        # categorie per partita
        bad=None
        for when_,n,c,sxn,mid,sk in g:
            if c==n: continue
            if c is None: bad='sx assente (da scaricare)'; break
            if sxn==0: bad='nessuna shotmap FotMob'; break
            bad='shotmap parziale'
        if bad: res[bad]+=1; lg_bad[(fmdir,bad)]+=1
        else: res['coincide']+=1
print(dict(res))
print(sorted(((v,k) for k,v in lg_bad.items()),reverse=True)[:12])
