// Pagina Partita nativa: preparazione dati (prepareMatch, aggiornamento live e finestra formazioni), testata, schede.
// Ogni scheda senza dati non si mostra. Le schede stanno in PartitaPanels.js (si portano una alla volta).
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import './../shared/shim';
import { bootShared } from '../shared/boot';
import { resetSel } from '../shared/hooks';
import PartitaHero from './PartitaHero';
import { useSharedValue } from 'react-native-reanimated';
import { TabBarN } from '../shared/TabsN';
import SwipeBodyN from '../shared/SwipeBodyN';
import { TintProvider } from '../shared/ui';
import { PANELS, hasPanel } from './PartitaPanels';
import { matchById, viewMatch } from '@/data/matches';
import { prepareMatch, prepareMatchCore, isReady } from '@/data/prepare';
import { lineupBeat, lineupWindowMs, lineupIsOfficial } from '@/data/lineupWindow';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';
import { matchTint } from '@/data/matchTint';
import { FM_ID, currentSeason, loadSeason } from '@/data/archive';
import { isPureCup, loadBracket } from '@/data/bracket';
import useAsync from '@/hooks/useAsync';

const PRE_TABS = [['overview', 'Panoramica'], ['stats', 'Statistiche'], ['lineups', 'Formazioni'], ['rel', 'Affidabilità'], ['standings', 'Classifica']];
const PLAYED_TABS = [['summary', 'Riepilogo'], ['stats', 'Statistiche'], ['lineups', 'Formazioni'], ['standings', 'Classifica']];

// scheletro con la forma della pagina (testata, tab, riquadri)
function Skel({ C }) {
  const b = (h, w, r = 20) => <View style={{ height: h, width: w || '100%', borderRadius: r, backgroundColor: C.skBase, marginBottom: 14 }} />;
  return <View style={{ paddingHorizontal: 16, paddingTop: 52 }}>{b(150, null, 28)}{b(40)}{b(160, null, 24)}{b(160, null, 24)}</View>;
}

const TAB_MEM = new Map(); // scheda scelta per partita, finche' la pagina e' nella pila

export default function Partita({ C, top, onBack, bottom = 90, openRoute, params }) {
  const id = params.id;
  const [ok, setOk] = useState(false);
  const [, bump] = useState(0);
  const [tab, setTab] = useState(() => TAB_MEM.get(id) || '');
  useEffect(() => {
    let on = true;
    resetSel(id);
    setOk(false);
    (async () => {
      await bootShared();
      if (on) bump((n) => n + 1); // dati condivisi pronti: la testata compare subito, prima delle schede
      const cap = setTimeout(() => on && setOk(true), 2500); // max 2,5 s: la pagina compare comunque
      await prepareMatchCore(id); // appena pronti i dati principali la pagina si apre; meteo, arbitro e rose arrivano subito dopo
      clearTimeout(cap);
      if (on) { setOk(true); bump((n) => n + 1); }
      await prepareMatch(id);
      if (on) bump((n) => n + 1);
    })().catch(() => on && setOk(true));
    // live: ogni 5 s; prima del fischio solo dentro la finestra delle formazioni
    let n = 0;
    let busy = false;
    const t = setInterval(() => {
      // fermo con l'app in background e per qualche secondo dopo il ritorno: l'app deve prima tornare a rispondere al tocco; mai due richieste insieme
      if (AppState.currentState !== 'active' || Date.now() < (globalThis.__resumeUntil || 0) || busy) return;
      n += 1;
      const beat = lineupBeat(matchById(id));
      if (beat && n % beat === 0) { busy = true; prepareMatch(id, true).then(() => on && bump((x) => x + 1)).catch(() => {}).finally(() => { busy = false; }); }
    }, 5000);
    return () => { on = false; clearInterval(t); };
  }, [id]);

  const pos = useSharedValue(0);
  const rawNow = matchById(id);
  // coppa o campionato: lo dicono i dati della competizione (tabellone senza classifica = coppa), non un elenco fisso
  const fmKey = rawNow ? (rawNow.archive ? rawNow.archive.fm : FM_ID[rawNow.leagueId]) : null;
  const skKey = rawNow && rawNow.archive ? rawNow.archive.sk : null;
  const { data: compInfo } = useAsync(async () => {
    if (!fmKey) return null;
    const sk = skKey || await currentSeason(fmKey);
    if (!sk) return null;
    const [b, se] = await Promise.all([loadBracket(fmKey, sk).catch(() => null), loadSeason(fmKey, sk).catch(() => null)]);
    return { bracket: !!(b && b.rounds && b.rounds.length), table: !!(se && (se.table || (se.groups && se.groups.length))) };
  }, [fmKey, skKey]);
  const early = !ok && !!(rawNow && rawNow.homeId && rawNow.awayId); // la testata (squadre, risultato, stato) c'e' gia' dalla Home: si mostra subito, le schede arrivano dopo
  const raw = ok || early ? rawNow : null;
  // coppe e partite d'archivio: stesse regole del sito
  useEffect(() => { if (ok && !raw) onBack && onBack(); }, [ok, raw]);
  if (early) {
    return (
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView style={{ paddingTop: top }} contentContainerStyle={{ paddingBottom: bottom + 20 }} showsVerticalScrollIndicator={false} scrollEnabled={false}>
          <PartitaHero C={C} match={raw} view={viewMatch(raw)} league={leagueById(raw.leagueId) || raw.leagueObj || null} home={teamById(raw.homeId)} away={teamById(raw.awayId)} onBack={onBack} openRoute={openRoute} />
          <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
            {[40, 160, 160].map((h, k) => <View key={k} style={{ height: h, borderRadius: k ? 24 : 20, backgroundColor: C.skBase, marginBottom: 14 }} />)}
          </View>
        </ScrollView>
      </View>
    );
  }
  if (!raw) return <View style={{ flex: 1, backgroundColor: 'transparent', paddingTop: top }}><Pressable onPress={onBack} hitSlop={12} style={{ paddingHorizontal: 20, height: 44, justifyContent: 'center' }}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable><Skel C={C} /></View>;
  const view = viewMatch(raw);
  const home = teamById(raw.homeId);
  const away = teamById(raw.awayId);
  const league = leagueById(raw.leagueId) || raw.leagueObj || null;
  const pre = raw.status === 'scheduled';
  const fmCup = raw.archive ? raw.archive.fm : FM_ID[raw.leagueId];
  const cup = !!(fmCup && (compInfo ? compInfo.bracket && !compInfo.table : isPureCup(fmCup)));
  const tabs = (pre ? PRE_TABS : PLAYED_TABS)
    .map(([k, l]) => [k, k === 'standings' && cup ? 'Tabellone' : l])
    .filter(([k]) => hasPanel(k, raw, view, home, away, pre, cup));
  const cur = tabs.some((t) => t[0] === tab) ? tab : (tabs[0] ? tabs[0][0] : '');
  const idx = Math.max(0, tabs.findIndex((t) => t[0] === cur));
  const tabsN = tabs.map(([k, l]) => ({ key: k, label: l }));
  const homeC = league ? matchTint(league.id, league) : (home && home.colors ? home.colors[0] : null);
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView style={{ paddingTop: top }} contentContainerStyle={{ paddingBottom: bottom + 20 }} showsVerticalScrollIndicator={false}>
        <PartitaHero C={C} match={raw} view={view} league={league} home={home} away={away} onBack={onBack} openRoute={openRoute} />
        <TabBarN C={C} tabs={tabsN} x={pos} onIndex={(i) => { TAB_MEM.set(id, tabs[i][0]); setTab(tabs[i][0]); }} />
        <TintProvider color={homeC}>
          <SwipeBodyN index={idx} count={tabs.length} pos={pos} onIndex={(i) => { TAB_MEM.set(id, tabs[i][0]); setTab(tabs[i][0]); }}
            render={(i) => { const P = PANELS[tabs[i][0]]; return P ? <P C={C} match={raw} view={view} home={home} away={away} pre={pre} cup={cup} openRoute={openRoute} /> : null; }} />
        </TintProvider>
      </ScrollView>
    </View>
  );
}
