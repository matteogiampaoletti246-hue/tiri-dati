import { ChevronRight } from 'lucide-react';
import LeagueBadge from './LeagueBadge';
import LeagueLink from './LeagueLink';
import MatchRow from './MatchRow';
import { tintGrad } from '@/lib/tint';
import { leagueTint } from '@/data/leagues';

export default function LeagueGroup({ league, matches }) {
  return (
    <section className="rise mx-4 mt-4 overflow-hidden rounded-[26px] glass" style={{ background: tintGrad(leagueTint(league.id), 0x45) }}>
      <LeagueLink league={league} className="press flex items-center gap-3 px-4 pb-3 pt-3.5">
        <LeagueBadge league={league} size={22} />
        <span className="flex-1 truncate text-[12.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>
          {league.name}
        </span>
        <span className="tnum text-[11px] font-medium" style={{ color: 'var(--ink-3)' }}>
          {matches.length}
        </span>
        <ChevronRight size={16} strokeWidth={1.8} style={{ color: 'var(--ink-3)' }} />
      </LeagueLink>
      <div className="border-t" style={{ borderColor: 'var(--hair-2)' }}>
        {matches.map((m, i) => (
          <div key={m.id} style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
            <MatchRow match={m} />
          </div>
        ))}
      </div>
    </section>
  );
}
