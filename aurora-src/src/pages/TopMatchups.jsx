import { primeKeyboard } from '@/lib/keyboard';
import { useState } from 'react';
import PageShell from '@/components/PageShell';
import FixedBar from '@/components/FixedBar';
import DayStrip from '@/components/DayStrip';
import StatPicker from '@/components/top/StatPicker';
import SearchOverlay from '@/components/SearchOverlay';
import DayPager from '@/components/DayPager';
import Skeleton from '@/components/Skeleton';
import MatchupRow from '@/components/top/MatchupRow';
import useInitialLoad from '@/hooks/useInitialLoad';
import { matchupRows, MATCHUP_TYPES } from '@/data/matchups';
import { DATES, TODAY_INDEX, isoDate } from '@/data/matches';

// Il calendario parte da ieri: i giorni piu' vecchi non servono (oggi e' il secondo giorno della striscia)
const DAYS = DATES.slice(Math.max(0, TODAY_INDEX - 1));
const TODAY_I = TODAY_INDEX - Math.max(0, TODAY_INDEX - 1);

// Giorno e statistica restano quando si apre una partita e si torna indietro.
const KEEP = { day: null, type: 'corner', stamp: '' };

export default function TopMatchups() {
  const today = isoDate(new Date());
  const fresh = KEEP.day === null || KEEP.stamp !== today;
  const [dayIdx, setDayIdx] = useState(fresh ? TODAY_I : Math.min(DAYS.length - 1, Math.max(0, KEEP.day)));
  const [typeKey, setTypeKey] = useState(fresh ? 'corner' : KEEP.type);
  KEEP.stamp = today;
  KEEP.day = dayIdx;
  KEEP.type = typeKey;
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = useInitialLoad();

  return (
    <PageShell swipeBack={false}>
      <header className="sticky top-0 z-30 pb-1" style={{ background: 'var(--sky-2)' }}>
        <FixedBar title="Migliori Matchup" onSearch={() => { primeKeyboard(); setSearchOpen(true); }} />
        <DayStrip dates={DAYS} todayIndex={TODAY_I} value={dayIdx} onChange={setDayIdx} />
        <div className="flex items-center pl-5 pr-5 pt-1">
          <StatPicker options={MATCHUP_TYPES} value={typeKey} onChange={setTypeKey} />
        </div>
      </header>
      <div className="h-2" />

      {loading ? (
        <div className="space-y-3 px-5 pt-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[150px] w-full rounded-[24px]" />
          ))}
        </div>
      ) : (
        <DayPager
          index={dayIdx}
          count={DAYS.length}
          onChange={setDayIdx}
          render={(i) => {
            const rows = matchupRows(isoDate(DAYS[i]), typeKey);
            return rows.length ? (
              <div>{rows.map((row) => <MatchupRow key={row.id} row={row} />)}</div>
            ) : (
              <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessuna partita</p>
            );
          }}
        />
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
