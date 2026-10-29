import LeaguePlayersPanel from '@/components/league/LeaguePlayersPanel';
import CompSeasonBar from '@/components/CompSeasonBar';
import { PastTeamPlayers } from '@/components/past/PastTeam';
import { useTeamView, announceComp } from '@/components/past/PastBits';
import { teamCompetitions } from '@/data/competitions';

// Giocatori della squadra: tendina della competizione e delle stagioni, come nelle statistiche.
export default function TeamPlayersPanel({ team }) {
  const { comp, setComp, season, eff, setSeason, comps, seasons, fm, noCur } = useTeamView(team, 'pl', teamCompetitions(team.id), team.leagueId);
  return (
    <div>
      <CompSeasonBar comps={comps} comp={comp} onComp={(c) => { setComp(c); announceComp(team.id, c); }} seasons={seasons} season={season} onSeason={setSeason} noCur={noCur} />
      {comp !== team.leagueId ? (
        <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Statistiche dei giocatori disponibili per il campionato</p>
      ) : eff !== 'cur' && fm ? <PastTeamPlayers fm={fm} sk={eff} team={team} /> : <LeaguePlayersPanel leagueId={team.leagueId} teamId={team.id} />}
    </div>
  );
}
