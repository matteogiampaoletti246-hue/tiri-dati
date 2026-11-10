// Squadra: scheda Classifica. Parte dal campionato della squadra (evidenziata); coppa nazionale = Tabellone; stagioni passate dall'archivio.
import React from 'react';
import { View } from 'react-native';
import useAsync from '@/hooks/useAsync';
import { standings } from '@/data/standings';
import { teamCompetitions } from '@/data/competitions';
import { isPureCup } from '@/data/bracket';
import { loadSeason, teamIdByName } from '@/data/archive';
import { teamFmId } from '@/data/teamIndex';
import { teamById } from '@/data/teams';
import { LeagueStandings, ArchiveStandings } from '../shared/Standings';
import { useTeamView, useAnnounceComp } from '../shared/teamView';
import CompBarN from '../shared/CompBarN';
import SwapN from '../shared/SwapN';
import PaneN from '../shared/PaneN';
import { PanelSkN } from '../shared/TabsN';
import Tabellone from './PartitaBracket';

function PastTeamStandings({ C, fm, sk, team, openRoute }) {
  const { data: season, loading } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  if (loading) return <PanelSkN C={C} />;
  if (!season) return null;
  const fid = teamFmId(team);
  const tid = fid && season.teams && season.teams[fid] ? String(fid) : teamIdByName(season.teams, team.name);
  return <ArchiveStandings C={C} season={season} fm={fm} sk={sk} highlight={tid} openRoute={openRoute} />;
}

export default function SquadraClassifica({ C, teamId, openRoute, bottom }) {
  const team = teamById(teamId);
  const { comp, setComp, season, eff, setSeason, comps, seasons, fm, noCur } = useTeamView(team, 'st', teamCompetitions(teamId), team.leagueId);
  const tap = useAnnounceComp(teamId, comp, season);
  const has = standings(comp).length > 0;
  const pure = fm && isPureCup(fm);
  return (
    <PaneN bottom={bottom}>
      <CompBarN C={C} comps={comps} comp={comp} onComp={tap(setComp)} seasons={seasons} season={season} onSeason={tap(setSeason)} noCur={noCur} />
      <SwapN k={`${comp}|${eff}`}>
      {pure && eff !== 'cur' ? <View style={{ paddingTop: 12 }}><Tabellone C={C} match={{ archive: { fm, sk: eff } }} openRoute={openRoute} /></View>
        : eff !== 'cur' && fm ? <PastTeamStandings C={C} fm={fm} sk={eff} team={team} openRoute={openRoute} />
          : <View style={{ paddingTop: 12 }}>{has ? <LeagueStandings C={C} leagueId={comp} highlight={[team.id]} openRoute={openRoute} /> : null}</View>}
      </SwapN>
    </PaneN>
  );
}
