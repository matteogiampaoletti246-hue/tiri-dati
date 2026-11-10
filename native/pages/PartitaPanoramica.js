// Panoramica della partita non iniziata (nativo): forma, numeri da tenere d'occhio (storie), giocatori migliori, duello in numeri, stadio, arbitro.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder, Animated } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Text as SText } from 'react-native-svg';
import useAsync from '@/hooks/useAsync';
import { leagueById } from '@/data/leagues';
import { matchKeyNumbers } from '@/data/extras';
import { matchKeyPlayers } from '@/data/keyPlayers';
import { playersByTeam } from '@/data/players';
import { playerReliability, okVoto } from '@/data/topPlayers';
import { rankOf, hasMetrics } from '@/data/standings';
import { archiveMetrics, listMetrics } from '@/data/archiveMetrics';
import { scoreColor } from '@/lib/calc';
import { comma } from '@/lib/format';
import { Panel, Face, TeamCrest } from '../shared/ui';
import { FormCard, StadioCard, RefereeCard } from './PartitaInfo';

const Title = ({ C, children }) => <Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{children}</Text>;

// ── Numeri da tenere d'occhio (storie): avanzamento automatico, tocco a destra/sinistra, tenuto premuto = pausa, swipe di lato.
const DUR = 5500;
const HOLD_MS = 180;
const SWIPE_PX = 40;
const H = 232;

function Slide({ C, card, home, away, league }) {
  const team = card.side === 'home' ? home : card.side === 'away' ? away : null;
  const cs = (team && team.colors) || (league && league.colors) || [];
  const c1 = cs[0] || C.storyBase;
  const c2 = cs[1] || cs[0] || C.storyBase;
  const art = (team ? team.crest : league ? league.logo : null) || null;
  const player = card.kind === 'player';
  const crest = player ? (team ? team.crest : null) : art;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      {crest ? <Image source={{ uri: crest }} blurRadius={22} style={{ position: 'absolute', left: -30, top: -30, right: -30, bottom: -30, opacity: 0.6 }} contentFit="cover" /> : null}
      {!player && art ? <Image source={{ uri: art }} style={{ position: 'absolute', right: 18, top: 40, width: 96, height: 96, zIndex: 2 }} contentFit="contain" /> : null}
      {player ? (
        <>
          <Text style={{ position: 'absolute', right: 12, top: 22, zIndex: 2, fontSize: 84, fontWeight: '800', letterSpacing: -5, color: 'rgba(255,255,255,.18)' }}>{card.rank}°</Text>
          <View style={{ position: 'absolute', right: 0, bottom: 0, width: '57%', height: '92%', zIndex: 1 }}>
            {card.photo ? <Image source={{ uri: card.photo }} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition="top" /> : null}
            <LinearGradient colors={[c1, 'rgba(0,0,0,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.45, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          </View>
        </>
      ) : null}
      <LinearGradient colors={['rgba(0,0,0,.25)', 'rgba(0,0,0,.08)', C.storyScrim]} locations={[0, 0.45, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }} />
      <View style={{ flex: 1, zIndex: 3, paddingTop: 28, paddingHorizontal: 16, paddingBottom: 14, justifyContent: 'flex-end' }}>
        <View style={{ position: 'absolute', top: 26, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          {crest ? <Image source={{ uri: crest }} style={{ width: 20, height: 20 }} contentFit="contain" /> : null}
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 11.5, fontWeight: '800', flexShrink: 1 }}>{player ? `${card.stat} ogni 90'` : (team ? team.name : league ? league.name : '')}</Text>
        </View>
        {player ? <Text numberOfLines={1} style={{ color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 6, maxWidth: '60%' }}>{card.name}</Text> : null}
        <Text style={{ color: '#fff', fontSize: 50, fontWeight: '800', letterSpacing: -1 }}>{player ? comma(card.p90, 2) : `${comma(card.value, card.digits)}${card.unit || ''}`}</Text>
        {player ? (card.tot != null ? <Text style={{ color: 'rgba(255,255,255,.84)', fontSize: 13.5, fontWeight: '700', marginTop: 5, maxWidth: '62%' }}>{card.tot} {card.unit} in totale</Text> : null)
          : <Text style={{ color: 'rgba(255,255,255,.84)', fontSize: 13.5, fontWeight: '700', marginTop: 5, maxWidth: '62%' }}>{card.label}</Text>}
        {player ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.95)', color: '#0F172A', overflow: 'hidden' }}>{card.rank}° in {card.comp}</Text>
            {card.also && card.also.length ? <Text numberOfLines={1} style={{ flexShrink: 1, color: 'rgba(255,255,255,.84)', fontSize: 11, fontWeight: '700' }}>anche {card.also.map((a) => `${a.rank}° ${a.label.toLowerCase()}`).join(', ')}</Text> : null}
          </View>
        ) : card.note ? <View style={{ flexDirection: 'row', marginTop: 10 }}><Text style={{ fontSize: 11, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.95)', color: '#0F172A', overflow: 'hidden' }}>{card.note}</Text></View> : null}
      </View>
    </View>
  );
}

function Story({ C, cards, home, away, league }) {
  const n = cards.length;
  const [idx, setIdx] = useState(0);
  const [held, setHeld] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const prog = useRef(new Animated.Value(0)).current;
  const st = useRef({ acc: 0, held: false, idx: 0, n, down: null, holdT: 0, raf: 0, last: 0, drag: false });
  st.current.n = n;
  st.current.idx = idx;
  const go = (i) => {
    const s = st.current;
    const next = ((i % s.n) + s.n) % s.n;
    s.acc = 0;
    prog.setValue(0);
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    setIdx(next);
  };
  const goRef = useRef(go);
  goRef.current = go;
  useEffect(() => {
    const s = st.current;
    const tick = (now) => {
      s.raf = requestAnimationFrame(tick);
      if (s.held) { s.last = now; return; }
      s.acc += Math.min(500, now - (s.last || now));
      s.last = now;
      if (s.acc >= DUR) { goRef.current(s.idx + 1); return; }
      prog.setValue(s.acc / DUR);
    };
    s.raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(s.raf); clearTimeout(s.holdT); };
  }, []); // eslint-disable-line
  const setHold = (v) => { st.current.held = v; setHeld(v); };
  const width = useRef(0);
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => !st.current.drag,
    onPanResponderGrant: (e) => {
      const s = st.current;
      s.down = { x: e.nativeEvent.locationX, t: Date.now() };
      s.drag = false;
      clearTimeout(s.holdT);
      s.holdT = setTimeout(() => setHold(true), HOLD_MS);
    },
    onPanResponderMove: (_, g) => {
      const s = st.current;
      if (!s.drag && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy)) { s.drag = true; clearTimeout(s.holdT); setHold(true); }
    },
    onPanResponderRelease: (_, g) => {
      const s = st.current;
      const d = s.down;
      clearTimeout(s.holdT);
      const wasHeld = s.held;
      setHold(false);
      s.down = null;
      if (!d) return;
      if (s.drag) { s.drag = false; if (Math.abs(g.dx) > SWIPE_PX) go(g.dx < 0 ? s.idx + 1 : s.idx - 1); return; }
      if (wasHeld && Date.now() - d.t > HOLD_MS) return;
      go(d.x < width.current / 3 ? s.idx - 1 : s.idx + 1);
    },
    onPanResponderTerminate: () => { const s = st.current; clearTimeout(s.holdT); s.drag = false; setHold(false); },
  })).current;
  const cur = cards[Math.min(idx, n - 1)];
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <View onLayout={(e) => { width.current = e.nativeEvent.layout.width; }} {...pan.panHandlers} style={{ height: H, borderRadius: 22, overflow: 'hidden', backgroundColor: C.storyBase }}>
        <Animated.View style={{ flex: 1, opacity: fade }}><Slide C={C} card={cur} home={home} away={away} league={league} /></Animated.View>
        <View pointerEvents="none" style={{ position: 'absolute', left: 14, right: 14, top: 11, flexDirection: 'row', gap: 4, zIndex: 4 }}>
          {cards.map((c, j) => (
            <View key={j} style={{ flex: 1, height: 2.5, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,.32)' }}>
              {j < idx ? <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,.95)' }} /> : j === idx ? <Animated.View style={{ height: '100%', backgroundColor: 'rgba(255,255,255,.95)', width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} /> : null}
            </View>
          ))}
        </View>
        {held ? <Text style={{ position: 'absolute', right: 14, top: 22, zIndex: 4, fontSize: 9.5, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.2)', color: '#fff', overflow: 'hidden' }}>PAUSA</Text> : null}
      </View>
    </View>
  );
}

function KeyNumbers({ C, match, home, away }) {
  const teamCards = matchKeyNumbers(match);
  const { data: playerCards } = useAsync(() => matchKeyPlayers(match), [match]);
  const cards = useMemo(() => {
    const ref = teamCards.filter((c) => c.side === 'ref');
    const T = teamCards.filter((c) => c.side !== 'ref');
    const P = [...(playerCards || [])];
    const out = [];
    while (T.length || P.length) { if (T.length) out.push(T.shift()); if (P.length) out.push(P.shift()); }
    return [...out, ...ref];
  }, [teamCards, playerCards]);
  if (!cards.length) return null;
  const league = leagueById(match.leagueId);
  return (
    <View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}><Title C={C}>Numeri da tenere d'occhio</Title></View>
      <Story C={C} cards={cards} home={home} away={away} league={league} />
    </View>
  );
}

// ── Giocatori migliori (concept B): affidabilita' tiri della stagione, in mancanza il voto medio.
const ratingColor = (v) => (v >= 7.5 ? '#17944F' : v >= 6.75 ? '#8FCF63' : v >= 6.25 ? '#EBCB3B' : v >= 5.5 ? '#C79A12' : v >= 4.5 ? '#F0816C' : '#D92B22');
function top3(teamId, date, line) {
  const list = playersByTeam(teamId);
  const rel = list.map((p) => ({ p, v: (playerReliability(p, date, line) || {}).voto })).filter((x) => okVoto(x.v)).sort((a, b) => b.v - a.v).slice(0, 3);
  if (rel.length) return { rows: rel, kind: 'aff' };
  return { rows: list.filter((p) => p.rating).sort((a, b) => b.rating - a.rating).slice(0, 3).map((p) => ({ p, v: p.rating })), kind: 'rating' };
}
export const hasBestPlayers = (match) => !!(top3(match.homeId, match.date, 1.5).rows.length || top3(match.awayId, match.date, 1.5).rows.length);
const sur = (p) => p.name.split(' ').slice(-1)[0];

function BestPlayers({ C, match, home, away, openRoute }) {
  const [line, setLine] = useState(1.5);
  const Hh = top3(match.homeId, match.date, line);
  const A = top3(match.awayId, match.date, line);
  const aff = Hh.kind === 'aff' || A.kind === 'aff';
  const voteColor = (v) => (aff ? scoreColor(v) : ratingColor(v));
  const n = Math.max(Hh.rows.length, A.rows.length);
  if (!n) return null;
  return (
    <Panel C={C} style={{ marginHorizontal: 16 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}><Title C={C}>Giocatori migliori</Title></View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}>
        {aff ? (
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
            {[0.5, 1.5, 2.5].map((l) => (
              <Pressable key={l} onPress={() => setLine(l)} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 999, backgroundColor: line === l ? C.thumb : C.chip, borderWidth: line === l ? 1 : 0, borderColor: C.thumbBd }}>
                <Text style={{ color: line === l ? C.ink : C.ink3, fontSize: 13, fontWeight: '700' }}>Over {String(l).replace('.', ',')}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 4 }}><TeamCrest team={home} size={20} C={C} /><TeamCrest team={away} size={20} C={C} /></View>
        {Array.from({ length: n }).map((_, i) => {
          const a = Hh.rows[i]; const b = A.rows[i];
          const tot = ((a && a.v) || 0) + ((b && b.v) || 0) || 1;
          return (
            <View key={i} style={{ paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: C.hair }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>{a ? <Pressable onPress={() => openRoute('/giocatore/' + a.p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}><Face uri={a.p.photo} size={36} /><Text numberOfLines={1} style={{ color: C.ink, fontSize: 12.5, fontWeight: '700', flexShrink: 1 }}>{sur(a.p)}</Text></Pressable> : null}</View>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>{b ? <Pressable onPress={() => openRoute('/giocatore/' + b.p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}><Text numberOfLines={1} style={{ color: C.ink, fontSize: 12.5, fontWeight: '700', flexShrink: 1 }}>{sur(b.p)}</Text><Face uri={b.p.photo} size={36} /></Pressable> : null}</View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Text style={{ width: 38, color: a ? voteColor(a.v) : C.ink, fontSize: 14, fontWeight: '800' }}>{a ? comma(a.v, 2) : ''}</Text>
                <View style={{ flex: 1, flexDirection: 'row', gap: 3, height: 7 }}>
                  <View style={{ width: `${(((a && a.v) || 0) / tot) * 100}%`, backgroundColor: a ? voteColor(a.v) : 'transparent', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }} />
                  <View style={{ flex: 1, backgroundColor: b ? voteColor(b.v) : 'transparent', borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
                </View>
                <Text style={{ width: 38, textAlign: 'right', color: b ? voteColor(b.v) : C.ink, fontSize: 14, fontWeight: '800' }}>{b ? comma(b.v, 2) : ''}</Text>
              </View>
            </View>
          );
        })}
        <Text style={{ color: C.ink3, fontSize: 10.5, textAlign: 'center', marginTop: 8 }}>{aff ? `Affidabilità tiri · Over ${comma(line, 1)}` : 'Voto medio stagione'}</Text>
      </View>
    </Panel>
  );
}

// ── Duello in numeri: ragnatela con la posizione in campionato delle due squadre su ogni voce.
const AXES6 = [['xg', 'xG'], ['tiri', 'Tiri'], ['tiriInPorta', 'In porta'], ['possesso', 'Possesso'], ['corner', 'Corner'], ['precisione', 'Passaggi']];
const AXES_LIST = [...AXES6.filter(([k]) => k !== 'tiri'), ['gol', 'Gol fatti'], ['golSubiti', 'Gol subiti'], ['inviolata', 'Porta inv.']];
const INV = new Set(['golSubiti']);
const fracOf = (t, key, am) => {
  if (am) {
    const rows = am.am.tids().map((tid) => ({ tid, v: am.am.value(tid, key) })).filter((r) => r.v !== null).sort((a, b) => (INV.has(key) ? a.v - b.v : b.v - a.v));
    const i = rows.findIndex((r) => String(r.tid) === String(am.tid(t)));
    return i >= 0 && rows.length > 1 ? (rows.length - 1 - i) / (rows.length - 1) : null;
  }
  const r = rankOf(t.leagueId, key, t.id);
  return r && r.rank && r.total > 1 ? (r.total - r.rank) / (r.total - 1) : null;
};
function Radar2({ C, home, away, am, AXES }) {
  const S = 220; const c0 = S / 2; const R = 78;
  const pt = (i, f) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length; const r = R * (0.18 + 0.82 * f); return [c0 + r * Math.cos(a), c0 + r * Math.sin(a)]; };
  const poly = (t) => AXES.map(([k], i) => pt(i, fracOf(t, k, am) ?? 0).join(',')).join(' ');
  const hc = '#E0443A'; const ac = '#3B9DFF';
  return (
    <Svg width="100%" viewBox={`0 0 ${S} ${S}`} style={{ aspectRatio: 1, maxWidth: 300, alignSelf: 'center' }}>
      {[0.25, 0.5, 0.75, 1].map((g) => <Polygon key={g} points={AXES.map((_, i) => pt(i, g).join(',')).join(' ')} fill="none" stroke={C.hair} strokeWidth="1" />)}
      {AXES.map(([k, l], i) => { const [x, y] = pt(i, 1.18); return <SText key={k} x={x} y={y + 3} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={C.ink3}>{l}</SText>; })}
      <Polygon points={poly(home)} fill={`${hc}55`} stroke={hc} strokeWidth="2" />
      <Polygon points={poly(away)} fill={`${ac}55`} stroke={ac} strokeWidth="2" />
    </Svg>
  );
}
function Duello({ C, match, home, away }) {
  const a1 = match.archive ? archiveMetrics(match) : null;
  const am0 = match.archive ? (a1 && a1.tids().length ? a1 : listMetrics(match)) : null;
  const am = am0 ? { am: am0, tid: (t) => (t.id === match.homeId ? match.archive.hid : match.archive.aid) } : null;
  const baseAxes = am0 && am0.fromLists ? AXES_LIST : AXES6;
  const axes = home && away && am ? baseAxes.filter(([k]) => fracOf(home, k, am) !== null && fracOf(away, k, am) !== null) : baseAxes;
  const ok = home && away && (am ? am0.has(am.tid(home)) && am0.has(am.tid(away)) && axes.length >= 3 : hasMetrics(match.homeId) && hasMetrics(match.awayId));
  if (!ok) return null;
  return (
    <Panel C={C} style={{ marginHorizontal: 16, padding: 16 }}>
      <Title C={C}>Duello in numeri</Title>
      <View style={{ marginTop: 8 }}><Radar2 C={C} home={home} away={away} am={am} AXES={axes} /></View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 4 }}>
        {[[home, '#E0443A'], [away, '#3B9DFF']].map(([t, c], i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c }} /><TeamCrest team={t} size={16} C={C} /><Text style={{ color: C.ink, fontSize: 11.5, fontWeight: '700' }}>{t ? t.short : ''}</Text></View>
        ))}
      </View>
      <Text style={{ color: C.ink3, fontSize: 10, textAlign: 'center', marginTop: 4 }}>Più il vertice è lontano dal centro, meglio si piazza la squadra in campionato su quella voce.</Text>
    </Panel>
  );
}

export default function Panoramica({ C, match, home, away, openRoute }) {
  return (
    <View style={{ gap: 16, paddingTop: 12, paddingBottom: 24 }}>
      <FormCard C={C} match={match} home={home} away={away} openRoute={openRoute} />
      <KeyNumbers C={C} match={match} home={home} away={away} />
      {match.archive || !hasBestPlayers(match) ? null : <BestPlayers C={C} match={match} home={home} away={away} openRoute={openRoute} />}
      <Duello C={C} match={match} home={home} away={away} />
      <StadioCard C={C} match={match} openRoute={openRoute} />
      <RefereeCard C={C} match={match} openRoute={openRoute} />
    </View>
  );
}
