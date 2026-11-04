import { primeKeyboard } from '@/lib/keyboard';
import { isNative } from '@/lib/carousel';
import { useState } from 'react';
import PageShell from '@/components/PageShell';
import FixedBar from '@/components/FixedBar';
import DayStrip from '@/components/DayStrip';
import StatPicker from '@/components/top/StatPicker';
import SearchOverlay from '@/components/SearchOverlay';
import DayPager from '@/components/DayPager';
import MatchupRow from '@/components/top/MatchupRow';
import ChunkRows from '@/components/top/ChunkRows';
import { matchupRows, MATCHUP_TYPES } from '@/data/matchups';
import { DATES, TODAY_INDEX, isoDate } from '@/data/matches';

// Il calendario parte da oggi: i giorni passati non servono
const DAYS = DATES.slice(TODAY_INDEX);
const TODAY_I = 0;

const keyOfRow = (row) => row.id;
const renderRow = (row) => <MatchupRow row={row} />;
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

  return (
    <PageShell swipeBack={isNative()}>
      <header className="sticky top-0 z-30 pb-1" style={{ background: 'var(--sky-2)' }}>
        <FixedBar title="Migliori Matchup" onSearch={() => { primeKeyboard(); setSearchOpen(true); }} />
        <DayStrip dates={DAYS} todayIndex={TODAY_I} value={dayIdx} onChange={setDayIdx} />
        <div className="flex items-center pl-5 pr-5 pt-1">
          <StatPicker options={MATCHUP_TYPES} value={typeKey} onChange={setTypeKey} />
        </div>
      </header>
      <div className="h-2" />

      <DayPager
        backEdge={isNative()}
        index={dayIdx}
        count={DAYS.length}
        onChange={setDayIdx}
        render={(i, active) => {
          const rows = matchupRows(isoDate(DAYS[i]), typeKey);
          return rows.length ? (
            <ChunkRows key={`${i}|${typeKey}`} rows={rows} active={active} rowH={190} keyOf={keyOfRow} renderRow={renderRow} />
          ) : (
            <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessuna partita</p>
          );
        }}
      />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
