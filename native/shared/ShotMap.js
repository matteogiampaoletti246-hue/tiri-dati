// Mappa tiri (nativa): campo verde con linee bianche, due porte viste da davanti, pallini nel colore della squadra;
// toccando un tiro compare la scheda con i dettagli. Stessi colori e regole del sito (ShotDot.jsx).
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { G, Rect, Line, Circle, Polyline, Polygon } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { shown, inkOn, colorDist, matchColors, teamGrad } from '@/lib/tint';
import { LinearGradient } from 'expo-linear-gradient';
import { findInMatch } from '@/data/playerSheet';
import { comma } from '@/lib/format';
import { Segmented } from './ui';
import PlayerLinkN from './PlayerLinkN';

const PITCH = '#1c5a38';
const LINE = 'rgba(255,255,255,.55)';
const GOALBG = '#12351f';
const TRACE = 'rgba(255,255,255,.8)';
const GOALLINE = 'rgba(255,255,255,.45)';
const RING_DARK = '#0b2616';
const HOME0 = '#1d6fe0';
const parse = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim()); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const onGreen = (c) => { const p = parse(c); if (!p) return false; return (p[1] > p[0] + 10 && p[1] > p[2] + 10) || colorDist(c, PITCH) < 100; };
const safe = (colors) => {
  const list = (Array.isArray(colors) ? colors : [colors]).filter((c) => parse(c));
  if (!list.length) return HOME0;
  const pick = onGreen(list[0]) ? (list.slice(1).find((c) => !onGreen(c)) || '#ffffff') : list[0];
  return shown(pick, 70);
};
export function shotColors(home, away) {
  const [mh, ma] = matchColors(home, away);
  const h = safe([mh, ...((home && home.colors) || []).slice(1)]);
  let a = safe([ma, ...((away && away.colors) || []).slice(1)]);
  if (colorDist(h, a) < 130) {
    const alts = [...((away && away.colors) || []), '#ffffff', '#4DA8FF'].filter((c) => parse(c) && !onGreen(c)).map((c) => shown(c, 70));
    a = alts.sort((x, y) => colorDist(h, y) - colorDist(h, x))[0] || a;
  }
  return [h, a];
}
const textOn = (C, c) => (inkOn(c) === '#0F172A' ? C.ink : c);
const isBlocked = (s) => s && s.outcome === 'Murato';

const PENT = [0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return [Math.cos(a), Math.sin(a)]; });
function DotShape({ c, goal, on, r }) {
  const ring = inkOn(c) === '#0F172A' ? RING_DARK : '#ffffff';
  const halo = <Circle r={r + 0.5} fill="rgba(0,0,0,.30)" />;
  if (goal) {
    return (
      <>
        {halo}
        <Circle r={r + 0.55} fill="none" stroke={String(c).toLowerCase() === '#ffffff' ? '#cfe9d8' : c} strokeWidth="0.7" />
        <Circle r={r} fill="#fff" />
        <Polygon points={PENT.map(([x, y]) => `${(0.42 * r * x).toFixed(2)},${(0.42 * r * y).toFixed(2)}`).join(' ')} fill="#111" />
        {PENT.map(([x, y], i) => <Line key={i} x1={0.42 * r * x} y1={0.42 * r * y} x2={0.98 * r * x} y2={0.98 * r * y} stroke="#111" strokeWidth="0.28" />)}
      </>
    );
  }
  if (on) return <>{halo}<Circle r={r} fill={c} stroke={ring} strokeWidth="0.5" /></>;
  return <>{halo}<Circle r={r - 0.3} fill="rgba(0,0,0,.35)" stroke={c} strokeWidth="0.85" /></>;
}

const arc = (cx, cy, r, from, to, n = 30) => {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = ((from + ((to - from) * i) / n) * Math.PI) / 180; pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`); }
  return pts.join(' ');
};
const mir = (pts) => pts.map(([x, y]) => [105 - x, y]);
const pl = (pts) => pts.map((p) => p.join(',')).join(' ');
const RIGHT = [[[105, 13.84], [88.5, 13.84], [88.5, 54.16], [105, 54.16]], [[105, 24.84], [99.5, 24.84], [99.5, 43.16], [105, 43.16]]];

const SITUATION = { RegularPlay: 'Azione', FastBreak: 'Contropiede', SetPiece: 'Palla inattiva', FromCorner: "Da calcio d'angolo", FreeKick: 'Calcio di punizione', Penalty: 'Rigore', ThrowInSetPiece: 'Rimessa laterale', IndirectFreekick: 'Punizione indiretta', Assisted: 'Assistito', IndividualPlay: 'Azione personale', Corner: "Da calcio d'angolo" };
const situationOf = (s) => SITUATION[s] || (s ? String(s).replace(/([a-z])([A-Z])/g, '$1 $2') : '—');
const zoneOf = (s) => {
  if (s.gy == null || s.gz == null) return '—';
  const y = s.gy - 34;
  const col = Math.abs(y) < 1.2 ? 'al centro' : y < 0 ? 'a sinistra' : 'a destra';
  const row = s.gz > 1.6 ? 'In alto' : s.gz > 0.8 ? 'A metà' : 'In basso';
  if (s.gy < 30.34 - 0.2 || s.gy > 37.66 + 0.2 || s.gz > 2.44 + 0.1) return 'Fuori dallo specchio';
  return `${row} ${col}`;
};
const outcomeOf = (s) => (s.outcome === 'Fuori' && s.onTarget ? 'Palo' : s.outcome);
const HIT = 'rgba(0,0,0,0.01)';

export default function ShotMap({ C, shots = [], home, away, match = null, openRoute }) {
  const [mode, setMode] = useState('all');
  const [sel, setSel] = useState(null);
  const [W, setW] = useState(0);
  const list = shots.filter((s) => !s.own && s.px != null && (mode !== 'target' || s.onTarget));
  const cur = sel != null && list[sel] ? list[sel] : null;
  const [HC, AC] = shotColors(home, away);
  const color = (s) => (s.side === 'home' ? HC : AC);
  const pos = (s) => (s.side === 'home' ? [105 - s.px, 68 - s.py] : [s.px, s.py]);
  const found = cur && match ? findInMatch(match, cur.playerName) : null;
  const photo = found ? found.entry.photo : null;
  useEffect(() => { if (sel != null && !list[sel]) setSel(null); }, [list.length]); // eslint-disable-line
  const step = (d) => setSel((i) => (list.length ? (((i == null ? -1 : i) + d + list.length) % list.length) : null));
  const team = cur ? (cur.side === 'home' ? home : away) : null;
  const goalPt = cur && cur.gy != null ? { x: cur.side === 'home' ? 0 : 105, y: cur.side === 'home' ? 68 - cur.gy : cur.gy } : null;
  const dot = (s, i, cx, cy, r, onPress) => (
    <G key={i} x={cx} y={cy} onPress={onPress}>
      {i === sel ? <Circle r={r + 1.6} fill="none" stroke="#f5a400" strokeWidth="0.7" /> : null}
      <Circle r={4.6} fill={HIT} />
      <DotShape c={color(s)} goal={s.outcome === 'Gol'} on={!!s.onTarget} r={r} />
    </G>
  );
  const goal = (side) => {
    const w = 11.5; const x0 = 10;
    const gl = list.filter((s) => s.side === side && s.gy != null && s.gz != null && !isBlocked(s));
    return (
      <Svg width="100%" viewBox="0 0 100 52" style={{ aspectRatio: 100 / 52, backgroundColor: GOALBG, borderRadius: 10 }}>
        <Line x1="2" x2="98" y1="44" y2="44" strokeWidth="0.5" stroke={GOALLINE} />
        <Rect x={x0 + 4} y={44 - 2.44 * w * 0.9} width={7.32 * w * 0.9} height={2.44 * w * 0.9} strokeWidth="1.2" fill="rgba(255,255,255,.05)" stroke="#ffffff" />
        {gl.map((s) => {
          const i = list.indexOf(s);
          const cx = x0 + 4 + (s.gy - 30.34) * w * 0.9;
          const cy = 44 - Math.max(0, Math.min(s.gz, 3.4)) * w * 0.9;
          return dot(s, i, Math.max(3, Math.min(97, cx)), cy, 2.1, () => setSel(i));
        })}
      </Svg>
    );
  };
  const bp = cur && isBlocked(cur) && cur.bx != null ? pos({ side: cur.side, px: cur.bx, py: cur.by }) : null;
  return (
    <View style={{ gap: 12 }}>
      <Segmented C={C} value={mode} onChange={(v) => { setMode(v); setSel(null); }} options={[{ value: 'all', label: 'Tutti' }, { value: 'target', label: 'Tiri in porta' }]} />
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {W ? (
          <Svg width={W} height={(W * 70) / 107} viewBox="-1 -1 107 70" style={{ backgroundColor: PITCH, borderRadius: 10, overflow: 'hidden' }}>
            <Rect x="0" y="0" width="105" height="68" fill="none" stroke={LINE} strokeWidth="0.5" />
            <Line x1="52.5" x2="52.5" y1="0" y2="68" stroke={LINE} strokeWidth="0.5" />
            <Circle cx="52.5" cy="34" r="9.15" fill="none" stroke={LINE} strokeWidth="0.5" />
            <Circle cx="52.5" cy="34" r="0.6" fill={LINE} />
            {RIGHT.map((l, i) => <Polyline key={`r${i}`} points={pl(l)} fill="none" stroke={LINE} strokeWidth="0.5" />)}
            {RIGHT.map((l, i) => <Polyline key={`l${i}`} points={pl(mir(l))} fill="none" stroke={LINE} strokeWidth="0.5" />)}
            <Polyline points={arc(94, 34, 9.15, 127, 233)} fill="none" stroke={LINE} strokeWidth="0.5" />
            <Polyline points={arc(11, 34, 9.15, -53, 53)} fill="none" stroke={LINE} strokeWidth="0.5" />
            {cur && bp ? (
              <>
                <Line x1={pos(cur)[0]} y1={pos(cur)[1]} x2={bp[0]} y2={bp[1]} stroke={TRACE} strokeWidth="0.45" strokeDasharray="1.3 1.1" />
                <Line x1={bp[0] - 1.5} y1={bp[1]} x2={bp[0] + 1.5} y2={bp[1]} stroke={TRACE} strokeWidth="0.9" strokeLinecap="round" />
              </>
            ) : cur && !isBlocked(cur) && goalPt ? (
              <Line x1={pos(cur)[0]} y1={pos(cur)[1]} x2={goalPt.x} y2={goalPt.y} stroke={TRACE} strokeWidth="0.45" strokeDasharray="1.4 1.2" />
            ) : null}
            {list.map((s, i) => { const [cx, cy] = pos(s); return dot(s, i, cx, cy, 1.9, () => setSel(i === sel ? null : i)); })}
          </Svg>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Text style={{ color: textOn(C, HC), fontSize: 10.5, fontWeight: '700', marginBottom: 2 }}>{home ? home.short || home.name : 'Casa'}</Text>{goal('home')}</View>
        <View style={{ flex: 1 }}><Text style={{ color: textOn(C, AC), fontSize: 10.5, fontWeight: '700', marginBottom: 2, textAlign: 'right' }}>{away ? away.short || away.name : 'Trasferta'}</Text>{goal('away')}</View>
      </View>
      {cur ? (
        <View style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: C.chip, padding: 14 }}>
          <LinearGradient colors={[`${(team && team.colors ? team.colors[0] : '#2C3E66')}70`, 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.3 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={() => step(-1)} hitSlop={10}><Ionicons name="chevron-back" size={20} color={C.accent} /></Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {photo ? <Image source={{ uri: photo }} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.hair }} contentFit="cover" cachePolicy="memory-disk" /> : null}
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: textOn(C, color(cur)), flexShrink: 1 }}>
                  {match && openRoute ? <PlayerLinkN match={match} name={cur.playerName} fmId={found && found.fmId} openRoute={openRoute}>{cur.playerName}</PlayerLinkN> : cur.playerName}{cur.og ? ' (autogol)' : ''}
                </Text>
              </View>
              <Text style={{ color: C.ink3, fontSize: 11.5 }}>{team ? team.name : ''} · {cur.minute}'</Text>
            </View>
            <Pressable onPress={() => step(1)} hitSlop={10}><Ionicons name="chevron-forward" size={20} color={C.accent} /></Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, rowGap: 12 }}>
            {[
              ['xG', comma(cur.xg, 2)],
              ['xGOT', cur.onTarget || cur.outcome === 'Gol' ? comma(cur.xgot, 2) : '—'],
              ['Esito', outcomeOf(cur)],
              ['Situazione', situationOf(cur.situation)],
              ['Tipo di tiro', cur.body === 'Testa' ? 'Colpo di testa' : cur.body === 'Destro' ? 'Piede destro' : cur.body === 'Sinistro' ? 'Piede sinistro' : 'Altro'],
              ['Zona gol', zoneOf(cur)],
            ].map(([k, v]) => (
              <View key={k} style={{ width: '33.33%', alignItems: 'center' }}>
                <Text style={{ color: C.ink3, fontSize: 10.5 }}>{k}</Text>
                <Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '700', textAlign: 'center' }}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text style={{ color: C.ink3, fontSize: 11.5, textAlign: 'center' }}>Tocca un tiro per vedere i dettagli</Text>
      )}
    </View>
  );
}
