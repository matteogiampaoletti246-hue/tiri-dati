import { useRef, useState } from 'react';
import PageShell from '@/components/PageShell';
import HomeHeader from '@/components/HomeHeader';
import DayStrip from '@/components/DayStrip';
import TextFilter from '@/components/TextFilter';
import LeagueGroup from '@/components/LeagueGroup';
import LiveStrip from '@/components/LiveStrip';
import MatchRowSkeleton from '@/components/MatchRowSkeleton';
import Skeleton from '@/components/Skeleton';
import SearchOverlay from '@/components/SearchOverlay';
import useInitialLoad from '@/hooks/useInitialLoad';
import useTicker from '@/hooks/useTicker';
import { DATES, TODAY_INDEX, isoDate, matchesByDate } from '@/data/matches';
import { LEAGUES } from '@/data/leagues';

export default function Home() {
  const [dayIdx, setDayIdx] = useState(TODAY_INDEX);
  const [filter, setFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = useInitialLoad();
  useTicker(30000);
  const drag = useRef(null);

  const date = DATES[dayIdx];
  const dayMatches = matchesByDate(isoDate(date));
  const liveMatches = dayMatches.filter((m) => m.status === 'live');
  const shown = filter === 'live' ? liveMatches : dayMatches;
  const groups = LEAGUES.map((league) => ({
    league,
    matches: shown.filter((m) => m.leagueId === league.id),
  })).filter((g) => g.matches.length);

  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e) => {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      setDayIdx((i) => Math.min(DATES.length - 1, Math.max(0, i + (dx < 0 ? 1 : -1))));
    }
  };

  return (
    <PageShell>
      <HomeHeader onSearch={() => setSearchOpen(true)} />

      <DayStrip dates={DATES} todayIndex={TODAY_INDEX} value={dayIdx} onChange={setDayIdx} />

      <div className="flex items-center px-5 pb-1 pt-1">
        <TextFilter
          options={[
            { value: 'all', label: 'Tutte' },
            {
              value: 'live',
              label: (
                <span className="flex items-center gap-1.5">
                  <span className="live-dot" />
                  Live
                </span>
              ),
            },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <span className="tnum ml-auto pl-4 text-[11.5px]" style={{ color: filter === 'live' ? 'var(--live)' : 'var(--ink-3)' }}>
          {liveMatches.length}
        </span>
      </div>

      {liveMatches.length && filter === 'all' ? <LiveStrip match={liveMatches[0]} /> : null}

      <div onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        {loading ? (
          <>
            {[0, 1].map((i) => (
              <div key={i} className="pt-4">
                <div className="flex items-center gap-2.5 px-5 pb-2">
                  <Skeleton className="h-[22px] w-[22px] rounded-full" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
                {[0, 1, 2].map((j) => (
                  <MatchRowSkeleton key={j} />
                ))}
              </div>
            ))}
          </>
        ) : groups.length ? (
          groups.map((g) => <LeagueGroup key={g.league.id} league={g.league} matches={g.matches} />)
        ) : (
          <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
            Nessuna partita
          </p>
        )}
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
