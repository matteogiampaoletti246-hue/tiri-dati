import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import MatchDayList from '@/components/MatchDayList';
import { allTeamMatches } from '@/data/extras';

const MATCH = {
  all: () => true,
  results: (m) => m.status === 'finished',
  upcoming: (m) => m.status !== 'finished',
};

export default function TeamMatchesPanel({ teamId }) {
  const [filter, setFilter] = useState('all');
  const shown = allTeamMatches(teamId).filter(MATCH[filter]);

  return (
    <div className="pt-2">
      <div className="px-5">
        <TextFilter
          options={[
            { value: 'all', label: 'Tutte' },
            { value: 'results', label: 'Risultati' },
            { value: 'upcoming', label: 'Programmate' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>
      {shown.length ? (
        <MatchDayList matches={shown} teamId={teamId} />
      ) : (
        <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Nessuna partita
        </p>
      )}
    </div>
  );
}
