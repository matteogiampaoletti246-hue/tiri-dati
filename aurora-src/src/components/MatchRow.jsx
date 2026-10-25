import { Link } from 'react-router-dom';
import Crest from './Crest';
import { teamById } from '@/data/teams';
import { viewMatch } from '@/data/matches';

export default function MatchRow({ match }) {
  const m = viewMatch(match);
  const home = teamById(m.homeId);
  const away = teamById(m.awayId);
  const live = m.status === 'live';
  const finished = m.status === 'finished';
  const played = live || finished;
  const hasScore = !!m.score;

  return (
    <Link to={`/match/${m.id}`} className="press flex items-center gap-2 px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
        <span className="truncate text-right text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
          {home ? home.name : '—'}
        </span>
        <Crest team={home} size={24} />
      </div>

      <div className="w-[64px] shrink-0 text-center">
        {played && hasScore ? (
          <span className="tnum text-[15.5px] font-extrabold" style={{ color: live ? 'var(--live)' : 'var(--ink)' }}>
            {m.score[0]}
            <span className="mx-0.5 font-medium" style={{ color: 'var(--ink-3)' }}>–</span>
            {m.score[1]}
          </span>
        ) : finished ? (
          <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-3)' }}>Finita</span>
        ) : (
          <span className="tnum text-[13.5px] font-semibold" style={{ color: 'var(--ink-3)' }}>{m.kickoff}</span>
        )}
        {finished ? <span className="tnum mt-[2px] block text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{m.kickoff}</span> : null}
        {live ? (
          <span className="mt-[3px] flex items-center justify-center gap-1">
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            <span className="tnum text-[10px] font-bold" style={{ color: 'var(--live)' }}>
              {m.liveHalf ? 'Int.' : `${m.minute}'`}
            </span>
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Crest team={away} size={24} />
        <span className="truncate text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
          {away ? away.name : '—'}
        </span>
      </div>
    </Link>
  );
}
