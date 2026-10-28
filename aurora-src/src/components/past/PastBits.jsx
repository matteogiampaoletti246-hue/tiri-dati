import { useEffect, useRef, useState } from 'react';
import { useNavigationType } from 'react-router-dom';
import useAsync from '@/hooks/useAsync';
import { pastSeasons, teamSeasons, playerSeasons, loadSeason, teamIdByName, sortSeasons, FM_ID } from '@/data/archive';
import { leagueById } from '@/data/leagues';
import { bandColor } from '@/components/player/playerCalc';

// stagione/scheda richiesta da un collegamento dello storico: la scheda unica si apre gia' li'
export const NAV = { fm: null, sk: null, tab: null };
// la stagione richiesta da un collegamento vale una sola volta: le schede aperte dopo non la ereditano
export const initSeason = (fm) => {
  if (NAV.sk && String(NAV.fm) === String(fm)) { const v = NAV.sk; NAV.sk = null; NAV.fm = null; return v; }
  return 'cur';
};

export const CARD = { backgroundColor: 'var(--panel-solid, rgba(255,255,255,.04))', border: '1px solid var(--hair-2)', borderRadius: 18 };
export const LBL = { fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' };
export const NEG_RE = /conceded|card|^fouls$|lost|dispossess|miss|offside|dribbled_past|error|faced|owngoal/i;

// stagioni passate del campionato (FotMob id) per la tendina
// con teamName: solo le stagioni in cui quella squadra ha giocato la competizione
// con pid (id FotMob del giocatore): solo le stagioni in cui quel giocatore ha giocato la competizione
export function useSeasonList(fm, teamName, pid) {
  const { data } = useAsync(() => (fm ? (pid ? playerSeasons(fm, pid) : teamName ? teamSeasons(fm, teamName) : pastSeasons(fm)) : Promise.resolve([])), [fm, teamName, pid]);
  const arr = data || [];
  arr.loaded = !!data;
  return arr;
}

// ---- Scelte di stagione / competizione legate alla scheda aperta ----
// Si ricordano finche' la scheda resta "nella pila" (apro un giocatore e torno indietro: la stagione c'e' ancora).
// Aprendo una scheda da zero (o dopo averla chiusa) si riparte da "stagione attuale".
const SEL = new Map();
const resetSel = (entity) => { [...SEL.keys()].forEach((k) => { if (k.startsWith(`${entity}|`)) SEL.delete(k); }); };
export function useEntityScope(entity) {
  const nav = useNavigationType();
  const done = useRef(null);
  if (done.current !== entity) {
    done.current = entity;
    if (nav !== 'POP') resetSel(entity);
  }
}
export function useSel(entity, slot, initial) {
  const k = `${entity}|${slot}`;
  const [v, setV] = useState(() => {
    if (SEL.has(k)) return SEL.get(k);
    const x = typeof initial === 'function' ? initial() : initial;
    SEL.set(k, x);
    return x;
  });
  const set = (x) => { SEL.set(k, x); setV(x); };
  return [v, set];
}

const CUP_IDS = ['champions-league', 'europa-league', 'conference-league'];
// competizioni (id app) che la squadra ha giocato in quella stagione: legate al tasto stagione
export function useSeasonComps(team, season, base) {
  const { data } = useAsync(async () => {
    if (season === 'cur') return null;
    const cands = [...new Set([team.leagueId, ...CUP_IDS])].filter((id) => FM_ID[id]);
    const hits = await Promise.all(cands.map(async (id) => {
      const s = await loadSeason(FM_ID[id], season).catch(() => null);
      return s && s.teams && teamIdByName(s.teams, team.name) ? id : null;
    }));
    return hits.filter(Boolean).map(leagueById).filter(Boolean);
  }, [team.name, season]);
  return season === 'cur' ? base : (data && data.length ? data : base);
}

// Vista di un pannello squadra: competizione + stagione collegate. allowAll: aggiunge "Tutte le competizioni".
export function useTeamView(team, slot, baseComps, defComp, allowAll = false) {
  const [comp, setComp] = useSel(team.id, `${slot}-c`, defComp);
  const [season, setSeason] = useSel(team.id, `${slot}-s`, () => initSeason(FM_ID[defComp === 'all' ? team.leagueId : defComp]));
  const comps = useSeasonComps(team, season, baseComps);
  const okComp = comp === 'all' ? allowAll : comps.some((c) => c.id === comp);
  const compEff = okComp ? comp : (allowAll ? 'all' : (comps[0] ? comps[0].id : comp));
  const fms = compEff === 'all' ? [...new Set([FM_ID[team.leagueId], ...CUP_IDS.map((c) => FM_ID[c])].filter(Boolean))] : [FM_ID[compEff]].filter(Boolean);
  const { data } = useAsync(async () => {
    const lists = await Promise.all(fms.map((fm) => teamSeasons(fm, team.name)));
    return sortSeasons([...new Set(lists.flat())]);
  }, [team.name, compEff]);
  const seasons = data || [];
  const sk = season === 'cur' || !data || seasons.includes(season) ? season : 'cur';
  return { comp: compEff, setComp, season: sk, setSeason, comps, seasons, fm: FM_ID[compEff] };
}

const ease = (t) => 1 - (1 - t) ** 3;
// numero che scorre dal valore precedente a quello nuovo (cifre insieme alla barra)
export function RollText({ value, fmt, delay = 0, duration = 900, className = '', style }) {
  const el = useRef(null);
  const shown = useRef(value);
  const raf = useRef(0);
  useEffect(() => {
    const node = el.current;
    if (!node) return undefined;
    const from = shown.current;
    const to = value;
    cancelAnimationFrame(raf.current);
    if (typeof to !== 'number' || typeof from !== 'number' || from === to) { node.textContent = fmt(to); shown.current = to; return undefined; }
    const t0 = performance.now() + delay;
    const tick = (now) => {
      const t = (now - t0) / duration;
      if (t < 0) { raf.current = requestAnimationFrame(tick); return; }
      const p = Math.min(1, t);
      const v = from + (to - from) * ease(p);
      shown.current = v;
      node.textContent = fmt(p >= 1 ? to : v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span ref={el} className={`tnum ${className}`} style={style}>{fmt(shown.current)}</span>;
}

// riga con valore a pillola colorata, posizione e barra con la media del campionato
export function BarRow({ label, value, fmt, frac, width, avgPos, avgText, rank, first, delay = 0 }) {
  const col = bandColor(frac);
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setW(width)));
    return () => cancelAnimationFrame(id);
  }, [width]);
  return (
    <div className="px-4 py-2.5" style={{ borderTop: first ? 'none' : '1px solid var(--hair-2)' }}>
      <div className="grid items-baseline gap-2" style={{ gridTemplateColumns: '1fr auto 42px' }}>
        <span className="text-[12.5px] leading-tight" style={{ color: 'var(--ink-2)' }}>{label}</span>
        <RollText value={value} fmt={fmt} delay={delay} className="justify-self-end text-right text-[14px] font-semibold" style={{ color: col, backgroundColor: `${col}26`, padding: '1px 8px', borderRadius: 999, transition: `color .9s ease ${delay}ms, background-color .9s ease ${delay}ms` }} />
        <span className="tnum text-right text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>{rank ? `${rank}°` : ''}</span>
      </div>
      <div className="relative" style={{ marginTop: 17, height: 9 }}>
        <div className="absolute inset-0 rounded-full" style={{ background: 'var(--hair-2)' }}>
          <div className="h-full overflow-hidden rounded-full" style={{ width: `${w}%`, backgroundColor: col, transition: `width .9s cubic-bezier(.22,.8,.24,1) ${delay}ms, background-color .9s ease ${delay}ms` }}>
            <span className="block h-full w-full" style={{ background: 'linear-gradient(90deg, rgba(5,7,13,.38), transparent 70%)' }} />
          </div>
        </div>
        {avgText ? (
          <>
            <span className="absolute" style={{ left: `${avgPos}%`, top: -5, bottom: -5, borderLeft: '2px dashed var(--ink)', opacity: 0.85 }} />
            <span className="tnum absolute whitespace-nowrap text-[9.5px] font-bold leading-none" style={{ left: `${Math.min(88, Math.max(12, avgPos))}%`, top: -20, transform: 'translateX(-50%)', color: 'var(--ink-2)', background: 'var(--hair-2)', padding: '2px 5px', borderRadius: 6 }}>media {avgText}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

// da una lista ordinata di classifica ricava posizione, frazione (1 = migliore), larghezza barra e media
export function standingOf(list, idx, key) {
  const n = list.length;
  const v = Number(list[idx][3]);
  const neg = NEG_RE.test(key);
  const best = Math.max(...list.slice(0, 5).map((r) => Number(r[3]) || 0), 0.0001);
  const avg = list.reduce((a, r) => a + (Number(r[3]) || 0), 0) / n;
  const top = Math.max(best * 1.05, avg * 1.6, v, 0.0001);
  const rank = neg ? n - idx : idx + 1;
  const frac = n > 1 ? (neg ? idx / (n - 1) : 1 - idx / (n - 1)) : 1;
  return { v, rank, frac, width: Math.max(3, Math.min(100, (v / top) * 100)), avg, avgPos: Math.min(100, (avg / top) * 100) };
}

// la scheda squadra mostra nel banner la competizione scelta nelle tendine
export const announceComp = (teamId, comp) => { try { window.dispatchEvent(new CustomEvent('sl-comp', { detail: { teamId, comp } })); } catch (e) { /* ignore */ } };
