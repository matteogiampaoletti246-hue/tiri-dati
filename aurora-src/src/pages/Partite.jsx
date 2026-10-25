import { useState } from 'react';
import PageShell from '@/components/PageShell';
import ListHeader from '@/components/ListHeader';
import DayStrip from '@/components/DayStrip';
import TextFilter from '@/components/TextFilter';
import MatchDayList from '@/components/MatchDayList';
import MatchRowSkeleton from '@/components/MatchRowSkeleton';
import SearchOverlay from '@/components/SearchOverlay';
import useInitialLoad from '@/hooks/useInitialLoad';
import useTicker from '@/hooks/useTicker';
import { DATES, TODAY_INDEX, isoDate, matchesByDate } from '@/data/matches';

const MATCH = {
  all: () => true,
  live: (m) => m.status === 'live',
  results: (m) => m.status === 'finished',
  upcoming: (m) => m.status === 'scheduled',
};

const OPTIONS = [
  { value: 'all', label: 'Tutte' },
  { value: 'live', label: 'Live' },
  { value: 'results', label: 'Risultati' },
  { value: 'upcoming', label: 'Programmate' },
];

export default function Partite() {
  const [dayIdx, setDayIdx] = useState(TODAY_INDEX);
  const [filter, setFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = useInitialLoad();
  useTicker(30000);

  const shown = matchesByDate(isoDate(DATES[dayIdx])).filter(MATCH[filter]);

  return (
    <PageShell>
      <ListHeader title="Partite" subtitle="Tutte le gare per data" onSearch={() => setSearchOpen(true)} />

      <DayStrip dates={DATES} todayIndex={TODAY_INDEX} value={dayIdx} onChange={setDayIdx} />

      <div className="flex items-center px-5 pb-1 pt-1">
        <TextFilter options={OPTIONS} value={filter} onChange={setFilter} />
        <span className="tnum ml-auto pl-4 text-[11.5px]" style={{ color: filter === 'live' ? 'var(--live)' : 'var(--ink-3)' }}>
          {shown.length}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3 px-5 pt-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <MatchRowSkeleton key={i} />
          ))}
        </div>
      ) : shown.length ? (
        <MatchDayList matches={shown} focusToday={false} />
      ) : (
        <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Nessuna partita
        </p>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
