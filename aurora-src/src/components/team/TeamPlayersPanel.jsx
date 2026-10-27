import { useState } from 'react';
import LeaguePlayersPanel from '@/components/league/LeaguePlayersPanel';
import CompSeasonBar from '@/components/CompSeasonBar';
import { PastTeamPlayers } from '@/components/past/PastTeam';
import { useSeasonList, initSeason, announceComp } from '@/components/past/PastBits';
import { teamCompetitions } from '@/data/competitions';
import { FM_ID } from '@/data/archive';

// Giocatori della squadra: tendina della competizione e delle stagioni, come nelle statistiche.
export default function TeamPlayersPanel({ team }) {
  const [comp, setComp] = useState(team.leagueId);
  const [season, setSeason] = useState(() => initSeason(FM_ID[comp]));
  const comps = teamCompetitions(team.id);
  const fm = FM_ID[comp];
  const seasons = useSeasonList(fm, team && team.name);
  return (
    <div>
      <CompSeasonBar comps={comps} comp={comp} onComp={(c) => { setComp(c); setSeason('cur'); announceComp(team.id, c); }} seasons={seasons} season={season} onSeason={setSeason} />
      {comp !== team.leagueId ? (
        <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Statistiche dei giocatori disponibili per il campionato</p>
      ) : season !== 'cur' && fm ? <PastTeamPlayers fm={fm} sk={season} team={team} /> : <LeaguePlayersPanel leagueId={team.leagueId} teamId={team.id} />}
    </div>
  );
}
