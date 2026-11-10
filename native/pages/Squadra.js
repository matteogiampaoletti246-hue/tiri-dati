// Scheda Squadra nativa (/squadra/:id): banner, posizione e punti, e le schede Partite / Classifica / Squadra / Statistiche / Giocatori.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import './../shared/shim';
import { bootShared } from '../shared/boot';
import useAsync from '@/hooks/useAsync';
import { BASE } from '@/data/load';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';
import { teamFromIndex, teamPlayerHistory } from '@/data/teamIndex';
import { flagCode } from '@/data/carriere';
import { isNationName } from '@/data/teamColorFix';
import { teamForm } from '@/data/matches';
import { allTeamMatches } from '@/data/extras';
import { coachOf, playersByTeam } from '@/data/players';
import { loadRose, roseOf, seasonRoster, roseLoaded } from '@/data/rose';
import { resetSel, useSel } from '../shared/hooks';
import { useBannerSel, useBannerRow } from '../shared/teamView';
import EntityBannerN from '../shared/EntityBannerN';
import TabsN from '../shared/TabsN';
import { TintProvider } from '../shared/ui';
import { FormDots } from './PartitaHero';
import SquadraPartite from './SquadraPartite';
import SquadraClassifica from './SquadraClassifica';
import SquadraRosa from './SquadraRosa';
import SquadraStat from './SquadraStat';
import SquadraGiocatori from './SquadraGiocatori';

const TABS = [
  { key: 'matches', label: 'Partite' },
  { key: 'standings', label: 'Classifica' },
  { key: 'roster', label: 'Squadra' },
  { key: 'stats', label: 'Statistiche' },
  { key: 'players', label: 'Giocatori' },
];

function Skel({ C, top, onBack }) {
  const b = (h, w, r = 18) => <View style={{ height: h, width: w || '100%', borderRadius: r, backgroundColor: C.skBase, marginBottom: 12 }} />;
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View style={{ paddingTop: top + 10, paddingHorizontal: 12, paddingBottom: 22, backgroundColor: C.sheet }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ width: 32, height: 38, justifyContent: 'center' }}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
        <View style={{ paddingLeft: 6 }}>{b(24, 180, 8)}{b(12, 120, 6)}</View>
      </View>
      <View style={{ padding: 16 }}>{b(40, null, 20)}{b(70)}{b(70)}{b(70)}</View>
    </View>
  );
}

function Body({ C, top, onBack, bottom, openRoute, team, srT }) {
  const [tabKey, setTabKey] = useSel(team.id, 'tab', 'matches');
  const [, bumpR] = useState(0);
  useEffect(() => { let on = true; loadRose().then(() => on && bumpR((n) => n + 1)); return () => { on = false; }; }, []);
  // scheda "Squadra" solo se c'e' una rosa; scheda "Giocatori" solo con statistiche giocatori (mai un pannello vuoto)
  const rp = roseLoaded() ? roseOf(team) : null;
  const rosterSync = (rp && rp.p && rp.p.length) || playersByTeam(team.id).length > 0;
  const { data: srT0, loading: srL } = useAsync(() => (roseLoaded() && !rosterSync ? seasonRoster(team) : Promise.resolve(null)), [team.id, rosterSync, roseLoaded()]);
  const hasRoster = rosterSync || !!srT0 || srL || !roseLoaded();
  const { data: plH, loading: plL } = useAsync(() => teamPlayerHistory(team), [team.id]);
  const hasPlayers = plL || playersByTeam(team.id).some((p) => p.hasStats) || !!(plH && Object.keys(plH.seasons).length);
  const sel = useBannerSel(team);
  const bComp = sel ? sel.comp : null;
  const row = useBannerRow(team, bComp, sel ? sel.sk : 'cur');
  const league = leagueById(team.leagueId);
  const shownLg = bComp && bComp !== 'all' ? leagueById(bComp) : league;
  const liveCount = allTeamMatches(team.id).filter((m) => m.status === 'live').length;
  const coach = (roseOf(team) || {}).co || (coachOf(team.id) !== '—' ? coachOf(team.id) : null) || (srT0 && srT0.co) || (srT && srT.co) || null;
  const below = row || coach ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {row ? (
        <>
          <Text style={{ color: C.ink, fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{row.rank}°</Text>
          <Text style={{ color: C.ink2, fontSize: 12.5, fontVariant: ['tabular-nums'] }}>{row.points} pt</Text>
          {coach ? <View style={{ width: 1, height: 16, backgroundColor: C.hair }} /> : null}
        </>
      ) : null}
      {coach ? <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 12.5, flexShrink: 1 }}>All. {coach}</Text> : null}
    </View>
  ) : null;
  const nat = isNationName(team.name);
  const fc = nat ? flagCode(team.name) : null;
  const tabs = TABS.filter((t) => (t.key !== 'roster' || hasRoster) && (t.key !== 'players' || hasPlayers));
  const idx = Math.max(0, tabs.findIndex((t) => t.key === tabKey));
  const props = { C, teamId: team.id, openRoute, bottom };
  const panel = { matches: SquadraPartite, standings: SquadraClassifica, roster: SquadraRosa, stats: SquadraStat, players: SquadraGiocatori };
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <EntityBannerN C={C} top={top} onBack={onBack} name={team.name} subtitle={shownLg ? shownLg.name : ''} meta={<FormDots C={C} form={teamForm(team.id)} size={14} />} below={below}
        colors={team.colors} logoUrl={fc ? null : team.crest} flagUrl={fc ? `${BASE}flags/${fc}.png` : null} liveCount={liveCount} />
      <TintProvider color={team.colors && team.colors[0]}>
      <TabsN C={C} tabs={tabs} index={idx} onIndex={(i) => setTabKey(tabs[i].key)} render={(i) => { const P = panel[tabs[i].key]; return <P key={tabs[i].key} {...props} />; }} />
      </TintProvider>
    </View>
  );
}

export default function Squadra({ C, top, onBack, bottom = 90, openRoute, params }) {
  const id = params && params.id ? decodeURIComponent(params.id) : null;
  const [st, setSt] = useState('load');
  const [t0, setT0] = useState(null);
  useEffect(() => {
    let live = true;
    setSt('load');
    (async () => {
      await bootShared();
      let t = teamById(id);
      const fmRoute = /^fm-(\d+)$/.exec(String(id));
      if (!t && fmRoute) t = await teamFromIndex(fmRoute[1]);
      if (live) { if (t) resetSel(t.id); setT0(t || null); setSt(t ? 'ok' : 'err'); }
    })().catch(() => { if (live) setSt('err'); });
    return () => { live = false; };
  }, [id]);
  useEffect(() => { if (st === 'err') onBack && onBack(); }, [st]); // eslint-disable-line react-hooks/exhaustive-deps
  if (st !== 'ok' || !t0) return <Skel C={C} top={top} onBack={onBack} />;
  return <Body C={C} top={top} onBack={onBack} bottom={bottom} openRoute={openRoute} team={t0} />;
}
