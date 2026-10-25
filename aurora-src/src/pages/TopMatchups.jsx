import { useState } from 'react';
import PageShell from '@/components/PageShell';
import ListHeader from '@/components/ListHeader';
import DayStrip from '@/components/DayStrip';
import TextFilter from '@/components/TextFilter';
import SearchOverlay from '@/components/SearchOverlay';
import Skeleton from '@/components/Skeleton';
import MatchupRow from '@/components/top/MatchupRow';
import useInitialLoad from '@/hooks/useInitialLoad';
import { matchupRows, MATCHUP_TYPES } from '@/data/matchups';
import { DATES, TODAY_INDEX, isoDate, matchesByDate } from '@/data/matches';

export default function TopMatchups() {
  const [dayIdx, setDayIdx] = useState(TODAY_INDEX);
  const [typeKey, setTypeKey] = useState('corner');
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = useInitialLoad();

  const rows = matchupRows(matchesByDate(isoDate(DATES[dayIdx])), typeKey);

  return (
    <PageShell>
      <ListHeader title="Migliori Matchup" subtitle="Divario atteso tra le squadre" onSearch={() => setSearchOpen(true)} />

      <DayStrip dates={DATES} todayIndex={TODAY_INDEX} value={dayIdx} onChange={setDayIdx} />

      <div className="flex items-center px-5 pb-1 pt-1">
        <TextFilter options={MATCHUP_TYPES.map((t) => ({ value: t.key, label: t.label }))} value={typeKey} onChange={setTypeKey} />
        <span className="tnum ml-auto pl-4 text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
          {rows.length}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3 px-5 pt-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[78px] w-full" />
          ))}
        </div>
      ) : rows.length ? (
        <div>
          {rows.map((row, i) => (
            <MatchupRow key={row.match.id} row={row} divider={i > 0} />
          ))}
        </div>
      ) : (
        <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Nessuna partita
        </p>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
