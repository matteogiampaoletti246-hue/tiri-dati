// Classifiche impilate (una per statistica) con podio, "Dal migliore / dal peggiore", "Mostra tutti" e il tasto "Vai a" (come StatLists del sito).
// sections: [{ id, group, title, rows: [{ id, to, left, name, sub, value, color, tc, bg }] }]. Occupa tutta la scheda: ha il suo scorrimento.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Animated as RNA, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing as REasing } from 'react-native-reanimated';
import { emitNearEnd } from './hooks';


// cambio tabella (Totale / Ogni 90'): i giocatori si sostituiscono con una semplice sfumatura, solo opacita' (thread UI, niente spostamenti)
function Anim({ tick, i, children, style }) {
  const t = useSharedValue(1);
  useEffect(() => {
    if (!tick) return;
    t.value = 0.15;
    t.value = withDelay(Math.min(i, 10) * 18, withTiming(1, { duration: 280, easing: REasing.out(REasing.quad) }));
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ opacity: t.value }));
  return <Animated.View style={[style, st]}>{children}</Animated.View>;
}

const sigOf = (secs) => secs.map((x) => `${x.id}:${x.rows.length}:${x.rows.slice(0, 12).map((r) => `${r.id}=${r.value}`).join(',')}`).join(';');
const okHex = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : null);

function Podium({ C, rows, rev, total, openRoute, tick }) {
  const pos = [1, 0, 2].filter((i) => rows[i]);
  const H = [74, 56, 44];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 4 }}>
      {pos.map((i) => {
        const r = rows[i];
        const c = C.medal[i];
        return (
          <Anim key={r.id} tick={tick} i={i} style={{ flex: 1, maxWidth: 118 }}><Pressable onPress={() => r.to && openRoute && openRoute(r.to)} style={{ alignItems: 'center' }}>
            <View style={{ marginBottom: 6, transform: [{ scale: i === 0 ? 1.25 : 1.05 }], marginTop: i === 0 ? 8 : 2 }}>{r.left}</View>
            <Text numberOfLines={1} style={{ color: C.ink, fontSize: 12, fontWeight: '700', textAlign: 'center', width: '100%' }}>{r.name}</Text>
            <Text style={{ color: C.ink, fontSize: 15, fontWeight: '800', marginTop: 2, fontVariant: ['tabular-nums'] }}>{r.value}</Text>
            <View style={{ marginTop: 6, width: '100%', height: H[i], alignItems: 'center', paddingTop: 6, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: `${c}2a`, borderWidth: 1, borderBottomWidth: 0, borderColor: `${c}77` }}>
              <Text style={{ color: c, fontSize: 18, fontWeight: '800' }}>{rev ? total - i : i + 1}</Text>
            </View>
          </Pressable></Anim>
        );
      })}
    </View>
  );
}

export default function StatListsN({ C, sections, header = null, limit = 8, podium = false, openRoute, bottom = 90, pending = false }) {
  const fade = useRef(new RNA.Value(1)).current;
  useEffect(() => {
    // cambio Totale/90': la lista si abbassa subito (driver nativo, anche col calcolo in corso) e torna piena a lavoro finito
    RNA.timing(fade, { toValue: pending ? 0.35 : 1, duration: pending ? 110 : 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps
  const sig = useMemo(() => sigOf(sections), [sections]);
  const hist = useRef({ cur: sections, sig, old: null, tick: 0 });
  // una lista ricalcolata con gli stessi dati (nuovo array, stessi giocatori e valori) non e' un cambio: niente dissolvenze ne' reset delle schede
  if (hist.current.cur !== sections && hist.current.sig === sig) hist.current.cur = sections;
  if (hist.current.cur !== sections) {
    hist.current.sig = sig;
    const m = {};
    hist.current.cur.forEach((x) => { m[x.id] = {}; x.rows.forEach((r, i) => { m[x.id][r.id] = i; }); });
    hist.current.old = m; hist.current.cur = sections; hist.current.tick += 1;
  }
  const { old: oldMaps, tick } = hist.current;
  const prevSec = useRef(sig);
  useEffect(() => { if (prevSec.current !== sig) { prevSec.current = sig; setLim(4); } }, [sig]);
  const sc = useRef(null);
  const base = useRef(0);
  const ys = useRef({});
  const [open, setOpen] = useState({});
  const [rev, setRev] = useState({});
  const [lim, setLim] = useState(4);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (lim >= sections.length) return undefined;
    const id = setTimeout(() => setLim((n) => n + 3), 160);
    return () => clearTimeout(id);
  }, [lim, sections.length]);
  const groups = [];
  sections.forEach((s) => {
    let g = groups.find((x) => x.name === s.group);
    if (!g) groups.push((g = { name: s.group, items: [] }));
    g.items.push(s);
  });
  const go = (id) => {
    setMenu(false);
    setLim(sections.length);
    setTimeout(() => { const y = ys.current[id]; if (y != null && sc.current) sc.current.scrollTo({ y: base.current + y - 8, animated: true }); }, 120);
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView ref={sc} scrollEventThrottle={120} onScroll={(e) => { const { contentOffset: o, contentSize: c, layoutMeasurement: l } = e.nativeEvent; if (o.y + l.height > c.height - 600) emitNearEnd(); }} contentContainerStyle={{ paddingBottom: bottom + 70 }}>
        {header}
        <RNA.View style={{ opacity: fade }} onLayout={(e) => { base.current = e.nativeEvent.layout.y; }}>
          {sections.slice(0, lim).map((s) => {
            const all = !!open[s.id];
            const r0 = !!rev[s.id];
            const ordered = r0 ? [...s.rows].reverse() : s.rows;
            const pod = podium && ordered.length >= 3;
            const rest = pod ? ordered.slice(3) : ordered;
            const cap = pod ? limit - 3 : limit;
            const rows = all ? rest : rest.slice(0, cap);
            const arrow = r0 ? '↑' : '↓';
            return (
              <View key={s.id} onLayout={(e) => { ys.current[s.id] = e.nativeEvent.layout.y; }} style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: C.card2, borderWidth: 1, borderColor: C.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                  <Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', flexShrink: 1 }}>{s.title}</Text>
                  <Pressable onPress={() => setRev({ ...rev, [s.id]: !r0 })} hitSlop={8}><Text style={{ color: C.accent, fontSize: 10.5, fontWeight: '700' }}>{r0 ? 'Dal peggiore' : 'Dal migliore'} {arrow}</Text></Pressable>
                </View>
                {pod ? <Podium C={C} rows={ordered} rev={r0} total={s.rows.length} openRoute={openRoute} tick={tick} /> : null}
                {rows.map((r, i0) => {
                  const i = pod ? i0 + 3 : i0;
                  const tc = okHex(r.tc);
                  const extra = all && i0 >= cap;
                  const inner = (
                    <>
                      <Text style={{ width: 22, color: C.ink3, fontSize: 11.5, fontVariant: ['tabular-nums'] }}>{r0 ? s.rows.length - i : i + 1}</Text>
                      {r.left}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13.5, fontWeight: '600' }}>{r.name}</Text>
                        {r.sub ? <Text numberOfLines={1} style={{ color: C.ink3, fontSize: 10.5 }}>{r.sub}</Text> : null}
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 3 }}>
                        <Text style={{ color: C.ink, fontSize: 14.5, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{r.value}</Text>
                        {r.color ? <View style={{ height: 3, minWidth: 26, alignSelf: 'stretch', borderRadius: 2, backgroundColor: r.color }} /> : null}
                      </View>
                    </>
                  );
                  const rowSt = { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 };
                  const el = r.bg && tc ? (
                    <Pressable onPress={() => r.to && openRoute && openRoute(r.to)} style={{ marginHorizontal: 8, marginBottom: 6, borderRadius: 16, overflow: 'hidden' }}>
                      <LinearGradient colors={[`${tc}55`, `${tc}12`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={rowSt}>{inner}</LinearGradient>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => r.to && openRoute && openRoute(r.to)} style={[rowSt, { borderTopWidth: 1, borderTopColor: C.hair }]}>{inner}</Pressable>
                  );
                  const wrapped = oldMaps && oldMaps[s.id] ? <Anim key={r.id} tick={tick} i={i}>{el}</Anim> : <View key={r.id}>{el}</View>;
                  return extra ? <Animated.View key={r.id} entering={FadeInDown.delay(Math.min(i0 - cap, 12) * 35).duration(220)}>{el}</Animated.View> : wrapped;
                })}
                {s.rows.length > limit ? (
                  <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.hair }}>
                    <Pressable onPress={() => setOpen({ ...open, [s.id]: !all })} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7, backgroundColor: C.accTint }, pressed && { opacity: 0.7 }]}>
                      <Text style={{ color: C.accent, fontSize: 12.5, fontWeight: '800' }}>{all ? 'Mostra meno' : `Mostra tutti +${s.rows.length - rows.length - (pod ? 3 : 0)}`}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </RNA.View>
      </ScrollView>
      {sections.length > 3 ? (
        <Pressable onPress={() => setMenu(true)} style={({ pressed }) => [{ position: 'absolute', right: 16, bottom: bottom + 8, flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, borderRadius: 999, paddingHorizontal: 14, backgroundColor: C.sheet, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }, pressed && { opacity: 0.7 }]}>
          <Ionicons name="list" size={14} color={C.ink} /><Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '700' }}>Vai a</Text>
        </Pressable>
      ) : null}
      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)} statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: C.scrim, justifyContent: 'flex-end', alignItems: 'flex-end', paddingRight: 16, paddingBottom: bottom + 8 }} onPress={() => setMenu(false)}>
          <View style={{ width: 250, maxHeight: '60%', borderRadius: 22, backgroundColor: C.sheet, borderWidth: 1, borderColor: C.border, padding: 8 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {groups.map((g) => (
                <View key={g.name} style={{ marginBottom: 4 }}>
                  <Text style={{ color: C.ink3, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 }}>{g.name}</Text>
                  {g.items.map((s) => (
                    <Pressable key={s.id} onPress={() => go(s.id)} style={({ pressed }) => [{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 11 }, pressed && { opacity: 0.6 }]}>
                      <Text style={{ color: C.ink2, fontSize: 13, fontWeight: '600' }}>{s.title}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
