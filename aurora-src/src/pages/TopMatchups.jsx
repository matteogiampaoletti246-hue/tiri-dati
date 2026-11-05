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
import ModePicker from '@/components/top/ModePicker';
import { SkCard } from '@/components/PageSkeletons';
import { matchupRows, MATCHUP_TYPES, modeOptions, keepMode, defaultMode } from '@/data/matchups';
import { useDayReferees, refereeRows } from '@/data/refMatchup';
import { DATES, TODAY_INDEX, isoDate } from '@/data/matches';

// Il calendario parte da oggi: i giorni passati non servono
const DAYS = DATES.slice(TODAY_INDEX);
const TODAY_I = 0;

const keyOfRow = (row) => row.id;
// Giorno, statistica e tendina di destra restano quando si apre una partita e si torna indietro.
const KEEP = { day: null, type: 'corner', mode: 'gap|total', stamp: '' };

// Un giorno: classifica della statistica scelta. Cartellini e Arbitri si confrontano: la partita presente in entrambe le classifiche (stessa voce, es. Over 1T) ha il bordo dorato.
function MatchupDay({ date, typeKey, modeKey, active }) {
  const isRef = typeKey === 'referees';
  const [mode, period] = modeKey.split('|');
  const crossed = isRef || (typeKey === 'cards' && mode !== 'gap');
  const { map, done } = useDayReferees(date, active && crossed);
  const rows = isRef ? refereeRows(date, modeKey, map) : matchupRows(date, typeKey, modeKey);
  let other = null;
  if (crossed) other = new Set((isRef ? matchupRows(date, 'cards', modeKey) : refereeRows(date, modeKey, map)).map((r) => r.id));
  const label = `${mode === 'over' ? 'Over' : 'Under'} cartellini + arbitro${period === 'first' ? ' 1T' : ''}`;
  const renderRow = (row) => <MatchupRow row={row} both={other && other.has(row.id) ? label : null} />;
  if (rows.length) return <ChunkRows key={`${date}|${typeKey}|${modeKey}`} rows={rows} active={active} rowH={190} keyOf={keyOfRow} renderRow={renderRow} />;
  if (isRef && !done) {
    return (
      <div className="pt-2">
        {[0, 1, 2].map((k) => <SkCard key={k} h={158} r={24} className="mx-4 mb-2.5" />)}
      </div>
    );
  }
  return <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessuna partita</p>;
}

export default function TopMatchups() {
  const today = isoDate(new Date());
  const fresh = KEEP.day === null || KEEP.stamp !== today;
  const [dayIdx, setDayIdx] = useState(fresh ? TODAY_I : Math.min(DAYS.length - 1, Math.max(0, KEEP.day)));
  const [typeKey, setTypeKey] = useState(fresh ? 'corner' : KEEP.type);
  const [modeKey, setModeKey] = useState(fresh ? defaultMode('corner') : KEEP.mode);
  KEEP.stamp = today;
  KEEP.day = dayIdx;
  KEEP.type = typeKey;
  KEEP.mode = modeKey;
  const pickType = (k) => { setTypeKey(k); setModeKey((m) => keepMode(k, m)); };
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <PageShell swipeBack={isNative()}>
      <header className="sticky top-0 z-30 pb-1" style={{ background: 'var(--sky-2)' }}>
        <FixedBar title="Migliori Matchup" onSearch={() => { primeKeyboard(); setSearchOpen(true); }} />
        <DayStrip dates={DAYS} todayIndex={TODAY_I} value={dayIdx} onChange={setDayIdx} />
        <div className="flex items-center justify-between pl-5 pr-5 pt-1">
          <StatPicker options={MATCHUP_TYPES} value={typeKey} onChange={pickType} />
          <ModePicker options={modeOptions(typeKey)} value={modeKey} onChange={setModeKey} />
        </div>
      </header>
      <div className="h-2" />

      <DayPager
        backEdge={isNative()}
        index={dayIdx}
        count={DAYS.length}
        onChange={setDayIdx}
        render={(i, active) => <MatchupDay date={isoDate(DAYS[i])} typeKey={typeKey} modeKey={modeKey} active={active} />}
      />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
