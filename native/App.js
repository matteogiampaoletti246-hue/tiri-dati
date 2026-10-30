// ScalperLab nativa - Home (React Native). Stesse regole della Home web: finestre per paese, top campionati in alto,
// colori e loghi delle competizioni, righe partita. Metadati da meta.json (generato da data/leagues.js e data/countries.js).
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ScrollView, StatusBar, Dimensions, StyleSheet, ActivityIndicator, Modal, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import META from './meta.json';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);

const SITE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/';
const W = Dimensions.get('window').width;
const C = { bg: '#05070D', ink: '#F1F5FB', ink2: '#A9B6CC', ink3: '#6D7A91', hair: 'rgba(255,255,255,.07)', border: 'rgba(255,255,255,.12)', accent: '#4DA8FF', live: '#FF6464' };
const WEEK = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const OFFSETS = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
const TODAY_INDEX = 7;
const rome = (d) => { try { return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' }); } catch (e) { return d.toISOString().slice(0, 10); } };
const hhmm = (iso) => { try { return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }); } catch (e) { return ''; } };
const crest = (id) => `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png`;
const darkLogo = (u) => (u || '').replace('/leaguelogo/', '/leaguelogo/dark/');
const getJ = async (u) => { const r = await fetch(SITE + u); if (!r.ok) throw new Error(u); return r.json(); };
const dayLabel = (d, i) => (i === TODAY_INDEX - 1 ? 'Ieri' : i === TODAY_INDEX ? 'Oggi' : i === TODAY_INDEX + 1 ? 'Domani' : `${WEEK[d.getDay()]} ${d.getDate()}`);

// ---------- raggruppamento (come groupsOf della Home web) ----------
const OPEN_KEY = {}; // aperto/chiuso ricordato per giorno e finestra
function groupsOf(rows, filter) {
  const by = new Map();
  rows.forEach((m) => {
    if (filter === 'live' && m[8] !== 'l') return;
    if (!by.has(m[1])) by.set(m[1], []);
    by.get(m[1]).push(m);
  });
  const top = []; const countries = new Map();
  by.forEach((ms, fm) => {
    const c = META.comps[fm];
    if (!c) return;
    const g = { fm, c, matches: ms.sort((a, b) => (a[2] < b[2] ? -1 : 1)) };
    if (c.solo >= 0) { top.push(g); return; }
    const k = c.cc || `N:${c.country}`;
    if (!countries.has(k)) countries.set(k, { k, flag: c.flag, name: c.country || '', comps: [] });
    countries.get(k).comps.push(g);
  });
  top.sort((a, b) => a.c.solo - b.c.solo);
  const cs = [...countries.values()].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  cs.forEach((x) => x.comps.sort((a, b) => a.c.rank - b.c.rank));
  return [...top.map((g) => ({ key: `l${g.fm}`, g })), ...cs.map((x) => ({ key: `p${x.k}`, p: x }))];
}

// ---------- componenti ----------
const Row = memo(({ m, onOpen }) => {
  const live = m[8] === 'l'; const fin = m[8] === 'f'; const sc = /(\d+)\s*-\s*(\d+)/.exec(m[7] || '');
  return (
    <Pressable onPress={() => onOpen(m)} style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}>
      <View style={s.teamL}><Text numberOfLines={1} style={s.tName}>{m[5]}</Text><Image source={{ uri: crest(m[3]) }} style={s.crest} /></View>
      <View style={s.mid}>
        {(live || fin) && sc ? (
          <Text style={[s.score, live && { color: C.live }]}>{sc[1]}<Text style={{ color: C.ink3, fontWeight: '500' }}> – </Text>{sc[2]}</Text>
        ) : fin ? <Text style={s.fin}>Finita</Text> : <Text style={s.time}>{hhmm(m[2])}</Text>}
        {fin ? <Text style={s.kick}>{hhmm(m[2])}</Text> : null}
        {live ? <View style={s.liveRow}><View style={s.liveDot} /><Text style={s.liveT}>LIVE</Text></View> : null}
      </View>
      <View style={s.teamR}><Image source={{ uri: crest(m[4]) }} style={s.crest} /><Text numberOfLines={1} style={s.tName}>{m[6]}</Text></View>
    </Pressable>
  );
});

const Card = ({ tint, a = '45', style, children }) => (
  <LinearGradient colors={[`${tint}${a}`, 'rgba(255,255,255,0.03)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.35 }} style={[s.card, style]}>{children}</LinearGradient>
);
const Chev = ({ open }) => <Ionicons name="chevron-down" size={17} color={C.ink3} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />;
const useOpen = (key, init) => {
  const [open, setOpen] = useState(() => (key in OPEN_KEY ? OPEN_KEY[key] : init));
  const toggle = () => { LayoutAnimation.configureNext(LayoutAnimation.create(260, 'easeInEaseOut', 'opacity')); setOpen((o) => { OPEN_KEY[key] = !o; return !o; }); };
  return [open, toggle];
};
const LeagueHead = ({ c, size = 22, small }) => (
  <View style={[s.lhRow, small && { paddingVertical: 12 }]}>
    <Image source={{ uri: darkLogo(c.logo) }} style={{ width: size, height: size }} resizeMode="contain" />
    <Text numberOfLines={1} style={[s.lhName, small && { fontSize: 12, fontWeight: '700' }]}>{c.name}</Text>
  </View>
);

const LeagueGroup = memo(({ iso, g, forceOpen, onOpen }) => {
  const [open, toggle] = useOpen(`${iso}|${g.fm}`, g.c.open);
  const isOpen = forceOpen || open;
  return (
    <Card tint={g.c.tint}>
      <Pressable onPress={toggle} style={s.headRow}>
        <View style={{ flex: 1 }}><LeagueHead c={g.c} /></View>
        <Text style={s.cnt}>{g.matches.length}</Text><Chev open={isOpen} />
      </Pressable>
      {isOpen ? <View style={s.body}>{g.matches.map((m, i) => <View key={m[0]} style={i ? s.sep : null}><Row m={m} onOpen={onOpen} /></View>)}</View> : null}
    </Card>
  );
});

const CountryGroup = memo(({ iso, p, forceOpen, onOpen }) => {
  const [open, toggle] = useOpen(`${iso}|paese:${p.k}`, false);
  const isOpen = forceOpen || open;
  const total = p.comps.reduce((n, x) => n + x.matches.length, 0);
  return (
    <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.035)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
      <Pressable onPress={toggle} style={s.headRow}>
        <View style={s.flag}><Text style={{ fontSize: 17 }}>{p.flag || '\u{1F30D}'}</Text></View>
        <Text numberOfLines={1} style={[s.lhName, { flex: 1, marginLeft: 12 }]}>{p.name}</Text>
        <Text style={s.cnt}>{total}</Text><Chev open={isOpen} />
      </Pressable>
      {isOpen ? p.comps.map((x) => (
        <Card key={x.fm} tint={x.c.tint} a="22" style={s.inner}>
          <View style={s.hairTop}><LeagueHead c={x.c} size={20} small /></View>
          {x.matches.map((m) => <View key={m[0]} style={s.sep}><Row m={m} onOpen={onOpen} /></View>)}
        </Card>
      )) : null}
    </LinearGradient>
  );
});

const Day = memo(({ iso, rows, filter, onOpen }) => {
  const items = useMemo(() => groupsOf(rows, filter), [rows, filter]);
  const render = useCallback(({ item }) => (item.g ? <LeagueGroup iso={iso} g={item.g} forceOpen={filter === 'live'} onOpen={onOpen} /> : <CountryGroup iso={iso} p={item.p} forceOpen={filter === 'live'} onOpen={onOpen} />), [iso, filter, onOpen]);
  if (!items.length) return <View style={{ width: W }}><Text style={s.empty}>Nessuna partita</Text></View>;
  return (
    <View style={{ width: W }}>
      <FlatList data={items} renderItem={render} keyExtractor={(i) => i.key} initialNumToRender={8} maxToRenderPerBatch={6} windowSize={7} contentContainerStyle={{ paddingBottom: 90 }} />
    </View>
  );
});

function Header({ onSearch, onMenu }) {
  return (
    <View style={s.header}>
      <Text style={s.brand}>Scalper<Text style={{ color: C.accent }}>Lab</Text></Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={onSearch} style={s.iconBtn}><Ionicons name="search" size={16} color={C.ink} /></Pressable>
        <Pressable onPress={onMenu} style={s.iconBtn}><Ionicons name="menu" size={17} color={C.ink} /></Pressable>
      </View>
    </View>
  );
}

function Screen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);
  const [cur, setCur] = useState(TODAY_INDEX);
  const [filter, setFilter] = useState('all');
  const [web, setWeb] = useState(null);
  const pager = useRef(null); const strip = useRef(null); const pos = useRef({});
  const dates = useMemo(() => OFFSETS.map((o) => { const d = new Date(); d.setDate(d.getDate() + o); return d; }), []);
  const keys = useMemo(() => dates.map(rome), [dates]);

  useEffect(() => {
    (async () => {
      const files = await Promise.all(keys.map((k) => getJ(`giorni/${k}.json`).catch(() => ({ m: [] }))));
      const seen = new Set(); const by = {};
      files.forEach((f) => (f.m || []).forEach((m) => {
        if (seen.has(m[0]) || m[8] === 'c' || !m[5] || !m[6] || !m[2]) return; seen.add(m[0]);
        const k = rome(new Date(m[2])); (by[k] = by[k] || []).push(m);
      }));
      setData(keys.map((k) => by[k] || []));
    })();
  }, [keys]);

  const openMatch = useCallback((m) => {
    const c = META.comps[m[1]];
    const top = c && c.solo >= 0 && c.cc && ['serie-a', 'premier-league', 'la-liga', 'bundesliga', 'ligue-1'].includes(c.id);
    const sk = META.cur[String(m[1])];
    const route = top && sk ? `/storico/${m[1]}/${sk}/${m[0]}` : `/match/x-${m[1]}-${m[0]}`;
    setWeb(`${SITE}aurora/#${route}`);
  }, []);

  const centre = (i) => { const p = pos.current[i]; if (p && strip.current) strip.current.scrollTo({ x: Math.max(0, p.x - W / 2 + p.w / 2), animated: true }); };
  const onEnd = useCallback((e) => { const i = Math.round(e.nativeEvent.contentOffset.x / W); setCur(i); centre(i); }, []);
  const go = (i) => { setCur(i); centre(i); pager.current && pager.current.scrollToIndex({ index: i, animated: true }); };

  if (!data) return <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={C.accent} /></View>;
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Header onSearch={() => setWeb(`${SITE}aurora/#/`)} onMenu={() => setWeb(`${SITE}aurora/#/menu`)} />
      <ScrollView ref={strip} horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={s.strip}>
        {dates.map((d, i) => (
          <Pressable key={keys[i]} onPress={() => go(i)} onLayout={(e) => { pos.current[i] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width }; if (i === cur) centre(i); }}>
            <Text style={[s.dTop, i === cur && s.dOn]}>{dayLabel(d, i)}</Text>
            <Text style={[s.dSub, i === cur && { opacity: 0.9 }]}>{d.getDate()} {MONTHS[d.getMonth()]}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.filters}>
        <Pressable onPress={() => setFilter('all')}><Text style={[s.fBtn, filter === 'all' && s.fOn]}>Tutte</Text></Pressable>
        <Pressable onPress={() => setFilter('live')} style={s.fLive}><View style={s.liveDot} /><Text style={[s.fBtn, filter === 'live' && s.fOn]}>Live</Text></Pressable>
      </View>
      <FlatList
        ref={pager} data={keys} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(k) => k}
        renderItem={({ item, index }) => <Day iso={item} rows={data[index]} filter={filter} onOpen={openMatch} />}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })} initialScrollIndex={TODAY_INDEX}
        onMomentumScrollEnd={onEnd} windowSize={3} initialNumToRender={1} maxToRenderPerBatch={1} decelerationRate="fast" extraData={filter}
      />
      <Modal visible={!!web} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setWeb(null)}>
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <Pressable onPress={() => setWeb(null)} style={s.back}><Ionicons name="chevron-back" size={20} color={C.accent} /><Text style={{ color: C.accent, fontSize: 16 }}>Home</Text></Pressable>
          {web ? <WebView source={{ uri: web }} style={{ flex: 1, backgroundColor: C.bg }} allowsBackForwardNavigationGestures /> : null}
        </View>
      </Modal>
    </View>
  );
}

export default function App() { return <SafeAreaProvider><Screen /></SafeAreaProvider>; }

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  brand: { color: C.ink, fontSize: 24, fontWeight: '800', letterSpacing: -1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: C.border },
  strip: { paddingHorizontal: 20, paddingVertical: 8, gap: 24, alignItems: 'center' },
  dTop: { color: C.ink3, fontSize: 15, fontWeight: '500' },
  dOn: { color: C.ink, fontWeight: '800' },
  dSub: { color: C.ink3, fontSize: 10.5, opacity: 0.6 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 20, paddingVertical: 6 },
  fBtn: { color: C.ink3, fontSize: 13.5, fontWeight: '500' },
  fOn: { color: C.ink, fontWeight: '700' },
  fLive: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.live },
  card: { marginHorizontal: 16, marginTop: 16, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  inner: { marginHorizontal: 0, marginTop: 0, borderRadius: 0, borderWidth: 0, borderTopWidth: 1, borderColor: C.hair },
  headRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 16, minHeight: 50 },
  lhRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingLeft: 16, paddingRight: 12 },
  lhName: { color: C.ink, fontSize: 12.5, fontWeight: '800', letterSpacing: 0.9, textTransform: 'uppercase', flexShrink: 1 },
  hairTop: { },
  cnt: { color: C.ink3, fontSize: 11, fontWeight: '500', marginRight: 8 },
  flag: { width: 22, height: 22, borderRadius: 11, marginLeft: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.08)', overflow: 'hidden' },
  body: { borderTopWidth: 1, borderTopColor: C.hair },
  sep: { borderTopWidth: 1, borderTopColor: C.hair },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  teamL: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  teamR: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tName: { color: C.ink, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  crest: { width: 24, height: 24 },
  mid: { width: 64, alignItems: 'center' },
  score: { color: C.ink, fontSize: 15.5, fontWeight: '800' },
  time: { color: C.ink3, fontSize: 13.5, fontWeight: '600' },
  fin: { color: C.ink3, fontSize: 12, fontWeight: '600' },
  kick: { color: C.ink3, fontSize: 10.5, marginTop: 2 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  liveT: { color: C.live, fontSize: 10, fontWeight: '700' },
  empty: { color: C.ink3, textAlign: 'center', padding: 50 },
  back: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 },
});
