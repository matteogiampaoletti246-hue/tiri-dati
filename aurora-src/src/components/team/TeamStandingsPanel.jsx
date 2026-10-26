import { useState } from 'react';
import CompSelect from '@/components/CompSelect';
import StandingsTable from '@/components/StandingsTable';
import { standings } from '@/data/standings';
import { teamCompetitions } from '@/data/competitions';

// Classifica: parte sempre dal campionato della squadra, la tendina sceglie le altre competizioni.
export default function TeamStandingsPanel({ team }) {
  const [comp, setComp] = useState(team.leagueId);
  const comps = teamCompetitions(team.id);
  const has = standings(comp).length > 0;
  return (
    <div>
      <CompSelect options={comps} value={comp} onChange={setComp} />
      <div key={comp} className="comp-in pt-3">
        {has ? <StandingsTable leagueId={comp} highlight={[team.id]} /> : (
          <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Classifica non ancora disponibile</p>
        )}
      </div>
    </div>
  );
}
