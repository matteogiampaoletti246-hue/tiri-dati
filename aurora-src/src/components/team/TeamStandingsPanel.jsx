import StandingsTable from '@/components/StandingsTable';
import CompSeasonBar from '@/components/CompSeasonBar';
import { PastTeamStandings } from '@/components/past/PastTeam';
import { useTeamView, announceComp } from '@/components/past/PastBits';
import { standings } from '@/data/standings';
import { teamCompetitions } from '@/data/competitions';

// Classifica: parte sempre dal campionato della squadra (evidenziata); le tendine scelgono competizione e stagione.
export default function TeamStandingsPanel({ team }) {
  const { comp, setComp, season, eff, setSeason, comps, seasons, fm } = useTeamView(team, 'st', teamCompetitions(team.id), team.leagueId);
  const has = standings(comp).length > 0;
  return (
    <div>
      <CompSeasonBar comps={comps} comp={comp} onComp={(c) => { setComp(c); announceComp(team.id, c); }} seasons={seasons} season={season} onSeason={setSeason} />
      {eff !== 'cur' && fm ? <PastTeamStandings fm={fm} sk={eff} team={team} /> : (
        <div key={comp} className="comp-in pt-3">
          {has ? <StandingsTable leagueId={comp} highlight={[team.id]} /> : (
            <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Classifica non ancora disponibile</p>
          )}
        </div>
      )}
    </div>
  );
}
