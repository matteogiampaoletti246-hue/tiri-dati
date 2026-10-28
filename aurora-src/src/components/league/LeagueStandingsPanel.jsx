import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import StandingsTable from '@/components/StandingsTable';
import ClassificaSwitch from '@/components/bracket/ClassificaSwitch';
import useAsync from '@/hooks/useAsync';
import { FM_ID, currentSeason } from '@/data/archive';

export default function LeagueStandingsPanel({ leagueId }) {
  const [mode, setMode] = useState('total');
  const fm = FM_ID[leagueId];
  // il tabellone della stagione in corso si ricava dalla stagione piu' recente dell'archivio
  const { data: sk } = useAsync(() => (fm ? currentSeason(fm) : null), [fm]);
  return (
    <ClassificaSwitch fm={fm} sk={sk}>
      <div className="pt-3">
        <div className="px-4">
          <TextFilter
            options={[
              { value: 'total', label: 'Totale' },
              { value: 'home', label: 'Casa' },
              { value: 'away', label: 'Trasferta' },
              { value: 'forma', label: 'Forma' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>
        <div className="mt-3">
          <StandingsTable leagueId={leagueId} mode={mode} />
        </div>
      </div>
    </ClassificaSwitch>
  );
}
