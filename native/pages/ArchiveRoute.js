// Rotte d'archivio /storico/:fm/:sk/squadra/:tid e /storico/:fm/:sk/giocatore/:pid: aprono la scheda unica di squadra o giocatore
// con la stagione scelta (come ArchiveTeam.jsx e ArchivePlayer.jsx del sito, che rimandano a /squadra/:id e /giocatore/:id).
import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import './../shared/shim';
import { bootShared } from '../shared/boot';
import { teamByName, teamByFm, ensureTeam } from '@/data/teams';
import { FM_ID, LID_BY_FM, loadSeason, teamLogo, loadPlayerStatsFor } from '@/data/archive';
import { loadCarriere } from '@/data/carriere';
import { PLAYERS } from '@/data/players';
import { archiveId } from '@/data/archivePlayer';
import { NAV } from '../shared/teamView';
import SquadraPage from './Squadra';
import GiocatorePage from './Giocatore';

function Wait({ C, top, onBack }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent', paddingTop: top }}>
      <Pressable onPress={onBack} hitSlop={12} style={{ paddingHorizontal: 20, height: 44, justifyContent: 'center' }}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
      <View style={{ margin: 16, height: 90, borderRadius: 22, backgroundColor: C.skBase }} />
    </View>
  );
}

function useResolve(fn, deps) {
  const [r, setR] = useState(undefined);
  useEffect(() => { let on = true; setR(undefined); (async () => { await bootShared(); return fn(); })().then((v) => on && setR(v || null)).catch(() => on && setR(null)); return () => { on = false; }; }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return r;
}

export function ArchTeamRoute(props) {
  const { params, C, top, onBack } = props;
  const { fm, sk, tid } = params.p;
  const r = useResolve(async () => {
    const season = await loadSeason(fm, sk);
    const name = season && season.teams && season.teams[tid];
    if (!name) return null;
    const byFm = teamByFm(tid);
    const byName = teamByName(name);
    const t = byFm || (byName && byName.leagueId && FM_ID[byName.leagueId] && String(FM_ID[byName.leagueId]) === String(fm) ? byName : null)
      || ensureTeam(name, LID_BY_FM[fm] || null, teamLogo(tid), String(tid), `fm-${tid}`);
    NAV.fm = fm; NAV.sk = sk;
    return t.id;
  }, [fm, sk, tid]);
  useEffect(() => { if (r === null) onBack && onBack(); }, [r]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!r) return <Wait C={C} top={top} onBack={onBack} />;
  return <SquadraPage {...props} params={{ id: r, tab: 'standings' }} />;
}

export function ArchPlayerRoute(props) {
  const { params, C, top, onBack } = props;
  const { fm, sk, pid } = params.p;
  const r = useResolve(async () => {
    const car = (await loadCarriere()) || {};
    const appId = Object.keys(car).find((k) => String(car[k] && car[k].fm) === String(pid));
    if (appId && PLAYERS.some((p) => p.id === appId)) return { id: appId, tab: 'stat', sk, lid: LID_BY_FM[fm] || null };
    const stats = await loadPlayerStatsFor(fm, sk, pid);
    const lists = (stats && stats.players) || {};
    const found = Object.keys(lists).some((k) => !k.startsWith('_') && lists[k].some((x) => String(x[0]) === String(pid)));
    return found ? { id: archiveId(fm, sk, pid), tab: 'stat' } : null;
  }, [fm, sk, pid]);
  useEffect(() => { if (r === null) onBack && onBack(); }, [r]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!r) return <Wait C={C} top={top} onBack={onBack} />;
  return <GiocatorePage {...props} params={r} />;
}
