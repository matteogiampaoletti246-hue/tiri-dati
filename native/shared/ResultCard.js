// Scheda risultato nativa (stessi numeri del sito: lib/calc.js condiviso): anello del voto con tre barre, voci del modello e stake.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { comma, num } from '@/lib/format';
import { fmtLine, fmtPct, scoreColorSmooth } from '@/lib/calc';

const R = 46; const CIRC = 2 * Math.PI * R;

function Gauge({ C, score, bars, verdict }) {
  const has = score !== null && score !== undefined && !Number.isNaN(score);
  const target = has ? Math.max(0, Math.min(10, score)) : 0;
  const [shown, setShown] = useState(0);
  const cur = useRef(0); const raf = useRef(0); const seen = useRef(false);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const from = cur.current; const dur = seen.current ? 450 : 1500; seen.current = true;
    const t0 = Date.now();
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / dur); const e = 1 - Math.pow(1 - k, 3);
      cur.current = from + (target - from) * e; setShown(cur.current);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  const color = has ? scoreColorSmooth(shown) : C.ink3;
  const prog = target > 0 ? Math.min(1, shown / target) : 0;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <View style={{ width: 132, height: 132 }}>
          <Svg width={132} height={132} viewBox="0 0 120 120" style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx="60" cy="60" r={R} fill="none" stroke={C.hair} strokeWidth="9" />
            <Circle cx="60" cy="60" r={R} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${CIRC}`} strokeDashoffset={CIRC * (1 - Math.max(0, Math.min(1, shown / 10)))} />
          </Svg>
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color, fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{has ? comma(shown, 2) : '—'}</Text>
            <Text style={{ color: C.ink3, fontSize: 10, marginTop: 2 }}>su 10</Text>
          </View>
        </View>
        <View style={{ flex: 1, gap: 12 }}>
          {bars.map((b) => (
            <View key={b.label}>
              <Text style={{ color: C.ink3, fontSize: 11 }}>{b.label}</Text>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: C.hair, marginTop: 4, overflow: 'hidden' }}>
                <View style={{ height: 6, borderRadius: 3, width: `${Math.max(0, Math.min(1, b.value)) * prog * 100}%`, backgroundColor: scoreColorSmooth(b.value * 10 * prog) }} />
              </View>
            </View>
          ))}
        </View>
      </View>
      {verdict ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hair }}>
          <Text style={{ color: C.ink2, fontSize: 14 }}>{verdict.left}</Text>
          {verdict.right ? <Text style={{ color, fontSize: 14, fontWeight: '700' }}>{verdict.right}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const Metric = ({ C, label, value, strong }) => (
  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12, paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hair }}>
    <Text style={{ color: C.ink3, fontSize: 12, flexShrink: 1 }}>{label}</Text>
    <Text style={{ marginLeft: 'auto', color: C.ink, fontSize: 14.5, fontWeight: strong ? '700' : '500', textAlign: 'right' }}>{value}</Text>
  </View>
);

export default function ResultCard({ C, result, kind = 'player' }) {
  const { stake } = result;
  const stakeValue = stake.stake === null ? '—' : comma(stake.stake, 2);
  const caption = stake.note === 'Valore' ? 'Unità di stake suggerite' : stake.note === 'Non di valore' ? 'Giocata sconsigliata dal modello' : stake.note === 'Inserisci la quota' ? 'Inserisci la quota per calcolare lo stake' : 'Inserisci le statistiche per calcolare lo stake';
  const has = (v) => v !== null && v !== undefined;
  const bars = [
    has(result.probModel) ? { label: 'Probabilità modello', value: result.probModel } : null,
    has(result.hitRate) ? { label: 'Hit rate', value: result.hitRate } : null,
    has(result.probFinal) ? { label: 'Probabilità finale', value: result.probFinal } : null,
  ].filter(Boolean);
  const verdict = has(result.line) && has(result.score)
    ? { left: `${result.lineType === 'under' ? 'Under' : 'Over'} ${fmtLine(result.line)}`, right: result.probFinal > 0 ? `Quota giusta ≥ ${comma(1 / result.probFinal, 2)}` : null }
    : null;
  return (
    <View style={{ borderRadius: 22, overflow: 'hidden', backgroundColor: C.card2, borderWidth: 1, borderColor: C.border }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}>
        <Gauge C={C} score={result.score} bars={bars} verdict={verdict} />
        <Text style={{ marginTop: 12, textAlign: 'center', color: C.ink2, fontSize: 14 }}>{result.reliability.label}</Text>
      </View>
      <Metric C={C} label="Lambda" value={comma(result.lambda, 2)} />
      <Metric C={C} label="Linea" value={`${result.lineType === 'under' ? 'Under' : 'Over'} ${fmtLine(result.line)}`} />
      <Metric C={C} label="Probabilità modello" value={fmtPct(result.probModel)} />
      {kind === 'player' ? <Metric C={C} label="Hit rate" value={result.hitLabel || '—'} /> : null}
      <Metric C={C} label="Probabilità finale" value={fmtPct(result.probFinal)} strong />
      <Metric C={C} label="Probabilità implicita" value={fmtPct(result.impliedProb)} />
      <Metric C={C} label="Fascia quota" value={result.tier.value === null ? '—' : `${result.tier.label} · ${comma(result.tier.value, 1)}`} />
      <Metric C={C} label="Valore complessivo" value={result.combo.value === null ? '—' : `${num(result.combo.value)} · ${result.combo.label}`} />
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
        <View style={{ borderRadius: 22, padding: 18, backgroundColor: C.accTint, borderWidth: 1, borderColor: C.accRing }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: C.ink3, fontSize: 11 }}>Stake suggerito</Text>
            <Text style={{ fontSize: 44, fontWeight: '800', color: stake.stake === null ? C.ink3 : C.accent }}>{stakeValue}</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: C.hair, marginTop: 14, overflow: 'hidden' }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: C.accent, width: `${stake.stake === null ? 0 : Math.max(0, Math.min(1, stake.stake / 2)) * 100}%` }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}><Text style={{ color: C.ink3, fontSize: 10.5 }}>0</Text><Text style={{ color: C.ink3, fontSize: 10.5 }}>2 max</Text></View>
        </View>
        <Text style={{ marginTop: 8, textAlign: 'right', color: C.ink3, fontSize: 11 }}>{caption}</Text>
      </View>
    </View>
  );
}
