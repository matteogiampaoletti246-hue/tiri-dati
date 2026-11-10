// Tabellone delle coppe a eliminazione diretta (nativo): due fasi per schermata, le pillole dei turni fanno scorrere il tabellone.
// Un solo valore animato `p` (turno in primo piano): riquadri e fondale ne derivano per interpolazione, i connettori si ridisegnano da p.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import useAsync from '@/hooks/useAsync';
import { teamLogo, loadColors, FM_ID } from '@/data/archive';
import { loadBracket, peekBracket, CUP_NAME } from '@/data/bracket';
import { teamByName } from '@/data/teams';
import { fixedColors } from '@/data/teamColorFix';
import { LEAGUES, leagueTint } from '@/data/leagues';
import { matchTint } from '@/data/matchTint';
import { useSel } from '../shared/hooks';

const H = 62; const U = 74; const X0 = 16; const GAP = 18; const POSTER_H = 250;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const POSTER_GOLD = '#ffd66b'; // la finale e' un manifesto scuro fisso (come i colori del campo): l'oro vale in entrambi i temi

const sigla = (name) => {
  const t = teamByName(name);
  if (t && t.initials) return String(t.initials).toUpperCase();
  return String(name || '?').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z ]/g, '').split(/\s+/)[0].slice(0, 3).toUpperCase();
};
const lgFor = (fm) => { const e = Object.entries(FM_ID).find(([, v]) => Number(v) === Number(fm)); return e ? LEAGUES.find((l) => l.id === e[0]) : null; };
const legsText = (t) => {
  const s = t.legs.filter((l) => l.score).map((l) => { const sc = l.h === t.a ? l.score : [l.score[1], l.score[0]]; return `${sc[0]}–${sc[1]}`; });
  if (t.pen) s.push(`rig. ${t.pen[0]}–${t.pen[1]}`);
  return t.legs.length > 1 || t.pen ? s.join(' · ') : '';
};
const dayText = (d) => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: 'Europe/Rome' }).replace('.', '');
const hexA = (h, a) => { const m = /^#?([0-9a-f]{6})/i.exec(String(h || '')); if (!m) return `rgba(77,168,255,${a})`; const n = parseInt(m[1], 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const shade = (hex, k) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return '#1B2C4E'; const n = parseInt(m[1], 16); const ch = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `#${((1 << 24) | (ch((n >> 16) & 255) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255)).toString(16).slice(1)}`; };

// colore sociale: file generato dagli stemmi, altrimenti la squadra gia' presente nell'app, altrimenti un blu neutro
function useTeamCol() {
  const { data } = useAsync(() => loadColors(), []);
  return useMemo(() => (id, name) => {
    const fx = fixedColors(name);
    if (fx) return fx[0];
    const t = name ? teamByName(name) : null;
    let c = t && t.colors && t.colors[0];
    if (!c || c === '#2C3E66') c = (data && data[String(id)]) || c || '#2C3E66';
    return c || shade('#2C3E66', 1);
  }, [data]);
}

// il lato passato e' luminoso con una barretta dorata, quello eliminato e' piu' piccolo e spento
function Side({ C, id, name, state }) {
  const win = state === 'win'; const lose = state === 'lose';
  const z = win ? 30 : lose ? 24 : 28;
  return (
    <View style={{ width: 44, alignItems: 'center', gap: 2 }}>
      <View style={{ height: 30, justifyContent: 'center' }}><Image source={{ uri: teamLogo(id) }} style={{ width: z, height: z, opacity: lose ? 0.42 : 1 }} contentFit="contain" cachePolicy="memory-disk" /></View>
      <Text style={{ color: C.ink, fontSize: 9, fontWeight: '800', letterSpacing: 0.7, opacity: lose ? 0.4 : 1 }}>{sigla(name)}</Text>
      <View style={{ height: 3, width: 22, borderRadius: 2, backgroundColor: win ? C.gold : 'transparent' }} />
    </View>
  );
}

function Tie({ C, t, names, col, w }) {
  const na = names[t.a] || '—'; const nb = names[t.b] || '—';
  const ca = col(t.a, na); const cb = col(t.b, nb);
  const done = t.played;
  const sa = t.win === 'a' ? 'win' : t.win === 'b' ? 'lose' : 'even';
  const sb = t.win === 'b' ? 'win' : t.win === 'a' ? 'lose' : 'even';
  return (
    <View style={{ width: w, height: H, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: C.hair, backgroundColor: C.sheet, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 }}>
      <LinearGradient colors={[hexA(ca, sa === 'lose' ? 0.27 : 0.8), 'rgba(0,0,0,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '45%' }} />
      <LinearGradient colors={['rgba(0,0,0,0)', hexA(cb, sb === 'lose' ? 0.27 : 0.8)]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%' }} />
      <Side C={C} id={t.a} name={na} state={sa} />
      <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
        {done || t.legs.some((l) => l.score) ? (
          <Text style={{ color: C.ink, fontSize: 19, fontWeight: '800', letterSpacing: 0.4 }}>
            <Text style={{ opacity: sa === 'lose' ? 0.45 : 1 }}>{t.sa}</Text><Text style={{ opacity: 0.4 }}>–</Text><Text style={{ opacity: sb === 'lose' ? 0.45 : 1 }}>{t.sb}</Text>
          </Text>
        ) : <Text style={{ color: C.ink2, fontSize: 12, fontWeight: '700' }}>{dayText(t.date)}</Text>}
        <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 9.5, fontWeight: '700' }}>{legsText(t)}</Text>
      </View>
      <Side C={C} id={t.b} name={nb} state={sb} />
    </View>
  );
}

// finale: i colori e il logo della competizione, stemmi nitidi e risultato in primo piano
function Poster({ t, names, fm, tint, mid, name, w }) {
  const na = names[t.a] || '—'; const nb = names[t.b] || '—';
  const wn = t.win === 'a' ? na : t.win === 'b' ? nb : null;
  const done = t.played || t.legs.some((l) => l.score);
  const ring = (on) => (on ? { borderWidth: 2, borderColor: POSTER_GOLD, shadowColor: POSTER_GOLD, shadowOpacity: 0.55, shadowRadius: 14 } : null);
  return (
    <View style={{ width: w, height: POSTER_H, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' }}>
      <LinearGradient colors={[tint, mid, '#050912']} locations={[0, 0.6, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <Image source={{ uri: `https://images.fotmob.com/image_resources/logo/leaguelogo/dark/${fm}.png` }} style={{ position: 'absolute', left: w / 2 - 165, top: POSTER_H / 2 - 165, width: 330, height: 330, opacity: 0.14 }} contentFit="contain" />
      <Text style={{ position: 'absolute', left: 0, right: 0, top: 16, textAlign: 'center', color: 'rgba(255,255,255,.8)', fontSize: 11, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase' }}>{name} · Finale</Text>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <View style={[{ borderRadius: 999, padding: 6, backgroundColor: 'rgba(255,255,255,.1)' }, ring(t.win === 'a')]}><Image source={{ uri: teamLogo(t.a) }} style={{ width: 68, height: 68, opacity: t.win === 'b' ? 0.85 : 1 }} contentFit="contain" cachePolicy="memory-disk" /></View>
        {done ? <Text style={{ color: '#fff', fontSize: 42, fontWeight: '800' }}>{t.sa}<Text style={{ opacity: 0.5 }}> – </Text>{t.sb}</Text> : <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 26, fontWeight: '800' }}>vs</Text>}
        <View style={[{ borderRadius: 999, padding: 6, backgroundColor: 'rgba(255,255,255,.1)' }, ring(t.win === 'b')]}><Image source={{ uri: teamLogo(t.b) }} style={{ width: 68, height: 68, opacity: t.win === 'a' ? 0.85 : 1 }} contentFit="contain" cachePolicy="memory-disk" /></View>
      </View>
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {wn ? <Ionicons name="trophy" size={14} color={POSTER_GOLD} /> : null}
        <Text style={{ color: '#d8e4ff', fontSize: 12.5, fontWeight: '700', textAlign: 'center' }}>
          {wn ? `${wn} vince${t.pen ? ` ai rigori ${Math.max(...t.pen)}–${Math.min(...t.pen)}` : ''}` : done ? '' : new Date(t.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Rome' })}
        </Text>
      </View>
    </View>
  );
}

// connettori: si ridisegnano da p (stato piccolo, solo due tracciati)
function Lines({ C, p, build, height }) {
  const [v, setV] = useState(() => p.__getValue());
  useEffect(() => { const id = p.addListener(({ value }) => setV(value)); return () => p.removeListener(id); }, [p]);
  const { d1, d2, a2 } = build(v);
  return (
    <Svg style={{ position: 'absolute', left: 0, top: 0 }} width="100%" height={height} pointerEvents="none">
      <Path d={d1} stroke={C.hair} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={d2} stroke={C.hair} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={a2} />
    </Svg>
  );
}

function BracketView({ C, data, fm, sk, openRoute }) {
  const col = useTeamCol();
  const { rounds, slots, names } = data;
  const L = rounds.length;
  const hasFinal = rounds[L - 1].key === 'final';
  const lg = lgFor(fm);
  const tint = leagueTint(lg ? lg.id : '');
  const glow = matchTint(lg ? lg.id : '', lg);
  const mid = (lg && lg.colors && lg.colors[0]) || '#0A1C5E';
  const [W, setW] = useState(Dimensions.get('window').width);
  const cw = Math.max(120, (W - 2 * X0 - GAP) / 2);
  const step = cw + GAP;

  const start = useMemo(() => {
    const open = rounds.findIndex((r) => r.ties.some((t) => !t.played));
    if (open >= 0) return Math.min(open, Math.max(0, L - 1));
    return Math.max(0, L - 3);
  }, [rounds, L]);
  const [saved, setSaved] = useSel(`lg-${fm}`, `ph-${sk}`, null);
  const first = saved != null && saved < L ? saved : start;
  const [active, setActive] = useState(first);
  const p = useRef(new Animated.Value(first)).current;

  // ordine verticale dei riquadri di ogni turno (mai uno dentro l'altro)
  const ord = useMemo(() => rounds.map((r) => r.ties.map((_, i) => i).sort((a, b) => r.ties[a].cy - r.ties[b].cy)), [rounds]);
  const scale = useMemo(() => { const a = rounds.map((r) => 1 / Math.max(1, slots / r.ties.length)); if (L > 1) a[L - 1] = a[L - 2]; return a; }, [rounds, slots, L]);
  // posizioni verticali ai turni interi (con la distanza minima); fra due interi si interpola
  const grid = useMemo(() => {
    const Y = []; const B = [];
    for (let k = 0; k < L; k += 1) {
      const sy = scale[k]; const y = {}; let maxB = 0;
      rounds.forEach((r, ri) => {
        let prev = -1e9;
        ord[ri].forEach((i) => {
          const t = r.ties[i];
          let yy = 8 + t.cy * U * sy - H / 2;
          if (yy < prev + H + 10) yy = prev + H + 10;
          prev = yy; y[`${ri}-${i}`] = yy;
          if (ri >= k && ri <= k + 1 && !(hasFinal && ri === L - 1 && k === L - 1)) maxB = Math.max(maxB, yy + H);
        });
      });
      Y.push(y);
      B.push(Math.max(hasFinal ? POSTER_H + 40 : 200, Math.max(slots * U * sy, maxB) + 24));
    }
    return { Y, B };
  }, [rounds, ord, scale, slots, L, hasFinal]);

  const ks = L > 1 ? rounds.map((_, i) => i) : [0, 1];
  const ip = (arr) => p.interpolate({ inputRange: ks, outputRange: L > 1 ? arr : [arr[0], arr[0]], extrapolate: 'clamp' });
  const sP = p.interpolate({ inputRange: [L - 1.45, L - 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const boxH = ip(grid.B);

  // connettori alla posizione p (stessa interpolazione dei riquadri)
  const build = useCallback((pv) => {
    const k0 = clamp(Math.floor(pv), 0, L - 1); const k1 = clamp(k0 + 1, 0, L - 1); const f = clamp(pv - k0);
    const at = (ri, i) => ({ x: X0 + (ri - pv) * step, y: grid.Y[k0][`${ri}-${i}`] + (grid.Y[k1][`${ri}-${i}`] - grid.Y[k0][`${ri}-${i}`]) * f });
    let d1 = ''; let d2 = '';
    rounds.forEach((r, ri) => {
      if (!ri) return;
      r.ties.forEach((t, i) => {
        const to = at(ri, i);
        (t.kids || []).forEach((kid) => {
          const fi = rounds[ri - 1].ties.indexOf(kid); if (fi < 0) return;
          const fr = at(ri - 1, fi);
          const x1 = fr.x + cw; const y1 = fr.y + H / 2; const x2 = to.x; const y2 = to.y + H / 2; const mx = (x1 + x2) / 2;
          const seg = `M${x1.toFixed(1)} ${y1.toFixed(1)}H${mx.toFixed(1)}V${y2.toFixed(1)}H${x2.toFixed(1)}`;
          if (hasFinal && ri === L - 1) d2 += seg; else d1 += seg;
        });
      });
    });
    const s = hasFinal ? clamp((pv - (L - 1) + 0.45) / 0.45) : 0;
    return { d1, d2, a2: 1 - s };
  }, [rounds, grid, step, cw, hasFinal, L]);

  // pillole dei turni: posizione/larghezza misurate, l'indicatore le segue
  const pillsX = useRef([]); const [pillsOk, setPillsOk] = useState(false);
  const rowRef = useRef(null); const rowW = useRef(0);
  const onPill = (i) => (e) => { pillsX.current[i] = e.nativeEvent.layout; if (pillsX.current.filter(Boolean).length === L) setPillsOk(true); };
  const centerOn = (to, animated) => {
    const l = pillsX.current[to]; if (!l || !rowRef.current) return;
    rowRef.current.scrollTo({ x: Math.max(0, l.x + l.width / 2 - rowW.current / 2), animated });
  };
  useEffect(() => { if (pillsOk) centerOn(first, false); }, [pillsOk]); // eslint-disable-line react-hooks/exhaustive-deps
  const indX = pillsOk ? p.interpolate({ inputRange: ks, outputRange: L > 1 ? pillsX.current.map((l) => l.x) : [pillsX.current[0].x, pillsX.current[0].x], extrapolate: 'clamp' }) : null;
  const indW = pillsOk ? p.interpolate({ inputRange: ks, outputRange: L > 1 ? pillsX.current.map((l) => l.width) : [pillsX.current[0].width, pillsX.current[0].width], extrapolate: 'clamp' }) : null;

  const go = (to) => {
    setActive(to); setSaved(to);
    const from = p.__getValue();
    if (from === to) return;
    p.stopAnimation();
    Animated.timing(p, { toValue: to, duration: 750 + 100 * Math.max(0, Math.abs(to - from) - 1), easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
    centerOn(to, true);
  };
  const open = (t) => {
    const l = [...t.legs].reverse().find((x) => x.score) || t.legs[t.legs.length - 1];
    if (l) openRoute(`/match/a-${fm}-${sk}-${l.mid}`);
  };

  const pw = W - 2 * X0;
  const finalTie = rounds[L - 1].ties[0];
  const finY = hasFinal ? ip(grid.Y.map((y) => y[`${L - 1}-0`])) : null;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ paddingBottom: 24, overflow: 'hidden' }}>
      <LinearGradient pointerEvents="none" colors={[hexA(glow, C.dark ? 0.28 : 0.2), hexA(glow, 0)]} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 360 }} />
      <ScrollView ref={rowRef} horizontal showsHorizontalScrollIndicator={false} onLayout={(e) => { rowW.current = e.nativeEvent.layout.width; }} style={{ marginHorizontal: 16, marginTop: 12, flexGrow: 0 }} contentContainerStyle={{ alignItems: 'center', gap: 6 }}>
        {pillsOk ? <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999, backgroundColor: C.accent, width: indW, transform: [{ translateX: indX }] }} /> : null}
        {rounds.map((r, i) => (
          <Pressable key={r.key} onLayout={onPill(i)} onPress={() => go(i)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999 }}>
            <Text style={{ color: active === i ? '#fff' : C.ink3, fontSize: 12.5, fontWeight: '800' }}>{r.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Animated.View style={{ marginTop: 12, height: boxH, overflow: 'hidden' }}>
        <Lines C={C} p={p} build={build} height={grid.B[L - 1] + 400} />
        {rounds.map((r, ri) => r.ties.map((t, i) => {
          const x = p.interpolate({ inputRange: ks, outputRange: L > 1 ? ks.map((k) => X0 + (ri - k) * step) : [X0 + ri * step, X0 + ri * step], extrapolate: 'extend' });
          const y = ip(grid.Y.map((yy) => yy[`${ri}-${i}`]));
          const op = hasFinal && ri === L - 1 ? Animated.subtract(1, sP) : 1;
          return (
            <Animated.View key={`${ri}-${i}`} style={{ position: 'absolute', left: 0, top: 0, width: cw, height: H, opacity: op, transform: [{ translateX: x }, { translateY: y }] }}>
              <Pressable onPress={() => open(t)} style={({ pressed }) => pressed && { opacity: 0.8 }}><Tie C={C} t={t} names={names} col={col} w={cw} /></Pressable>
            </Animated.View>
          );
        }))}
        {hasFinal ? (
          <Animated.View pointerEvents={active === L - 1 ? 'box-none' : 'none'} style={{ position: 'absolute', left: 0, top: 0, width: pw, height: POSTER_H, opacity: sP, transform: [{ translateX: p.interpolate({ inputRange: ks, outputRange: L > 1 ? ks.map((k) => X0 + (L - 1 - k) * step) : [X0, X0], extrapolate: 'extend' }) }, { translateY: Animated.add(finY, Animated.multiply(Animated.subtract(14, finY), sP)) }] }}>
            <Pressable onPress={() => open(finalTie)}><Poster t={finalTie} names={names} fm={fm} tint={tint} mid={mid} name={CUP_NAME[fm] || (lg && lg.name) || ''} w={pw} /></Pressable>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}

// segnaposto con la forma del tabellone (pillole + due riquadri)
function BracketSkel({ C }) {
  const b = (h, w, r = 22) => <View style={{ height: h, width: w, borderRadius: r, backgroundColor: C.skBase }} />;
  return <View style={{ padding: 16, gap: 14 }}><View style={{ flexDirection: 'row', gap: 6 }}>{b(32, 74, 999)}{b(32, 74, 999)}{b(32, 74, 999)}</View>{b(H, '48%')}{b(H, '48%')}{b(H, '48%')}</View>;
}

export default function Tabellone({ C, match, openRoute }) {
  const { fm, sk } = match.archive;
  const hit = peekBracket(fm, sk);
  const { data: d0, loading } = useAsync(() => (sk ? loadBracket(fm, sk) : null), [fm, sk]);
  const data = d0 || hit;
  if (loading && !data) return <BracketSkel C={C} />;
  if (!data || !data.rounds || !data.rounds.length) return null;
  return <BracketView key={`${fm}-${sk}`} C={C} data={data} fm={fm} sk={sk} openRoute={openRoute} />;
}
