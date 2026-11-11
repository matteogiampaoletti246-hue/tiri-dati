// Scheda Campionato nativa (/campionato/:id): banner con i colori del campionato, tendina stagioni e schede
// Partite / Classifica / Stat. squadre / Giocatori / Arbitri. Stagione in corso dai dati dell'app, stagioni passate dall'archivio.
import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import './../shared/shim';
import { bootShared } from '../shared/boot';
import useAsync from '@/hooks/useAsync';
import { RAW } from '@/data/load';
import { FM_ID, archIndex, seasonLabel, sortSeasons, firstSeasonWithData, currentSeason } from '@/data/archive';
import { leagueById, leagueTint } from '@/data/leagues';
import { teamsOf } from '@/data/teams';
import { matchesForLeague } from '@/data/matches';
import { CATEGORY_DEFS, hasMetrics, metricOf } from '@/data/standings';
import { comma } from '@/lib/format';
import { loadLeaguePlayerStats, loadSeason } from '@/data/archive';
import { resetSel, useSel } from '../shared/hooks';
import EntityBannerN from '../shared/EntityBannerN';
import TabsN, { PanelSkN } from '../shared/TabsN';
import Dropdown from '../shared/Dropdown';
import PaneN from '../shared/PaneN';
import SwapN from '../shared/SwapN';
import StatListsN from '../shared/StatListsN';
import RefereesN, { leagueReferees } from '../shared/RefereesN';
import { MatchdayListN, MATCH_FILTERS, APP_PASS } from '../shared/MatchdayN';
import { appPlayerSections } from '../shared/appPlayerSections';
import { LeagueStandings } from '../shared/Standings';
import { Segmented, TeamCrest, TintProvider, isDarkLogo } from '../shared/ui';
import ArchiveLeagueN, { ArchPlayersN, ClassificaSwitchN } from './CampionatoArch';
import { useTeamColors } from './GiocatorePast';

const TOP5_LG = ['premier-league', 'serie-a', 'la-liga', 'bundesliga', 'ligue-1'];
const TABS = [
  { key: 'matches', label: 'Partite' },
  { key: 'standings', label: 'Classifica' },
  { key: 'teams', label: 'Stat. squadre' },
  { key: 'players', label: 'Giocatori' },
  { key: 'referees', label: 'Arbitri' },
];
const hex6 = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#2C3E66');
const INVERT_DARK = ['premier-league', 'champions-league', 'ligue-1'];

function Skel({ C, top, onBack }) {
  const b = (h, w, r = 18) => <View style={{ height: h, width: w || '100%', borderRadius: r, backgroundColor: C.skBase, marginBottom: 12 }} />;
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View style={{ paddingTop: top + 10, paddingHorizontal: 12, paddingBottom: 22, backgroundColor: C.sheet }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ width: 32, height: 38, justifyContent: 'center' }}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
        <View style={{ paddingLeft: 6 }}>{b(24, 180, 8)}{b(12, 120, 6)}</View>
      </View>
      <PanelSkN C={C} />
    </View>
  );
}

// ---- schede del campionato in corso
function LiveMatches({ C, leagueId, tint, openRoute, bottom }) {
  const [filter, setFilter] = useState('all');
  const anchor = useRef({ on: false }).current;
  const all = useMemo(() => matchesForLeague(leagueId), [leagueId]);
  const shown = all.filter(APP_PASS[filter]);
  return (
    <PaneN bottom={bottom} anchor={anchor}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}><Segmented C={C} options={MATCH_FILTERS} value={filter} onChange={setFilter} /></View>
      <SwapN k={filter}>
        {shown.length ? <MatchdayListN C={C} matches={shown} all={all} tint={tint} openRoute={openRoute} anchor={anchor} /> : <View style={{ height: 40 }} />}
      </SwapN>
    </PaneN>
  );
}

function LiveStandings({ C, leagueId, openRoute, bottom }) {
  const [mode, setMode] = useState('total');
  const fm = FM_ID[leagueId];
  const { data: sk } = useAsync(() => (fm ? currentSeason(fm) : null), [fm]);
  return (
    <PaneN bottom={bottom}>
      <ClassificaSwitchN C={C} fm={fm} sk={sk} openRoute={openRoute}>
        <View style={{ paddingTop: 12 }}>
          <View style={{ paddingHorizontal: 16 }}><Segmented C={C} options={[{ value: 'total', label: 'Totale' }, { value: 'home', label: 'Casa' }, { value: 'away', label: 'Trasferta' }, { value: 'forma', label: 'Forma' }]} value={mode} onChange={setMode} /></View>
          <SwapN k={mode}><LeagueStandings C={C} leagueId={leagueId} mode={mode} openRoute={openRoute} /></SwapN>
        </View>
      </ClassificaSwitchN>
    </PaneN>
  );
}

function LiveTeams({ C, leagueId, openRoute, bottom }) {
  const [part, setPart] = useState(0);
  const dPart = useDeferredValue(part);
  const sections = useMemo(() => {
    const teams = teamsOf(leagueId).filter((t) => hasMetrics(t.id, leagueId));
    const out = [];
    CATEGORY_DEFS.forEach((cat) => cat.metrics.forEach((mt) => {
      const rows = teams.map((t) => ({ t, v: metricOf(t.id, mt.key, dPart, leagueId) })).sort((a, b) => b.v - a.v)
        .map(({ t, v }) => ({ id: t.id, to: `/squadra/${t.id}`, left: <TeamCrest team={t} size={24} C={C} />, name: t.name, bg: true, tc: hex6(t.colors && t.colors[0]), value: comma(v, 2) }));
      out.push({ id: mt.key, group: cat.title, title: mt.label, rows });
    }));
    return out;
  }, [leagueId, dPart, C]);
  if (!sections.length) return <View />;
  return <StatListsN C={C} sections={sections} pending={dPart !== part} podium openRoute={openRoute} bottom={bottom} />;
}

// top 5 campionati: giocatori dell'app; coppe europee e altre competizioni: statistiche FotMob della competizione stessa
function AppPlayers({ C, leagueId, openRoute, bottom }) {
  const [mode, setMode] = useState('tot');
  const dMode = useDeferredValue(mode);
  const sections = useMemo(() => appPlayerSections(C, leagueId, null, dMode), [leagueId, dMode, C]);
  return <StatListsN C={C} sections={sections} pending={dMode !== mode} podium openRoute={openRoute} bottom={bottom} header={<View style={{ paddingHorizontal: 16, paddingTop: 8 }}><Segmented C={C} options={[{ value: 'tot', label: 'Totale' }, { value: 'p90', label: "Ogni 90'" }]} value={mode} onChange={setMode} /></View>} />;
}
function FmPlayers({ C, fm, sk, openRoute, bottom }) {
  const { data: season } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const { data: pstats } = useAsync(() => loadLeaguePlayerStats(fm, sk), [fm, sk]);
  const col = useTeamColors();
  if (!pstats) return <PanelSkN C={C} />;
  return <ArchPlayersN C={C} fm={fm} sk={sk} stats={pstats} names={(season && season.teams) || {}} col={col} openRoute={openRoute} bottom={bottom} />;
}

function Body({ C, top, onBack, bottom, openRoute, league, fm, past, fsd }) {
  const key = `lg-${fm || league.id}`;
  const [season, setSeason] = useSel(key, 'season', () => { const x = league.extra && RAW.extra && RAW.extra.sk && RAW.extra.sk[String(league.fm)]; return x || 'live'; });
  const [tabKey, setTabKey] = useSel(key, 'tab', 'matches');
  const curKey = (league.season || '').replace('/', '-');
  // campionato solo dall'archivio: nessuna stagione "dal vivo", si parte dalla piu' recente con dati
  const seasonEff = league.arch && season === 'live' ? ((fsd && fsd.sk) || past[0]) : season;
  const inArchive = seasonEff !== 'live';
  const tint = leagueTint(league.id);
  const leagueMatches = useMemo(() => matchesForLeague(league.id), [league.id]);
  const teamCount = teamsOf(league.id).length;
  const liveCount = leagueMatches.filter((m) => m.status === 'live').length;
  const opts = (league.arch ? past : ['live', ...past]).map((s) => ({ key: s, label: s === 'live' ? (league.season || 'Stagione attuale') : seasonLabel(s), short: s === 'live' ? (league.season || 'Attuale') : seasonLabel(s) }));
  const seasonBtn = fm && past.length ? <Dropdown C={C} options={opts} value={seasonEff} onChange={(v) => { setSeason(v); setTabKey('matches'); }} side="left" width={200} /> : null;
  const meta = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 6 }}>
      {inArchive ? null : <Text style={{ color: C.ink2, fontSize: 11.5, fontVariant: ['tabular-nums'] }}>{leagueMatches.length} gare · {teamCount} squadre</Text>}
      {seasonBtn}
    </View>
  );
  const useFm = fm && !TOP5_LG.includes(league.id);
  const showRefs = leagueReferees(league.id).length > 0;
  const tabs = TABS.filter((t) => t.key !== 'referees' || showRefs);
  const idx = Math.max(0, tabs.findIndex((t) => t.key === tabKey));
  const render = (i) => {
    const k = tabs[i].key;
    const p = { C, leagueId: league.id, openRoute, bottom };
    if (k === 'matches') return <LiveMatches key={k} {...p} tint={tint} />;
    if (k === 'standings') return <LiveStandings key={k} {...p} />;
    if (k === 'teams') return <LiveTeams key={k} {...p} />;
    if (k === 'players') return useFm ? <FmPlayers key={k} C={C} fm={fm} sk={curKey} openRoute={openRoute} bottom={bottom} /> : <AppPlayers key={k} {...p} />;
    return <RefereesN key={k} C={C} base={leagueReferees(league.id)} to={(r) => `/arbitro/${r.id}`} openRoute={openRoute} bottom={bottom} />;
  };
  const dark = C.dark;
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <EntityBannerN C={C} top={top} onBack={onBack} name={league.name} subtitle={`${league.country} · ${inArchive ? seasonLabel(seasonEff) : league.season}`} meta={meta}
        colors={league.colors} logoUrl={dark && league.logoDark ? league.logoDark : league.logo} logoTint={isDarkLogo(league.logo) ? '#FFFFFF' : null} liveCount={inArchive ? 0 : liveCount} />
      <TintProvider color={tint}>
        {inArchive
          ? <ArchiveLeagueN key={seasonEff} C={C} fm={fm} sk={seasonEff} tint={tint} tabKey={tabKey} onTab={setTabKey} openRoute={openRoute} bottom={bottom} />
          : <TabsN C={C} tabs={tabs} index={idx} onIndex={(i) => setTabKey(tabs[i].key)} render={render} />}
      </TintProvider>
    </View>
  );
}

// la pagina vera si monta solo a tendina finita: durante lo scorrimento resta lo scheletro leggero (niente scatti, tocco subito preso)
const afterSlide = () => new Promise((res) => { setTimeout(res, 300); }); // solo timer: le animazioni continue (sfondo) tengono occupato InteractionManager e non scatterebbe mai
export default function Campionato({ C, top, onBack, bottom = 90, openRoute, params }) {
  const id = params && params.id ? decodeURIComponent(params.id) : null;
  const [st, setSt] = useState('load');
  const [info, setInfo] = useState(null);
  useEffect(() => {
    let live = true;
    setSt('load');
    (async () => {
      await bootShared();
      const isArch = /^fm-\d+$/.test(String(id));
      const idx = FM_ID[id] || isArch ? await archIndex() : null;
      const fm = FM_ID[id];
      const league = leagueById(id);
      if (!league) { if (live) setSt('err'); return; }
      const archS = (idx && fm && idx[String(fm)] && idx[String(fm)].s) || (isArch && idx && idx[String(league.fm)] && idx[String(league.fm)].s) || [];
      const fmId = fm || (isArch ? league.fm : null);
      const fsd = isArch && fmId && archS.length ? await firstSeasonWithData(fmId, sortSeasons(archS)) : null;
      if (isArch && fsd && !fsd.sk) { if (live) setSt('err'); return; }
      const curKey = (league.season || '').replace('/', '-');
      const past = sortSeasons((archS || []).filter((x) => x !== curKey && !(fsd && fsd.empty.includes(x))));
      resetSel(`lg-${fmId || league.id}`);
      await afterSlide();
      if (live) { setInfo({ league, fm: fmId, past, fsd }); setSt('ok'); }
    })().catch(() => { if (live) setSt('err'); });
    return () => { live = false; };
  }, [id]);
  useEffect(() => { if (st === 'err') onBack && onBack(); }, [st]); // eslint-disable-line react-hooks/exhaustive-deps
  if (st !== 'ok' || !info) return <Skel C={C} top={top} onBack={onBack} />;
  return <Body C={C} top={top} onBack={onBack} bottom={bottom} openRoute={openRoute} {...info} />;
}
