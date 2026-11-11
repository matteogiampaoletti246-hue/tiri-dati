// Statistiche della partita (nativo): confronto a barre per periodo e mappa tiri. Partite non iniziate: vedi PartitaPre.
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Panel, PanelTitle, Segmented, TeamCrest } from '../shared/ui';
import CompareBars from '../shared/CompareBars';
import ShotMap from '../shared/ShotMap';
import { matchColors } from '@/lib/tint';
import { comma, num } from '@/lib/format';
import StatistichePre from './PartitaPre';

const LIVE_STATS = [
  { key: 'possesso', label: 'Possesso', format: (v) => `${comma(v, 0)}%` },
  { key: 'xg', label: 'xG', format: (v) => comma(v, 2) },
  { key: 'tiri', label: 'Tiri' },
  { key: 'tiriInPorta', label: 'Tiri in porta' },
  { key: 'occasioni', label: 'Occasioni nitide' },
  { key: 'corner', label: 'Corner' },
  { key: 'falli', label: 'Falli' },
  { key: 'cartellini', label: 'Cartellini' },
  { key: 'passaggi', label: 'Passaggi' },
  { key: 'fuorigioco', label: 'Fuorigioco' },
];

// la scheda compare solo se c'e' qualcosa da mostrare
export function hasPlayedStats(view) {
  const periods = view.statPeriods;
  const stats = view.stats || {};
  return !!((periods && (periods.all || Object.keys(periods).length)) || LIVE_STATS.some((s) => stats[s.key]) || (view.shots || []).length);
}

export default function Statistiche({ C, match, view, home, away, pre, openRoute }) {
  if (pre) return <StatistichePre C={C} match={match} home={home} away={away} openRoute={openRoute} />;
  const [period, setPeriod] = useState('all');
  const [hcol, acol] = matchColors(home, away);
  const periods = view.statPeriods;
  const groups = periods ? periods[period] || periods.all : null;
  const per = { all: null, first: 'FirstHalf', second: 'SecondHalf' }[period];
  const shots = (view.shots || []).filter((s) => !per || s.period === per).sort((a, b) => a.min - b.min);
  const stats = view.stats || {};
  const fallback = LIVE_STATS.filter((s) => stats[s.key]).map((s) => ({ label: s.label, home: stats[s.key][0], away: stats[s.key][1], format: s.format || num }));
  const rowsOf = (g) => g.rows.map((r) => ({ label: r.label, home: r.home, away: r.away, homeText: r.homeText, awayText: r.awayText }));
  const Card = ({ title, children }) => <Panel C={C} style={{ marginHorizontal: 16, padding: 16 }}>{title ? <PanelTitle C={C}>{title}</PanelTitle> : null}{children}</Panel>;
  if (!groups && !fallback.length && !(view.shots || []).length) return null;
  return (
    <View style={{ gap: 20, paddingTop: 12, paddingBottom: 16 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <Segmented C={C} liquid value={period} onChange={setPeriod} options={[{ value: 'all', label: 'Totale' }, { value: 'first', label: '1° tempo' }, { value: 'second', label: '2° tempo' }]} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8 }}>
        <Pressable onPress={() => home && openRoute('/squadra/' + home.id)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}><TeamCrest team={home} size={20} C={C} /><Text numberOfLines={1} style={{ color: C.ink, fontSize: 12.5, fontWeight: '600', flexShrink: 1 }}>{home ? home.name : ''}</Text></Pressable>
        <Pressable onPress={() => away && openRoute('/squadra/' + away.id)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}><Text numberOfLines={1} style={{ color: C.ink, fontSize: 12.5, fontWeight: '600', flexShrink: 1 }}>{away ? away.name : ''}</Text><TeamCrest team={away} size={20} C={C} /></Pressable>
      </View>
      {groups ? groups.slice(0, 1).map((g) => <Card key={g.key} title={g.title}><CompareBars C={C} homeColor={hcol} awayColor={acol} rows={rowsOf(g)} /></Card>)
        : fallback.length ? <Card><CompareBars C={C} homeColor={hcol} awayColor={acol} rows={fallback} /></Card> : null}
      {(view.shots || []).length ? <Card title="Mappa tiri"><ShotMap C={C} shots={shots} home={home} away={away} match={match} openRoute={openRoute} /></Card> : null}
      {groups ? groups.slice(1).map((g) => <Card key={g.key} title={g.title}><CompareBars C={C} homeColor={hcol} awayColor={acol} rows={rowsOf(g)} /></Card>) : null}
    </View>
  );
}
