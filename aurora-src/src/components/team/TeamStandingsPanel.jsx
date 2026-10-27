import { useState } from 'react';
import StandingsTable from '@/components/StandingsTable';
import CompSeasonBar from '@/components/CompSeasonBar';
import { PastTeamStandings } from '@/components/past/PastTeam';
import { useSeasonList, initSeason, announceComp } from '@/components/past/PastBits';
import { standings } from '@/data/standings';
import { teamCompetitions } from '@/data/competitions';
import { FM_ID } from '@/data/archive';

// Classifica: parte sempre dal campionato della squadra (evidenziata); le tendine scelgono competizione e stagione.
export default function TeamStandingsPanel({ team }) {
  const [comp, setComp] = useState(team.leagueId);
  const [season, setSeason] = useState(() => initSeason(FM_ID[comp]));
  const comps = teamCompetitions(team.id);
  const fm = FM_ID[comp];
  const seasons = useSeasonList(fm);
  const has = standings(comp).length > 0;
  return (
    <div>
      <CompSeasonBar comps={comps} comp={comp} onComp={(c) => { setComp(c); setSeason('cur'); announceComp(team.id, c); }} seasons={seasons} season={season} onSeason={setSeason} />
      {season !== 'cur' && fm ? <PastTeamStandings fm={fm} sk={season} team={team} /> : (
        <div key={comp} className="comp-in pt-3">
          {has ? <StandingsTable leagueId={comp} highlight={[team.id]} /> : (
            <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Classifica non ancora disponibile</p>
          )}
        </div>
      )}
    </div>
  );
}
