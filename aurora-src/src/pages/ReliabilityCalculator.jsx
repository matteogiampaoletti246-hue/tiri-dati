import { useState } from 'react';
import PageShell from '@/components/PageShell';
import SwipeTabs from '@/components/SwipeTabs';
import TopBar from '@/components/TopBar';
import PlayerTab from '@/components/calc/PlayerTab';
import StoricoTab from '@/components/calc/StoricoTab';
import TeamTab from '@/components/calc/TeamTab';
import useCalcHistory from '@/hooks/useCalcHistory';

const TABS = [
  { key: 'player', label: 'Affidabilità giocatore' },
  { key: 'team', label: 'Media tiri squadra' },
  { key: 'storico', label: 'Storico' },
];

export default function ReliabilityCalculator() {
  const [index, setIndex] = useState(0);
  const { plays, add, remove, merge } = useCalcHistory();

  return (
    <PageShell swipeBack={false}>
      <TopBar
        title="Calcolatore di Affidabilità"
        back={false}
        right={
          plays.length ? (
            <button type="button" className="filter-btn" onClick={() => setIndex(2)}>
              Storico · {plays.length}
            </button>
          ) : null
        }
      />
      <SwipeTabs
        tabs={TABS}
        index={index}
        stickyTop="54px"
        onChange={setIndex}
        panels={[
          <PlayerTab key="player" onSave={add} />,
          <TeamTab key="team" onSave={add} />,
          <StoricoTab key="storico" plays={plays} onRemove={remove} onMerge={merge} />,
        ]}
      />
    </PageShell>
  );
}
