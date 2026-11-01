import { primeKeyboard } from '@/lib/keyboard';
import { isNative } from '@/lib/carousel';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import PageShell from '@/components/PageShell';
import FixedBar from '@/components/FixedBar';
import DayStrip from '@/components/DayStrip';
import TextFilter from '@/components/TextFilter';
import SearchOverlay from '@/components/SearchOverlay';
import DayPager from '@/components/DayPager';
import Skeleton from '@/components/Skeleton';
import TopPlayerRow from '@/components/top/TopPlayerRow';
import TopStatPicker from '@/components/top/TopStatPicker';
import ChunkRows from '@/components/top/ChunkRows';
import useInitialLoad from '@/hooks/useInitialLoad';
import { bestPlayers, isFoulStat, loadBestFouls, THRESHOLDS, TOP_KEEP, TOP_STATS } from '@/data/topPlayers';
import { DATES, TODAY_INDEX, isoDate } from '@/data/matches';

// Il calendario parte da oggi: i giorni passati non servono
const DAYS = DATES.slice(TODAY_INDEX);
const TODAY_I = 0;
const ANIM_ROWS = 8; // banner che entrano con l'animazione (quelli sullo schermo); gli altri arrivano gia' fermi
const OUT_MS = 240; // uscita dei banner vecchi quando si cambia statistica
const CHILD_MS = 10 * 60 * 1000; // ritorno da giocatore/calcolatore aperti da una riga: la pagina resta com'era

const keyOfPlayer = (row) => row.player.id;
const reduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// righe di un giorno: tiri e tiri in porta subito, falli quando le partite della stagione sono pronte
function useDayRows(day, thr, stat, active) {
  const rows = bestPlayers(day, thr, stat);
  const [, force] = useState(0);
  const need = isFoulStat(stat) && !rows;
  useEffect(() => {
    if (!need) return undefined;
    let live = true;
    // i giorni vicini aspettano: prima la classifica del giorno mostrato
    const t = setTimeout(() => loadBestFouls(day, thr, stat).then(() => { if (live) force((x) => x + 1); }), active ? 0 : 1200);
    return () => { live = false; clearTimeout(t); };
  }, [need, day, thr, stat, active]);
  return rows;
}

function DayList({ day, thr, stat, active, takeAnim }) {
  // l'animazione si decide una volta sola, quando la lista nasce (apertura o cambio statistica), mai cambiando giorno
  const [anim] = useState(() => (active ? takeAnim() : false));
  const rows = useDayRows(day, thr, stat, active);
  if (!rows) {
    return (
      <div className="space-y-3 px-5 pt-2">
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[96px] w-full rounded-[24px]" />)}
      </div>
    );
  }
  if (!rows.length) return <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessun giocatore</p>;
  return (
    <ChunkRows
      rows={rows}
      active={active}
      rowH={84}
      keyOf={keyOfPlayer}
      renderRow={(row, k) => <TopPlayerRow row={row} rank={k + 1} threshold={thr} stat={stat} enter={anim && k < ANIM_ROWS ? k : -1} delay={0} />}
    />
  );
}

export default function TopPlayers() {
  const today = isoDate(new Date());
  // tornando da un giocatore o dal calcolatore (aperti da una riga) tutto resta com'era e niente animazione
  const [ret] = useState(() => {
    const b = !!TOP_KEEP.child && Date.now() - TOP_KEEP.child < CHILD_MS;
    TOP_KEEP.child = 0;
    return b;
  });
  const fresh = TOP_KEEP.day === null || TOP_KEEP.stamp !== today;
  const [dayIdx, setDayIdx] = useState(fresh ? TODAY_I : Math.min(DAYS.length - 1, Math.max(0, TOP_KEEP.day)));
  const [threshold, setThreshold] = useState(fresh ? '0.5' : TOP_KEEP.thr);
  // all'apertura la classifica dei tiri; tornando indietro la statistica che si stava guardando
  const [stat, setStat] = useState(() => (ret && !fresh ? TOP_KEEP.stat : 'tiri'));
  const [shown, setShown] = useState(stat);
  const [leaving, setLeaving] = useState(false);
  const [anim, setAnim] = useState(ret ? 0 : 1);
  const used = useRef(0);
  const timer = useRef(0);
  TOP_KEEP.stamp = today;
  TOP_KEEP.day = dayIdx;
  TOP_KEEP.thr = threshold;
  TOP_KEEP.stat = shown;
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = useInitialLoad();

  const dThr = useDeferredValue(threshold);
  const takeAnim = () => {
    if (anim > used.current) { used.current = anim; return true; }
    return false;
  };

  // cambio statistica: i banner attuali escono, poi entrano quelli nuovi con la stessa animazione dell'apertura
  const onStat = (v) => {
    if (v === stat) return;
    setStat(v);
    clearTimeout(timer.current);
    if (reduced()) { setShown(v); return; }
    setLeaving(true);
    timer.current = setTimeout(() => { setShown(v); setLeaving(false); setAnim((a) => a + 1); }, OUT_MS);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <PageShell swipeBack={isNative()}>
      <header className="sticky top-0 z-30 pb-1" style={{ background: 'var(--sky-2)' }}>
        <FixedBar title="Migliori Giocatori" onSearch={() => { primeKeyboard(); setSearchOpen(true); }} />
        <DayStrip dates={DAYS} todayIndex={TODAY_I} value={dayIdx} onChange={setDayIdx} />
        <div className="flex items-center gap-2 px-5 pt-1">
          <TextFilter className="min-w-0" options={THRESHOLDS.map((t) => ({ value: t.key, label: t.label }))} value={threshold} onChange={setThreshold} />
          <span className="ml-auto flex-none">
            <TopStatPicker options={TOP_STATS} value={stat} onChange={onStat} />
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
        <div className={leaving ? 'tp-out' : undefined}>
          <DayPager
            backEdge={isNative()}
            index={dayIdx}
            count={DAYS.length}
            onChange={setDayIdx}
            render={(i, active) => (
              <DayList key={`${i}|${shown}|${dThr}`} day={isoDate(DAYS[i])} thr={dThr} stat={shown} active={active} takeAnim={takeAnim} />
            )}
          />
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
