import StandingsTable from '@/components/StandingsTable';
import CompSeasonBar from '@/components/CompSeasonBar';
import { PastTeamStandings } from '@/components/past/PastTeam';
import { useTeamView, announceComp, useCompIn } from '@/components/past/PastBits';
import { standings } from '@/data/standings';
import { teamCompetitions } from '@/data/competitions';
import Bracket from '@/components/bracket/Bracket';
import { isPureCup } from '@/data/bracket';

// Classifica: parte sempre dal campionato della squadra (evidenziata); le tendine scelgono competizione e stagione.
export default function TeamStandingsPanel({ team }) {
  const { comp, setComp, season, eff, setSeason, comps, seasons, fm, noCur } = useTeamView(team, 'st', teamCompetitions(team.id), team.leagueId);
  const has = standings(comp).length > 0;
  // coppa nazionale a eliminazione diretta: la "classifica" e' il Tabellone (stesso nome della scheda, contenuto diverso)
  const pure = fm && isPureCup(fm);
  const anim = useCompIn(`${comp}-${eff}`);
  return (
    <div>
      <CompSeasonBar comps={comps} comp={comp} onComp={(c) => { setComp(c); announceComp(team.id, c); }} seasons={seasons} season={season} onSeason={setSeason} noCur={noCur} />
      {pure && eff !== 'cur' ? <div key={`${comp}-${eff}`} className={`${anim} pt-3`}><Bracket fm={fm} sk={eff} /></div> : eff !== 'cur' && fm ? <PastTeamStandings fm={fm} sk={eff} team={team} /> : (
        <div key={comp} className={`${anim} pt-3`}>
          {has ? <StandingsTable leagueId={comp} highlight={[team.id]} /> : null}
        </div>
      )}
    </div>
  );
}
