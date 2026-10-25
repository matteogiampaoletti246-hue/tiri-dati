import { useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import PageShell from '@/components/PageShell';
import HomeHeader from '@/components/HomeHeader';
import DayStrip from '@/components/DayStrip';
import TextFilter from '@/components/TextFilter';
import LeagueGroup from '@/components/LeagueGroup';
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
  const [custom, setCustom] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = useInitialLoad();
  useTicker(30000);
  const drag = useRef(null);

  const date = DATES[dayIdx];
  const dayMatches = matchesByDate(custom || isoDate(date));
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

      <DayStrip dates={DATES} todayIndex={TODAY_INDEX} value={custom ? -1 : dayIdx}
        onChange={(i) => {
          setCustom(null);
          setDayIdx(i);
        }}
      />

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
        <label className="glass press relative ml-auto flex h-9 w-9 items-center justify-center rounded-full" aria-label="Calendario">
          <CalendarDays size={16} strokeWidth={1.9} style={{ color: custom ? 'var(--accent)' : 'var(--ink)' }} />
          <input
            type="date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            value={custom || isoDate(date)}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              const idx = DATES.findIndex((d) => isoDate(d) === v);
              if (idx >= 0) {
                setCustom(null);
                setDayIdx(idx);
              } else setCustom(v);
            }}
            aria-label="Scegli data"
          />
        </label>
      </div>

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
