import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import Crest from '@/components/Crest';
import { Image } from '@/components/ui/image';
import PlayerLink from './PlayerLink';
import { SubIcon } from './EventIcons';
import { playerById } from '@/data/players';
import { playerReliability } from '@/data/topPlayers';
import { flagOf } from '@/data/referees';
import { comma } from '@/lib/format';

const last = (n) => String(n || '').split(' ').slice(-1)[0];
const tone = (v) => (v == null ? 'var(--hair)' : v >= 7.5 ? '#1FA45B' : v >= 7 ? '#5DBB3F' : v >= 6.5 ? '#E0B400' : v >= 6 ? '#E8892B' : '#E5484D');

function Face({ p, size = 46, team }) {
  return (
    <span className="avatar relative shrink-0 overflow-visible" style={{ width: size, height: size, background: `linear-gradient(150deg, ${team.colors[0]}, ${team.colors[1]})` }}>
      <span className="block h-full w-full overflow-hidden rounded-full">
        {p.photo ? <Image src={p.photo} alt={p.name} className="h-full w-full" fittingType="fill" /> : <span className="flex h-full w-full items-center justify-center text-[12px] font-bold text-white">{p.initials}</span>}
      </span>
      {p.card ? <span className="absolute -left-1 -top-1 h-[11px] w-[8px] rounded-[1.5px]" style={{ background: p.card === 'red' ? '#E5484D' : '#F2C230' }} /> : null}
      {p.subOut ? <span className="absolute -left-2 top-0 rounded-full p-[1px]" style={{ background: 'hsl(var(--background))' }}><SubIcon size={13} /></span> : null}
      {p.captain ? <span className="absolute -right-1 top-0 flex h-[14px] w-[14px] items-center justify-center rounded-full text-[8.5px] font-extrabold" style={{ background: '#F2C230', color: '#222' }}>C</span> : null}
    </span>
  );
}

function Badge({ v }) {
  if (v == null) return null;
  return <span className="tnum absolute -bottom-1 -right-2 rounded-full px-[5px] py-[1px] text-[10px] font-extrabold text-white" style={{ background: tone(v), border: '1.5px solid hsl(var(--background))' }}>{comma(v, 1)}</span>;
}

function Node({ p, team, val, size, match }) {
  return (
    <PlayerLink match={match} name={p.name} fmId={p.fmId} className="flex w-[70px] flex-col items-center gap-1">
      <span className="relative"><Face p={p} team={team} size={size} /><Badge v={val} /></span>
      <span className="mt-1 w-full truncate text-center text-[10.5px] font-bold leading-tight" style={{ color: 'var(--ink)' }}><span className="tnum" style={{ color: 'var(--ink-3)' }}>{p.number} </span>{last(p.name)}</span>
    </PlayerLink>
  );
}

function PitchView({ lineup, team, valOf, concept, match }) {
  const xi = lineup.xi;
  const rows = [[xi[0]]];
  let idx = 1;
  lineup.formation.rows.forEach((c) => {
    rows.push(xi.slice(idx, idx + c));
    idx += c;
  });
  const display = [...rows.slice(1).reverse(), rows[0]];

  if (concept === 'c') {
    const names = ['Portiere', 'Difesa', 'Centrocampo', 'Attacco'];
    const order = [...rows.slice(1), rows[0]].reverse();
    return (
      <div className="flex flex-col gap-3">
        {order.map((row, ri) => (
          <div key={ri} className="glass-flat rounded-[20px] px-3 py-3">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{ri === 0 ? names[3] : ri === order.length - 1 ? names[0] : order.length === 4 ? names[order.length - 1 - ri] : `Linea ${order.length - ri - 1}`}</p>
            <div className="flex flex-wrap justify-around gap-y-3">{row.map((p) => <Node key={p.playerId} match={match} p={p} team={team} val={valOf(p)} size={46} />)}</div>
          </div>
        ))}
      </div>
    );
  }

  const green = concept !== 'b';
  return (
    <div
      className="relative overflow-hidden rounded-[24px] px-2 py-6"
      style={{
        background: green ? 'repeating-linear-gradient(180deg,#1f6f43 0 56px,#227a4a 56px 112px)' : 'linear-gradient(180deg, rgba(120,170,255,.16), rgba(120,170,255,.05))',
        border: green ? '1px solid rgba(255,255,255,.18)' : '1px solid var(--hair)',
      }}
    >
      <span className="pointer-events-none absolute inset-x-3 bottom-3 h-20 rounded-b-[12px]" style={{ border: `1.5px solid ${green ? 'rgba(255,255,255,.4)' : 'var(--hair)'}`, borderTop: 'none' }} />
      <span className="pointer-events-none absolute inset-x-3 top-3 h-20 rounded-t-[12px]" style={{ border: `1.5px solid ${green ? 'rgba(255,255,255,.4)' : 'var(--hair)'}`, borderBottom: 'none' }} />
      <span className="pointer-events-none absolute inset-x-3 top-1/2 h-px" style={{ background: green ? 'rgba(255,255,255,.4)' : 'var(--hair)' }} />
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ border: `1.5px solid ${green ? 'rgba(255,255,255,.4)' : 'var(--hair)'}` }} />
      <div className="relative flex flex-col gap-7">
        {display.map((row, ri) => (
          <div key={ri} className="flex items-start justify-around gap-1">
            {row.map((p) => <PitchNode key={p.playerId} match={match} p={p} team={team} val={valOf(p)} light={green} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

function PitchNode({ p, team, val, light, match }) {
  return (
    <PlayerLink match={match} name={p.name} fmId={p.fmId} className="flex w-[70px] flex-col items-center gap-1">
      <span className="relative"><Face p={p} team={team} size={46} /><Badge v={val} /></span>
      <span className="mt-1 w-full truncate text-center text-[10.5px] font-bold leading-tight" style={{ color: light ? '#fff' : 'var(--ink)', textShadow: light ? '0 1px 3px rgba(0,0,0,.55)' : 'none' }}>{p.number} {last(p.name)}</span>
    </PlayerLink>
  );
}

export default function MatchLineupsPanel({ match, view, home, away, pre }) {
  const [side, setSide] = useState('home');
  const concept = 'a';
  const lineup = view.lineup ? view.lineup[side] : null;
  const team = side === 'home' ? home : away;
  const valOf = (p) => {
    const pl = playerById(p.playerId);
    if (pre) {
      const r = pl && playerReliability(pl, match.date);
      return r ? r.voto : null;
    }
    return p.rating;
  };
  const official = lineup && lineup.confirmed !== false && view.lineupType !== undefined && !/pred|prob/i.test(String(view.lineupType || ''));

  return (
    <div className="flex flex-col gap-5 pb-6 pt-3">
      <div className="flex items-center gap-3 px-4">
        <TextFilter options={[{ value: 'home', label: home ? home.short || home.name : 'Casa' }, { value: 'away', label: away ? away.short || away.name : 'Trasferta' }]} value={side} onChange={setSide} />
      </div>

      {!lineup || !lineup.xi || !lineup.xi.length ? <p className="px-5 py-12 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Formazioni non ancora disponibili</p> : null}

      {lineup && lineup.xi && lineup.xi.length ? (
        <div className="px-4">
          <div className="mb-3 flex items-center gap-2">
            <Crest team={team} size={22} />
            <span className="text-[13px] font-extrabold">{pre ? (official ? 'Formazione ufficiale' : 'Formazione probabile') : 'Formazione'}</span>
            <span className="ml-auto text-[13px] font-extrabold" style={{ color: 'var(--ink-2)' }}>{lineup.formation ? lineup.formation.label : ''}</span>
          </div>
          <PitchView lineup={lineup} team={team} valOf={valOf} concept={concept} match={match} />
          <p className="mt-2 text-center text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{pre ? 'Voto = affidabilità tiri (over 0,5)' : 'Voto = prestazione in partita'}</p>
        </div>
      ) : null}

      {lineup && lineup.coach ? (
        <section className="glass mx-4 flex items-center gap-3 rounded-[24px] px-4 py-3">
          <span className="avatar h-[52px] w-[52px]">{lineup.coachId ? <Image src={`https://images.fotmob.com/image_resources/playerimages/${lineup.coachId}.png`} alt={lineup.coach} className="h-full w-full" fittingType="fill" /> : lineup.coach.slice(0, 1)}</span>
          <div>
            <p className="text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Allenatore</p>
            <p className="text-[16px] font-extrabold">{lineup.coach} {lineup.coachCc ? <span className="ml-1">{flagOf(lineup.coachCc)}</span> : null}</p>
          </div>
        </section>
      ) : null}

      {lineup && lineup.bench && lineup.bench.length ? (
        <section className="glass mx-4 overflow-hidden rounded-[24px] px-4 py-3.5">
          <p className="mb-2 text-[12.5px] font-extrabold uppercase tracking-wider">Panchina</p>
          <div className="grid grid-cols-2 gap-x-4">
            {lineup.bench.map((p, i) => {
              const v = valOf(p);
              return (
                <PlayerLink key={p.playerId + i} match={match} name={p.name} fmId={p.fmId} className="flex items-center gap-2.5 py-2" style={{ borderTop: i > 1 ? '1px solid var(--hair-2)' : 'none', width: '100%' }}>
                  <span className="relative"><Face p={p} team={team} size={34} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-bold"><span className="tnum" style={{ color: 'var(--ink-3)' }}>{p.number} </span>{last(p.name)}</span>
                    {p.subIn ? <span className="flex items-center gap-1 text-[10.5px]" style={{ color: 'var(--good)' }}><SubIcon size={11} />{p.subIn}&apos;</span> : null}
                  </span>
                  {v != null ? <span className="tnum rounded-full px-1.5 py-[1px] text-[10px] font-extrabold text-white" style={{ background: tone(v) }}>{comma(v, 1)}</span> : null}
                </PlayerLink>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
