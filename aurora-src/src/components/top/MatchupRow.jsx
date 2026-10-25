import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import TeamLink from '@/components/TeamLink';
import { teamById } from '@/data/teams';
import { matchesByDate } from '@/data/matches';
import { comma } from '@/lib/format';

export default function MatchupRow({ row, divider = true }) {
  const home = teamById(row.homeId);
  const away = teamById(row.awayId);
  const found = matchesByDate(row.date).find((m) => m.homeId === row.homeId && m.awayId === row.awayId);
  const Wrap = found ? Link : 'div';
  const props = found ? { to: `/match/${found.id}` } : {};

  return (
    <Wrap
      {...props}
      className="block px-5 py-3 transition-opacity active:opacity-60"
      style={{ borderTop: divider ? '1px solid var(--hair-2)' : 'none' }}
    >
      <div className="flex items-center gap-2.5">
        <TeamLink team={home} className="flex flex-none items-center">
          <Crest team={home} size={20} />
        </TeamLink>
        <span className="min-w-0 flex-1 truncate text-[13.5px]" style={{ color: 'var(--ink)' }}>
          {row.homeName} – {row.awayName}
        </span>
        <TeamLink team={away} className="flex flex-none items-center">
          <Crest team={away} size={20} />
        </TeamLink>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="truncate text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
          {row.league}
          {found ? ` · ${found.kickoff}` : ''}
        </span>
        <span className="ml-auto text-[9.5px] uppercase tracking-[.1em]" style={{ color: 'var(--ink-3)' }}>
          Divario
        </span>
        <span className="tnum text-[15px] font-medium" style={{ color: 'var(--ink)' }}>
          {comma(row.divario, 1)}
        </span>
      </div>

      <div className="mt-1 flex items-baseline gap-2 text-[11px]" style={{ color: 'var(--ink-3)' }}>
        <span className="tnum truncate">
          {row.type.label} {comma(row.home, 1)} – {comma(row.away, 1)}
        </span>
        <span className="tnum ml-auto flex-none">
          Partite usate: {row.playedHome ?? '—'} / {row.playedAway ?? '—'}
        </span>
      </div>
    </Wrap>
  );
}
