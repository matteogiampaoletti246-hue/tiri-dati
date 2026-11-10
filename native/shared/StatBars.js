// Righe con valore a pillola colorata e barra con la media (stesso aspetto del sito per stagione attuale e passate).
import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { bandColor } from '@/components/player/playerCalc';

export const NEG_RE = /conceded|card|^fouls$|lost|dispossess|miss|offside|dribbled_past|error|faced|owngoal/i;
export const groupOf = (() => {
  const G = [
    ['Difesa', /conced|clean|faced|saves|save_|saved|keeper|error|last_man|clearance|owngoal/i],
    ['Attacco', /goal|shot|scoring_att|assist|chance|xg|expected|penalty_won|won_contest|dribble/i],
    ['Passaggi', /pass|cross|long|lbp|touch/i],
    ['Difesa', /tackle|intercept|clear|block|recover|defens|duel|aerial|poss_won|save|clean|conced/i],
    ['Disciplina', /card|foul|offside/i],
    ['Rendimento', /rating|min|match|appear/i],
  ];
  return (k) => (G.find(([, re]) => re.test(k)) || ['Altro'])[0];
})();
export const ORDER = ['Attacco', 'Rendimento', 'Passaggi', 'Difesa', 'Disciplina', 'Altro'];
export const fmtVal = (key, v) => {
  if (v == null) return '–';
  if (/rating/.test(key)) return Number(v).toFixed(2).replace('.', ',');
  if (/per_90|percentage|_team_match|expected|_diff/.test(key)) return Number(v).toFixed(2).replace('.', ',');
  if (/_team$/.test(key) && !Number.isInteger(v)) return Number(v).toFixed(2).replace('.', ',');
  return Number.isInteger(v) ? String(v) : Number(v).toFixed(1).replace('.', ',');
};

export function standingOf(list, idx, key, avgIn = null) {
  const n = list.length;
  const v = Number(list[idx][3]);
  const neg = NEG_RE.test(key);
  const best = Math.max(...list.slice(0, 5).map((r) => Number(r[3]) || 0), 0.0001);
  const avg = avgIn != null ? avgIn : list.reduce((a, r) => a + (Number(r[3]) || 0), 0) / n;
  const top = Math.max(best * 1.05, avg * 1.6, v, 0.0001);
  const rank = neg ? n - idx : idx + 1;
  const frac = n > 1 ? (neg ? idx / (n - 1) : 1 - idx / (n - 1)) : 1;
  return { v, rank, frac, width: Math.max(3, Math.min(100, (v / top) * 100)), avg, avgPos: Math.min(100, (avg / top) * 100) };
}
export function zeroStandingOf(list, key, avgIn = null) {
  const n = list.length;
  const neg = NEG_RE.test(key);
  const best = Math.max(...list.slice(0, 5).map((r) => Number(r[3]) || 0), 0.0001);
  const avg = avgIn != null ? avgIn : list.reduce((a, r) => a + (Number(r[3]) || 0), 0) / n;
  const top = Math.max(best * 1.05, avg * 1.6, 0.0001);
  return { v: 0, rank: null, frac: neg ? 1 : 0, width: 0, avg, avgPos: Math.min(100, (avg / top) * 100) };
}

// barra che cresce da sinistra e scorre quando cambia il valore; lineetta tratteggiata con la media del campionato
export function Bar({ C, width, col, avgPos, avgText, delay = 0, grow = true }) {
  // barra di caricamento: a ogni cambio di valore (nuova statistica, tasto toccato) riparte da zero e scorre piano fino al valore (thread UI, niente scatti)
  const p = useSharedValue(grow ? 0 : width);
  const first = useRef(true);
  useEffect(() => {
    if (first.current && !grow) { first.current = false; return; }
    first.current = false;
    p.value = 0;
    p.value = withDelay(delay, withTiming(width, { duration: 900, easing: Easing.bezier(0.22, 0.8, 0.24, 1) }));
  }, [width]); // eslint-disable-line
  const w = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, p.value))}%` }));
  return (
    <View style={{ marginTop: 20, height: 9 }}>
      <View style={{ ...absFill, borderRadius: 99, backgroundColor: C.border, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', borderRadius: 99, backgroundColor: col }, w]} />
      </View>
      {avgText ? (
        <>
          <View style={{ position: 'absolute', left: `${avgPos}%`, top: -5, bottom: -5, width: 2, marginLeft: -1, justifyContent: 'space-between', opacity: 0.85 }}>
            {[0, 1, 2].map((i) => <View key={i} style={{ width: 2, height: 4, backgroundColor: C.ink }} />)}
          </View>
          <View style={{ position: 'absolute', left: `${Math.min(88, Math.max(12, avgPos))}%`, top: -20, transform: [{ translateX: -24 }], width: 48, alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 9.5, fontWeight: '700', backgroundColor: C.chip, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' }}>{avgText}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
const absFill = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 };

// riga: etichetta, valore a pillola colorata, posizione, barra
export function BarRow({ C, label, valueText, frac, width, avgPos, avgText, rank, first, delay = 0 }) {
  const col = bandColor(frac);
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderTopColor: C.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text style={{ flex: 1, color: C.ink2, fontSize: 12.5 }}>{label}</Text>
        <Text style={{ color: col, backgroundColor: `${col}26`, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 99, overflow: 'hidden', fontSize: 14, fontWeight: '600' }}>{valueText}</Text>
        <Text style={{ width: 42, textAlign: 'right', color: C.ink3, fontSize: 11, fontWeight: '700' }}>{rank ? `${rank}°` : ''}</Text>
      </View>
      <Bar C={C} width={width} col={col} avgPos={avgPos} avgText={avgText ? `media ${avgText}` : ''} delay={delay} />
    </View>
  );
}
