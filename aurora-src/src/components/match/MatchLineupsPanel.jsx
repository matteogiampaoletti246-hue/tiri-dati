import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PlayerPhoto from '@/components/PlayerPhoto';
import Crest from '@/components/Crest';
import { teamColor } from '@/lib/tint';
import InjuryIcon from '@/components/InjuryIcon';
import { injuryOf } from '@/data/injuries';
import { Image } from '@/components/ui/image';
import PlayerLink from './PlayerLink';
import { SubIcon, BallIcon, BootIcon } from './EventIcons';
import { playerById, playerByFm, playersByTeam } from '@/data/players';
import { openPanel } from '@/data/playerPanel';
import { playerReliability, loadPlayerFouls, TOP_STATS } from '@/data/topPlayers';
import { isOutOn } from '@/data/injuries';
import TopStatPicker from '@/components/top/TopStatPicker';
import LinePicker from './LinePicker';
import VoteBadge from './VoteBadge';
import FlagDot from '@/components/FlagDot';
import { flagCodeOf } from '@/data/referees';
import { comma } from '@/lib/format';
import usePullRefresh from '@/hooks/usePullRefresh';
import { prepareMatch } from '@/data/prepare';

// rotella piccola accanto al titolo mentre si aggiorna (tira giu' per aggiornare, concept C)
const MiniSpin = () => (
  <svg width="14" height="14" viewBox="0 0 34 34" className="pl-spin absolute right-full top-1/2 mr-2 -mt-[7px]" aria-hidden="true">
    <circle cx="17" cy="17" r="13" fill="none" stroke="var(--line, rgba(128,128,128,.3))" strokeWidth="4" />
    <path d="M17 4a13 13 0 0 1 13 13" fill="none" stroke="#4aa8ff" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const last = (n) => String(n || '').split(' ').slice(-1)[0];
const tone = (v) => (v == null ? 'var(--hair)' : v >= 7.5 ? '#1FA45B' : v >= 7 ? '#5DBB3F' : v >= 6.5 ? '#E0B400' : v >= 6 ? '#E8892B' : '#E5484D');

// giocatore dell'app per una riga di formazione: per id app, altrimenti per id FotMob (campionati minori: il nome FotMob e' diverso da quello dell'elenco)
const plOf = (p) => playerById(p.playerId) || (p.fmId ? playerByFm(p.fmId) : null);

// Concept A: voto a pillola sul bordo basso del volto; cartellino in alto a sinistra, gol e assist in colonna in alto a destra, cambio (solo le due freccette, senza sfondo ne' minuto) in basso a sinistra, capitano in basso a destra, stella (migliore) in alto.
// Ogni icona ha il suo posto fisso (colonne ai lati del volto): non si coprono tra loro ne' con il voto.
const SHADOW = { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.9)) drop-shadow(0 0 1px rgba(0,0,0,.9))' };

function Face({ p, size = 46, team, ring }) {
  return (
    <span className="avatar relative shrink-0 overflow-visible" style={{ width: size, height: size, background: `linear-gradient(150deg, ${team.colors[0]}, ${team.colors[1]})`, boxShadow: ring ? '0 0 0 2.5px #FFC83D, 0 0 14px rgba(255,200,61,.55)' : undefined }}>
      <span className="block h-full w-full overflow-hidden rounded-full">
        <PlayerPhoto src={p.photo} alt={p.name} />
      </span>
    </span>
  );
}

function Events({ p, size, mvp }) {
  const ab = 'pointer-events-none absolute';
  const num = (n) => (n > 1 ? <span className="tnum text-[10px] font-extrabold leading-none text-white">{n}</span> : null);
  return (
    <>
      {p.card ? <span className={ab} style={{ left: -7, top: -5, width: size * 0.62, height: size * 0.82, borderRadius: 2.5, background: p.card === 'red' ? '#E5484D' : '#F2C230', boxShadow: '0 0 0 1px rgba(0,0,0,.35)' }} /> : null}
      {p.goals || p.assists ? (
        <span className={`${ab} flex flex-col items-start gap-[2px]`} style={{ left: '100%', top: -5, marginLeft: -2 }}>
          {p.goals ? <span className="flex items-center" style={SHADOW}><BallIcon size={size} />{num(p.goals)}</span> : null}
          {p.assists ? <span className="flex items-center" style={SHADOW}><BootIcon size={size} />{num(p.assists)}</span> : null}
        </span>
      ) : null}
      {p.subOut ? (
        <span className={`${ab} flex items-center`} style={{ right: '100%', marginRight: -6, bottom: 2, ...SHADOW }}>
          <SubIcon size={size} />
        </span>
      ) : null}
      {p.captain ? <span className={`${ab} flex items-center justify-center rounded-full font-extrabold`} style={{ left: '100%', marginLeft: -3, bottom: 3, width: size * 0.95, height: size * 0.95, fontSize: size * 0.58, background: '#F2C230', color: '#222' }}>C</span> : null}
      {mvp ? <span className={`${ab} text-[14px] leading-none`} style={{ left: '50%', top: -11, transform: 'translateX(-50%)', color: '#FFC83D', textShadow: '0 1px 2px #000' }}>★</span> : null}
    </>
  );
}

function Badge({ v }) {
  if (v == null) return null;
  return <span className="tnum absolute left-1/2 -translate-x-1/2 rounded-full px-[6px] py-[1px] text-[10.5px] font-extrabold leading-[13px] text-white" style={{ bottom: -7, background: tone(v), border: '1.5px solid rgba(0,0,0,.4)' }}>{comma(v, 1)}</span>;
}

function PitchNode({ p, team, val, match, compact, mvp, pre }) {
  const size = compact ? 40 : 46;
  const ic = compact ? 14 : 16;
  return (
    <PlayerLink match={match} name={p.name} fmId={p.fmId} className="flex min-w-0 max-w-[72px] flex-1 basis-0 flex-col items-center">
      <span className="relative">
        <Face p={p} team={team} size={size} ring={mvp} />
        <Events p={p} size={ic} mvp={mvp} />
        {pre ? <VoteBadge v={val} /> : <Badge v={val} />}
        {match.status === 'scheduled' && p.playerId && injuryOf(p.playerId) ? <span className="absolute -left-1 -top-1"><InjuryIcon size={14} /></span> : null}
      </span>
      <span className="mt-[11px] max-w-full truncate rounded-full px-1.5 text-center text-[10.5px] font-bold leading-[15px] text-white" style={{ background: 'rgba(0,0,0,.32)', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>{last(p.name)}</span>
    </PlayerLink>
  );
}

// righe di una squadra dal portiere all'attacco (ordine di FotMob)
function rowsOf(lineup) {
  const xi = lineup.xi;
  const rows = [[xi[0]]];
  let idx = 1;
  lineup.formation.rows.forEach((c) => {
    rows.push(xi.slice(idx, idx + c));
    idx += c;
  });
  return rows;
}

// Campo unico: casa in alto (specchiata: la sua ala destra sta a sinistra dello schermo), ospite in basso.
function DualPitch({ lh, la, home, away, valOf, match, mvpId, pre, wave }) {
  const rh = lh ? rowsOf(lh).map((r) => [...r].reverse()) : [];
  const ra = la ? rowsOf(la).reverse() : [];
  const ROW = 86;
  const GAP = 34;
  const h = (rh.length + ra.length) * ROW + GAP + 52;
  const line = 'rgba(255,255,255,.2)';
  const half = (rows, team, side) => (
    <div className="flex flex-col justify-between" style={{ height: rows.length * ROW }}>
      {rows.map((row, ri) => (
        <div key={ri} className="flex items-start justify-around gap-1" style={{ height: ROW }}>
          {row.map((p) => <PitchNode key={p.playerId || p.name} match={match} p={p} team={team} val={valOf(p)} compact={row.length >= 5} mvp={!!mvpId && p.playerId === mvpId} pre={pre} />)}
        </div>
      ))}
    </div>
  );
  return (
    <div data-pitch="1" className="relative overflow-hidden rounded-[24px] px-1.5" style={{ height: h, paddingTop: 26, background: 'linear-gradient(180deg,#12301f,#0f2a1b)', border: '1px solid rgba(255,255,255,.12)' }}>
      {wave ? <span key={wave} className="pitch-wave pointer-events-none absolute left-1/2 top-1/2 z-10" /> : null}
      <span className="pointer-events-none absolute left-1/2 top-0 h-[86px] w-[56%] -translate-x-1/2 rounded-b-[10px]" style={{ border: `1.5px solid ${line}`, borderTop: 'none' }} />
      <span className="pointer-events-none absolute bottom-0 left-1/2 h-[86px] w-[56%] -translate-x-1/2 rounded-t-[10px]" style={{ border: `1.5px solid ${line}`, borderBottom: 'none' }} />
      <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px" style={{ background: line }} />
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ border: `1.5px solid ${line}` }} />
      <span className="absolute left-3 top-2.5 z-[2] max-w-[60%] truncate text-[11.5px] font-extrabold uppercase tracking-wider" style={{ color: tcol(home) }}>{home ? home.name : ''}</span>
      <span className="absolute bottom-2.5 right-3 z-[2] max-w-[60%] truncate text-[11.5px] font-extrabold uppercase tracking-wider" style={{ color: tcol(away) }}>{away ? away.name : ''}</span>
      <div className="relative">
        {half(rh, home, 'h')}
        <div style={{ height: GAP }} />
        {half(ra, away, 'a')}
      </div>
    </div>
  );
}

// colore del nome squadra leggibile sul verde scuro
const tcol = (t) => { const c = t && t.colors && t.colors[0]; return c ? `color-mix(in srgb, ${c} 55%, #fff)` : '#fff'; };

// Pillola dell'allenatore nei colori della squadra scelta
function CoachPill({ lineup, team }) {
  if (!lineup || !lineup.coach) return null;
  const c = (team && team.colors) || ['#1B2C4E', '#0E1830'];
  return (
    <div className="flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-5" style={{ background: `linear-gradient(110deg, ${c[0]}, color-mix(in srgb, ${c[1] || c[0]} 70%, #000))`, boxShadow: '0 6px 18px -10px rgba(0,0,0,.7)' }}>
      <span className="avatar h-[44px] w-[44px] shrink-0 overflow-hidden rounded-full" style={{ background: 'rgba(0,0,0,.25)' }}>{lineup.coachId ? <Image src={`https://images.fotmob.com/image_resources/playerimages/${lineup.coachId}.png`} alt={lineup.coach} className="h-full w-full" fittingType="fill" /> : <PlayerPhoto src={null} alt={lineup.coach} />}</span>
      <div className="min-w-0" style={{ textShadow: '0 1px 2px rgba(0,0,0,.45)' }}>
        <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-white/75">Allenatore</p>
        <p className="truncate text-[15px] font-extrabold text-white">{lineup.coach} {lineup.coachCc ? <span className="ml-1 align-middle"><FlagDot code={flagCodeOf(lineup.coachCc)} size={16} /></span> : null}</p>
      </div>
    </div>
  );
}

// Panchina in colonna (una riga per giocatore)
function Bench({ lineup, team, valOf, match, pre }) {
  if (!lineup || !lineup.bench || !lineup.bench.length) return null;
  return (
    <section className="glass tint-card overflow-hidden rounded-[24px] px-4 py-3" style={{ '--tint': teamColor(team) }}>
      <p className="mb-1 text-[12.5px] font-extrabold uppercase tracking-wider">Panchina</p>
      {lineup.bench.map((p, i) => {
        const v = valOf(p);
        return (
          <PlayerLink key={p.playerId + i} match={match} name={p.name} fmId={p.fmId} className="flex items-center gap-3 py-2" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none', width: '100%' }}>
            <span className="relative"><Face p={p} team={team} size={36} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-bold"><span className="tnum" style={{ color: 'var(--ink-3)' }}>{p.number} </span>{p.name}</span>
              {p.subIn ? <span className="flex items-center gap-1 text-[10.5px]" style={{ color: 'var(--good)' }}><SubIcon size={11} />{p.subIn}&apos;</span> : null}
            </span>
            {pre ? <VoteBadge inline v={v} /> : v != null ? <span className="tnum rounded-full px-2 py-[1px] text-[11px] font-extrabold text-white" style={{ background: tone(v) }}>{comma(v, 1)}</span> : null}
          </PlayerLink>
        );
      })}
    </section>
  );
}

// Infortunati della squadra (formazioni prima del fischio): dopo la panchina, tutti i giocatori dell'app fuori alla data della partita
// (stessi dati e stessa croce rossa della scheda giocatore). Nessun infortunato = niente riquadro.
function injuredOf(team, lineup, match) {
  if (!team) return [];
  const seen = new Set();
  const out = [];
  const add = (pl) => {
    if (!pl || seen.has(pl.id) || pl.teamId !== team.id) return;
    seen.add(pl.id);
    if (!isOutOn(pl.id, match.date)) return;
    const i = injuryOf(pl.id);
    if (i) out.push({ pl, i });
  };
  playersByTeam(team.id).forEach(add);
  if (lineup) [...(lineup.xi || []), ...(lineup.bench || [])].forEach((p) => add(plOf(p)));
  return out.sort((a, b) => (b.pl.minutes || 0) - (a.pl.minutes || 0));
}

function Injured({ list, team }) {
  if (!list.length) return null;
  return (
    <section data-injured="1" className="alert-a overflow-hidden rounded-[24px] px-4 py-3" style={{ background: 'linear-gradient(110deg, rgba(229,72,77,.20), rgba(229,72,77,.035) 70%), hsl(var(--background))', border: '1px solid rgba(229,72,77,.40)' }}>
      <p className="mb-1 flex items-center gap-2 text-[12.5px] font-extrabold uppercase tracking-wider"><InjuryIcon size={18} />Infortunati</p>
      {list.map(({ pl, i }, k) => (
        <button key={pl.id} type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openPanel(pl.id); }} className="press flex w-full items-center gap-3 py-2" style={{ borderTop: k ? '1px solid var(--hair-2)' : 'none', textAlign: 'left', color: 'inherit', font: 'inherit' }}>
          <span className="relative"><Face p={pl} team={team} size={36} /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-bold">{pl.name}</span>
            <span className="block truncate text-[11px]" style={{ color: 'var(--ink-3)' }}>{i.reason}{i.label ? ` · Rientro: ${i.label}` : ''}</span>
          </span>
        </button>
      ))}
    </section>
  );
}

const hasSide = (l) => !!(l && (l.coach || (l.bench && l.bench.length)));

// Selettore squadra sotto il campo (concept Sofascore): due pillole a meta' larghezza, casa a sinistra e ospite a destra;
// la squadra scelta mostra allenatore e panchina, il passaggio e' uno scorrimento orizzontale (niente componenti ricreati).
function SidePicker({ lh, la, home, away, valOf, match, pre }) {
  const sides = [[lh, home], [la, away]].map(([l, t], i) => ({ l, t, i, inj: pre ? injuredOf(t, l, match) : [] })).filter((x) => hasSide(x.l) || x.inj.length);
  const [sel, setSel] = useState(0);
  const boxes = useRef([]);
  const [h, setH] = useState(null);
  const cur = sides.length > 1 ? sel : 0;
  useLayoutEffect(() => {
    const el = boxes.current[cur];
    if (!el) return undefined;
    const upd = () => setH(el.offsetHeight);
    upd();
    if (!('ResizeObserver' in window)) return undefined;
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cur, sides.length]);
  if (!sides.length) return null;
  return (
    <div className="px-4">
      {sides.length > 1 ? (
        <div className="halo-trigger glass relative mb-3 flex rounded-full p-1" role="tablist" data-side-picker="1">
          <span aria-hidden="true" className="lg-thumb lg-move absolute bottom-1 left-1 top-1 rounded-full" style={{ width: 'calc(50% - 4px)', transform: `translate3d(${cur ? '100%' : '0'},0,0)` }} />
          {sides.map((x, k) => (
            <button key={x.i} type="button" role="tab" aria-selected={cur === k} onClick={() => setSel(k)} className="press relative z-[1] flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2">
              <Crest team={x.t} size={22} />
              <span className="truncate text-[13px] font-extrabold" style={{ color: cur === k ? 'var(--atabs-pill-ink)' : 'var(--ink-3)', transition: 'color .3s ease' }}>{x.t ? x.t.name : ''}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="overflow-hidden" style={{ height: h == null ? 'auto' : h, transition: 'height .3s cubic-bezier(.22,.8,.24,1)' }}>
        <div className="flex items-start" style={{ width: `${sides.length * 100}%`, transform: `translate3d(${(-100 * cur) / sides.length}%,0,0)`, transition: 'transform .3s cubic-bezier(.22,.8,.24,1)' }}>
          {sides.map((x, k) => (
            <div key={x.i} ref={(el) => { boxes.current[k] = el; }} className="flex flex-col gap-3" style={{ width: `${100 / sides.length}%` }} aria-hidden={cur !== k}>
              <CoachPill lineup={x.l} team={x.t} />
              <Bench lineup={x.l} team={x.t} valOf={valOf} match={match} pre={pre} />
              <Injured list={x.inj} team={x.t} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// la scheda Formazioni compare solo se c'e' almeno un campo, un allenatore o una panchina
const okSide = (l) => !!(l && l.xi && l.xi.length && l.formation);
const okList = (l) => !!(l && l.list && l.list.length === 11);
export const hasLineups = (view) => {
  const l = view.lineup;
  if (!l) return false;
  // servono i due undici veri (sul campo o, con i soli nomi ufficiali, in elenco): solo allenatore o panchina non bastano = niente scheda
  return (okSide(l.home) && okSide(l.away)) || (okList(l.home) && okList(l.away));
};

// ---- Formazione a soli nomi (concept A scelto il 07/11/2026): due colonne affiancate, maglietta nel colore della squadra con il numero
// dentro (senza numero se la fonte non lo da'), portiere per primo con la maglietta da portiere (colore evidenziatore dei temi).
const rgbOf = (c) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(c || '').trim());
  if (m) { const h = m[1].length === 3 ? m[1].split('').map((x) => x + x).join('') : m[1]; return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
  const r = /rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/i.exec(String(c || ''));
  return r ? [+r[1], +r[2], +r[3]] : null;
};
const lumOf = (rgb) => (rgb ? (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255 : 0);
// squadra che gioca in giallo/verde chiaro: il portiere passa al secondo colore evidenziatore
const yellowish = (rgb) => !!rgb && rgb[0] > 150 && rgb[1] > 150 && rgb[2] < 120;

function Shirt({ fill, ink, n, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 30" aria-hidden="true" className="shrink-0">
      <path d="M8 3 L12 1 Q16 4 20 1 L24 3 L29 9 L25 13 L23 11 L23 28 L9 28 L9 11 L7 13 L3 9 Z" fill={fill} stroke="rgba(0,0,0,.25)" strokeWidth="0.8" />
      {n != null && n !== '' ? <text x="16" y="21" textAnchor="middle" fontSize={String(n).length > 2 ? 8 : 10} fontWeight="800" fill={ink}>{n}</text> : null}
    </svg>
  );
}

function ListColumn({ lineup, team, match, right }) {
  const c = (team && team.colors && team.colors[0]) || '#1B2C4E';
  const rgb = rgbOf(c);
  const ink = lumOf(rgb) > 0.6 ? '#111' : '#fff';
  const gkFill = yellowish(rgb) ? 'var(--gk-shirt-alt)' : 'var(--gk-shirt)';
  return (
    <div className="min-w-0">
      <div className={`mb-1.5 flex items-center gap-1.5 ${right ? 'justify-end' : 'justify-start'}`}>
        {right ? null : <Crest team={team} size={20} />}
        <span className="truncate text-[11.5px] font-extrabold uppercase tracking-wider" style={{ color: tcol(team), textAlign: right ? 'right' : 'left' }}>{team ? team.name : ''}</span>
        {right ? <Crest team={team} size={20} /> : null}
      </div>
      {lineup.list.map((p, i) => (
        <PlayerLink key={p.name + i} match={match} name={p.name} fmId={p.fmId} className="flex w-full items-center gap-2 py-[7px]" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
          <Shirt fill={p.gk ? gkFill : c} ink={p.gk ? 'var(--gk-shirt-ink)' : ink} n={p.number} />
          <span className="min-w-0 truncate text-[13px] font-bold">{p.name}</span>
        </PlayerLink>
      ))}
    </div>
  );
}

function ListLineups({ lh, la, home, away, match }) {
  return (
    <div data-lineup-list="1" className="glass grid gap-3 rounded-[24px] px-3 py-3" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
      <ListColumn lineup={lh} team={home} match={match} />
      <ListColumn lineup={la} team={away} match={match} right />
    </div>
  );
}

// Linee disponibili per statistica: i tiri arrivano a Over 3,5, le altre a Over 2,5
const LINES = { tiri: [0.5, 1.5, 2.5, 3.5], porta: [0.5, 1.5, 2.5], fc: [0.5, 1.5, 2.5], fs: [0.5, 1.5, 2.5] };
const FOUL_LINES = [0.5, 1.5, 2.5];

export default function MatchLineupsPanel({ match, view, home, away, pre }) {
  const wrapRef = useRef(null);
  const bodyRef = useRef(null);
  const arcRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [wave, setWave] = useState(0);
  const [, bump] = useState(0);
  usePullRefresh({
    wrapRef, bodyRef, arcRef,
    onRefresh: () => prepareMatch(match.id, true).then(() => bump((n) => n + 1)),
    onBusy: (b, done) => { setBusy(b); if (done) setWave((n) => n + 1); },
  });
  const lh = view.lineup ? view.lineup.home : null;
  const la = view.lineup ? view.lineup.away : null;
  const okH = okSide(lh);
  const okA = okSide(la);
  // Prima del fischio: statistica e linea scelte dalle due tendine accanto al titolo (si parte da Tiri, Over 1,5)
  const [stat, setStat] = useState('tiri');
  const [line, setLine] = useState(1.5);
  const [fouls, setFouls] = useState({});
  const isF = stat === 'fc' || stat === 'fs';
  const last = useRef({});
  const players = [lh, la].flatMap((l) => (l ? [...(l.xi || []), ...(l.bench || [])] : []));
  const pk = players.map((p) => p.playerId).join(',');
  useEffect(() => {
    if (!pre || !isF || fouls[stat]) return undefined;
    let on = true;
    Promise.all(players.map((p) => {
      const pl = plOf(p);
      return pl && !isOutOn(pl.id, match.date) ? loadPlayerFouls(pl, match.date, FOUL_LINES, stat) : Promise.resolve(null);
    })).then((rows) => {
      if (!on) return;
      const m = {};
      players.forEach((p, i) => { m[p.playerId] = rows[i]; });
      setFouls((f) => ({ ...f, [stat]: m }));
    });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stat, pre, pk]);
  const valOf = (p) => {
    const pl = plOf(p);
    if (pre) {
      if (!pl) return null;
      if (isF) {
        const tab = fouls[stat];
        if (!tab) return last.current[p.playerId] === undefined ? null : last.current[p.playerId]; // in caricamento: restano i voti di prima
        const row = tab[p.playerId];
        const v = row ? row[FOUL_LINES.indexOf(line)] : null;
        last.current[p.playerId] = v == null ? null : v;
        return v == null ? null : v;
      }
      const r = playerReliability(pl, match.date, line, false, stat === 'porta' ? 'inPorta' : 'totali');
      last.current[p.playerId] = r ? r.voto : null;
      return r ? r.voto : null;
    }
    return p.rating;
  };
  const onStat = (k) => { setStat(k); setLine((l) => (LINES[k].includes(l) ? l : 2.5)); };
  // ufficiale solo se FotMob la dà come tale ("standard"); "lastStarting11" e' l'ultima formazione schierata = probabile
  const official = (okH || okA) && (lh || la).confirmed !== false && view.lineupType !== undefined && /^(standard|official|confirm)/i.test(String(view.lineupType || ''));
  // migliore in campo (stella): voto piu' alto tra tutti, solo a partita giocata
  let mvpId = null;
  if (!pre) {
    let best = 0;
    [lh, la].forEach((l) => l && [...(l.xi || []), ...(l.bench || [])].forEach((p) => { if (p.rating != null && p.rating > best) { best = p.rating; mvpId = p.playerId; } }));
  }
  const title = pre ? (official ? 'Formazione ufficiale' : 'Formazione probabile') : 'Formazioni';

  return (
    <div ref={wrapRef} className="relative">
    <div className="pointer-events-none absolute left-4 right-4 top-0.5 z-10 h-[3px] overflow-hidden rounded" style={{ background: 'var(--line, rgba(128,128,128,.15))' }}>
      <i ref={arcRef} className="block h-full" style={{ width: 0, background: 'linear-gradient(90deg,#2f6bff,#4aa8ff)' }} />
    </div>
    <div ref={bodyRef} className="flex flex-col gap-5 pb-6 pt-3">
      {okH && okA ? (
        <div className="px-4">
          {pre ? (
            <div className="mb-3 grid items-center gap-1.5" style={{ gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)' }}>
              <div className="flex justify-start"><TopStatPicker side="left" tight options={TOP_STATS} value={stat} onChange={onStat} /></div>
              <div className="text-center">
                <p className="text-[13.5px] font-extrabold"><span className="relative">{busy ? <MiniSpin /> : null}{title}</span></p>
                {lh.formation.label || la.formation.label ? (
                  <p className="mt-1 text-[12.5px] font-extrabold">
                    <span style={{ color: tcol(home) }}>{lh.formation.label}</span>
                    {lh.formation.label && la.formation.label ? <span className="mx-2" style={{ color: 'var(--ink-3)' }}>·</span> : null}
                    <span style={{ color: tcol(away) }}>{la.formation.label}</span>
                  </p>
                ) : null}
              </div>
              <div className="flex justify-end"><LinePicker lines={LINES[stat]} value={line} onChange={setLine} /></div>
            </div>
          ) : (
            <div className="mb-3 text-center">
              <p className="text-[15px] font-extrabold"><span className="relative">{busy ? <MiniSpin /> : null}{title}</span></p>
              {lh.formation.label || la.formation.label ? (
                <p className="mt-1 text-[13px] font-extrabold">
                  <span style={{ color: tcol(home) }}>{lh.formation.label}</span>
                  {lh.formation.label && la.formation.label ? <span className="mx-2" style={{ color: 'var(--ink-3)' }}>·</span> : null}
                  <span style={{ color: tcol(away) }}>{la.formation.label}</span>
                </p>
              ) : null}
            </div>
          )}
          <DualPitch lh={lh} la={la} home={home} away={away} valOf={valOf} match={match} mvpId={mvpId} pre={pre} wave={wave} />
          {pre ? null : <p className="mt-2 text-center text-[10.5px]" style={{ color: 'var(--ink-3)' }}>Voto = prestazione in partita</p>}
        </div>
      ) : okList(lh) && okList(la) ? (
        <div className="px-4">
          <div className="mb-3 text-center">
            <p className="text-[15px] font-extrabold"><span className="relative">{busy ? <MiniSpin /> : null}{pre ? 'Formazione ufficiale' : 'Formazioni'}</span></p>
          </div>
          <ListLineups lh={lh} la={la} home={home} away={away} match={match} />
        </div>
      ) : null}

      <SidePicker lh={lh} la={la} home={home} away={away} valOf={valOf} match={match} pre={pre} />
    </div>
    </div>
  );
}
