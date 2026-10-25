import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import StandingsTable from '@/components/StandingsTable';

export default function LeagueStandingsPanel({ leagueId }) {
  const [mode, setMode] = useState('total');
  return (
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
  );
}
