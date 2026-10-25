import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';
import { viewMatch } from '@/data/matches';

export default function LiveStrip({ match }) {
  if (!match) return null;
  const m = viewMatch(match);
  const home = teamById(m.homeId);
  const away = teamById(m.awayId);
  const league = leagueById(m.leagueId);

  return (
    <Link
      to={`/match/${m.id}`}
      className="flex items-center gap-3 px-5 py-2.5"
      style={{ background: 'color-mix(in srgb, var(--live) 8%, transparent)' }}
    >
      <span className="live-dot" />
      <span className="text-[11px] font-medium uppercase tracking-[.14em]" style={{ color: 'var(--live)' }}>
        Live ora
      </span>
      <span className="truncate text-[12px]" style={{ color: 'var(--ink-2)' }}>
        {league ? league.name : ''}
      </span>
      <span className="tnum ml-auto flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink)' }}>
        {home ? home.short : ''} {m.score[0]} – {m.score[1]} {away ? away.short : ''}
      </span>
      <ChevronRight size={14} strokeWidth={1.3} style={{ color: 'var(--ink-3)' }} />
    </Link>
  );
}
