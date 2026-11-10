// Schede di una pagina (Partite / Classifica / ...): barra fissa con la linea che segue il dito e pagine a scorrimento laterale.
// Ogni pagina ha il suo scorrimento verticale; le pagine accanto si montano poco dopo l'apertura (prima: scheletro con la forma della scheda).
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, interpolateColor, useSharedValue } from 'react-native-reanimated';
import { DayPagerN } from './DayNav';

function Tab({ C, i, x, label, w, onPress }) {
  const tx = useAnimatedStyle(() => { const p = Math.max(0, 1 - Math.abs(x.value - i)); return { color: interpolateColor(p, [0, 1], [C.ink3, C.accent]) }; }, [C]);
  return (
    <Pressable onPress={onPress} style={{ width: w, alignItems: 'center', paddingVertical: 12 }}>
      <Animated.Text numberOfLines={1} style={[{ fontSize: 13.5, fontWeight: '800' }, tx]}>{label}</Animated.Text>
    </Pressable>
  );
}

export function PanelSkN({ C }) {
  const b = (h, r = 22) => <View style={{ height: h, borderRadius: r, backgroundColor: C.skBase, marginBottom: 12 }} />;
  return <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>{b(40, 16)}{b(64)}{b(64)}{b(64)}{b(64)}</View>;
}

export default function TabsN({ C, tabs, index, onIndex, render }) {
  const { width: W } = useWindowDimensions();
  const x = useSharedValue(index);
  const [ready, setReady] = useState(false);
  const seen = useRef(new Set());
  seen.current.add(index);
  useEffect(() => { setReady(false); const t = setTimeout(() => setReady(true), 320); return () => clearTimeout(t); }, [index]);
  const w = W / tabs.length;
  const line = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * w + w * 0.2 }] }));
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border }}>
        {tabs.map((t, i) => <Tab key={t.key} C={C} i={i} x={x} w={w} label={t.label} onPress={() => onIndex(i)} />)}
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', bottom: -1, left: 0, width: w * 0.6, height: 2.5, borderRadius: 2, backgroundColor: C.accent }, line]} />
      </View>
      <DayPagerN count={tabs.length} index={index} onIndex={onIndex} x={x} render={(i, active) => (active || ready || seen.current.has(i) ? render(i, active) : <PanelSkN C={C} />)} />
    </View>
  );
}
