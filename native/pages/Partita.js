// Pagina Partita nativa: preparazione dati (prepareMatch, aggiornamento live e finestra formazioni), testata, schede.
// Ogni scheda senza dati non si mostra. Le schede stanno in PartitaPanels.js (si portano una alla volta).
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import './../shared/shim';
import { bootShared } from '../shared/boot';
import { resetSel } from '../shared/hooks';
import PartitaHero from './PartitaHero';
import { PANELS, hasPanel } from './PartitaPanels';
import { matchById, viewMatch } from '@/data/matches';
import { prepareMatch, isReady } from '@/data/prepare';
import { lineupBeat, lineupWindowMs, lineupIsOfficial } from '@/data/lineupWindow';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';
import { isPureCup } from '@/data/bracket';

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
      const cap = setTimeout(() => on && setOk(true), 7000); // max 7 s: la pagina compare comunque
      await prepareMatch(id);
      clearTimeout(cap);
      if (on) { setOk(true); bump((n) => n + 1); }
    })().catch(() => on && setOk(true));
    // live: ogni 5 s; prima del fischio solo dentro la finestra delle formazioni
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      const beat = lineupBeat(matchById(id));
      if (beat && n % beat === 0) prepareMatch(id, true).then(() => on && bump((x) => x + 1));
    }, 5000);
    return () => { on = false; clearInterval(t); };
  }, [id]);

  const raw = ok ? matchById(id) : null;
  // coppe e partite d'archivio: stesse regole del sito
  useEffect(() => { if (ok && !raw) onBack && onBack(); }, [ok, raw]);
  if (!raw) return <View style={{ flex: 1, backgroundColor: 'transparent', paddingTop: top }}><Pressable onPress={onBack} hitSlop={12} style={{ paddingHorizontal: 20, height: 44, justifyContent: 'center' }}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable><Skel C={C} /></View>;
  const view = viewMatch(raw);
  const home = teamById(raw.homeId);
  const away = teamById(raw.awayId);
  const league = leagueById(raw.leagueId) || raw.leagueObj || null;
  const pre = raw.status === 'scheduled';
  const cup = !!(raw.archive && isPureCup(raw.archive.fm));
  const tabs = (pre ? PRE_TABS : PLAYED_TABS)
    .map(([k, l]) => [k, k === 'standings' && cup ? 'Tabellone' : l])
    .filter(([k]) => hasPanel(k, raw, view, home, away, pre, cup));
  const cur = tabs.some((t) => t[0] === tab) ? tab : (tabs[0] ? tabs[0][0] : '');
  const Panel = PANELS[cur];
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ paddingTop: top, paddingBottom: bottom + 20 }} showsVerticalScrollIndicator={false}>
        <PartitaHero C={C} match={raw} view={view} league={league} home={home} away={away} onBack={onBack} openRoute={openRoute} />
        <View style={{ flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
          {tabs.map(([k, l]) => (
            <Pressable key={k} onPress={() => { TAB_MEM.set(id, k); setTab(k); }} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: cur === k ? C.accent : 'transparent' }}>
              <Text numberOfLines={1} style={{ color: cur === k ? C.accent : C.ink3, fontSize: 12.5, fontWeight: cur === k ? '800' : '500' }}>{l}</Text>
            </Pressable>
          ))}
        </View>
        {Panel ? <Panel key={cur} C={C} match={raw} view={view} home={home} away={away} pre={pre} cup={cup} openRoute={openRoute} /> : null}
      </ScrollView>
    </View>
  );
}
