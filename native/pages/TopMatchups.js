// Migliori Matchup (nativo): giorni a scorrimento, statistica (angoli, cartellini, arbitri, tiri...) e modo (Over / Under / Divario).
// Stessi dati e calcoli del sito (`@/data/matchups`, `@/data/refMatchup`); il tocco su una scheda apre la partita.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import './../shared/shim';
import { bootShared } from '../shared/boot';
import { matchupRows, MATCHUP_TYPES, modeOptions, keepMode, defaultMode } from '@/data/matchups';
import { useDayReferees, refereeRows } from '@/data/refMatchup';
import { DATES, TODAY_INDEX, isoDate, matchesByDate } from '@/data/matches';
import { teamById } from '@/data/teams';
import { comma } from '@/lib/format';
import { matchColors } from '@/lib/tint';
import { TeamCrest } from '../shared/ui';
import { DayStripN, DayPagerN, EmptyDayN, nextWith } from '../shared/DayNav';
import Dropdown from '../shared/Dropdown';
import PageHead from '../shared/PageHead';
import StatIconN from '../shared/StatIconN';

const DAYS = DATES.slice(TODAY_INDEX);
const TODAY_I = 0;
const KEEP = { day: null, type: 'corner', mode: 'gap|total', stamp: '' }; // restano tornando da una partita
const SEEN = new Set(); // schede gia' entrate con l'animazione

const Side = ({ C, team, name, value }) => (
  <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
    <TeamCrest team={team} size={68} C={C} />
    <Text numberOfLines={2} style={{ color: C.ink, fontSize: 17, fontWeight: '800', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>{name}</Text>
    <Text style={{ color: C.ink, fontSize: 26, fontWeight: '800', marginTop: 2 }}>{value == null ? ' ' : comma(value, 1)}</Text>
  </View>
);

const Card = React.memo(function Card({ C, row, both, openRoute, enter }) {
  const home = teamById(row.homeId);
  const away = teamById(row.awayId);
  const [c1, c2] = matchColors(home, away);
  // la partita si trova prima per id FotMob (le nazionali non sempre hanno gli stessi id squadra), poi per le due squadre;
  // senza partita in Home si apre quella d'archivio (Nations League: fm + stagione dal file)
  const day = matchesByDate(row.date);
  const found = day.find((m) => m.fmId && String(m.fmId) === String(row.id)) || day.find((m) => m.homeId === row.homeId && m.awayId === row.awayId);
  const to = found ? `/match/${found.id}` : row.fm && row.sk ? `/match/a-${row.fm}-${row.sk}-${row.id}` : null;
  const body = (
    <View style={{ marginHorizontal: 12, marginTop: 14, marginBottom: 2 }}>
      <Pressable disabled={!to} onPress={() => openRoute(to)} style={({ pressed }) => [both && { shadowColor: C.medal[0], shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }, pressed && { opacity: 0.8 }]}>
      <LinearGradient colors={both ? [C.medal[0], C.medal[0]] : [c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 30, padding: 1.5 }}>
      <View style={{ borderRadius: 28.5, backgroundColor: C.sheet, overflow: 'hidden', paddingHorizontal: 12, paddingTop: 14, paddingBottom: 16 }}>
        <LinearGradient pointerEvents="none" colors={[c1 + 'B3', c1 + '14', c2 + '14', c2 + 'B3']} locations={[0, 0.42, 0.58, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <Text numberOfLines={1} style={{ color: C.ink3, fontSize: 15, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>{row.league}{found ? ` · ${found.kickoff}` : ''}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Side C={C} team={home} name={row.homeName} value={row.home} />
          <View style={{ width: 118, alignItems: 'center', paddingTop: 10 }}>
            <Text style={{ color: C.ink3, fontSize: 14, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' }}>{row.centerLabel}</Text>
            <Text style={{ color: C.medal[0], fontSize: 46, fontWeight: '800', marginTop: 2 }}>{comma(row.center, 1)}</Text>
            {row.referee
              ? <Text numberOfLines={2} style={{ color: C.ink2, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 8 }}>{row.referee.name}</Text>
              : <Text style={{ color: C.ink3, fontSize: 17, marginTop: 10 }}>{row.type.label}</Text>}
          </View>
          <Side C={C} team={away} name={row.awayName} value={row.away} />
        </View>
        <Text style={{ color: C.ink3, fontSize: 15, textAlign: 'center', marginTop: 12 }}>{row.referee ? `Gare arbitro ${row.referee.n}` : `Partite usate ${row.playedHome ?? '—'} / ${row.playedAway ?? '—'}`}</Text>
      </View>
      </LinearGradient>
      </Pressable>
      {both ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: -9, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ backgroundColor: C.medal[0], color: C.goldInk, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' }}>{both}</Text>
        </View>
      ) : null}
    </View>
  );
  return enter >= 0 ? <Animated.View entering={FadeInUp.delay(100 + enter * 60).duration(340)}>{body}</Animated.View> : body;
});

const Skel = ({ C, n = 3 }) => (
  <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
    {Array.from({ length: n }, (_, i) => <View key={i} style={{ height: 158, borderRadius: 24, backgroundColor: C.skBase, marginBottom: 12 }} />)}
  </View>
);

// Un giorno: classifica della statistica scelta. Cartellini e Arbitri si confrontano: la partita presente in entrambe le classifiche ha il bordo dorato.
function MatchupDay({ C, date, idx, typeKey, modeKey, active, onGo, openRoute, bottom }) {
  const isRef = typeKey === 'referees';
  const [mode, period] = modeKey.split('|');
  const crossed = isRef || (typeKey === 'cards' && mode !== 'gap');
  const { map, done } = useDayReferees(date, active && crossed);
  const [live, setLive] = useState(active);
  useEffect(() => { if (active) { setLive(true); return undefined; } const t = setTimeout(() => setLive(true), 500); return () => clearTimeout(t); }, [active]);
  if (!live) return <Skel C={C} />;
  const rows = isRef ? refereeRows(date, modeKey, map) : matchupRows(date, typeKey, modeKey);
  let other = null;
  if (crossed) other = new Set((isRef ? matchupRows(date, 'cards', modeKey) : refereeRows(date, modeKey, map)).map((r) => r.id));
  const label = `${mode === 'over' ? 'Over' : 'Under'} cartellini + arbitro${period === 'first' ? ' 1T' : ''}`;
  if (rows.length) {
    return (
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item, index }) => {
          const k = `${date}|${typeKey}|${modeKey}|${item.id}`;
          let enter = -1;
          if (active && index < 6 && !SEEN.has(k)) { SEEN.add(k); if (SEEN.size > 300) SEEN.delete(SEEN.values().next().value); enter = index; }
          return <Card C={C} row={item} both={other && other.has(item.id) ? label : null} openRoute={openRoute} enter={enter} />;
        }}
        initialNumToRender={6}
        windowSize={5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom + 20 }}
      />
    );
  }
  if (isRef && !done) return <Skel C={C} />;
  // arbitri: arrivano dopo, il prossimo giorno si cerca tra le partite con i cartellini (stesse partite del giorno)
  const next = nextWith(idx, DAYS.length, DAYS, (i) => matchupRows(isoDate(DAYS[i]), isRef ? 'cards' : typeKey, modeKey).length);
  return <EmptyDayN C={C} date={DAYS[idx]} index={idx} todayIndex={TODAY_I} title="Nessuna partita" next={next} onGo={onGo} noun={['partita', 'partite']} />;
}

const Head = ({ C, onSearch, onMenu }) => <PageHead C={C} title="Migliori Matchup" onSearch={onSearch} onMenu={onMenu} />;

export default function TopMatchups({ C, top, onSearch, onMenu, openRoute, bottom = 90 }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { let live = true; bootShared().then(() => { if (live) setReady(true); }, () => {}); return () => { live = false; }; }, []);
  if (!ready) return <View style={{ flex: 1, backgroundColor: 'transparent', paddingTop: top }}><Head C={C} onSearch={onSearch} onMenu={onMenu} /><Skel C={C} /></View>;
  return <Body C={C} top={top} onSearch={onSearch} onMenu={onMenu} openRoute={openRoute} bottom={bottom} />;
}

function Body({ C, top, onSearch, onMenu, openRoute, bottom }) {
  const today = isoDate(new Date());
  const fresh = KEEP.day === null || KEEP.stamp !== today;
  const [dayIdx, setDayIdx] = useState(fresh ? TODAY_I : Math.min(DAYS.length - 1, Math.max(0, KEEP.day)));
  const x = useSharedValue(dayIdx);
  const [typeKey, setTypeKey] = useState(fresh ? 'corner' : KEEP.type);
  const [modeKey, setModeKey] = useState(fresh ? defaultMode('corner') : KEEP.mode);
  KEEP.stamp = today; KEEP.day = dayIdx; KEEP.type = typeKey; KEEP.mode = modeKey;
  const pickType = (k) => { setTypeKey(k); setModeKey((m) => keepMode(k, m)); };
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent', paddingTop: top }}>
      <Head C={C} onSearch={onSearch} onMenu={onMenu} />
      <DayStripN C={C} dates={DAYS} todayIndex={TODAY_I} x={x} value={dayIdx} onChange={setDayIdx} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4 }}>
        <Dropdown C={C} options={MATCHUP_TYPES} value={typeKey} onChange={pickType} side="left" width={230} compact pillKey="label" icon={(o, col) => <StatIconN k={o.key} size={20} color={col} />} />
        <Dropdown C={C} options={modeOptions(typeKey)} value={modeKey} onChange={setModeKey} side="right" width={190} compact pillKey="label" />
      </View>
      <View style={{ flex: 1, marginTop: 6 }}>
        <DayPagerN count={DAYS.length} index={dayIdx} onIndex={setDayIdx} x={x}
          render={(i, active) => <MatchupDay key={`${i}|${typeKey}|${modeKey}`} C={C} date={isoDate(DAYS[i])} idx={i} typeKey={typeKey} modeKey={modeKey} active={active} onGo={setDayIdx} openRoute={openRoute} bottom={bottom} />} />
      </View>
    </View>
  );
}
