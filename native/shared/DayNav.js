// Striscia dei giorni e pager a scorrimento laterale (Migliori Giocatori e Matchup), stesso comportamento della Home nativa:
// `x` = pagina frazionaria sul thread UI; il giorno scelto sta al centro; la linea sotto il giorno segue il dito.
import { useBackGate } from './backGate';
import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, interpolateColor, withTiming, cancelAnimation, runOnJS, useSharedValue, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { dayLabel, MONTHS, WEEKDAYS_LONG } from '@/lib/format';
import { RingBox } from './ui';

function DayBtn({ C, i, x, on, top, sub, onPress, onLayout }) {
  const near = useAnimatedStyle(() => { const p = Math.max(0, 1 - Math.abs(x.value - i)); return { color: interpolateColor(p, [0, 1], [C.ink3, C.ink]), transform: [{ scale: 1 + 0.07 * p }] }; }, [C]);
  const subSt = useAnimatedStyle(() => { const p = Math.max(0, 1 - Math.abs(x.value - i)); return { opacity: 0.6 + 0.3 * p }; });
  const ul = useAnimatedStyle(() => { const p = Math.max(0, 1 - Math.abs(x.value - i)); return { opacity: Math.min(1, p * 1.5), transform: [{ scaleX: 0.2 + 0.8 * p }] }; });
  return (
    <Pressable onPress={onPress} onLayout={onLayout} style={{ paddingBottom: 7 }}>
      <Animated.Text style={[{ fontSize: 15, fontWeight: on ? '700' : '500' }, near]}>{top}</Animated.Text>
      <Animated.Text style={[{ color: C.ink3, fontSize: 10.5 }, subSt]}>{sub}</Animated.Text>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: '10%', right: '10%', bottom: 0, height: 3, borderRadius: 2, backgroundColor: C.accent, shadowColor: C.accent, shadowOpacity: 0.55, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } }, ul]} />
    </Pressable>
  );
}

export function DayStripN({ C, dates, todayIndex = 0, x, value, onChange }) {
  const { width: W } = useWindowDimensions();
  const sc = useRef(null);
  const pos = useRef({});
  const centre = (i) => { const p = pos.current[i]; if (p && sc.current) sc.current.scrollTo({ x: Math.max(0, p.x + p.w / 2 - W / 2), animated: true }); };
  useEffect(() => { centre(value); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <ScrollView ref={sc} horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 24, alignItems: 'center' }}>
      {dates.map((d, i) => (
        <DayBtn key={d.toISOString()} C={C} i={i} x={x} on={i === value} top={dayLabel(d, todayIndex, i)} sub={`${d.getDate()} ${MONTHS[d.getMonth()]}`} onPress={() => onChange(i)}
          onLayout={(e) => { const { x: lx, width } = e.nativeEvent.layout; pos.current[i] = { x: lx, w: width }; if (i === value) centre(i); }} />
      ))}
    </ScrollView>
  );
}

const Pane = ({ idx, x, W, children }) => {
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: (idx - x.value) * W }] }));
  return <Animated.View style={[StyleSheet.absoluteFill, st]}>{children}</Animated.View>;
};

// Pagine dei giorni: si montano il giorno mostrato e i due vicini (quelli accanto servono per lo swipe)
export function DayPagerN({ count, index, onIndex, x, render }) {
  const { width: W } = useWindowDimensions();
  useBackGate(index > 0); // sulla prima scheda lo swipe verso destra e' dello swipe indietro
  const x0 = useSharedValue(index);
  const target = useSharedValue(index);
  useEffect(() => {
    if (target.value === index) return;
    target.value = index;
    x.value = withTiming(index, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const pan = React.useMemo(() => Gesture.Pan().activeOffsetX([-10, index > 0 ? 10 : 100000]).failOffsetY([-28, 28])
    .onStart(() => { cancelAnimation(x); const r = Math.round(x.value); if (r !== target.value) { target.value = r; runOnJS(onIndex)(r); } x0.value = x.value; })
    .onUpdate((e) => {
      let v = x0.value - e.translationX / W;
      if (v < 0) v *= 0.3; else if (v > count - 1) v = count - 1 + (v - (count - 1)) * 0.3;
      x.value = v;
    })
    .onEnd((e) => {
      const base = Math.round(x0.value);
      let t = Math.round(x.value - (e.velocityX / W) * 0.2);
      t = Math.max(base - 1, Math.min(base + 1, t));
      t = Math.max(0, Math.min(count - 1, t));
      target.value = t;
      // l'indice cambia a scorrimento finito: il ridisegno della scheda non pesa mai sull'animazione
      x.value = withTiming(t, { duration: 240, easing: Easing.out(Easing.cubic) }, (fin) => { if (fin) runOnJS(onIndex)(t); });
    }), [x, x0, target, count, W, onIndex, index > 0]);
  const shown = [index - 1, index, index + 1].filter((i) => i >= 0 && i < count);
  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {shown.map((i) => <Pane key={i} idx={i} x={x} W={W}>{render(i, i === index)}</Pane>)}
      </View>
    </GestureDetector>
  );
}

// Giorno senza risultati (Empty State B): riquadro tratteggiato, icona e il prossimo giorno con risultati
export function EmptyDayN({ C, date, index, todayIndex = 0, title, next, onGo, noun }) {
  const lab = dayLabel(date, todayIndex, index);
  const tit = /^(Oggi|Ieri|Domani)$/.test(lab) ? `${title} ${lab.toLowerCase()}` : `${title} ${lab}`;
  const nl = next ? dayLabel(next.date, todayIndex, next.i) : '';
  return (
    <View style={{ marginHorizontal: 16, marginTop: 14 }}>
      <RingBox C={C} radius={22} plain style={{}} innerStyle={{ flex: 0, backgroundColor: C.sheet }}>
        <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingVertical: 22 }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip, marginBottom: 12 }}><Ionicons name="calendar-clear-outline" size={28} color={C.ink2} /></View>
          <Text style={{ color: C.ink, fontSize: 16, fontWeight: '600' }}>{tit}</Text>
          {next ? (
            <>
              <Text style={{ color: C.ink3, fontSize: 12.5, marginTop: 5, textAlign: 'center' }}>Prossimi risultati: {/^(Oggi|Domani)$/.test(nl) ? nl.toLowerCase() : WEEKDAYS_LONG[next.date.getDay()].toLowerCase()} {next.date.getDate()} {MONTHS[next.date.getMonth()]} · {next.n} {next.n === 1 ? noun[0] : noun[1]}</Text>
              <Pressable onPress={() => onGo(next.i)} style={({ pressed }) => [{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.accent }, pressed && { opacity: 0.7 }]}>
                <Text style={{ color: '#041225', fontSize: 14, fontWeight: '600' }}>{nl}</Text>
                <Ionicons name="chevron-forward" size={15} color="#041225" />
              </Pressable>
            </>
          ) : <Text style={{ color: C.ink3, fontSize: 12.5, marginTop: 5 }}>Nessun risultato nei prossimi giorni</Text>}
        </View>
      </RingBox>
    </View>
  );
}

export const nextWith = (from, total, dates, count, max = 21) => {
  for (let i = from + 1; i < Math.min(total, from + 1 + max); i++) { const n = count(i); if (n) return { i, date: dates[i], n }; }
  return null;
};
