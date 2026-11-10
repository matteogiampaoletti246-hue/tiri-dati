// Confronto squadra / squadra (concept A "Paired Bars"): barre a specchio dal centro nei colori sociali; chi prevale ha il colore pieno.
import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { shown } from '@/lib/tint';

function Half({ C, v, mx, col, win, side }) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = 0; p.value = withTiming(mx ? (v / mx) * 100 : 0, { duration: 700, easing: Easing.bezier(0.22, 1, 0.36, 1) }); }, [v, mx]); // eslint-disable-line
  const w = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, p.value))}%` }));
  return (
    <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: C.hair, overflow: 'hidden', flexDirection: 'row', justifyContent: side === 'home' ? 'flex-end' : 'flex-start' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 3, backgroundColor: col, opacity: win ? 1 : 0.5 }, w]} />
    </View>
  );
}

export default function CompareBars({ C, rows, homeColor, awayColor, format = (v) => v }) {
  const hc = shown(homeColor);
  const ac = shown(awayColor);
  return (
    <View style={{ gap: 14 }}>
      {rows.map((row) => {
        const h = Math.abs(row.home || 0);
        const a = Math.abs(row.away || 0);
        const mx = Math.max(h, a) || 1;
        const fmt = row.format || format;
        return (
          <View key={row.label}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={{ color: hc, opacity: h >= a ? 1 : 0.7, fontSize: 13.5, fontWeight: '800', minWidth: 36 }}>{row.homeText ?? fmt(row.home)}</Text>
              <Text numberOfLines={1} style={{ flex: 1, color: C.ink3, fontSize: 12, textAlign: 'center' }}>{row.label}</Text>
              <Text style={{ color: ac, opacity: a >= h ? 1 : 0.7, fontSize: 13.5, fontWeight: '800', minWidth: 36, textAlign: 'right' }}>{row.awayText ?? fmt(row.away)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
              <Half C={C} v={h} mx={mx} col={hc} win={h >= a} side="home" />
              <Half C={C} v={a} mx={mx} col={ac} win={a >= h} side="away" />
            </View>
          </View>
        );
      })}
    </View>
  );
}
