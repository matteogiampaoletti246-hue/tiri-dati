import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import LeagueBadge from '@/components/LeagueBadge';
import TeamLink from '@/components/TeamLink';
import LeagueLink from '@/components/LeagueLink';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';
import { comma } from '@/lib/format';

export default function MatchupRow({ row, divider = true }) {
  const m = row.match;
  const home = teamById(m.homeId);
  const away = teamById(m.awayId);
  const league = leagueById(m.leagueId);

  return (
    <Link
      to={`/match/${m.id}`}
      className="block px-5 py-3 transition-opacity active:opacity-60"
      style={{ borderTop: divider ? '1px solid var(--hair-2)' : 'none' }}
    >
      <div className="flex items-center gap-2.5">
        {league ? (
          <LeagueLink league={league} className="flex flex-none items-center transition-opacity active:opacity-60">
            <LeagueBadge league={league} size={20} />
          </LeagueLink>
        ) : null}
        <TeamLink team={home} className="flex flex-none items-center transition-opacity active:opacity-60">
          <Crest team={home} size={20} />
        </TeamLink>
        <span className="min-w-0 flex-1 truncate text-[13.5px]" style={{ color: 'var(--ink)' }}>
          {home ? home.name : '—'} – {away ? away.name : '—'}
        </span>
        <TeamLink team={away} className="flex flex-none items-center transition-opacity active:opacity-60">
          <Crest team={away} size={20} />
        </TeamLink>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <LeagueLink league={league} className="flex min-w-0 items-center gap-1 transition-opacity active:opacity-60">
          <span className="truncate text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
            {league ? league.name : ''}
          </span>
        </LeagueLink>
        <span className="flex-none text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
          · {m.kickoff}
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
          {row.type.unit} {comma(row.home, 1)} – {comma(row.away, 1)}
        </span>
        <span className="tnum ml-auto flex-none">
          Partite usate: {row.playedHome} / {row.playedAway}
        </span>
      </div>
    </Link>
  );
}
