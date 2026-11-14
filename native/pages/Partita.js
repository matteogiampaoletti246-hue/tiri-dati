// Pagina Partita nativa: preparazione dati (prepareMatch, aggiornamento live e finestra formazioni), testata, schede.
// Ogni scheda senza dati non si mostra. Le schede stanno in PartitaPanels.js (si portano una alla volta).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, AppState } from 'react-native';
import { onResumeCalm, justResumed } from '../shared/resume';
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
import { parseArchiveId, buildArchiveShell } from '@/data/archiveMatch';
import { peekFeedRow } from '@/data/feedRows';
import META from '../meta.json';
import { lineupBeat, lineupWindowMs, lineupIsOfficial } from '@/data/lineupWindow';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';
import { matchTint } from '@/data/matchTint';
import { FM_ID, currentSeason, loadSeason } from '@/data/archive';
import { isPureCup, loadBracket } from '@/data/bracket';
import useAsync from '@/hooks/useAsync';

const PRE_TABS = [['overview', 'Panoramica'], ['stats', 'Statistiche'], ['lineups', 'Formazioni'], ['rel', 'Affidabilità'], ['standings', 'Classifica']];
const PLAYED_TABS = [['summary', 'Riepilogo'], ['stats', 'Statistiche'], ['lineups', 'Formazioni'], ['standings', 'Classifica']];

// Testata istantanea: dalla riga della Home (squadre, campionato, orario, risultato), senza aspettare i dati condivisi (primo avvio dell'app: erano 2-5 s di scheletro nudo)
const HM = (() => { try { return new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }); } catch (e) { return null; } })();
const initials = (n) => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
function quickOf(id) {
  const a = parseArchiveId(id);
  const x = /^x-\d+-(\d+)$/.exec(String(id));
  const mid = a ? a.mid : x ? x[1] : null;
  const r = mid ? peekFeedRow(mid) : null;
  if (!r || !r[3] || !r[4]) return null;
  const nm = (tid, n) => (META.names || {})[String(tid)] || n;
  const team = (tid, n) => ({ id: `fm-${tid}`, name: nm(tid, n), initials: initials(nm(tid, n)), crest: `https://images.fotmob.com/image_resources/logo/teamlogo/${tid}.png`, colors: null });
  const c = (META.comps || {})[String(r[1])];
  const league = c ? { id: c.id, name: c.name, tint: c.tint, logo: c.logo, logoDark: c.logo ? c.logo.replace('/leaguelogo/', '/leaguelogo/dark/') : null, country: c.country } : null;
  const sc = /(\d+)\s*-\s*(\d+)/.exec(r[7] || '');
  const status = r[8] === 'l' ? 'live' : r[8] === 'f' ? 'finished' : 'scheduled';
  const ts = Date.parse(r[2]);
  const view = { score: sc ? [Number(sc[1]), Number(sc[2])] : null, events: [], minute: /^\d+(\+\d+)?$/.test(r[10] || '') ? r[10] : null, liveHalf: /^HT$/i.test(r[10] || '') };
  const match = { id, ts, status, kickoff: HM ? HM.format(new Date(ts)) : '', homeId: `fm-${r[3]}`, awayId: `fm-${r[4]}`, formOf: () => [], leagueId: league ? league.id : null };
  return { match, view, league, home: team(r[3], r[5]), away: team(r[4], r[6]) };
}

// scheletro con la forma della pagina (testata, tab, riquadri)
function Skel({ C }) {
  const b = (h, w, r = 20) => <View style={{ height: h, width: w || '100%', borderRadius: r, backgroundColor: C.skBase, marginBottom: 14 }} />;
  return <View style={{ paddingHorizontal: 16, paddingTop: 52 }}>{b(150, null, 28)}{b(40)}{b(160, null, 24)}{b(160, null, 24)}</View>;
}

import { TAB_MEM } from '../shared/tabMem'; // scheda scelta per partita, finche' la pagina e' nella pila

export default function Partita({ C, top, onBack, bottom = 90, openRoute, params }) {
  const id = params.id;
  const [ok, setOk] = useState(false);
  const [fin, setFin] = useState(false); // preparazione finita (anche male): solo allora, senza partita, si torna indietro
  const [, bump] = useState(0);
  const [tab, setTab] = useState(() => TAB_MEM.get(id) || '');
  useEffect(() => {
    let on = true;
    resetSel(id);
    setOk(false);
    setFin(false);
    // il tempo del solo scheletro parte dall'apertura (non dopo i dati condivisi): al massimo 2,5 s, poi la pagina compare con cio' che c'e'
    const cap = setTimeout(() => on && setOk(true), 2500);
    (async () => {
      await bootShared();
      if (on) bump((n) => n + 1); // dati condivisi pronti: la testata compare subito, prima delle schede
      const core = prepareMatchCore(id); // parte subito e in parallelo alla testata
      const arch = parseArchiveId(id);
      // partite d'archivio (id a-...): la testata (squadre, data, risultato) si costruisce dal solo calendario, senza i dettagli pesanti
      if (arch) buildArchiveShell(arch.fm, arch.sk, arch.mid).then(() => on && bump((n) => n + 1)).catch(() => {});
      await core; // appena pronti i dati principali la pagina si apre; meteo, arbitro e rose arrivano subito dopo
      clearTimeout(cap);
      if (on) { setOk(true); setFin(true); bump((n) => n + 1); }
      await prepareMatch(id);
      if (on) bump((n) => n + 1);
    })().catch(() => { clearTimeout(cap); if (on) { setOk(true); setFin(true); } });
    // live: ogni 3 s (anche prima del fischio dentro la finestra formazioni; fuori finestra ogni 30-60 s); al ritorno dal background un giro parte subito
    let n = 0;
    let busy = false;
    const run = (force) => {
      if (AppState.currentState !== 'active' || justResumed() || busy) return;
      n += 1;
      const beat = lineupBeat(matchById(id));
      const every = beat <= 1 ? 1 : Math.round((beat * 5) / 3);
      if (beat && (force || n % every === 0)) { busy = true; prepareMatch(id, true).then(() => on && bump((x) => x + 1)).catch(() => {}).finally(() => { busy = false; }); }
    };
    const t = setInterval(() => run(false), 3000);
    const sub = { remove: onResumeCalm(() => run(true)) };
    return () => { on = false; clearTimeout(cap); clearInterval(t); sub.remove(); };
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
  const quick = useMemo(() => (raw ? null : quickOf(id)), [id, !!raw]); // eslint-disable-line react-hooks/exhaustive-deps
  // coppe e partite d'archivio: stesse regole del sito
  useEffect(() => { if (fin && !matchById(id)) onBack && onBack(); }, [fin, raw]);
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
  if (!raw && quick) {
    return (
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView style={{ paddingTop: top }} contentContainerStyle={{ paddingBottom: bottom + 20 }} showsVerticalScrollIndicator={false} scrollEnabled={false}>
          <PartitaHero C={C} match={quick.match} view={quick.view} league={quick.league} home={quick.home} away={quick.away} onBack={onBack} openRoute={openRoute} />
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
