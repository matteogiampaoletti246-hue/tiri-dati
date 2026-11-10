// Scheda Arbitro nativa (/arbitro/:id): intestazione, ultime due stagioni (o totali) con Over/Under, medie e partite arbitrate (come Referee.jsx del sito).
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import './../shared/shim';
import { bootShared } from '../shared/boot';
import { refereeById, refGames, leagueRefAvg, refStatsIn } from '@/data/referees';
import { leagueById } from '@/data/leagues';
import { archIndex, LID_BY_FM } from '@/data/archive';
import { matchTint } from '@/data/matchTint';
import { comma } from '@/lib/format';
import { Panel, PanelTitle, LeagueLogo } from '../shared/ui';
import { TeamLogoN } from '../shared/Standings';
import { UnderBar, RefBar, CardIcon } from './PartitaInfo';

const initialsOf = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const dateOf = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' });
const okHex = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#38A2FF');

const TILES = [['games', 'Gare'], ['yellows', 'Gialli'], ['reds', 'Rossi'], ['penalties', 'Rigori']];
const ROWS = [['yellows', 'Cartellini gialli'], ['reds', 'Cartellini rossi'], ['fouls', 'Falli fischiati'], ['penalties', 'Rigori assegnati']];

function Tiles({ C, items }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {items.map(([l, v]) => (
        <View key={l} style={{ flex: 1 }}>
          <Text style={{ color: C.ink3, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase' }}>{l}</Text>
          <Text style={{ color: C.ink, fontSize: 20, fontWeight: '300', marginTop: 4, fontVariant: ['tabular-nums'] }}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function Cards({ C, n, big }) {
  if (!n) return null;
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><CardIcon size={big ? 15 : 11} /><Text style={{ color: C.ink, fontSize: big ? 14 : 11, fontWeight: '800' }}>x{n}</Text></View>;
}

function Row({ C, m, comp, openRoute }) {
  const [date, fm, sk, mid, home, away, hg, ag, tot, c1, c2, hid, aid] = m;
  const lg = leagueById(LID_BY_FM[Number(fm)]);
  const t = okHex(lg ? matchTint(lg.id, lg) : null);
  return (
    <Pressable onPress={() => openRoute(`/storico/${fm}/${sk}/${mid}`)} style={({ pressed }) => [{ paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: C.hair }, pressed && { opacity: 0.6 }]}>
      {lg ? <LinearGradient pointerEvents="none" colors={[`${t}38`, `${t}00`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {lg ? <LeagueLogo league={lg} size={16} C={C} /> : null}
        <Text style={{ color: C.ink3, fontSize: 10.5 }}>{dateOf(date)}{comp ? ` · ${comp}` : ''}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <Text numberOfLines={1} style={{ flex: 1, color: C.ink, fontSize: 13, textAlign: 'right' }}>{home}</Text>
        <TeamLogoN id={hid} name={home} size={20} C={C} />
        <Text style={{ minWidth: 38, textAlign: 'center', color: C.ink, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{hg}–{ag}</Text>
        <TeamLogoN id={aid} name={away} size={20} C={C} />
        <Text numberOfLines={1} style={{ flex: 1, color: C.ink, fontSize: 13 }}>{away}</Text>
      </View>
      {tot ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 }}>
          <MaterialCommunityIcons name="whistle-outline" size={14} color={C.ink3} />
          {c1 ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Text style={{ color: C.ink3, fontSize: 9.5 }}>1T</Text><Cards C={C} n={c1} /></View> : null}
          {c2 ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Text style={{ color: C.ink3, fontSize: 9.5 }}>2T</Text><Cards C={C} n={c2} /></View> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Text style={{ color: C.ink3, fontSize: 9.5 }}>Tot</Text><Cards C={C} n={tot} big /></View>
        </View>
      ) : null}
    </Pressable>
  );
}

function Body({ C, top, onBack, bottom, openRoute, referee }) {
  const [two, setTwo] = useState(null);
  const [g, setG] = useState(undefined);
  const [idx, setIdx] = useState(null);
  useEffect(() => {
    let on = true;
    refGames(referee.name).then((d) => { if (on) { setG(d); setTwo(d && d.n > 0 ? d : null); } });
    archIndex().then((i) => on && setIdx(i));
    return () => { on = false; };
  }, [referee.name]);
  const league = leagueById(referee.leagueId);
  const per = (v) => comma(referee.games ? v / referee.games : null, 2);
  const lg = referee.leagueId ? leagueRefAvg(referee.leagueId) : null;
  const st = lg ? refStatsIn(referee, referee.leagueId) : null;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'transparent' }} contentContainerStyle={{ paddingTop: top, paddingBottom: bottom + 24 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={onBack} hitSlop={12} style={{ width: 32, height: 38, justifyContent: 'center' }}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
          {league ? (
            <Pressable onPress={() => openRoute(`/campionato/${league.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 'auto', alignSelf: 'center' }}>
              <LeagueLogo league={league} size={18} C={C} />
              <Text style={{ color: C.ink3, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{league.name}</Text>
            </Pressable>
          ) : <Text style={{ color: C.ink3, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', alignSelf: 'center' }}>Arbitro</Text>}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 20, marginTop: 16 }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip, borderWidth: 1, borderColor: C.border }}><Text style={{ color: C.ink2, fontSize: 24, fontWeight: '300' }}>{initialsOf(referee.name)}</Text></View>
          <View style={{ flex: 1, paddingTop: 4 }}>
            <Text style={{ color: C.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.5 }}>{referee.name}</Text>
            <Text numberOfLines={1} style={{ color: C.ink3, fontSize: 11.5, marginTop: 4 }}>{referee.country} · {two ? `${two.n} gare nelle ultime 2 stagioni` : `${referee.games} gare arbitrate`}</Text>
          </View>
        </View>
      </View>
      <View style={{ marginTop: 24, gap: 28 }}>
        {two ? (
          <View style={{ paddingHorizontal: 20 }}>
            <Tiles C={C} items={[['Gare', two.n], ['Cartellini', two.m.reduce((a, x) => a + (x[8] || 0), 0)], ['Cart. / gara', two.y != null ? comma(two.y, 2) : null], ['Falli / gara', two.fo != null ? comma(two.fo, 1) : null]].filter((t) => t[1] != null)} />
            <Text style={{ color: C.ink3, fontSize: 10, marginTop: 8 }}>Ultime 2 stagioni, tutte le competizioni.</Text>
            <Panel C={C} tint="transparent" style={{ marginTop: 16 }}><UnderBar C={C} games={two.m} /></Panel>
          </View>
        ) : (
          <>
            <View style={{ paddingHorizontal: 20 }}><Tiles C={C} items={TILES.map(([k, l]) => [l, referee[k]])} /></View>
            {lg && st ? (
              <View style={{ paddingHorizontal: 20 }}>
                <PanelTitle C={C}>Rispetto agli altri arbitri</PanelTitle>
                <Panel C={C}>
                  <RefBar C={C} label="Ammonizioni / partita" v={st.y} avg={lg.y} sorted={lg.ys} />
                  <View style={{ borderTopWidth: 1, borderTopColor: C.hair }}><RefBar C={C} label="Falli fischiati / partita" v={st.fo} avg={lg.fo} sorted={lg.fos} /></View>
                  <Text style={{ color: C.ink3, fontSize: 10, paddingHorizontal: 16, paddingBottom: 12 }}>La lineetta è la media stagionale degli arbitri del campionato ({lg.n} arbitri).</Text>
                </Panel>
              </View>
            ) : null}
            <View style={{ paddingHorizontal: 20 }}>
              <PanelTitle C={C}>Medie</PanelTitle>
              <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 8 }}><View style={{ flex: 1 }} /><Text style={{ width: 44, textAlign: 'right', color: C.ink3, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase' }}>Totale</Text><Text style={{ width: 54, textAlign: 'right', color: C.ink3, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase' }}>Per gara</Text></View>
              <Panel C={C} style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
                {ROWS.map(([k, l], i) => (
                  <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.hair }}>
                    <Text numberOfLines={1} style={{ flex: 1, color: C.ink2, fontSize: 13 }}>{l}</Text>
                    <Text style={{ width: 44, textAlign: 'right', color: C.ink3, fontSize: 12.5, fontVariant: ['tabular-nums'] }}>{referee[k]}</Text>
                    <Text style={{ width: 54, textAlign: 'right', color: C.ink, fontSize: 13.5, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{per(referee[k])}</Text>
                  </View>
                ))}
              </Panel>
            </View>
          </>
        )}
        {g && g.m && g.m.length ? (
          <View>
            <View style={{ paddingHorizontal: 20, paddingTop: 12 }}><PanelTitle C={C} right={String(g.n)}>Partite arbitrate · ultime 2 stagioni</PanelTitle></View>
            {g.m.map((m) => <Row key={`${m[1]}-${m[3]}`} C={C} m={m} comp={idx && idx[m[1]] ? idx[m[1]].n : ''} openRoute={openRoute} />)}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

export default function Arbitro({ C, top, onBack, bottom = 90, openRoute, params }) {
  const id = params && params.id ? decodeURIComponent(params.id) : null;
  const [ref0, setRef] = useState(undefined);
  useEffect(() => { let on = true; setRef(undefined); bootShared().then(() => on && setRef(refereeById(id) || null)).catch(() => on && setRef(null)); return () => { on = false; }; }, [id]);
  useEffect(() => { if (ref0 === null) onBack && onBack(); }, [ref0]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ref0) return <View style={{ flex: 1, paddingTop: top, backgroundColor: 'transparent' }}><Pressable onPress={onBack} hitSlop={12} style={{ paddingHorizontal: 20, height: 44, justifyContent: 'center' }}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable><View style={{ margin: 20, height: 90, borderRadius: 22, backgroundColor: C.skBase }} /></View>;
  return <Body C={C} top={top} onBack={onBack} bottom={bottom} openRoute={openRoute} referee={ref0} />;
}
