// Hit Rate a colonne (concept B): una colonna per partita, linea dorata, verde se supera la linea e rossa altrimenti.
// Tocco su colonna o avversario: la colonna risalta e le altre si scuriscono; secondo tocco sull'avversario: partita (scheda Formazioni).
// Swipe laterale dentro il grafico: una pagina per competizione (la scelta nel Calcolatore per prima).
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, cancelAnimation, interpolateColor, Easing } from 'react-native-reanimated';
import { useInView } from './inView';
import { TeamCrest, CompLogo } from './ui';
import { TAB_MEM } from './tabMem';
import { pagerTouch } from './backGate';


// Colonne che salgono dal basso (12/11/2026): quando il grafico entra nello schermo scorrendo e, dopo lo swipe, quando arriva una nuova competizione.
// `t` va da 0 a 1; ogni colonna parte con 70 ms di ritardo dalla precedente e sale in 700 ms.
function Grow({ show, isPage, sig, n, children }) {
  const t = useSharedValue(0);
  const played = useRef(null);
  const D = 700 + Math.max(0, n - 1) * 70;
  useEffect(() => {
    if (!isPage) { if (played.current !== null) { cancelAnimation(t); t.value = 0; played.current = null; } return; }
    if (show && played.current !== sig) { played.current = sig; cancelAnimation(t); t.value = 0; t.value = withTiming(1, { duration: D, easing: Easing.linear }); }
  }, [show, isPage, sig]); // eslint-disable-line react-hooks/exhaustive-deps
  return children(t, D);
}
function GBox({ t, D, i, v, mx, ln, lt, hasLine, under, C, style, children }) {
  const so = (StyleSheet.flatten(style) || {}).shadowOpacity || 0;
  // l'ombra sfocata si ridisegna a ogni fotogramma: mentre la colonna sale non c'e', compare negli ultimi istanti (colonne molto piu' leggere)
  const st = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (t.value * D - i * 70) / 700));
    const bh = Math.max(3, (v / mx.value) * PLOT_H);
    const ok = okP(v, ln.value, lt.value, hasLine, under);
    return { height: bh * (1 - Math.pow(1 - p, 3)), shadowOpacity: p < 0.88 ? 0 : so * Math.min(1, (p - 0.88) / 0.12), shadowColor: interpolateColor(ok, [0, 1], [C.bad, C.good]) };
  }, [v, D, i, so, hasLine, under, C.good, C.bad]);
  return <Animated.View style={[style, st]}>{children}</Animated.View>;
}
// strato verde sopra lo strato rosso: l'opacita' del verde e' la sfumatura da rosso a verde
function GFill({ v, ln, lt, hasLine, under, C, radius }) {
  const st = useAnimatedStyle(() => ({ opacity: okP(v, ln.value, lt.value, hasLine, under) }), [v, hasLine, under]);
  return (
    <>
      <LinearGradient colors={[C.bad, `${C.bad}AA`]} style={[StyleSheet.absoluteFill, radius]} />
      <Animated.View style={[StyleSheet.absoluteFill, radius, st]}><LinearGradient colors={[C.good, `${C.good}AA`]} style={[{ flex: 1 }, radius]} /></Animated.View>
    </>
  );
}
// numeri e righe della scala seguono la scala animata; quelli oltre il massimo che sta scorrendo restano nascosti
function TickLbl({ v, mx, C }) {
  const st = useAnimatedStyle(() => ({ bottom: (v / mx.value) * PLOT_H - 7, opacity: v <= mx.value + 1e-3 ? 1 : 0 }), [v]);
  return <Animated.Text style={[{ position: 'absolute', right: 6, color: C.ink3, fontSize: 10.5, fontVariant: ['tabular-nums'] }, st]}>{v}</Animated.Text>;
}
function TickLine({ v, mx, C }) {
  const st = useAnimatedStyle(() => ({ top: PLOT_H - (v / mx.value) * PLOT_H, opacity: v <= mx.value + 1e-3 ? 1 : 0 }), [v]);
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: C.hair }, st]} />;
}
function ValTxt({ v, ln, lt, hasLine, under, C, size }) {
  const st = useAnimatedStyle(() => ({ color: interpolateColor(okP(v, ln.value, lt.value, hasLine, under), [0, 1], [C.bad, C.good]) }), [v, hasLine, under, C.good, C.bad]);
  return <Animated.Text style={[{ fontSize: size, fontWeight: '800', marginBottom: 4 }, st]}>{v}</Animated.Text>;
}
function GFade({ t, D, i, style, children }) {
  const st = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, (t.value * D - i * 70) / 450)) }), [D, i]);
  return <Animated.View style={[style, st]}>{children}</Animated.View>;
}

const PLOT_H = 190;
const AXIS_W = 26;
const LINE_MS = 420;

// Cambio linea (13/11/2026): la linea gialla, la scala e i colori delle colonne seguono un unico valore animato (`ln`).
// Una colonna passa da rossa a verde (o viceversa) mentre la linea le passa sopra, in una finestra di 0,5 sulla distanza dalla linea;
// a animazione finita (`ln` = `lt`, la linea di arrivo) vale solo l'esito vero (> linea, o < linea con "under"), mai un colore a meta'.
function okP(v, ln, lt, hasLine, under) {
  'worklet';
  if (!hasLine) return 1;
  const d = under ? ln - v : v - ln;
  if (Math.abs(ln - lt) < 1e-4) return d > 1e-9 ? 1 : 0;
  return Math.min(1, Math.max(0, d / 0.5));
}

export default function HitChart({ C, pages, line, under, statLabel, openRoute, headRight }) {
  const [sel, setSel] = useState(null); // 'pagina:indice'
  const [pg, setPg] = useState(0);
  const [W, setW] = useState(0);
  const ref = useRef(null);
  const plotRef = useRef(null);
  const { vis, check } = useInView(plotRef, 0.5);
  const [act, setAct] = useState(0); // competizione ferma al centro dopo lo swipe
  const list = (pages || []).filter((p) => p.values && p.values.length);
  const hasLine = Number.isFinite(line);
  const top = Math.max(...list.flatMap((p) => p.values), hasLine ? line : 0);
  const max = Math.max(4, Math.ceil(top + 0.5));
  const tgt = hasLine ? line : 0;
  const mx = useSharedValue(max); // scala verticale animata
  const ln = useSharedValue(tgt); // linea gialla animata
  const lt = useSharedValue(tgt); // linea di arrivo
  const prevSig = useRef(null);
  const dataSig = list.map((p) => p.key + ':' + p.values.join(',')).join('|');
  useEffect(() => {
    if (!list.length) return;
    lt.value = tgt;
    if (prevSig.current === null || prevSig.current !== dataSig) {
      // primo disegno o dati nuovi (giocatore, statistica, sede): niente scorrimento, ci pensano le colonne che salgono
      prevSig.current = dataSig; cancelAnimation(ln); cancelAnimation(mx); ln.value = tgt; mx.value = max; return;
    }
    const cfg = { duration: LINE_MS, easing: Easing.inOut(Easing.cubic) };
    ln.value = withTiming(tgt, cfg);
    mx.value = withTiming(max, cfg);
  }, [tgt, max, dataSig]); // eslint-disable-line react-hooks/exhaustive-deps
  const lineSt = useAnimatedStyle(() => ({ top: PLOT_H - (ln.value / mx.value) * PLOT_H - 1 }), []);
  const tagSt = useAnimatedStyle(() => ({ top: PLOT_H - (ln.value / mx.value) * PLOT_H - 9 }), []);
  if (!list.length) return null;
  const step = max > 14 ? 5 : max > 8 ? 2 : 1;
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  const yOf = (v) => (v / max) * PLOT_H;
  const hit = (v) => (under ? v < line : v > line);
  const cur = list[Math.min(pg, list.length - 1)];
  const goMatch = (m) => { if (!m || !m.matchId || !openRoute) return; TAB_MEM.set(String(m.matchId), 'lineups'); openRoute(`/match/${m.matchId}`); };
  const dim = sel != null;
  const onScroll = (e) => { if (W > 0) { const i = Math.round(e.nativeEvent.contentOffset.x / W); if (i !== pg) { setPg(i); setSel(null); } } };
  const release = () => { pagerTouch.value = 0; };
  const settle = (e) => { release(); if (W > 0) setAct(Math.round(e.nativeEvent.contentOffset.x / W)); };
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 2, gap: 10 }}>
        <View style={{ flexShrink: 1 }}>
          <Text numberOfLines={1} style={{ color: C.ink, fontSize: 15, fontWeight: '800' }}>Hit rate · {statLabel}</Text>
        </View>
        {headRight || null}
      </View>
      {list.length > 1 || cur.name ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 10, height: 20 }}>
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
          {ticks.map((v) => <TickLbl key={v} v={v} mx={mx} C={C} />)}
        </View>
        <View ref={plotRef} collapsable={false} style={{ flex: 1 }} onLayout={(e) => { setW(Math.round(e.nativeEvent.layout.width)); setTimeout(check, 80); }}>
          {ticks.map((v) => <TickLine key={v} v={v} mx={mx} C={C} />)}
          {W > 0 ? (
            <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} bounces={list.length > 1} scrollEnabled={list.length > 1} onScroll={onScroll} scrollEventThrottle={16}
              onTouchStart={() => { pagerTouch.value = 1; }} onTouchEnd={release} onTouchCancel={release} onScrollEndDrag={release} onMomentumScrollEnd={settle}
              style={{ overflow: 'hidden' }}>
              {list.map((p, pi) => {
                const n = p.values.length;
                const itemW = Math.floor(W / Math.max(n, 5));
                const barW = Math.min(34, itemW - 12);
                return (
                  <View key={p.key} style={{ width: W }}>
                    <Grow show={vis} isPage={act === pi} sig={p.key + ':' + p.values.join(',')} n={n}>{(t, D) => (
                    <Pressable onPress={() => setSel(null)} style={{ height: PLOT_H, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {p.values.map((v, i) => {
                        const on = sel === `${pi}:${i}`;
                        const mn = p.minutes && p.minutes[i] != null ? Math.round(p.minutes[i]) : null;
                        const bh = Math.max(3, yOf(v));
                        const short = bh < 24;
                        const sub = mn != null && mn < 90;
                        return (
                          <Pressable key={i} onPress={() => setSel((c) => (c === `${pi}:${i}` ? null : `${pi}:${i}`))} style={{ width: itemW, height: PLOT_H, alignItems: 'center', justifyContent: 'flex-end', opacity: dim && !on ? 0.28 : 1 }}>
                            {mn != null && short ? <GFade t={t} D={D} i={i}><Text style={{ color: sub ? C.warn || '#ffb454' : C.ink3, fontSize: 9.5, fontWeight: '800', marginBottom: 1 }}>{mn}'</Text></GFade> : null}
                            <GFade t={t} D={D} i={i}><ValTxt v={v} ln={ln} lt={lt} hasLine={hasLine} under={!!under} C={C} size={on ? 17 : 14} /></GFade>
                            <GBox t={t} D={D} i={i} v={v} mx={mx} ln={ln} lt={lt} hasLine={hasLine} under={!!under} C={C} style={{ width: on ? barW + 4 : barW, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, shadowOpacity: on ? 0.95 : 0.5, shadowRadius: on ? 16 : 10, shadowOffset: { width: 0, height: 0 }, borderWidth: on ? 1.5 : 0, borderColor: '#FFFFFF88' }}>
                              <GFill v={v} ln={ln} lt={lt} hasLine={hasLine} under={!!under} C={C} radius={{ borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
                              {mn != null && !short ? <GFade t={t} D={D} i={i} style={{ position: 'absolute', left: 0, right: 0, bottom: 4 }}><Text style={{ textAlign: 'center', fontSize: 9.5, fontWeight: '900', color: sub ? '#FFFFFF' : 'rgba(5,30,18,.78)' }}>{mn}'</Text></GFade> : null}
                            </GBox>
                          </Pressable>
                        );
                      })}
                    </Pressable>
                    )}</Grow>
                    {p.games ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                        {p.values.map((_, i) => {
                          const m = p.games[i] || null;
                          const on = sel === `${pi}:${i}`;
                          return (
                            <Pressable key={i} onPress={() => (on ? goMatch(m) : setSel(`${pi}:${i}`))} disabled={!m} style={{ width: itemW, alignItems: 'center', gap: 3, opacity: dim && !on ? 0.28 : 1 }}>
                              {m && m.team ? <TeamCrest team={m.team} size={on ? 24 : 20} C={C} /> : null}
                              {m ? <Text numberOfLines={2} style={{ color: on ? C.ink : C.ink2, fontSize: 9.5, fontWeight: on ? '800' : '600', textAlign: 'center', lineHeight: 11 }}>vs {m.label || m.opp}</Text> : null}
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
              <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: C.gold, shadowColor: C.gold, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }, lineSt]} />
              <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: -30, height: 18, minWidth: 26, paddingHorizontal: 5, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: C.gold }, tagSt]}><Text style={{ color: '#2b2000', fontSize: 10, fontWeight: '900' }}>{String(line).replace('.', ',')}</Text></Animated.View>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}
