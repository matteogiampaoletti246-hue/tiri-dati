import { isNative } from '@/lib/carousel';
import { primeKeyboard } from '@/lib/keyboard';
import { useRef, useState } from 'react';
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
  const [index, setIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const noop = useRef(() => {}).current;

  return (
    <PageShell swipeBack={isNative()}>
      {/* testata unica: titolo e due schede grandi nello stesso blocco opaco, il contenuto non si vede passare */}
      <header className="sticky top-0 z-30" style={{ background: 'var(--sky-2)' }}>
        <FixedBar onSearch={() => { primeKeyboard(); setSearchOpen(true); }} />
        <div className="px-5 pb-2.5">
          <h1 className="title-sora whitespace-nowrap text-[23px]" style={{ color: 'var(--ink)' }}>
            Calcolatore di Affidabilità
          </h1>
          <div className="relative mt-3 grid grid-cols-2 rounded-[16px] p-1" style={{ background: 'var(--panel-2)', border: '1px solid var(--hair)' }}>
            <span
              aria-hidden="true"
              className="absolute bottom-1 top-1 rounded-[12px]"
              style={{
                left: 4,
                width: 'calc(50% - 4px)',
                transform: `translateX(${index * 100}%)`,
                transition: 'transform .34s cubic-bezier(.22,.8,.24,1)',
                background: 'color-mix(in srgb, var(--accent) 22%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent) 45%, transparent)',
              }}
            />
            {TABS.map((t, i) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setIndex(i)}
                className="relative z-10 py-3 text-[14px] font-bold transition-colors"
                style={{ color: i === index ? 'var(--ink)' : 'var(--ink-3)' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <SwipeTabs
        hideBar
        tabs={TABS}
        index={index}
        onChange={setIndex}
        panels={[<PlayerTab key="player" onSave={noop} />, <TeamTab key="team" onSave={noop} />]}
      />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
