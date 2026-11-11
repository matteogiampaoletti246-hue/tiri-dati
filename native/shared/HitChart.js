// Hit Rate a colonne (concept B): una colonna per partita, linea dorata, verde se supera la linea e rossa altrimenti.
// Tocco su colonna o avversario: la colonna risalta e le altre si scuriscono; secondo tocco sull'avversario: partita (scheda Formazioni).
// Swipe laterale dentro il grafico: una pagina per competizione (la scelta nel Calcolatore per prima).
import React, { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TeamCrest, CompLogo } from './ui';
import { TAB_MEM } from './tabMem';
import { pagerTouch } from './backGate';

const PLOT_H = 190;
const AXIS_W = 26;

export default function HitChart({ C, pages, line, under, statLabel, openRoute, headRight }) {
  const [sel, setSel] = useState(null); // 'pagina:indice'
  const [pg, setPg] = useState(0);
  const [W, setW] = useState(0);
  const ref = useRef(null);
  const list = (pages || []).filter((p) => p.values && p.values.length);
  if (!list.length) return null;
  const hasLine = Number.isFinite(line);
  const top = Math.max(...list.flatMap((p) => p.values), hasLine ? line : 0);
  const max = Math.max(4, Math.ceil(top + 0.5));
  const step = max > 14 ? 5 : max > 8 ? 2 : 1;
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  const yOf = (v) => (v / max) * PLOT_H;
  const hit = (v) => (under ? v < line : v > line);
  const cur = list[Math.min(pg, list.length - 1)];
  const hits = hasLine ? cur.values.filter(hit).length : 0;
  const goMatch = (m) => { if (!m || !m.matchId || !openRoute) return; TAB_MEM.set(String(m.matchId), 'lineups'); openRoute(`/match/${m.matchId}`); };
  const dim = sel != null;
  const onScroll = (e) => { if (W > 0) { const i = Math.round(e.nativeEvent.contentOffset.x / W); if (i !== pg) { setPg(i); setSel(null); } } };
  const release = () => { pagerTouch.value = 0; };
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 2, gap: 10 }}>
        <View style={{ flexShrink: 1 }}>
          <Text numberOfLines={1} style={{ color: C.ink, fontSize: 15, fontWeight: '800' }}>Hit rate · {statLabel}</Text>
          <Text numberOfLines={1} style={{ color: C.ink3, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>Ultime {cur.values.length} partite{hasLine ? ` · linea ${String(line).replace('.', ',')} · ${hits}/${cur.values.length}` : ''}</Text>
        </View>
        {headRight || null}
      </View>
      {list.length > 1 || cur.name ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 10 }}>
          {cur.logo ? <View style={{ width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.92)' }}><CompLogo uri={cur.logo} size={14} /></View> : null}
          <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 12, fontWeight: '800' }}>{cur.name}</Text>
          {list.length > 1 ? (
            <View style={{ flexDirection: 'row', gap: 5, marginLeft: 6 }}>
              {list.map((p, i) => <View key={p.key} style={{ width: i === pg ? 14 : 6, height: 6, borderRadius: 3, backgroundColor: i === pg ? C.accent : C.hair }} />)}
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: AXIS_W, height: PLOT_H }}>
          {ticks.map((v) => <Text key={v} style={{ position: 'absolute', right: 6, bottom: yOf(v) - 7, color: C.ink3, fontSize: 10.5, fontVariant: ['tabular-nums'] }}>{v}</Text>)}
        </View>
        <View style={{ flex: 1 }} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
          {ticks.map((v) => <View key={v} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: PLOT_H - yOf(v), height: 1, backgroundColor: C.hair }} />)}
          {W > 0 ? (
            <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} bounces={list.length > 1} scrollEnabled={list.length > 1} onScroll={onScroll} scrollEventThrottle={16}
              onTouchStart={() => { pagerTouch.value = 1; }} onTouchEnd={release} onTouchCancel={release} onScrollEndDrag={release} onMomentumScrollEnd={release}
              style={{ overflow: 'visible' }}>
              {list.map((p, pi) => {
                const n = p.values.length;
                const itemW = Math.floor(W / Math.max(n, 5));
                const barW = Math.min(34, itemW - 12);
                return (
                  <View key={p.key} style={{ width: W }}>
                    <Pressable onPress={() => setSel(null)} style={{ height: PLOT_H, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {p.values.map((v, i) => {
                        const ok = hasLine ? hit(v) : true;
                        const c1 = ok ? C.good : C.bad;
                        const on = sel === `${pi}:${i}`;
                        return (
                          <Pressable key={i} onPress={() => setSel((c) => (c === `${pi}:${i}` ? null : `${pi}:${i}`))} style={{ width: itemW, height: PLOT_H, alignItems: 'center', justifyContent: 'flex-end', opacity: dim && !on ? 0.28 : 1 }}>
                            <Text style={{ color: c1, fontSize: on ? 17 : 14, fontWeight: '800', marginBottom: 4 }}>{v}</Text>
                            <View style={{ width: on ? barW + 4 : barW, height: Math.max(3, yOf(v)), borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, shadowColor: c1, shadowOpacity: on ? 0.95 : 0.5, shadowRadius: on ? 16 : 10, shadowOffset: { width: 0, height: 0 }, borderWidth: on ? 1.5 : 0, borderColor: '#FFFFFF88' }}>
                              <LinearGradient colors={[c1, `${c1}AA`]} style={{ flex: 1, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
                            </View>
                          </Pressable>
                        );
                      })}
                    </Pressable>
                    {p.games ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                        {p.values.map((_, i) => {
                          const m = p.games[i] || null;
                          const on = sel === `${pi}:${i}`;
                          return (
                            <Pressable key={i} onPress={() => (on ? goMatch(m) : setSel(`${pi}:${i}`))} disabled={!m} style={{ width: itemW, alignItems: 'center', gap: 3, opacity: dim && !on ? 0.28 : 1 }}>
                              {m && m.team ? <TeamCrest team={m.team} size={on ? 24 : 20} C={C} /> : null}
                              {m ? <Text numberOfLines={2} style={{ color: on ? C.ink : C.ink2, fontSize: 9.5, fontWeight: on ? '800' : '600', textAlign: 'center', lineHeight: 11 }}>vs {m.opp}</Text> : null}
                              {on && m && m.matchId ? <Text style={{ color: C.accent, fontSize: 9, fontWeight: '800', marginTop: 1 }}>Partita ›</Text> : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          ) : null}
          {hasLine ? (
            <>
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: PLOT_H - yOf(line) - 1, height: 2, backgroundColor: C.gold, shadowColor: C.gold, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }} />
              <View pointerEvents="none" style={{ position: 'absolute', left: -30, top: PLOT_H - yOf(line) - 9, height: 18, minWidth: 26, paddingHorizontal: 5, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: C.gold }}><Text style={{ color: '#2b2000', fontSize: 10, fontWeight: '900' }}>{String(line).replace('.', ',')}</Text></View>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}
