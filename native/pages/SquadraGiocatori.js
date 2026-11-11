// Squadra: scheda Giocatori. Campionato dell'app = classifiche dei giocatori della squadra; altre competizioni/stagioni dall'archivio.
import React, { useDeferredValue, useMemo, useState } from 'react';
import { View } from 'react-native';
import useAsync from '@/hooks/useAsync';
import { teamCompetitions } from '@/data/competitions';
import { playersByTeam } from '@/data/players';
import { teamById } from '@/data/teams';
import { loadSeason, loadTeamPlayerStats, statsFromMatches, teamIdByName } from '@/data/archive';
import { teamFmId } from '@/data/teamIndex';
import { Segmented } from '../shared/ui';
import { useTeamView, useAnnounceComp, curSkOf } from '../shared/teamView';
import CompBarN from '../shared/CompBarN';
import StatListsN from '../shared/StatListsN';
import { statSections } from '../shared/statSections';
import { appPlayerSections } from '../shared/appPlayerSections';
import { PanelSkN } from '../shared/TabsN';
import { useTeamColors } from './GiocatorePast';

const PARTS = [{ value: 'tot', label: 'Totale' }, { value: 'home', label: 'Casa' }, { value: 'away', label: 'Trasferta' }, { value: 'p90', label: "Ogni 90'" }];
const CATS = [{ value: 'all', label: 'Tutte' }, { value: 'Attacco', label: 'Attacco' }, { value: 'Difesa', label: 'Difesa' }, { value: 'Disciplina', label: 'Disciplina' }, { value: 'Gioco', label: 'Gioco' }];
export const playerCat = (g) => (['Attacco', 'Difesa', 'Disciplina'].includes(g) ? g : 'Gioco');

function Pills({ C, part, onPart }) {
  // solo Totale / Ogni 90': Casa/Trasferta e i filtri Tutte/Attacco/Difesa/Disciplina/Gioco non servono (per spostarsi c'e' "Vai a")
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      <Segmented C={C} options={PARTS.filter((p) => p.value === 'tot' || p.value === 'p90')} value={part === 'p90' ? 'p90' : 'tot'} onChange={onPart} />
    </View>
  );
}

function PastPlayers({ C, fm, sk, team, part, onPart, cat, onCat, split, header, openRoute, bottom }) {
  const col = useTeamColors();
  const { data: season, loading } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const fid = teamFmId(team);
  const tid = season ? (fid && season.teams && season.teams[fid] ? String(fid) : teamIdByName(season.teams, team.name)) : null;
  const byMatch = part === 'home' || part === 'away';
  const { data: stats, loading: l2 } = useAsync(() => (!tid ? Promise.resolve(null) : byMatch ? statsFromMatches(fm, sk, part) : loadTeamPlayerStats(fm, sk, tid)), [fm, sk, tid, part]);
  const { data: exact } = useAsync(() => statsFromMatches(fm, sk), [fm, sk]);
  const sections = useMemo(() => {
    if (!season || !tid) return [];
    const secs = statSections(C, stats, 'players', season.teams || {}, col, fm, sk, part === 'p90' ? 'p90' : 'tot', tid, exact);
    const has = [...new Set(secs.map((x) => playerCat(x.group)))];
    return cat === 'all' || !has.includes(cat) ? secs : secs.filter((x) => playerCat(x.group) === cat);
  }, [C, stats, season, col, fm, sk, part, tid, exact, cat]);
  if (loading || (l2 && !stats)) return <><View>{header}</View><PanelSkN C={C} /></>;
  if (!season || !tid) return <View>{header}</View>;
  if (!sections.length && part === 'tot') return <View>{header}</View>;
  return <StatListsN C={C} sections={sections} podium openRoute={openRoute} bottom={bottom} header={<>{header}<Pills C={C} part={part} onPart={onPart} /></>} />;
}

export default function SquadraGiocatori({ C, teamId, openRoute, bottom }) {
  const team = teamById(teamId);
  const hasApp = playersByTeam(team.id).some((p) => p.hasStats);
  const { comp, setComp, season, eff, setSeason, comps, seasons, fm, noCur, noSplit } = useTeamView(team, 'pl', teamCompetitions(team.id), team.leagueId, false, { hasApp });
  const tap = useAnnounceComp(team.id, comp, season);
  const [part, setPart] = useState('tot');
  const [cat, setCat] = useState('all');
  const sk = eff === 'cur' ? curSkOf(comp) : eff;
  const split = !!fm && !!sk && !noSplit.includes(sk);
  const usePart = !split && (part === 'home' || part === 'away') ? 'tot' : part;
  const dUse = useDeferredValue(usePart);
  const appList = eff === 'cur' && comp === team.leagueId && hasApp && usePart !== 'home' && usePart !== 'away';
  const bar = <CompBarN C={C} comps={comps} comp={comp} onComp={tap(setComp)} seasons={seasons} season={season} onSeason={tap(setSeason)} noCur={noCur} />;
  const mode = dUse === 'p90' ? 'p90' : 'tot';
  const appSections = useMemo(() => {
    if (!appList) return null;
    const secs = appPlayerSections(C, team.leagueId, team.id, mode);
    const has = [...new Set(secs.map((x) => playerCat(x.group)))];
    return cat === 'all' || !has.includes(cat) ? secs : secs.filter((x) => playerCat(x.group) === cat);
  }, [appList, C, team.leagueId, team.id, mode, cat]);
  if (appList) {
    const sections = appSections;
    return <StatListsN C={C} sections={sections} pending={dUse !== usePart} podium openRoute={openRoute} bottom={bottom} header={<>{bar}<Pills C={C} part={usePart} onPart={setPart} /></>} />;
  }
  if (fm && sk) return <PastPlayers C={C} fm={fm} sk={sk} team={team} part={usePart} onPart={setPart} cat={cat} onCat={setCat} split={split} header={bar} openRoute={openRoute} bottom={bottom} />;
  return <View>{bar}</View>;
}
