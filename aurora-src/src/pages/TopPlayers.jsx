import { primeKeyboard } from '@/lib/keyboard';
import { useDeferredValue, useEffect, useState } from 'react';
import PageShell from '@/components/PageShell';
import FixedBar from '@/components/FixedBar';
import { loadCarriere } from '@/data/carriere';
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

  const [, bump] = useState(0);
  useEffect(() => {
    let on = true;
    loadCarriere().then(() => on && bump((n) => n + 1));
    return () => { on = false; };
  }, []);

  const dThr = useDeferredValue(threshold);
  const rows = bestPlayers(isoDate(DATES[dayIdx]), dThr);

  return (
    <PageShell>
      <header className="sticky top-0 z-30 pb-1" style={{ background: 'var(--sky-2)' }}>
        <FixedBar onSearch={() => { primeKeyboard(); setSearchOpen(true); }} />
        <div className="px-5">
          <h1 className="title-sora text-[26px]" style={{ color: 'var(--ink)' }}>Migliori Giocatori</h1>
          <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>Voti attesi per data</p>
        </div>
        <DayStrip dates={DATES} todayIndex={TODAY_INDEX} value={dayIdx} onChange={setDayIdx} />
        <div className="flex items-center px-5 pt-1">
          <TextFilter options={THRESHOLDS.map((t) => ({ value: t.key, label: t.label }))} value={threshold} onChange={setThreshold} />
          <span className="tnum ml-auto pl-4 text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
            {rows.length}
          </span>
        </div>
      </header>
      <div className="h-2" />

      {loading ? (
        <div className="space-y-3 px-5 pt-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[96px] w-full rounded-[24px]" />
          ))}
        </div>
      ) : rows.length ? (
        <div>
          {rows.map((row, i) => (
            <TopPlayerRow key={row.player.id} row={row} rank={i + 1} threshold={dThr} delay={Math.min(i, 8) * 60} />
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
