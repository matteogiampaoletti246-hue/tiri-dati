// Riepilogo della partita (nativo): Momentum, cronologia (Riassunto), scheda stadio, arbitro, forma. Stessi dati del sito.
import React, { useRef, useState } from 'react';
import { View, Text, PanResponder } from 'react-native';
import Svg, { Defs, ClipPath, Rect, Path, Line, Circle, LinearGradient, Stop } from 'react-native-svg';
import { Panel } from '../shared/ui';
import { BallIcon, BootIcon } from '../shared/Icons';
import PlayerLinkN from '../shared/PlayerLinkN';
import { matchColors, shown } from '@/lib/tint';
import { StadioCard, RefereeCard, FormCard, SubIcon, CardIcon } from './PartitaInfo';

const Card = ({ C, title, children, noPad }) => (
  <Panel C={C} style={{ marginHorizontal: 16 }}>
    <Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>{title}</Text>
    <View style={noPad ? null : { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}>{children}</View>
  </Panel>
);

// ── Momentum: positivo = squadra di casa. Linea con due aree nei colori sociali, mirino che segue il dito minuto per minuto.
function Momentum({ C, values, events, home, away }) {
  const [W, setW] = useState(0);
  const [hov, setHov] = useState(null);
  const wRef = useRef(0);
  const hide = useRef(null);
  const held = useRef(false);
  const holdT = useRef(null);
  const n = values.length;
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => true,
    // il mirino segue il dito solo dopo una breve pressione: un trascinamento veloce e' dello swipe (indietro / tra schede)
    onPanResponderGrant: (e) => { clearTimeout(hide.current); held.current = false; clearTimeout(holdT.current); holdT.current = setTimeout(() => { held.current = true; }, 180); pick(e.nativeEvent.locationX); },
    onPanResponderMove: (e) => { if (held.current) pick(e.nativeEvent.locationX); },
    onPanResponderRelease: () => { clearTimeout(holdT.current); hide.current = setTimeout(() => setHov(null), 1200); },
    onPanResponderTerminate: () => { clearTimeout(holdT.current); hide.current = setTimeout(() => setHov(null), 400); },
  })).current;
  const pick = (x) => { if (!wRef.current) return; setHov(Math.round(Math.min(1, Math.max(0, x / wRef.current)) * (n - 1))); };
  const max = Math.max(40, ...values.map((v) => Math.abs(v)));
  const goals = events.filter((e) => e.type === 'goal');
  const H = 130;
  const mid = H / 2;
  const [mh, ma] = matchColors(home, away);
  const HC = shown(mh);
  const AC = shown(ma);
  const xOf = (minute) => Math.min(1, parseInt(String(minute), 10) / (n * 3)) * W;
  const pts = values.map((v, i) => [(i / (n - 1 || 1)) * W, mid - (v / max) * (mid - 6)]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const hv = hov == null ? null : values[hov];
  const minute = hov == null ? 0 : Math.round((hov / (n - 1 || 1)) * 90);
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: HC }} /><Text style={{ color: C.ink, fontSize: 11.5, fontWeight: '700' }}>{home ? home.short : 'Casa'}</Text></View>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={{ color: C.ink, fontSize: 11.5, fontWeight: '700' }}>{away ? away.short : 'Trasferta'}</Text><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: AC }} /></View>
      </View>
      <View style={{ height: H }} onLayout={(e) => { wRef.current = e.nativeEvent.layout.width; setW(e.nativeEvent.layout.width); }} {...pan.panHandlers}>
        {W ? (
          <Svg width={W} height={H}>
            <Defs>
              <ClipPath id="mup"><Rect x="0" y="0" width={W} height={mid} /></ClipPath>
              <ClipPath id="mdn"><Rect x="0" y={mid} width={W} height={mid} /></ClipPath>
              <LinearGradient id="mgu" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={HC} stopOpacity=".95" /><Stop offset="1" stopColor={HC} stopOpacity=".45" /></LinearGradient>
              <LinearGradient id="mgd" x1="0" y1="1" x2="0" y2="0"><Stop offset="0" stopColor={AC} stopOpacity=".95" /><Stop offset="1" stopColor={AC} stopOpacity=".45" /></LinearGradient>
            </Defs>
            <Path d={`${path} L${W} ${mid} L0 ${mid} Z`} fill="url(#mgu)" clipPath="url(#mup)" />
            <Path d={`${path} L${W} ${mid} L0 ${mid} Z`} fill="url(#mgd)" clipPath="url(#mdn)" />
            <Path d={path} fill="none" stroke={C.ink} strokeOpacity=".85" strokeWidth="1.5" strokeLinejoin="round" />
            <Line x1="0" x2={W} y1={mid} y2={mid} stroke={C.hair} strokeWidth="1" />
            <Line x1={W / 2} x2={W / 2} y1="0" y2={H} stroke={C.hair} strokeDasharray="3 3" strokeWidth="1" />
            {goals.map((g, i) => <Circle key={i} cx={xOf(g.minute)} cy={g.team === 'home' ? 8 : H - 8} r="3.6" fill={g.team === 'home' ? HC : AC} stroke={C.ink} strokeWidth="1" />)}
            {hov != null ? (
              <>
                <Line x1={pts[hov][0]} x2={pts[hov][0]} y1="0" y2={H} stroke={C.ink2} strokeDasharray="3 3" strokeWidth="1" />
                <Circle cx={pts[hov][0]} cy={pts[hov][1]} r="3.8" fill={hv >= 0 ? HC : AC} stroke={C.ink} strokeWidth="1.2" />
              </>
            ) : null}
          </Svg>
        ) : null}
        {hov != null && W ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: -6, left: Math.min(W - 90, Math.max(0, pts[hov][0] - 45)), backgroundColor: C.sheet, borderColor: C.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ color: C.ink, fontSize: 10.5, fontWeight: '700' }}>{minute}' · {hv >= 0 ? (home ? home.short : 'Casa') : (away ? away.short : 'Trasferta')}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ color: C.ink3, fontSize: 10.5 }}>0'</Text><Text style={{ color: C.ink3, fontSize: 10.5 }}>45'</Text><Text style={{ color: C.ink3, fontSize: 10.5 }}>90'</Text>
      </View>
    </View>
  );
}

// ── Riassunto: cronologia con linea al centro, eventi recenti in alto, casa a sinistra e trasferta a destra.
const shortName = (nm) => {
  if (/^\(?\s*(tbd|tba|n\/a|unknown)\s*\)?$/i.test(String(nm || '').trim())) return '';
  const t = String(nm || '').trim().split(/\s+/);
  if (t.length < 2) return t[0] || '';
  if (/^[A-Za-zÀ-ÿ]\.$/.test(t[0])) return t.join(' ');
  return `${t[0][0].toUpperCase()}. ${t.slice(1).join(' ')}`;
};
const minNum = (m) => parseInt(String(m), 10) || 0;
function withMarks(events, finished) {
  const out = [];
  let gh = 0; let ga = 0; let htDone = false;
  const htScore = () => [events.filter((e) => e.type === 'goal' && e.team === 'home' && minNum(e.minute) <= 45).length, events.filter((e) => e.type === 'goal' && e.team === 'away' && minNum(e.minute) <= 45).length];
  const hasSecond = events.some((e) => minNum(e.minute) > 45);
  events.forEach((e) => {
    if (!htDone && minNum(e.minute) > 45) { out.push({ mark: `PT ${htScore().join(' – ')}` }); htDone = true; }
    if (e.type === 'goal') e.team === 'home' ? gh++ : ga++;
    out.push(e);
  });
  if (!hasSecond && events.length && (finished || events.some((e) => minNum(e.minute) >= 45))) out.push({ mark: `PT ${htScore().join(' – ')}` });
  if (finished) out.push({ mark: `FT ${gh} – ${ga}` });
  return out;
}
const EventIcon = ({ e, size = 18 }) => (e.type === 'goal' ? <BallIcon size={size} /> : e.type === 'sub' ? <SubIcon size={size} /> : <CardIcon red={e.type === 'red'} size={size} />);

function Lines({ C, e, align, match, openRoute }) {
  const al = align === 'right' ? 'right' : 'left';
  const main = e.type === 'sub' ? e.inName : e.name;
  return (
    <View style={{ flexShrink: 1 }}>
      <Text style={{ color: C.ink, fontSize: 13, fontWeight: '700', textAlign: al }}>
        <PlayerLinkN match={match} name={main} openRoute={openRoute}>{shortName(main)}</PlayerLinkN>
        {e.pen ? ' (rig.)' : ''}{e.og ? ' (aut.)' : ''}
      </Text>
      {e.type === 'sub' ? <Text style={{ color: C.ink3, fontSize: 11, textAlign: al }}><PlayerLinkN match={match} name={e.name} openRoute={openRoute}>{shortName(e.name)}</PlayerLinkN></Text> : null}
      {e.type === 'goal' && (e.assist || e.score) ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: al === 'right' ? 'flex-end' : 'flex-start', gap: 3, flexWrap: 'wrap' }}>
          {e.assist ? <><BootIcon size={13} /><Text style={{ color: C.ink3, fontSize: 11 }}><PlayerLinkN match={match} name={e.assist} openRoute={openRoute}>{shortName(e.assist)}</PlayerLinkN>{e.score ? ' · ' : ''}</Text></> : null}
          {e.score ? <Text style={{ color: C.ink3, fontSize: 11 }}>{e.score[0]} – {e.score[1]}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function Riassunto({ C, match, events, finished, home, away, openRoute }) {
  const rows = withMarks(events, finished);
  const [hc, ac] = matchColors(home, away);
  const list = [...rows].reverse();
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
      <View style={{ position: 'absolute', top: 12, bottom: 12, left: '50%', marginLeft: -1, width: 2, borderRadius: 1, backgroundColor: C.hair }} />
      {list.map((r, i) => {
        if (r.mark) return <View key={i} style={{ alignItems: 'center', marginVertical: 8 }}><Text style={{ color: C.ink2, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, backgroundColor: C.chip, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' }}>{r.mark}</Text></View>;
        const isH = r.team === 'home';
        const col = shown(isH ? hc : ac);
        const min = <Text style={{ width: 26, color: C.ink2, fontSize: 12, fontWeight: '800', textAlign: isH ? 'right' : 'left' }}>{r.minute}'</Text>;
        return (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingRight: 4 }}>
              {isH ? <><Lines C={C} e={r} align="right" match={match} openRoute={openRoute} /><EventIcon e={r} />{min}</> : null}
            </View>
            <View style={{ width: 11, height: 11, borderRadius: 6, marginHorizontal: 2.5, backgroundColor: C.bg, borderWidth: 2.5, borderColor: col }} />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
              {!isH ? <>{min}<EventIcon e={r} /><Lines C={C} e={r} align="left" match={match} openRoute={openRoute} /></> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Scheda Riepilogo: ogni riquadro compare solo se ha dati; senza momentum si parte dal Riassunto.
export default function Riepilogo({ C, match, view, home, away, openRoute }) {
  const events = view.events || [];
  const hasMomentum = !!(view.momentum && view.momentum.length);
  return (
    <View style={{ gap: 16, paddingTop: 12, paddingBottom: 24 }}>
      {hasMomentum ? <Card C={C} title="Momentum"><Momentum C={C} values={view.momentum} events={events} home={home} away={away} /></Card> : null}
      {events.length ? <Card C={C} title="Riassunto" noPad><Riassunto C={C} match={match} events={events} finished={match.status === 'finished'} home={home} away={away} openRoute={openRoute} /></Card> : null}
      <StadioCard C={C} match={match} openRoute={openRoute} />
      <RefereeCard C={C} match={match} openRoute={openRoute} />
      <FormCard C={C} match={match} home={home} away={away} openRoute={openRoute} />
    </View>
  );
}
