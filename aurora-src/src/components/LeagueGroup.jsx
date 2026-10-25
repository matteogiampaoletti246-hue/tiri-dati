import { ChevronRight } from 'lucide-react';
import LeagueBadge from './LeagueBadge';
import LeagueLink from './LeagueLink';
import MatchRow from './MatchRow';

export default function LeagueGroup({ league, matches }) {
  return (
    <section className="rise">
      <div className="flex items-center gap-1 px-5 pb-1 pt-4">
        <LeagueLink league={league} className="flex items-center gap-2.5 transition-opacity active:opacity-60">
          <LeagueBadge league={league} size={22} />
          <span className="text-[13.5px] font-medium tracking-[-.01em]" style={{ color: 'var(--ink)' }}>
            {league.name}
          </span>
          <ChevronRight size={14} strokeWidth={1.3} style={{ color: 'var(--ink-3)' }} />
        </LeagueLink>
        <span className="tnum ml-auto text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
          {matches.length}
        </span>
      </div>
      <div>
        {matches.map((m) => (
          <MatchRow key={m.id} match={m} />
        ))}
      </div>
    </section>
  );
}
