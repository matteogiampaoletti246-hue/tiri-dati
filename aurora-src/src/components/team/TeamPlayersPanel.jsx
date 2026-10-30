import { useState } from 'react';
import LeaguePlayersPanel from '@/components/league/LeaguePlayersPanel';
import CompSeasonBar from '@/components/CompSeasonBar';
import { PastTeamPlayers, PlayerPills, playerCat } from '@/components/past/PastTeam';
import { useTeamView, announceComp, curSkOf } from '@/components/past/PastBits';
import { teamCompetitions } from '@/data/competitions';
import { playersByTeam } from '@/data/players';

// Giocatori della squadra: tendina della competizione e delle stagioni, come nelle statistiche. Le tendine elencano solo competizioni e stagioni
// con statistiche giocatori (indice tidx): coppe comprese, dalle classifiche ufficiali o calcolate dalle partite (mai un messaggio al posto dei dati).
export default function TeamPlayersPanel({ team }) {
  const hasApp = playersByTeam(team.id).some((p) => p.hasStats);
  const { comp, setComp, season, eff, setSeason, comps, seasons, fm, noCur, noSplit } = useTeamView(team, 'pl', teamCompetitions(team.id), team.leagueId, false, { hasApp });
  const [part, setPart] = useState('tot');
  const [cat, setCat] = useState('all');
  const sk = eff === 'cur' ? curSkOf(comp) : eff;
  const split = !!fm && !!sk && !noSplit.includes(sk);
  const usePart = !split && (part === 'home' || part === 'away') ? 'tot' : part;
  // stagione in corso del campionato dell'app: dati dell'app sempre aggiornati (Casa/Trasferta si calcolano dalle partite)
  const appList = eff === 'cur' && comp === team.leagueId && hasApp && usePart !== 'home' && usePart !== 'away';
  return (
    <div>
      <CompSeasonBar comps={comps} comp={comp} onComp={(c) => { setComp(c); announceComp(team.id, c); }} seasons={seasons} season={season} onSeason={setSeason} noCur={noCur} />
      {appList ? (
        <LeaguePlayersPanel leagueId={team.leagueId} teamId={team.id} mode={usePart === 'p90' ? 'p90' : 'tot'} cat={cat} catOf={playerCat} renderControls={(has) => <PlayerPills part={usePart} onPart={setPart} cat={cat} onCat={setCat} split={split} has={has} />} />
      ) : fm && sk ? <PastTeamPlayers fm={fm} sk={sk} team={team} part={usePart} onPart={setPart} cat={cat} onCat={setCat} split={split} /> : null}
    </div>
  );
}
