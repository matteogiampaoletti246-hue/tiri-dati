import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import TeamLink from '@/components/TeamLink';
import { teamById } from '@/data/teams';
import { matchesByDate } from '@/data/matches';
import { comma } from '@/lib/format';
import { teamColor } from '@/lib/tint';

const GOLD = '#F5C84C';

function Side({ team, name, value }) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <TeamLink team={team} className="flex flex-col items-center">
        <Crest team={team} size={46} />
      </TeamLink>
      <span className="mt-1.5 line-clamp-2 w-full text-center text-[12.5px] font-extrabold leading-tight" style={{ color: 'var(--ink)' }}>{name}</span>
      <span className="tnum mt-1 text-[18px] font-extrabold leading-none" style={{ color: 'var(--ink)' }}>{value == null ? '\u00a0' : comma(value, 1)}</span>
    </div>
  );
}

// Scheda del matchup: bordi nei colori delle due squadre, divario in oro al centro.
export default function MatchupRow({ row }) {
  const home = teamById(row.homeId);
  const away = teamById(row.awayId);
  const found = matchesByDate(row.date).find((m) => m.homeId === row.homeId && m.awayId === row.awayId);
  const Wrap = found ? Link : 'div';
  const props = found ? { to: `/match/${found.id}` } : {};

  return (
    <Wrap
      {...props}
      className="press mx-4 mb-2.5 block rounded-[24px] px-3 pb-3 pt-2.5"
      style={{
        background: `linear-gradient(90deg, color-mix(in srgb, ${teamColor(home)} 55%, transparent) 0%, transparent 40%, transparent 60%, color-mix(in srgb, ${teamColor(away)} 50%, transparent) 100%), var(--glass-bg)`,
        border: '1px solid var(--glass-border)',
      }}
    >
      <p className="mb-2 truncate text-center text-[10.5px] font-bold uppercase tracking-[.08em]" style={{ color: 'var(--ink-3)' }}>
        {row.league}{found ? ` · ${found.kickoff}` : ''}
      </p>
      <div className="grid items-start" style={{ gridTemplateColumns: '1fr 88px 1fr' }}>
        <Side team={home} name={row.homeName} value={row.home} />
        <div className="flex flex-col items-center pt-2">
          <span className="text-[9.5px] font-bold uppercase tracking-[.12em]" style={{ color: 'var(--ink-3)' }}>{row.type.centerLabel || 'Divario'}</span>
          <span className="tnum text-[30px] font-extrabold leading-none" style={{ color: GOLD }}>{comma(row.divario, 1)}</span>
          <span className="mt-2 text-[10px]" style={{ color: 'var(--ink-3)' }}>{row.type.label}</span>
        </div>
        <Side team={away} name={row.awayName} value={row.away} />
      </div>
      <p className="tnum mt-2 text-center text-[10px]" style={{ color: 'var(--ink-3)' }}>
        Partite usate {row.playedHome ?? '—'} / {row.playedAway ?? '—'}
      </p>
    </Wrap>
  );
}
