// Migliori Giocatori (nativo): giorni a scorrimento, soglia Over, statistica; righe nei colori della squadra con voto e tasto Calcolatore.
// Stessi dati e calcoli del sito (`@/data/topPlayers`); il tocco su una riga apre pannello (partita non iniziata) o scheda giocatore.
import React, { startTransition, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { InteractionManager } from '../shared/afterInteractions';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInLeft, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
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
import PageHead from '../shared/PageHead';
import { Segmented } from '../shared/ui';
import StatIconN from '../shared/StatIconN';
import { CALC_IN } from '../shared/calcIn';
import { FlagN, natOf } from '../shared/FlagN';

const DAYS = DATES.slice(TODAY_INDEX);
const TODAY_I = 0;
const ANIM_ROWS = 6;
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

const Row = React.memo(function Row({ C, row, rank, threshold, stat, enter, tv, openRoute, left }) { // eslint-disable-line no-unused-vars
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
  const nat = natOf(player);
  const sides = match ? [teamById(match.homeId), teamById(match.awayId)] : null;
  const body = (
    <Pressable onPress={go} style={({ pressed }) => [{ marginHorizontal: 10, marginBottom: 8 }, pressed && { opacity: 0.8 }]}>
      <View style={{ borderRadius: 22, borderWidth: 1.5, borderColor: c1 }}>
        <View style={{ borderRadius: 20.5, overflow: 'hidden', backgroundColor: C.sheet }}>
          <LinearGradient pointerEvents="none" colors={[c1 + '57', c1 + '22', c1 + '0F']} locations={[0, 0.55, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, paddingLeft: 14 }}>
            <View>
              <View style={{ width: 54, height: 54, borderRadius: 15, overflow: 'hidden', backgroundColor: c1 + '55', borderWidth: 1.5, borderColor: C.border }}>
                {player.photo ? <Image source={{ uri: player.photo }} style={{ width: 51, height: 51 }} contentFit="cover" cachePolicy="memory-disk" /> : null}
              </View>
              <View style={{ position: 'absolute', left: -9, top: -9, minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: rk }}>
                <Text style={{ color: rank <= 3 ? C.goldInk : '#fff', fontSize: 13, fontWeight: '700' }}>{rank}</Text>
              </View>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: C.ink, fontSize: 16, fontWeight: '600' }}>{player.name}</Text>
              {sides ? sides.map((t, i) => {
                const own = t && t.id === player.teamId;
                return (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: i ? 2 : 3 }}>
                    {t ? <TeamCrest team={t} size={15} C={C} /> : null}
                    <Text numberOfLines={1} style={{ flexShrink: 1, color: own ? C.ink : C.ink3, fontSize: own ? 13.5 : 12.5, fontWeight: own ? '600' : '400' }}>{t ? t.name : own ? player.teamName : match.oppName}</Text>
                    {own && nat ? <View style={{ width: 1, height: 13, backgroundColor: C.ink3, opacity: 0.5 }} /> : null}
                    {own && nat ? <FlagN code={nat.code} size={13} C={C} /> : null}
                    {own && nat ? <Text numberOfLines={1} style={{ flexShrink: 1, color: C.ink2, fontSize: 12.5 }}>{nat.name}</Text> : null}
                    {i ? <Text numberOfLines={1} style={{ color: C.ink3, fontSize: 12 }}>· {when(match)}</Text> : null}
                  </View>
                );
              }) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  {team ? <TeamCrest team={team} size={15} C={C} /> : null}
                  <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13.5, fontWeight: '600' }}>{team ? team.name : player.teamName}</Text>
                  {nat ? <View style={{ width: 1, height: 13, backgroundColor: C.ink3, opacity: 0.5 }} /> : null}
                  {nat ? <FlagN code={nat.code} size={13} C={C} /> : null}
                  {nat ? <Text numberOfLines={1} style={{ flexShrink: 1, color: C.ink2, fontSize: 12.5 }}>{nat.name}</Text> : null}
                </View>
              )}
              <View style={{ height: 4, borderRadius: 2, marginTop: 7, backgroundColor: c1 }} />
            </View>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ color: scoreColorSmooth(row.voto), fontSize: 28, fontWeight: '700' }}>{comma(row.voto, 1)}</Text>
              <Pressable onPress={calc} hitSlop={8} style={({ pressed }) => [{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip, borderWidth: 1.5, borderColor: C.accRing }, pressed && { opacity: 0.6 }]}>
                <Ionicons name="calculator-outline" size={18} color={C.accent} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
  // all'apertura i banner salgono; cambiando linea o statistica entrano da sinistra verso destra, uno dopo l'altro
  return enter >= 0 ? <Animated.View entering={left ? FadeInLeft.delay(30 + enter * 45).duration(300) : FadeInUp.delay(100 + enter * 60).duration(340)}>{body}</Animated.View> : body;
});

const Skel = ({ C, n = 7 }) => (
  <View style={{ paddingHorizontal: 10, paddingTop: 8 }}>
    {Array.from({ length: n }, (_, i) => <View key={i} style={{ height: 84, borderRadius: 22, backgroundColor: C.skBase, marginBottom: 8 }} />)}
  </View>
);

function DayList({ C, day, idx, thr, stat, active, takeAnim, onGo, openRoute, bottom, left }) {
  const [anim] = useState(() => (active ? takeAnim() : false));
  const [rows, setRows] = useState(() => (left ? null : bestPlayers(day, thr, stat) || null));
  useEffect(() => {
    let live = true;
    const run = () => {
      const r = bestPlayers(day, thr, stat);
      if (r) { if (live) setRows(r); return; }
      if (isFoulStat(stat)) loadBestFouls(day, thr, stat).then(() => { if (live) setRows(bestPlayers(day, thr, stat) || []); }).catch(() => { if (live) setRows([]); });
      else if (live) setRows([]);
    };
    let h; const t = setTimeout(() => { if (active) run(); else h = InteractionManager.runAfterInteractions(run); }, active ? 20 : 1600);
    return () => { live = false; clearTimeout(t); if (h && h.cancel) h.cancel(); };
  }, [day, thr, stat, active]);
  // orari veri del giorno (FotMob): il calendario squadra ha solo un orario segnaposto
  const [tv, setTv] = useState(0);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => syncDayTimes(day).then((n) => { if (live && n) setTv((x) => x + 1); }).catch(() => 0), active ? 1500 : 3000);
    return () => { live = false; clearTimeout(t); };
  }, [day, active]);
  if (!rows) return left ? null : <Skel C={C} />; // dopo un cambio linea/statistica la lista e' sfumata: niente scheletro che lampeggia
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
      renderItem={({ item, index }) => <Row C={C} row={item} rank={index + 1} threshold={thr} stat={stat} enter={enterOf(item, index)} left={left} tv={tv} openRoute={openRoute} />}
      initialNumToRender={7}
      maxToRenderPerBatch={4}
      updateCellsBatchingPeriod={60}
      windowSize={4}
      removeClippedSubviews
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: bottom + 20 }}
    />
  );
}

export default function TopPlayers({ C, top, onSearch, onMenu, openRoute, bottom = 90 }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { let live = true; bootShared().then(() => { if (live) setReady(true); }, () => {}); return () => { live = false; }; }, []);
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: 'transparent', paddingTop: top }}>
        <Head C={C} onSearch={onSearch} onMenu={onMenu} />
        <Skel C={C} />
      </View>
    );
  }
  return <Body C={C} top={top} onSearch={onSearch} onMenu={onMenu} openRoute={openRoute} bottom={bottom} />;
}

const Head = ({ C, onSearch, onMenu }) => <PageHead C={C} title="Migliori Giocatori" onSearch={onSearch} onMenu={onMenu} />;

function Body({ C, top, onSearch, onMenu, openRoute, bottom }) {
  const today = isoDate(new Date());
  const [ret] = useState(() => { const b = !!TOP_KEEP.child && Date.now() - TOP_KEEP.child < CHILD_MS; TOP_KEEP.child = 0; return b; });
  const fresh = TOP_KEEP.day === null || TOP_KEEP.stamp !== today;
  const [dayIdx, setDayIdx] = useState(fresh ? TODAY_I : Math.min(DAYS.length - 1, Math.max(0, TOP_KEEP.day)));
  const x = useSharedValue(dayIdx);
  const [threshold, setThreshold] = useState(fresh ? '0.5' : TOP_KEEP.thr);
  const [stat, setStat] = useState(() => (ret && !fresh ? TOP_KEEP.stat : 'tiri'));
  const [shown, setShown] = useState(stat);
  const [shownThr, setShownThr] = useState(threshold);
  const [anim, setAnim] = useState(ret ? 0 : 1);
  const used = useRef(0);
  const timer = useRef(0);
  const leave = useSharedValue(1);
  TOP_KEEP.stamp = today; TOP_KEEP.day = dayIdx; TOP_KEEP.thr = shownThr; TOP_KEEP.stat = shown;
  const takeAnim = () => { if (anim > used.current) { used.current = anim; return true; } return false; };
  // cambio statistica: i banner escono, poi entrano quelli nuovi con l'animazione dell'apertura
  const swap = (nextStat, nextThr) => {
    clearTimeout(timer.current);
    leave.value = withTiming(0, { duration: 180 });
    timer.current = setTimeout(() => { startTransition(() => { setShown(nextStat); setShownThr(nextThr); setAnim((a) => a + 1); }); }, 200);
  };
  const onStat = (v) => { if (v === stat) return; setStat(v); swap(v, threshold); };
  const onThr = (v) => { if (v === threshold) return; setThreshold(v); swap(stat, v); };
  useEffect(() => () => clearTimeout(timer.current), []);
  const leaveSt = useAnimatedStyle(() => ({ opacity: leave.value }));
  useEffect(() => { leave.value = 1; }, [shown, shownThr]); // eslint-disable-line react-hooks/exhaustive-deps
  // la nuova lista torna visibile solo quando e' stata disegnata (mai il vecchio contenuto che lampeggia)

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent', paddingTop: top }}>
      <Head C={C} onSearch={onSearch} onMenu={onMenu} />
      <DayStripN C={C} dates={DAYS} todayIndex={TODAY_I} x={x} value={dayIdx} onChange={setDayIdx} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 4 }}>
        <View style={{ flex: 1, minWidth: 0 }}><Segmented fit pad={10} C={C} options={THRESHOLDS.map((t) => ({ value: t.key, label: t.label }))} value={threshold} onChange={onThr} /></View>
        <Dropdown C={C} options={TOP_STATS} value={stat} onChange={onStat} side="right" width={222} compact slim style={{ flexShrink: 0 }} icon={(o, col) => <StatIconN k={o.icon} size={17} color={col} />} />
      </View>
      <Animated.View style={[{ flex: 1 }, leaveSt]}>
        <DayPagerN count={DAYS.length} index={dayIdx} onIndex={setDayIdx} x={x}
          render={(i, active) => <DayList key={`${i}|${shown}|${shownThr}`} C={C} left={anim > 1} day={isoDate(DAYS[i])} idx={i} thr={shownThr} stat={shown} active={active} takeAnim={takeAnim} onGo={setDayIdx} openRoute={openRoute} bottom={bottom} />} />
      </Animated.View>
    </View>
  );
}
