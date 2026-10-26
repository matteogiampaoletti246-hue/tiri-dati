import { primeKeyboard } from '@/lib/keyboard';
import { useDeferredValue, useState } from 'react';
import PageShell from '@/components/PageShell';
import ListHeader from '@/components/ListHeader';
import DayStrip from '@/components/DayStrip';
import TextFilter from '@/components/TextFilter';
import SearchOverlay from '@/components/SearchOverlay';
import Skeleton from '@/components/Skeleton';
import TopPlayerRow from '@/components/top/TopPlayerRow';
import useInitialLoad from '@/hooks/useInitialLoad';
import { bestPlayers, THRESHOLDS } from '@/data/topPlayers';
import { DATES, TODAY_INDEX, isoDate } from '@/data/matches';

export default function TopPlayers() {
  const [dayIdx, setDayIdx] = useState(TODAY_INDEX);
  const [threshold, setThreshold] = useState('0.5');
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = useInitialLoad();

  const dThr = useDeferredValue(threshold);
  const rows = bestPlayers(isoDate(DATES[dayIdx]), dThr);

  return (
    <PageShell>
      <ListHeader title="Migliori Giocatori" subtitle="Voti attesi per data" onSearch={() => { primeKeyboard(); setSearchOpen(true); }} />

      <DayStrip dates={DATES} todayIndex={TODAY_INDEX} value={dayIdx} onChange={setDayIdx} />

      <div className="flex items-center px-5 pb-1 pt-1">
        <TextFilter options={THRESHOLDS.map((t) => ({ value: t.key, label: t.label }))} value={threshold} onChange={setThreshold} />
        <span className="tnum ml-auto pl-4 text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
          {rows.length}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3 px-5 pt-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[76px] w-full" />
          ))}
        </div>
      ) : rows.length ? (
        <div>
          {rows.map((row, i) => (
            <TopPlayerRow key={row.player.id} row={row} rank={i + 1} divider={i > 0} />
          ))}
        </div>
      ) : (
        <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Nessun giocatore
        </p>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
