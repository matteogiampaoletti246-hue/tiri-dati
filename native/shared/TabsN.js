// Schede di una pagina (Partite / Classifica / ...): barra fissa con la linea che segue il dito e pagine a scorrimento laterale.
// Ogni pagina ha il suo scorrimento verticale; le pagine accanto si montano poco dopo l'apertura (prima: scheletro con la forma della scheda).
import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, interpolateColor, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { DayPagerN } from './DayNav';

// Voci come nel sito (SwipeTabs): testo a sinistra, 24 px tra le voci; la linea sotto la voce (sfumata, con alone) segue il dito
function Tab({ C, i, x, label, onPress }) {
  const tx = useAnimatedStyle(() => { const p = Math.max(0, 1 - Math.abs(x.value - i)); return { color: interpolateColor(p, [0, 1], [C.ink3, C.ink]) }; }, [C]);
  const ul = useAnimatedStyle(() => { const p = Math.max(0, 1 - Math.abs(x.value - i)); return { opacity: Math.min(1, p * 1.6), transform: [{ scaleX: 0.25 + 0.75 * p }] }; });
  return (
    <Pressable onPress={onPress} style={{ paddingBottom: 10 }}>
      <Animated.Text numberOfLines={1} style={[{ fontSize: 14, fontWeight: '700' }, tx]}>{label}</Animated.Text>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, borderRadius: 2, overflow: 'hidden', shadowColor: C.accent, shadowOpacity: 0.7, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } }, ul]}>
        <LinearGradient colors={['#1F6BEF', C.accent, '#7B6CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </Pressable>
  );
}

export function PanelSkN({ C }) {
  const b = (h, r = 22) => <View style={{ height: h, borderRadius: r, backgroundColor: C.skBase, marginBottom: 12 }} />;
  return <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>{b(40, 16)}{b(64)}{b(64)}{b(64)}{b(64)}</View>;
}

export function TabBarN({ C, tabs, x, onIndex }) {
  return (
    <View style={{ flexDirection: 'row', gap: 24, paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.sheet }}>
      {tabs.map((t, i) => <Tab key={t.key} C={C} i={i} x={x} label={t.label} onPress={() => onIndex(i)} />)}
    </View>
  );
}

export default function TabsN({ C, tabs, index, onIndex, render }) {
  const x = useSharedValue(index);
  const [ready, setReady] = useState(false);
  const seen = useRef(new Set());
  seen.current.add(index);
  useEffect(() => { setReady(false); const t = setTimeout(() => setReady(true), 320); return () => clearTimeout(t); }, [index]);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', gap: 24, paddingHorizontal: 20, paddingTop: 12 }}>
        {tabs.map((t, i) => <Tab key={t.key} C={C} i={i} x={x} label={t.label} onPress={() => onIndex(i)} />)}
      </View>
      <DayPagerN count={tabs.length} index={index} onIndex={onIndex} x={x} render={(i, active) => (active || ready || seen.current.has(i) ? render(i, active) : <PanelSkN C={C} />)} />
    </View>
  );
}
