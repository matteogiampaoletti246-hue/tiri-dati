import { isNative } from '@/lib/carousel';
import { primeKeyboard } from '@/lib/keyboard';
import { useRef, useState } from 'react';
import { useCascade, useFreshOpen } from '@/lib/cascade';
import { CALC_KEEP, saveCalcKeep } from '@/data/calcKeep';
import FixedBar from '@/components/FixedBar';
import SearchOverlay from '@/components/SearchOverlay';
import PageShell from '@/components/PageShell';
import SwipeTabs from '@/components/SwipeTabs';
import PlayerTab from '@/components/calc/PlayerTab';
import TeamTab from '@/components/calc/TeamTab';

const TABS = [
  { key: 'player', label: 'Affidabilità giocatore' },
  { key: 'team', label: 'Affidabilità squadra' },
];

export default function ReliabilityCalculator() {
  const [index, setIndexRaw] = useState(CALC_KEEP.index);
  const setIndex = (i) => { CALC_KEEP.index = i; saveCalcKeep(); setIndexRaw(i); };
  const [searchOpen, setSearchOpen] = useState(false);
  const noop = useRef(() => {}).current;
  // entrata dei banner dall'alto (concept A); tornando indietro niente animazione
  const casRef = useRef(null);
  useCascade(casRef, '[data-casroot] > *', useFreshOpen());

  return (
    <PageShell swipeBack={isNative()}>
      {/* testata unica: titolo e due schede grandi nello stesso blocco opaco, il contenuto non si vede passare */}
      <header className="head-solid sticky top-0 z-30">
        <FixedBar title="Calcolatore Affidabilità" onSearch={() => { primeKeyboard(); setSearchOpen(true); }} />
        <div className="px-5 pb-2.5">
          <div className="relative mt-2 grid grid-cols-2 rounded-full p-1" style={{ background: 'var(--panel-2)', border: '1px solid var(--hair)' }}>
            {/* stessa pillola liquid glass di tutti i selettori (lg-thumb, lg-move in index.css) */}
            <span
              aria-hidden="true"
              className="lg-thumb lg-move absolute bottom-1 top-1 rounded-full"
              style={{ left: 4, width: 'calc(50% - 4px)', transform: `translateX(${index * 100}%)` }}
            />
            {TABS.map((t, i) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setIndex(i)}
                className="relative z-10 py-3 text-[14px] font-bold transition-colors"
                style={{ color: i === index ? 'var(--atabs-pill-ink)' : 'var(--ink-3)' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div ref={casRef}>
      <SwipeTabs
        hideBar
        eager
        tabs={TABS}
        index={index}
        onChange={setIndex}
        panels={[<PlayerTab key="player" onSave={noop} />, <TeamTab key="team" onSave={noop} />]}
      />
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
