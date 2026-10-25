import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Crest from './Crest';
import TeamLink from './TeamLink';
import { teamById } from '@/data/teams';
import { viewMatch } from '@/data/matches';

export default function MatchRow({ match }) {
  const m = viewMatch(match);
  const home = teamById(m.homeId);
  const away = teamById(m.awayId);
  const live = m.status === 'live';
  const finished = m.status === 'finished';
  const scoreColor = live ? 'var(--live)' : 'var(--ink)';

  return (
    <Link
      to={`/match/${m.id}`}
      className="grid items-center gap-3 px-5 py-3 transition-colors duration-200 active:opacity-60"
      style={{ gridTemplateColumns: '48px 1fr 14px' }}
    >
      <div className="flex flex-col items-start">
        {live ? (
          <span className="tnum flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: 'var(--live)' }}>
            <span className="live-dot" />
            {m.minute}&apos;
          </span>
        ) : (
          <span className="tnum text-[12.5px] font-normal" style={{ color: finished ? 'var(--ink-3)' : 'var(--ink-2)' }}>
            {finished ? 'Finita' : m.kickoff}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {[
          { team: home, goals: m.score ? m.score[0] : null },
          { team: away, goals: m.score ? m.score[1] : null },
        ].map(({ team, goals }, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <TeamLink team={team} className="flex min-w-0 items-center gap-2.5 transition-opacity active:opacity-60">
              <Crest team={team} size={22} />
              <span className="truncate text-[14px]" style={{ color: 'var(--ink)' }}>
                {team ? team.name : '—'}
              </span>
            </TeamLink>
            {goals !== null ? (
              <span className="tnum ml-auto pl-2 text-[15px] font-medium" style={{ color: scoreColor }}>
                {goals}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <ChevronRight size={15} strokeWidth={1.3} style={{ color: 'var(--ink-3)' }} />
    </Link>
  );
}
