import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import MatchDayList from '@/components/MatchDayList';
import { matchesForLeague } from '@/data/matches';

const MATCH = {
  all: () => true,
  live: (m) => m.status === 'live',
  results: (m) => m.status === 'finished',
  upcoming: (m) => m.status === 'scheduled',
};

export default function LeagueMatchesPanel({ leagueId }) {
  const [filter, setFilter] = useState('all');
  const shown = matchesForLeague(leagueId).filter(MATCH[filter]);

  return (
    <div className="pt-2">
      <div className="px-5">
        <TextFilter
          options={[
            { value: 'all', label: 'Tutte' },
            { value: 'live', label: 'Live' },
            { value: 'results', label: 'Risultati' },
            { value: 'upcoming', label: 'Programmate' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>
      {shown.length ? (
        <MatchDayList matches={shown} />
      ) : (
        <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Nessuna partita
        </p>
      )}
    </div>
  );
}
