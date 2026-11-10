// Radar dei percentili (0-100) su 6 assi, come il sito: griglia chiara, area piena, punti sui vertici.
import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SText } from 'react-native-svg';

const lum = (c) => {
  const s = String(c || '').trim();
  const m = /^#([0-9a-f]{6})$/i.exec(s);
  if (!m) return 1;
  const n = parseInt(m[1], 16);
  return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
export const seen = (c, C) => (lum(c) < 0.42 ? C.ink : c);

export default function Radar({ C, items, color, size = 250 }) {
  const dark = lum(color) < 0.42;
  const col = dark ? C.ink : color;
  const n = items.length;
  const c = size / 2;
  const R = size * 0.34;
  const pt = (i, f) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [c + Math.cos(a) * R * f, c + Math.sin(a) * R * f]; };
  const poly = (f) => items.map((_, i) => pt(i, f).join(',')).join(' ');
  const data = items.map((it, i) => pt(i, Math.max(0.04, (it.pct || 0) / 100)).join(',')).join(' ');
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[0.25, 0.5, 0.75, 1].map((f) => <Polygon key={f} points={poly(f)} fill="none" stroke={C.ink} strokeOpacity={dark ? 0.3 : 0.22} strokeWidth="1" />)}
        {items.map((_, i) => { const [x, y] = pt(i, 1); return <Line key={i} x1={c} y1={c} x2={x} y2={y} stroke={C.ink} strokeOpacity={dark ? 0.3 : 0.22} strokeWidth="1" />; })}
        <Polygon points={data} fill={col} fillOpacity={dark ? 0.34 : 0.28} stroke={col} strokeWidth={dark ? 2.5 : 2} strokeLinejoin="round" />
        {items.map((it, i) => {
          const [x, y] = pt(i, 1.24);
          const [dx, dy] = pt(i, Math.max(0.04, (it.pct || 0) / 100));
          return (
            <React.Fragment key={it.key}>
              <Circle cx={dx} cy={dy} r="3.4" fill={col} />
              <SText x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fill={dark ? C.ink : C.ink2}>{it.short}</SText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
