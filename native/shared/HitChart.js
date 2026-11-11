// Hit Rate a colonne (concept B): una colonna per partita, linea dorata, verde se supera la linea e rossa altrimenti.
// Tocco su colonna o avversario: la colonna risalta e le altre si scuriscono; secondo tocco sull'avversario: partita (scheda Formazioni).
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TeamCrest } from './ui';
import { TAB_MEM } from './tabMem';

const PLOT_H = 190;

export default function HitChart({ C, values, line, under, games, statLabel, openRoute }) {
  const [sel, setSel] = useState(null);
  const n = values.length;
  if (!n) return null;
  const hasLine = Number.isFinite(line);
  const top = Math.max(...values, hasLine ? line : 0);
  const max = Math.max(4, Math.ceil(top + 0.5));
  const step = max > 14 ? 5 : max > 8 ? 2 : 1;
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  const yOf = (v) => (v / max) * PLOT_H;
  const hit = (v) => (under ? v < line : v > line);
  const hits = hasLine ? values.filter(hit).length : 0;
  const g = (i) => (games && games[i]) || null;
  const pick = (i) => setSel((c) => (c === i ? null : i));
  const goMatch = (i) => { const m = g(i); if (!m || !m.matchId || !openRoute) return; TAB_MEM.set(String(m.matchId), 'lineups'); openRoute(`/match/${m.matchId}`); };
  const onLabel = (i) => { if (sel === i) goMatch(i); else setSel(i); };
  const dim = sel != null;
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 2 }}>
        <View>
          <Text style={{ color: C.ink, fontSize: 15, fontWeight: '800' }}>Hit rate · {statLabel}</Text>
          <Text style={{ color: C.ink3, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>Ultime {n} partite{hasLine ? ` · linea ${String(line).replace('.', ',')}` : ''}</Text>
        </View>
        {hasLine ? <View style={{ borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: `${C.good}22`, borderWidth: 1, borderColor: `${C.good}66` }}><Text style={{ color: C.good, fontSize: 13, fontWeight: '800' }}>{hits}/{n}</Text></View> : null}
      </View>
      <Pressable onPress={() => setSel(null)} style={{ flexDirection: 'row' }}>
        <View style={{ width: 26, height: PLOT_H }}>
          {ticks.map((v) => <Text key={v} style={{ position: 'absolute', right: 6, bottom: yOf(v) - 7, color: C.ink3, fontSize: 10.5, fontVariant: ['tabular-nums'] }}>{v}</Text>)}
        </View>
        <View style={{ flex: 1, height: PLOT_H }}>
          {ticks.map((v) => <View key={v} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: yOf(v), height: 1, backgroundColor: C.hair }} />)}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {values.map((v, i) => {
              const ok = hasLine ? hit(v) : true;
              const c1 = ok ? C.good : C.bad;
              const on = sel === i;
              return (
                <Pressable key={i} onPress={() => pick(i)} style={{ width: 44, height: PLOT_H, alignItems: 'center', justifyContent: 'flex-end', opacity: dim && !on ? 0.28 : 1 }}>
                  <Text style={{ color: c1, fontSize: on ? 17 : 14, fontWeight: '800', marginBottom: 4 }}>{v}</Text>
                  <View style={{ width: on ? 40 : 34, height: Math.max(3, yOf(v)), borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, shadowColor: c1, shadowOpacity: on ? 0.95 : 0.5, shadowRadius: on ? 16 : 10, shadowOffset: { width: 0, height: 0 }, borderWidth: on ? 1.5 : 0, borderColor: '#FFFFFF88' }}>
                    <LinearGradient colors={[c1, `${c1}AA`]} style={{ flex: 1, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
                  </View>
                </Pressable>
              );
            })}
          </View>
          {hasLine ? (
            <>
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: yOf(line) - 1, height: 2, backgroundColor: C.gold, shadowColor: C.gold, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }} />
              <View pointerEvents="none" style={{ position: 'absolute', left: -30, bottom: yOf(line) - 9, height: 18, minWidth: 26, paddingHorizontal: 5, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: C.gold }}><Text style={{ color: '#2b2000', fontSize: 10, fontWeight: '900' }}>{String(line).replace('.', ',')}</Text></View>
            </>
          ) : null}
        </View>
      </Pressable>
      {games ? (
        <View style={{ flexDirection: 'row', marginLeft: 26, marginTop: 10, justifyContent: 'space-around' }}>
          {values.map((_, i) => {
            const m = g(i);
            const on = sel === i;
            return (
              <Pressable key={i} onPress={() => onLabel(i)} disabled={!m} style={{ width: 62, alignItems: 'center', gap: 3, opacity: dim && !on ? 0.28 : 1 }}>
                {m && m.team ? <TeamCrest team={m.team} size={on ? 28 : 24} C={C} /> : null}
                {m ? <Text numberOfLines={2} style={{ color: on ? C.ink : C.ink2, fontSize: 10, fontWeight: on ? '800' : '600', textAlign: 'center', lineHeight: 11 }}>vs {m.opp}</Text> : null}
                {on && m && m.matchId ? <Text style={{ color: C.accent, fontSize: 9, fontWeight: '800', marginTop: 1 }}>Partita ›</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
