// Classifica arbitri (nativa): la statistica scelta ordina la lista e la sua colonna e' evidenziata (RefereesView del sito).
// `base`: [{ id, name, country, n, y, r, fo, pen }] medie a partita. `to`: percorso della scheda arbitro (null = riga non toccabile).
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Segmented } from './ui';
import PaneN from './PaneN';
import { refereesOf } from '@/data/referees';
import { comma } from '@/lib/format';

const METRICS = [
  { key: 'y', label: 'Gialli', f: 'y', d: 1 },
  { key: 'r', label: 'Rossi', f: 'r', d: 2 },
  { key: 'fo', label: 'Falli', f: 'fo', d: 1 },
  { key: 'pen', label: 'Rigori', f: 'pen', d: 2 },
  { key: 'n', label: 'Partite', f: 'n', d: 0 },
];

// arbitri del campionato attuale, con i dati del campionato (non di tutte le competizioni)
export const leagueReferees = (leagueId) => refereesOf(leagueId)
  .map((r) => {
    const b = (r.by && r.by[leagueId]) || { n: r.games, y: r.yellowsAvg, r: r.redsAvg, fo: r.foulsAvg, pen: r.penaltiesAvg };
    return { id: r.id, name: r.name, country: r.country, n: b.n || 0, y: b.y || 0, r: b.r || 0, fo: b.fo || 0, pen: b.pen || 0 };
  })
  .filter((r) => r.n > 0);

export default function RefereesN({ C, base, to = null, openRoute, bottom }) {
  const [mode, setMode] = useState('avg');
  const [sel, setSel] = useState('y');
  const cur = METRICS.find((m) => m.key === sel);
  const val = (r, m) => (m.key === 'n' ? r.n : mode === 'avg' ? r[m.f] : Math.round(r[m.f] * r.n));
  const fmt = (v, m) => (m.key === 'n' || mode === 'tot' ? String(v) : comma(v, m.d));
  const rows = useMemo(() => [...base].sort((a, b) => val(b, cur) - val(a, cur) || b.n - a.n || a.name.localeCompare(b.name)), [base, mode, sel]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!base.length) return null;
  return (
    <PaneN bottom={bottom}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Segmented C={C} options={[{ value: 'avg', label: 'A partita' }, { value: 'tot', label: 'Totale' }]} value={mode} onChange={setMode} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 20 }}>
        {METRICS.map((m) => (
          <Pressable key={m.key} onPress={() => setSel(m.key)} style={{ paddingBottom: 6 }}>
            <Text style={{ fontSize: 13.5, fontWeight: m.key === sel ? '800' : '500', color: m.key === sel ? C.ink : C.ink3 }}>{m.label}</Text>
            {m.key === sel ? <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2.5, borderRadius: 2, backgroundColor: C.accent }} /> : null}
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
        <View style={{ width: 20 }} />
        <Text style={{ flex: 1, color: C.ink3, fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>Arbitro</Text>
        {METRICS.map((m) => (
          <Pressable key={m.key} onPress={() => setSel(m.key)} style={{ width: 40 }}>
            <Text style={{ textAlign: 'right', color: m.key === sel ? C.accent : C.ink3, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      {rows.map((r, i) => (
        <Pressable key={r.id} disabled={!to} onPress={() => to && openRoute && openRoute(to(r))} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.hair }, pressed && { opacity: 0.6 }]}>
          <Text style={{ width: 20, color: C.ink3, fontSize: 11.5, fontVariant: ['tabular-nums'] }}>{i + 1}</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: C.ink, fontSize: 12.5, fontWeight: '600' }}>{r.name}</Text>
            {r.country ? <Text numberOfLines={1} style={{ color: C.ink3, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' }}>{r.country}</Text> : null}
          </View>
          {METRICS.map((m) => (
            <Text key={m.key} style={{ width: 40, textAlign: 'right', fontVariant: ['tabular-nums'], color: m.key === sel ? C.accent : C.ink3, fontSize: m.key === sel ? 13.5 : 11.5, fontWeight: m.key === sel ? '800' : '400' }}>{fmt(val(r, m), m)}</Text>
          ))}
        </Pressable>
      ))}
    </PaneN>
  );
}
