// Migliori Giocatori (nativo): giorni a scorrimento, soglia Over, statistica; righe nei colori della squadra con voto e tasto Calcolatore.
// Stessi dati e calcoli del sito (`@/data/topPlayers`); il tocco su una riga apre pannello (partita non iniziata) o scheda giocatore.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import './../shared/shim';
import { bootShared } from '../shared/boot';
import { bestPlayers, isFoulStat, loadBestFouls, THRESHOLDS, TOP_KEEP, TOP_STATS } from '@/data/topPlayers';
import { DATES, TODAY_INDEX, isoDate, matchesByDate } from '@/data/matches';
import { syncDayTimes } from '@/data/fotmob';
import { teamById } from '@/data/teams';
import { matchStarted, openPanel } from '@/data/playerPanel';
import { romeDay } from '@/data/util';
import { scoreColorSmooth } from '@/lib/calc';
import { comma } from '@/lib/format';
import { Face, TeamCrest } from '../shared/ui';
import { DayStripN, DayPagerN, EmptyDayN, nextWith } from '../shared/DayNav';
import Dropdown from '../shared/Dropdown';
import StatIconN from '../shared/StatIconN';
import { CALC_IN } from '../shared/calcIn';

const DAYS = DATES.slice(TODAY_INDEX);
const TODAY_I = 0;
const ANIM_ROWS = 8;
const CHILD_MS = 10 * 60 * 1000;
const ENTER = new Set(); // righe gia' entrate con l'animazione: tornando a vederle sono ferme

const FMT = (() => { try { return new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return null; } })();
// orario vero dalla partita in calendario (solo se la fonte lo conosce); se non c'e', solo giorno e data
const when = (match) => {
  const t = FMT ? FMT.format(new Date(match.ts)).replace(/\./g, '') : '';
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  const real = matchesByDate(romeDay(match.ts)).find((m) => m.homeId === match.homeId && m.awayId === match.awayId);
  const wd = cap.split(' ')[0];
  return real && real.kickoff && real.timeKnown !== false ? `${wd} ${real.kickoff}` : cap;
};

const Row = React.memo(function Row({ C, row, rank, threshold, stat, enter, tv, openRoute }) { // eslint-disable-line no-unused-vars
  const { player, match } = row;
  const team = teamById(player.teamId);
  const c1 = team && team.colors ? team.colors[0] : '#2C3E66';
  const rk = C.medal[rank - 1] || C.accent;
  const go = () => {
    TOP_KEEP.child = Date.now();
    if (!matchStarted(match)) openPanel(player.id); else openRoute('/giocatore/' + player.id);
  };
  const calc = () => {
    TOP_KEEP.child = Date.now();
    CALC_IN.v = { playerId: player.id, line: threshold, ts: match ? match.ts : null, stat };
    openRoute('/calcolatore');
  };
  const sides = match ? [teamById(match.homeId), teamById(match.awayId)] : null;
  const body = (
    <Pressable onPress={go} style={({ pressed }) => [{ marginHorizontal: 16, marginBottom: 10, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: C.border, backgroundColor: C.card2 }, pressed && { opacity: 0.8 }]}>
      <LinearGradient colors={[c1 + '55', 'rgba(255,255,255,0.03)']} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 0.2 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
        <View>
          <Face uri={player.photo} color={c1} size={50} />
          <View style={{ position: 'absolute', left: -6, top: -6, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: rk }}>
            <Text style={{ color: rank <= 3 ? C.goldInk : '#fff', fontSize: 12, fontWeight: '800' }}>{rank}</Text>
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: C.ink, fontSize: 14.5, fontWeight: '800' }}>{player.name}</Text>
          {sides ? sides.map((t, i) => {
            const own = t && t.id === player.teamId;
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: i ? 4 : 2 }}>
                {t ? <TeamCrest team={t} size={15} C={C} /> : null}
                <Text numberOfLines={1} style={{ flexShrink: 1, color: own ? C.ink : C.ink3, fontSize: own ? 12 : 11, fontWeight: own ? '800' : '400' }}>{t ? t.name : own ? player.teamName : match.oppName}</Text>
                {i ? <Text style={{ color: C.ink3, fontSize: 11 }}>· {when(match)}</Text> : null}
              </View>
            );
          }) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {team ? <TeamCrest team={team} size={15} C={C} /> : null}
              <Text numberOfLines={1} style={{ color: C.ink, fontSize: 12, fontWeight: '800' }}>{team ? team.name : player.teamName}</Text>
            </View>
          )}
          <LinearGradient colors={[c1, team && team.colors && team.colors[1] ? team.colors[1] : c1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 5, borderRadius: 3, marginTop: 8 }} />
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ color: scoreColorSmooth(row.voto), fontSize: 25, fontWeight: '800' }}>{comma(row.voto, 1)}</Text>
          <Pressable onPress={calc} hitSlop={8} style={({ pressed }) => [{ width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip, borderWidth: 1, borderColor: C.border }, pressed && { opacity: 0.6 }]}>
            <Ionicons name="calculator-outline" size={14} color={C.accent} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
  return enter >= 0 ? <Animated.View entering={FadeInUp.delay(100 + enter * 60).duration(340)}>{body}</Animated.View> : body;
});

const Skel = ({ C, n = 7 }) => (
  <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
    {Array.from({ length: n }, (_, i) => <View key={i} style={{ height: 96, borderRadius: 24, backgroundColor: C.skBase, marginBottom: 12 }} />)}
  </View>
);

function DayList({ C, day, idx, thr, stat, active, takeAnim, onGo, openRoute, bottom }) {
  const [anim] = useState(() => (active ? takeAnim() : false));
  const [rows, setRows] = useState(() => bestPlayers(day, thr, stat) || null);
  useEffect(() => {
    let live = true;
    const run = () => {
      const r = bestPlayers(day, thr, stat);
      if (r) { if (live) setRows(r); return; }
      if (isFoulStat(stat)) loadBestFouls(day, thr, stat).then(() => { if (live) setRows(bestPlayers(day, thr, stat) || []); }).catch(() => { if (live) setRows([]); });
      else if (live) setRows([]);
    };
    const t = setTimeout(run, active ? 20 : 900);
    return () => { live = false; clearTimeout(t); };
  }, [day, thr, stat, active]);
  // orari veri del giorno (FotMob): il calendario squadra ha solo un orario segnaposto
  const [tv, setTv] = useState(0);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => syncDayTimes(day).then((n) => { if (live && n) setTv((x) => x + 1); }).catch(() => 0), active ? 0 : 900);
    return () => { live = false; clearTimeout(t); };
  }, [day, active]);
  if (!rows) return <Skel C={C} />;
  if (!rows.length) {
    const cs = isFoulStat(stat) ? 'tiri' : stat;
    const next = nextWith(idx, DAYS.length, DAYS, (i) => (bestPlayers(isoDate(DAYS[i]), thr, cs) || []).length);
    return <EmptyDayN C={C} date={DAYS[idx]} index={idx} todayIndex={TODAY_I} title="Nessun giocatore" next={next} onGo={onGo} noun={['giocatore', 'giocatori']} />;
  }
  const enterOf = (row, k) => {
    if (!anim || k >= ANIM_ROWS) return -1;
    const key = `${day}|${thr}|${stat}|${row.player.id}`;
    if (ENTER.has(key)) return -1;
    ENTER.add(key);
    if (ENTER.size > 400) ENTER.delete(ENTER.values().next().value);
    return k;
  };
  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => String(r.player.id)}
      renderItem={({ item, index }) => <Row C={C} row={item} rank={index + 1} threshold={thr} stat={stat} enter={enterOf(item, index)} tv={tv} openRoute={openRoute} />}
      initialNumToRender={8}
      maxToRenderPerBatch={6}
      windowSize={5}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: bottom + 20 }}
    />
  );
}

export default function TopPlayers({ C, top, onSearch, openRoute, bottom = 90 }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { let live = true; bootShared().then(() => { if (live) setReady(true); }, () => {}); return () => { live = false; }; }, []);
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: top }}>
        <Head C={C} onSearch={onSearch} />
        <Skel C={C} />
      </View>
    );
  }
  return <Body C={C} top={top} onSearch={onSearch} openRoute={openRoute} bottom={bottom} />;
}

const Head = ({ C, onSearch }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 20 }}>
    <Text style={{ flex: 1, color: C.ink, fontSize: 22, fontWeight: '800' }}>Migliori Giocatori</Text>
    {onSearch ? <Pressable onPress={onSearch} hitSlop={10}><Ionicons name="search" size={22} color={C.ink2} /></Pressable> : null}
  </View>
);

function Body({ C, top, onSearch, openRoute, bottom }) {
  const today = isoDate(new Date());
  const [ret] = useState(() => { const b = !!TOP_KEEP.child && Date.now() - TOP_KEEP.child < CHILD_MS; TOP_KEEP.child = 0; return b; });
  const fresh = TOP_KEEP.day === null || TOP_KEEP.stamp !== today;
  const [dayIdx, setDayIdx] = useState(fresh ? TODAY_I : Math.min(DAYS.length - 1, Math.max(0, TOP_KEEP.day)));
  const x = useSharedValue(dayIdx);
  const [threshold, setThreshold] = useState(fresh ? '0.5' : TOP_KEEP.thr);
  const [stat, setStat] = useState(() => (ret && !fresh ? TOP_KEEP.stat : 'tiri'));
  const [shown, setShown] = useState(stat);
  const [anim, setAnim] = useState(ret ? 0 : 1);
  const used = useRef(0);
  const timer = useRef(0);
  const leave = useSharedValue(1);
  TOP_KEEP.stamp = today; TOP_KEEP.day = dayIdx; TOP_KEEP.thr = threshold; TOP_KEEP.stat = shown;
  const takeAnim = () => { if (anim > used.current) { used.current = anim; return true; } return false; };
  // cambio statistica: i banner escono, poi entrano quelli nuovi con l'animazione dell'apertura
  const onStat = (v) => {
    if (v === stat) return;
    setStat(v);
    clearTimeout(timer.current);
    leave.value = withTiming(0, { duration: 200 });
    timer.current = setTimeout(() => { setShown(v); setAnim((a) => a + 1); leave.value = withTiming(1, { duration: 120 }); }, 240);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const leaveSt = useAnimatedStyle(() => ({ opacity: leave.value }));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: top }}>
      <Head C={C} onSearch={onSearch} />
      <DayStripN C={C} dates={DAYS} todayIndex={TODAY_I} x={x} value={dayIdx} onChange={setDayIdx} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 4 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          {THRESHOLDS.map((t) => {
            const on = t.key === threshold;
            return (
              <Pressable key={t.key} onPress={() => setThreshold(t.key)} hitSlop={8}>
                <Text style={{ color: on ? C.ink : C.ink3, fontSize: 15, fontWeight: on ? '800' : '600' }}>{t.label}</Text>
                <View style={{ height: 3, borderRadius: 2, marginTop: 3, backgroundColor: on ? C.accent : 'transparent' }} />
              </Pressable>
            );
          })}
        </View>
        <Dropdown C={C} options={TOP_STATS} value={stat} onChange={onStat} side="right" width={222} icon={(o, col) => <StatIconN k={o.icon} size={17} color={col} />} />
      </View>
      <Animated.View style={[{ flex: 1 }, leaveSt]}>
        <DayPagerN count={DAYS.length} index={dayIdx} onIndex={setDayIdx} x={x}
          render={(i, active) => <DayList key={`${i}|${shown}|${threshold}`} C={C} day={isoDate(DAYS[i])} idx={i} thr={threshold} stat={shown} active={active} takeAnim={takeAnim} onGo={setDayIdx} openRoute={openRoute} bottom={bottom} />} />
      </Animated.View>
    </View>
  );
}
