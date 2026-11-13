import json,os,gzip,collections,sys,datetime
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def lj(p):
    if p.endswith('.gz'):
        with gzip.open(p,'rt',encoding='utf8') as f: return json.load(f)
    with open(p,encoding='utf8') as f: return json.load(f)
G=lj(R+'/giocatori.json'); CT=lj(R+'/calc_tutte.json'); CX=lj(R+'/calc_extra.json')
# giocatori: (sorgente, id, nome, squadra, pid FotMob, righe h)
pl=[]
for p in G['players']:
    pl.append(('G',p['i'],p['n'],p['t'],p.get('f'),p.get('h') or []))
for p in CX['players']:
    pl.append(('CX',p['i'],p['n'],p['t'],p.get('f') or p.get('fm'),p.get('h') or []))
for p in CT['players']:
    pl.append(('CT',p['i'],p['n'],p['t'],p.get('fm'),p.get('h') or []))
need=collections.defaultdict(list)  # comp -> [(pi, rowidx)]
for k,(src,i,n,t,pid,h) in enumerate(pl):
    for j,r in enumerate(h):
        if len(r)>=7 and r[5] and r[6]: need[int(r[6])].append((k,j))
def dts(d): return datetime.date(int(d[:4]),int(d[4:6]),int(d[6:8]))
res={}  # (k,j) -> opp id / None
stat=collections.Counter(); miss_comp=collections.Counter()
for comp,lst in sorted(need.items()):
    pd=R+f'/partite/{comp}'; ad=R+f'/arch/{comp}'
    if not os.path.isdir(pd) or not os.path.isdir(ad):
        for key in lst: res[key]=('nocomp',None)
        stat['comp_non_in_archivio']+=len(lst); miss_comp[comp]+=len(lst); continue
    seasons=sorted(f[:-8] for f in os.listdir(pd) if f.endswith('.json.gz'))
    # indice pid -> giorno -> (opp, mid) ; fix per squadra
    byp=collections.defaultdict(dict); fixd=collections.defaultdict(list)
    for sk in seasons:
        try:
            d=lj(f'{pd}/{sk}.json.gz'); a=lj(f'{ad}/{sk}.json') if os.path.exists(f'{ad}/{sk}.json') else (lj(f'{ad}/{sk}.json.gz') if os.path.exists(f'{ad}/{sk}.json.gz') else {})
        except Exception as e: continue
        fx={str(m[0]):m for m in a.get('fix') or []}
        for mid,m in (d.get('m') or {}).items():
            f=fx.get(mid)
            if not f: continue
            day=f[4][:10].replace('-','')
            for sd,osd in (('h','a'),('a','h')):
                lu=m.get(sd) or {}
                opp=(m.get(osd) or {}).get('id') or (f[3] if sd=='h' else f[2])
                me=lu.get('id') or (f[2] if sd=='h' else f[3])
                for x in (lu.get('st') or [])+(lu.get('sb') or []):
                    if isinstance(x,list) and x and x[0] is not None: byp[str(x[0])].setdefault(day,[]).append((str(opp),str(me),sk,mid))
            for pid,v in (m.get('pn') or {}).items():
                if isinstance(v,list) and len(v)>=3:
                    # squadra del giocatore = v[2]
                    me=str(v[2]); opp=(f[3] if str(f[2])==me else f[2]) if me in (str(f[2]),str(f[3])) else None
                    if opp: byp[str(pid)].setdefault(day,[]).append((str(opp),me,sk,mid))
    for (k,j) in lst:
        src,i,n,t,pid,h=pl[k]; r=h[j]; day=str(r[5])
        found=None
        if pid is not None:
            dd=dts(day)
            for off in (0,-1,1):
                dk=(dd+datetime.timedelta(off)).strftime('%Y%m%d')
                c=byp.get(str(pid),{}).get(dk)
                if c: found=c[0]; break
        res[(k,j)]=('ok' if found else 'noid',found); stat['ok' if found else 'senza_abbinamento']+=1
    print(comp,len(lst),flush=True,file=sys.stderr)
print(stat)
out=[]
for (k,j),(s,f) in res.items():
    if s!='ok':
        src,i,n,t,pid,h=pl[k]; out.append([src,i,n,t,pid,h[j],s])
json.dump(out,open('report/hit_avversari_mancanti.json','w'),ensure_ascii=False)
print(len(out)); print(miss_comp.most_common(20))
