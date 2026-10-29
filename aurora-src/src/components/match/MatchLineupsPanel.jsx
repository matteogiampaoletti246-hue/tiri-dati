import { useLayoutEffect, useRef, useState } from 'react';
import PlayerPhoto from '@/components/PlayerPhoto';
import Crest from '@/components/Crest';
import { teamColor } from '@/lib/tint';
import InjuryIcon from '@/components/InjuryIcon';
import { injuryOf } from '@/data/injuries';
import { Image } from '@/components/ui/image';
import PlayerLink from './PlayerLink';
import { SubIcon, BallIcon, BootIcon } from './EventIcons';
import { playerById } from '@/data/players';
import { playerReliability } from '@/data/topPlayers';
import { flagOf } from '@/data/referees';
import { comma } from '@/lib/format';

const last = (n) => String(n || '').split(' ').slice(-1)[0];
const tone = (v) => (v == null ? 'var(--hair)' : v >= 7.5 ? '#1FA45B' : v >= 7 ? '#5DBB3F' : v >= 6.5 ? '#E0B400' : v >= 6 ? '#E8892B' : '#E5484D');

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

function PitchNode({ p, team, val, match, compact, mvp }) {
  const size = compact ? 40 : 46;
  const ic = compact ? 14 : 16;
  return (
    <PlayerLink match={match} name={p.name} fmId={p.fmId} className="flex w-[72px] flex-col items-center">
      <span className="relative">
        <Face p={p} team={team} size={size} ring={mvp} />
        <Events p={p} size={ic} mvp={mvp} />
        <Badge v={val} />
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
function DualPitch({ lh, la, home, away, valOf, match, mvpId }) {
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
          {row.map((p) => <PitchNode key={p.playerId || p.name} match={match} p={p} team={team} val={valOf(p)} compact={row.length >= 5} mvp={!!mvpId && p.playerId === mvpId} />)}
        </div>
      ))}
    </div>
  );
  return (
    <div className="relative overflow-hidden rounded-[24px] px-1.5" style={{ height: h, paddingTop: 26, background: 'linear-gradient(180deg,#12301f,#0f2a1b)', border: '1px solid rgba(255,255,255,.12)' }}>
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
        <p className="truncate text-[15px] font-extrabold text-white">{lineup.coach} {lineup.coachCc ? <span className="ml-1">{flagOf(lineup.coachCc)}</span> : null}</p>
      </div>
    </div>
  );
}

// Panchina in colonna (una riga per giocatore)
function Bench({ lineup, team, valOf, match }) {
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
            {v != null ? <span className="tnum rounded-full px-2 py-[1px] text-[11px] font-extrabold text-white" style={{ background: tone(v) }}>{comma(v, 1)}</span> : null}
          </PlayerLink>
        );
      })}
    </section>
  );
}

const hasSide = (l) => !!(l && (l.coach || (l.bench && l.bench.length)));

// Selettore squadra sotto il campo (concept Sofascore): due pillole a meta' larghezza, casa a sinistra e ospite a destra;
// la squadra scelta mostra allenatore e panchina, il passaggio e' uno scorrimento orizzontale (niente componenti ricreati).
function SidePicker({ lh, la, home, away, valOf, match }) {
  const sides = [[lh, home], [la, away]].map(([l, t], i) => ({ l, t, i })).filter((x) => hasSide(x.l));
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
        <div className="glass relative mb-3 flex rounded-full p-1" role="tablist" data-side-picker="1">
          <span aria-hidden="true" className="absolute bottom-1 left-1 top-1 rounded-full" style={{ width: 'calc(50% - 4px)', transform: `translate3d(${cur ? '100%' : '0'},0,0)`, transition: 'transform .3s cubic-bezier(.22,.8,.24,1), background .3s ease', background: 'var(--pill-active)' }} />
          {sides.map((x, k) => (
            <button key={x.i} type="button" role="tab" aria-selected={cur === k} onClick={() => setSel(k)} className="press relative z-[1] flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2">
              <Crest team={x.t} size={22} />
              <span className="truncate text-[13px] font-extrabold" style={{ color: cur === k ? 'var(--ink)' : 'var(--ink-3)', transition: 'color .3s ease' }}>{x.t ? x.t.name : ''}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="overflow-hidden" style={{ height: h == null ? 'auto' : h, transition: 'height .3s cubic-bezier(.22,.8,.24,1)' }}>
        <div className="flex items-start" style={{ width: `${sides.length * 100}%`, transform: `translate3d(${(-100 * cur) / sides.length}%,0,0)`, transition: 'transform .3s cubic-bezier(.22,.8,.24,1)' }}>
          {sides.map((x, k) => (
            <div key={x.i} ref={(el) => { boxes.current[k] = el; }} className="flex flex-col gap-3" style={{ width: `${100 / sides.length}%` }} aria-hidden={cur !== k}>
              <CoachPill lineup={x.l} team={x.t} />
              <Bench lineup={x.l} team={x.t} valOf={valOf} match={match} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// la scheda Formazioni compare solo se c'e' almeno un campo, un allenatore o una panchina
const okSide = (l) => !!(l && l.xi && l.xi.length && l.formation);
export const hasLineups = (view) => {
  const l = view.lineup;
  if (!l) return false;
  return (okSide(l.home) && okSide(l.away)) || [l.home, l.away].some((x) => x && (x.coach || (x.bench && x.bench.length)));
};

export default function MatchLineupsPanel({ match, view, home, away, pre }) {
  const lh = view.lineup ? view.lineup.home : null;
  const la = view.lineup ? view.lineup.away : null;
  const okH = okSide(lh);
  const okA = okSide(la);
  const valOf = (p) => {
    const pl = playerById(p.playerId);
    if (pre) {
      const r = pl && playerReliability(pl, match.date, 1.5);
      return r ? r.voto : null;
    }
    return p.rating;
  };
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
    <div className="flex flex-col gap-5 pb-6 pt-3">
      {okH && okA ? (
        <div className="px-4">
          <div className="mb-3 text-center">
            <p className="text-[15px] font-extrabold">{title}</p>
            <p className="mt-1 text-[13px] font-extrabold">
              <span style={{ color: tcol(home) }}>{lh.formation.label}</span>
              <span className="mx-2" style={{ color: 'var(--ink-3)' }}>·</span>
              <span style={{ color: tcol(away) }}>{la.formation.label}</span>
            </p>
          </div>
          <DualPitch lh={lh} la={la} home={home} away={away} valOf={valOf} match={match} mvpId={mvpId} />
          <p className="mt-2 text-center text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{pre ? 'Voto = affidabilità tiri (over 1,5)' : 'Voto = prestazione in partita'}</p>
        </div>
      ) : null}

      <SidePicker lh={lh} la={la} home={home} away={away} valOf={valOf} match={match} />
    </div>
  );
}
