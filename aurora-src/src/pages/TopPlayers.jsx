import { primeKeyboard } from '@/lib/keyboard';
import { useDeferredValue, useEffect, useState } from 'react';
import PageShell from '@/components/PageShell';
import FixedBar from '@/components/FixedBar';
import { loadCarriere } from '@/data/carriere';
import DayStrip from '@/components/DayStrip';
import TextFilter from '@/components/TextFilter';
import SearchOverlay from '@/components/SearchOverlay';
import DayPager from '@/components/DayPager';
import Skeleton from '@/components/Skeleton';
import TopPlayerRow from '@/components/top/TopPlayerRow';
import useInitialLoad from '@/hooks/useInitialLoad';
import { bestPlayers, THRESHOLDS } from '@/data/topPlayers';
import { DATES, TODAY_INDEX, isoDate } from '@/data/matches';

// Il calendario parte da ieri: i giorni piu' vecchi non servono (oggi e' il secondo giorno della striscia)
const DAYS = DATES.slice(Math.max(0, TODAY_INDEX - 1));
const TODAY_I = TODAY_INDEX - Math.max(0, TODAY_INDEX - 1);

// Giorno e soglia restano quando si apre un giocatore e si torna indietro.
const KEEP = { day: null, thr: '0.5', stamp: '' };

export default function TopPlayers() {
  const today = isoDate(new Date());
  const fresh = KEEP.day === null || KEEP.stamp !== today;
  const [dayIdx, setDayIdx] = useState(fresh ? TODAY_I : Math.min(DAYS.length - 1, Math.max(0, KEEP.day)));
  const [threshold, setThreshold] = useState(fresh ? '0.5' : KEEP.thr);
  KEEP.stamp = today;
  KEEP.day = dayIdx;
  KEEP.thr = threshold;
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = useInitialLoad();

  const [, bump] = useState(0);
  useEffect(() => {
    let on = true;
    loadCarriere().then(() => on && bump((n) => n + 1));
    return () => { on = false; };
  }, []);

  const dThr = useDeferredValue(threshold);
  const rows = bestPlayers(isoDate(DAYS[dayIdx]), dThr);

  return (
    <PageShell swipeBack={false}>
      <header className="sticky top-0 z-30 pb-1" style={{ background: 'var(--sky-2)' }}>
        <FixedBar title="Migliori Giocatori" onSearch={() => { primeKeyboard(); setSearchOpen(true); }} />
        <DayStrip dates={DAYS} todayIndex={TODAY_I} value={dayIdx} onChange={setDayIdx} />
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
      ) : (
        <DayPager
          index={dayIdx}
          count={DAYS.length}
          onChange={setDayIdx}
          render={(i) => {
            const rows = bestPlayers(isoDate(DAYS[i]), dThr);
            return rows.length ? (
              <div>{rows.map((row, k) => <TopPlayerRow key={row.player.id} row={row} rank={k + 1} threshold={dThr} delay={0} />)}</div>
            ) : (
              <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessun giocatore</p>
            );
          }}
        />
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
