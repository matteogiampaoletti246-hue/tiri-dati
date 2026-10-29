import { teamGrad } from '@/lib/tint';
import { teamById } from '@/data/teams';
import InjuryIcon from '@/components/InjuryIcon';
import { injuryOf } from '@/data/injuries';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadCarriere, carriereOf, countryIt, flagOf, ageOf } from '@/data/carriere';
import { Image } from '@/components/ui/image';
import { playersByTeam } from '@/data/players';
import { loadRose, roseOf } from '@/data/rose';
import { FM_ID, currentSeason, playerFace } from '@/data/archive';
import { archiveId } from '@/data/archivePlayer';
import useAsync from '@/hooks/useAsync';

const GROUPS = [
  { key: 'GK', title: 'Portieri', color: '#E8B923', pos: ['GK'] },
  { key: 'DEF', title: 'Difensori', color: '#38A2FF', pos: ['DEF'] },
  { key: 'MID', title: 'Centrocampisti', color: '#3FCF8E', pos: ['MID'] },
  { key: 'ATT', title: 'Attaccanti', color: '#EF5B5B', pos: ['WNG', 'ATT'] },
  { key: 'UNK', title: 'Giocatori', color: '#8EA0BD', pos: ['UNK'] }, // ruolo non fornito dalla fonte (rosa ricavata dalle presenze)
];

// Rosa della squadra divisa per ruolo.
export default function TeamRosterPanel({ teamId }) {
  const [, bump] = useState(0);
  useEffect(() => {
    let on = true;
    Promise.all([loadCarriere(), loadRose()]).then(() => on && bump((n) => n + 1));
    return () => { on = false; };
  }, []);
  const all = playersByTeam(teamId);
  const team = teamById(teamId);
  const rose = roseOf(team);
  const nk = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const mine = {};
  all.forEach((p) => { mine[nk(p.name)] = p; });
  const fmR = rose ? FM_ID[rose.lg] : null;
  const { data: skR } = useAsync(() => (fmR ? currentSeason(fmR) : Promise.resolve(null)), [fmR]);
  if (rose && rose.p && rose.p.length) {
    const grp = GROUPS.map((g) => ({ ...g, list: rose.p.filter((r) => g.pos.includes(r[2]) || (g.key === 'ATT' && r[2] === 'ATT')).sort((a, b) => (b[7] || 0) - (a[7] || 0) || (a[3] || 99) - (b[3] || 99)) }));
    return (
      <div className="flex flex-col gap-3.5 px-4 pb-8 pt-4">
        {grp.filter((g) => g.list.length).map((g) => (
          <section key={g.key} className="glass overflow-hidden rounded-[22px]" style={{ borderLeft: `3px solid ${g.color}` }}>
            <div className="flex items-center px-4 py-2.5" style={{ background: `${g.color}1f` }}>
              <b className="text-[12.5px] uppercase tracking-[.07em]" style={{ color: g.color }}>{g.title}</b>
              <span className="ml-auto text-[12px]" style={{ color: 'var(--ink-3)' }}>{g.list.length}</span>
            </div>
            <div className="h-1.5" />
            {g.list.map((r) => {
              const bits = [r[4] ? `${flagOf(r[4])} ${countryIt(r[4])}`.trim() : null, r[6] ? `${r[6]} cm` : null, r[5] ? `${r[5]} anni` : null].filter(Boolean);
              const initials = String(r[1]).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <Link key={r[0]} to={mine[nk(r[1])] ? `/giocatore/${mine[nk(r[1])].id}` : skR && r[0] > 0 ? `/giocatore/${archiveId(fmR, skR, r[0])}` : '#'} className="press mx-2 mb-1.5 flex items-center gap-3 rounded-[18px] px-3 py-2" style={{ background: teamGrad(team, 0x55) }}>
                  <span className="avatar h-[38px] w-[38px] text-[11px]">
                    <Image src={playerFace(r[0])} alt={r[1]} className="h-full w-full" fittingType="fill" />
                    <span className="sr-only">{initials}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold">{r[3] ? <span style={{ color: 'var(--accent)' }}>{r[3]} </span> : null}{r[1]}{r[10] ? <> <InjuryIcon size={15} /></> : null}</span>
                    {bits.length ? <span className="block truncate text-[11px]" style={{ color: 'var(--ink-3)' }}>{bits.join(' · ')}</span> : null}
                  </span>
                </Link>
              );
            })}
          </section>
        ))}
      </div>
    );
  }
  const grouped = GROUPS.map((g) => ({ ...g, list: all.filter((p) => g.pos.includes(p.position)).sort((a, b) => (b.minutes || 0) - (a.minutes || 0)) }));
  const other = all.filter((p) => !GROUPS.some((g) => g.pos.includes(p.position)));
  if (other.length) grouped.push({ key: 'OT', title: 'Altri', color: '#8EA0BD', list: other });
  if (!all.length) return null;

  return (
    <div className="flex flex-col gap-3.5 px-4 pb-8 pt-4">
      {grouped.filter((g) => g.list.length).map((g) => (
        <section key={g.key} className="glass overflow-hidden rounded-[22px]" style={{ borderLeft: `3px solid ${g.color}` }}>
          <div className="flex items-center px-4 py-2.5" style={{ background: `${g.color}1f` }}>
            <b className="text-[12.5px] uppercase tracking-[.07em]" style={{ color: g.color }}>{g.title}</b>
            <span className="ml-auto text-[12px]" style={{ color: 'var(--ink-3)' }}>{g.list.length}</span>
          </div>
          <div className="h-1.5" />
          {g.list.map((p) => (
            <Link key={p.id} to={`/giocatore/${p.id}`} className="press mx-2 mb-1.5 flex items-center gap-3 rounded-[18px] px-3 py-2" style={{ background: teamGrad(teamById(teamId), 0x55) }}>
              <span className="avatar h-[38px] w-[38px] text-[11px]">
                {p.photo ? <Image src={p.photo} alt={p.name} className="h-full w-full" fittingType="fill" /> : p.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold">{(() => { const n = (carriereOf(p.id) || {}).n; return n ? <span style={{ color: 'var(--accent)' }}>{n} </span> : null; })()}{p.name}{injuryOf(p.id) ? <> <InjuryIcon size={15} /></> : null}</span>
                {(() => {
                  const c = carriereOf(p.id) || {};
                  const age = ageOf(c.b);
                  const bits = [c.c ? `${flagOf(c.c)} ${countryIt(c.c)}`.trim() : null, c.h ? `${c.h} cm` : null, age ? `${age} anni` : null].filter(Boolean);
                  return bits.length ? <span className="block truncate text-[11px]" style={{ color: 'var(--ink-3)' }}>{bits.join(' · ')}</span> : null;
                })()}
              </span>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}
