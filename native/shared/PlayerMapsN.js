// Mappe del campo del giocatore (nativo): Tiri, Tiri in porta, Falli commessi, Falli subiti, tutte le partite sommate.
// Si scorre di lato tra una mappa e l'altra; il giocatore attacca sempre verso destra. Dati: `@/data/playerMaps`.
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Svg, { Rect, Line, Circle } from 'react-native-svg';
import { Panel } from './ui';
import { shown } from '@/lib/tint';

const PITCH = '#1c5a38';
const LINE = 'rgba(255,255,255,.55)';
const RING = 'rgba(255,255,255,.95)';
const PAD = 2;

function Pitch({ pts, color, goals }) {
  const dot = pts.length > 250 ? 0.8 : pts.length > 80 ? 1.05 : 1.4;
  const op = pts.length > 250 ? 0.45 : pts.length > 80 ? 0.6 : 0.8;
  return (
    <Svg width="100%" viewBox={`${-PAD} ${-PAD} ${105 + PAD * 2} ${68 + PAD * 2}`} style={{ aspectRatio: (105 + PAD * 2) / (68 + PAD * 2) }}>
      <Rect x={-PAD} y={-PAD} width={105 + PAD * 2} height={68 + PAD * 2} fill={PITCH} />
      <Rect x={0} y={0} width={105} height={68} fill="none" stroke={LINE} strokeWidth={0.4} />
      <Line x1={52.5} y1={0} x2={52.5} y2={68} stroke={LINE} strokeWidth={0.4} />
      <Circle cx={52.5} cy={34} r={9.15} fill="none" stroke={LINE} strokeWidth={0.4} />
      <Rect x={0} y={13.84} width={16.5} height={40.32} fill="none" stroke={LINE} strokeWidth={0.4} />
      <Rect x={0} y={24.84} width={5.5} height={18.32} fill="none" stroke={LINE} strokeWidth={0.4} />
      <Rect x={88.5} y={13.84} width={16.5} height={40.32} fill="none" stroke={LINE} strokeWidth={0.4} />
      <Rect x={99.5} y={24.84} width={5.5} height={18.32} fill="none" stroke={LINE} strokeWidth={0.4} />
      {pts.map((p, i) => <Circle key={i} cx={Math.max(0.5, Math.min(104.5, p[0]))} cy={Math.max(0.5, Math.min(67.5, p[1]))} r={dot} fill={color} fillOpacity={op} />)}
      {goals ? pts.filter((p) => p[2] === 1).map((p, i) => <Circle key={`g${i}`} cx={Math.max(0.5, Math.min(104.5, p[0]))} cy={Math.max(0.5, Math.min(67.5, p[1]))} r={dot + 0.7} fill={color} stroke={RING} strokeWidth={0.45} />) : null}
    </Svg>
  );
}

export default function PlayerMapsN({ C, maps, color }) {
  const pages = maps ? [['Tiri', maps.tiri, true], ['Tiri in porta', maps.porta, true], ['Falli commessi', maps.fc, false], ['Falli subiti', maps.fs, false]].filter((x) => x[1].length) : [];
  const [w, setW] = useState(0);
  const [i, setI] = useState(0);
  if (maps === undefined) return <View style={{ marginHorizontal: 20, marginTop: 16, height: 250, borderRadius: 22, backgroundColor: C.skBase }} />;
  if (!pages.length) return null;
  const col = shown(color || '#ffffff', 70);
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      <Panel C={C} tint={color}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ color: C.ink, fontSize: 15, fontWeight: '800' }}>{pages[Math.min(i, pages.length - 1)][0]}</Text>
          <Text style={{ color: C.ink3, fontSize: 12 }}>{pages[Math.min(i, pages.length - 1)][1].length}</Text>
        </View>
        {w ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} nestedScrollEnabled onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / (w - 2)))} style={{ width: w - 2 }}>
            {pages.map(([name, pts, g]) => (
              <View key={name} style={{ width: w - 2, paddingHorizontal: 10 }}><Pitch pts={pts} color={col} goals={g} /></View>
            ))}
          </ScrollView>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 }}>
          {pages.map((x, k) => <View key={x[0]} style={{ width: k === i ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: k === i ? col : C.border }} />)}
        </View>
      </Panel>
    </View>
  );
}
