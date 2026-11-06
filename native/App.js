// ScalperLab nativa - Home (React Native). Stesse regole della Home web: finestre per paese, top campionati in alto,
// colori e loghi delle competizioni, righe partita. Metadati da meta.json (generato da data/leagues.js e data/countries.js).
import React, { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, StatusBar, Dimensions, StyleSheet, Animated as RNAnimated, AccessibilityInfo, LayoutAnimation, Platform, UIManager, AppState, Modal, TextInput, Keyboard, BackHandler, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedReaction, withTiming, cancelAnimation, runOnJS, Easing, interpolateColor, Keyframe, LinearTransition, FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import META from './meta.json';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);

const SITE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/';
const W = Dimensions.get('window').width;
const DARK = { dark: true, bg: '#05070D', ink: '#F1F5FB', ink2: '#A9B6CC', ink3: '#6D7A91', hair: 'rgba(255,255,255,.10)', border: 'rgba(255,255,255,.12)', accent: '#4DA8FF', live: '#FF6464', chip: 'rgba(255,255,255,.08)', wash: 'rgba(255,255,255,0.03)', card1: 'rgba(255,255,255,0.10)', card2: 'rgba(255,255,255,0.035)', sheet: '#0E1626', scrim: 'rgba(0,0,0,.5)', dockBg: 'rgba(14,22,38,0.62)', tile1: 'rgba(255,255,255,0.08)', accTint: 'rgba(77,168,255,0.16)', accRing: 'rgba(77,168,255,0.6)', skBase: 'rgba(255,255,255,0.075)', skHi: 'rgba(255,255,255,0.10)', skHi0: 'rgba(255,255,255,0)' };
const LIGHT = { dark: false, bg: '#F3F6FB', ink: '#0F172A', ink2: '#475569', ink3: '#8592A6', hair: 'rgba(15,23,42,.08)', border: 'rgba(15,23,42,.10)', accent: '#1F6BEF', live: '#E5484D', chip: 'rgba(15,23,42,.06)', wash: 'rgba(255,255,255,0.85)', card1: 'rgba(255,255,255,0.95)', card2: 'rgba(255,255,255,0.8)', sheet: '#FFFFFF', scrim: 'rgba(15,23,42,.28)', dockBg: 'rgba(255,255,255,0.6)', tile1: 'rgba(255,255,255,0.9)', accTint: 'rgba(31,107,239,0.12)', accRing: 'rgba(31,107,239,0.55)', skBase: 'rgba(15,23,42,0.085)', skHi: 'rgba(255,255,255,0.8)', skHi0: 'rgba(255,255,255,0)' };
const WORKER = 'https://scalperlab-live.matteo-giampaoletti04.workers.dev';
const NAMES = META.names || {};
const nm = (id, n) => NAMES[String(id)] || n;
const EL_FM = 73; // Europa League: coppa disegnata (bianca di notte, nera di giorno) come nel sito
const _n = new Date(); const TODAY_MID = new Date(_n.getFullYear(), _n.getMonth(), _n.getDate());
const NOKEYS = [];
const WEEK = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const OFFSETS = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
const TODAY_INDEX = 7;
const FMT_DAY = (() => { try { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }); } catch (e) { return null; } })();
const FMT_HM = (() => { try { return new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }); } catch (e) { return null; } })();
const rome = (d) => { try { return FMT_DAY.format(d); } catch (e) { return d.toISOString().slice(0, 10); } };
const HM_CACHE = {};
const LIVE_MEM = new Map(); // id partita -> ultimo { st, score, lt, t } letto da /fx
const MEM_KEY = 'sl-livemem';
const MEM_TTL = 3 * 3600000;
// gli ultimi risultati live si ricordano sul telefono: all'apertura la Home li mostra subito (mai "LIVE" senza gol nei primi secondi)
const MEM_READY = AsyncStorage.getItem(MEM_KEY).then((v) => {
  const o = v ? JSON.parse(v) : {}; const n = Date.now();
  Object.keys(o).forEach((k) => { if (o[k] && n - o[k].t < MEM_TTL && !LIVE_MEM.has(k)) LIVE_MEM.set(k, o[k]); });
}).catch(() => {});
let memTimer = null;
const memSave = () => {
  if (memTimer) return;
  memTimer = setTimeout(() => {
    memTimer = null; const n = Date.now(); const o = {};
    LIVE_MEM.forEach((v, k) => { if (n - v.t < MEM_TTL) o[k] = v; });
    AsyncStorage.setItem(MEM_KEY, JSON.stringify(o)).catch(() => {});
  }, 1500);
};
const hhmm = (iso) => { if (HM_CACHE[iso] !== undefined) return HM_CACHE[iso]; let r = ''; try { r = FMT_HM.format(new Date(iso)); } catch (e) { r = ''; } HM_CACHE[iso] = r; return r; };

const crest = (id) => `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png`;
const darkLogo = (u) => (u || '').replace('/leaguelogo/', '/leaguelogo/dark/');
const getJ = async (u) => { const r = await fetch(SITE + u); if (!r.ok) throw new Error(u); return r.json(); };
const dayLabel = (d) => { const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - TODAY_MID) / 86400000); return diff === -1 ? 'Ieri' : diff === 0 ? 'Oggi' : diff === 1 ? 'Domani' : `${WEEK[d.getDay()]} ${d.getDate()}`; };

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
    if (!countries.has(k)) countries.set(k, { k, flag: c.flag, fc: c.fc || '', tint: (META.tints && META.tints[c.fc]) || '', name: c.country || '', comps: [] });
    countries.get(k).comps.push(g);
  });
  top.sort((a, b) => a.c.solo - b.c.solo);
  const cs = [...countries.values()].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  cs.forEach((x) => x.comps.sort((a, b) => a.c.rank - b.c.rank));
  return [...top.map((g) => ({ key: `l${g.fm}`, g })), ...cs.map((x) => ({ key: `p${x.k}`, p: x }))];
}

// ---------- componenti ----------
// Stemma: se non si scarica riprova (2 volte, con attesa); se FotMob non ce l'ha, sagoma con le iniziali (mai un buco)
const initialsOf = (n) => String(n || '').replace(/\(.*?\)/g, '').split(/[\s-]+/).filter((w) => /^[\p{L}\p{N}]/u.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
const Crest = memo(({ id, name }) => {
  const { s } = useT();
  const [tries, setTries] = useState(0);
  const [bad, setBad] = useState(false);
  const fail = useCallback(() => { if (tries < 2) setTimeout(() => setTries((t) => t + 1), 1200 * (tries + 1)); else setBad(true); }, [tries]);
  if (bad) return <View style={[s.crest, s.crestPh]}><Text style={s.crestTx}>{initialsOf(name)}</Text></View>;
  return <Image key={tries} source={{ uri: crest(id) + (tries ? `?r=${tries}` : '') }} style={s.crest} contentFit="contain" cachePolicy="memory-disk" transition={0} onError={fail} />;
});

const Row = memo(({ m, onOpen }) => {
  const { C, s } = useT();
  const live = m[8] === 'l'; const fin = m[8] === 'f'; const sc = /(\d+)\s*-\s*(\d+)/.exec(m[7] || '');
  return (
    <Pressable onPress={() => onOpen(m)} style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}>
      <View style={s.teamL}><Text numberOfLines={1} style={s.tName}>{nm(m[3], m[5])}</Text><Crest id={m[3]} name={nm(m[3], m[5])} /></View>
      <View style={s.mid}>
        {(live || fin) && sc ? (
          <Text style={[s.score, live && { color: C.live }]}>{sc[1]}<Text style={{ color: C.ink3, fontWeight: '500' }}> – </Text>{sc[2]}</Text>
        ) : fin ? <Text style={s.fin}>Finita</Text> : <Text style={s.time}>{hhmm(m[2])}</Text>}
        {fin ? <Text style={s.kick}>{hhmm(m[2])}</Text> : null}
        {live ? <View style={s.liveRow}><View style={s.liveDot} /><Text style={s.liveT}>{/^\d+(\+\d+)?$/.test(m[10] || '') ? `${m[10]}'` : /^HT$/i.test(m[10] || '') ? 'Int.' : 'LIVE'}</Text></View> : null}
      </View>
      <View style={s.teamR}><Crest id={m[4]} name={nm(m[4], m[6])} /><Text numberOfLines={1} style={s.tName}>{nm(m[4], m[6])}</Text></View>
    </Pressable>
  );
});

// Finestra a una sola tinta (concept B): sfumatura a 135 gradi dalla tinta (.34) quasi a vuoto (.06 al 70%)
const Card = ({ tint, style, children }) => {
  const { C, s } = useT();
  const t = /^#[0-9a-f]{6}$/i.test(tint || '') ? tint : '#6D7A91';
  return (
    <LinearGradient colors={[`${t}${C.dark ? '57' : '33'}`, `${t}${C.dark ? '0F' : '0A'}`]} locations={[0, 0.7]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.card, style]}>{children}</LinearGradient>
  );
};
// Bandiera rotonda vera, con anello e alone della tinta del paese; senza bandiera, un globo
const Flag = memo(({ fc, tint }) => {
  const { C, s } = useT();
  const t = /^#[0-9a-f]{6}$/i.test(tint || '') ? tint : '#6D7A91';
  const ring = { borderColor: `${t}8C`, shadowColor: t };
  return (
    <View style={[s.flag, ring]}>
      {fc ? <Image source={{ uri: `${SITE}native-link/flags/${fc}.png` }} style={s.flagImg} contentFit="cover" cachePolicy="memory-disk" transition={0} />
        : <Ionicons name="globe-outline" size={18} color={C.ink2} />}
    </View>
  );
});
const Chev = ({ open }) => { const { C } = useT(); return <Ionicons name="chevron-down" size={17} color={C.ink2} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />; };
const useOpen = (key, init, size = 0) => {
  const [open, setOpen] = useState(() => (key in OPEN_KEY ? OPEN_KEY[key] : init));
  // Finestre grandi: niente animazione di layout su decine di righe (era il ritardo e lo scatto).
  const toggle = () => { if (size <= 14) LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity')); setOpen((o) => { OPEN_KEY[key] = !o; return !o; }); };
  return [open, toggle];
};
// Righe montate a pezzi: le prime subito (la finestra risponde al tocco), il resto a riposo, un pezzo per volta.
const FIRST_ROWS = 8, STEP_ROWS = 10;
const useChunk = (total) => {
  const [n, setN] = useState(Math.min(total, FIRST_ROWS));
  useEffect(() => {
    if (n >= total) return undefined;
    const t = setTimeout(() => setN((v) => Math.min(total, v + STEP_ROWS)), 40);
    return () => clearTimeout(t);
  }, [n, total]);
  return Math.min(n, total);
};
const LeagueBody = ({ g, onOpen }) => {
  const { s } = useT();
  const n = useChunk(g.matches.length);
  return <View style={s.body}>{g.matches.slice(0, n).map((m, i) => <View key={m[0]} style={i ? s.sep : null}><Row m={m} onOpen={onOpen} /></View>)}</View>;
};
const CountryBody = ({ p, onLeague, onOpen }) => {
  const { s } = useT();
  const total = p.comps.reduce((a, x) => a + x.matches.length, 0);
  let left = useChunk(total);
  return p.comps.map((x) => {
    if (left <= 0) return null;
    const ms = x.matches.slice(0, left);
    left -= ms.length;
    return (
      <View key={x.fm} style={s.inner}>
        <Pressable onPress={() => onLeague(leagueRoute(x.c, x.fm))} style={({ pressed }) => [s.hairTop, pressed && { opacity: 0.6 }]}><LeagueHead c={x.c} size={20} small /></Pressable>
        {ms.map((m) => <View key={m[0]} style={s.sep}><Row m={m} onOpen={onOpen} /></View>)}
      </View>
    );
  });
};
const leagueRoute = (c, fm) => `/campionato/${c.id || `fm-${fm}`}`;
const LeagueHead = ({ c, size = 22, small }) => {
  const { C, s } = useT();
  const uri = c.logoFm === EL_FM || /\/leaguelogo\/73\.png/.test(c.logo || '') ? `${SITE}aurora/${C.dark ? 'el-night' : 'el-light'}.png` : (C.dark ? darkLogo(c.logo) : c.logo);
  return (
    <View style={[s.lhRow, small && { paddingVertical: 12 }]}>
      <Image source={{ uri }} style={{ width: size, height: size }} contentFit="contain" cachePolicy="memory-disk" transition={0} />
      <Text numberOfLines={1} style={[s.lhName, small && { fontSize: 12, fontWeight: '700' }]}>{c.name}</Text>
    </View>
  );
};

const LeagueGroup = memo(({ iso, g, forceOpen, onOpen, onLeague }) => {
  const { s } = useT();
  const [open, toggle] = useOpen(`${iso}|${g.fm}`, g.c.open, g.matches.length);
  const isOpen = forceOpen || open;
  return (
    <Card tint={g.c.tint}>
      <View style={s.headRow}>
        <Pressable onPress={() => onLeague(leagueRoute(g.c, g.fm))} style={({ pressed }) => [{ flexShrink: 1 }, pressed && { opacity: 0.6 }]}><LeagueHead c={g.c} /></Pressable>
        <Pressable onPress={toggle} hitSlop={{ top: 14, bottom: 14, right: 14 }} style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}><Text style={s.cnt}>{g.matches.length}</Text><Chev open={isOpen} /></Pressable>
      </View>
      {isOpen ? <LeagueBody g={g} onOpen={onOpen} /> : null}
    </Card>
  );
});

const CountryGroup = memo(({ iso, p, forceOpen, onOpen, onLeague }) => {
  const { C, s } = useT();
  const total = p.comps.reduce((n, x) => n + x.matches.length, 0);
  const [open, toggle] = useOpen(`${iso}|paese:${p.k}`, false, total);
  const isOpen = forceOpen || open;
  return (
    <Card tint={p.tint}>
      <Pressable onPress={toggle} style={s.headRow}>
        <Flag fc={p.fc} tint={p.tint} />
        <Text numberOfLines={1} style={[s.lhName, { flex: 1, marginLeft: 12 }]}>{p.name}</Text>
        <Text style={s.cnt}>{total}</Text><Chev open={isOpen} />
      </Pressable>
      {isOpen ? <CountryBody p={p} onLeague={onLeague} onOpen={onOpen} /> : null}
    </Card>
  );
});

const Day = memo(({ iso, rows, filter, onOpen, onLeague, top, isCur }) => {
  const { s } = useT();
  const list = useRef(null);
  // tasto Home toccato in Home: torna in cima solo il giorno mostrato (gli altri e quelli montati dopo non si muovono)
  const seen = useRef(top); const curR = useRef(isCur); curR.current = isCur;
  useEffect(() => { if (top !== seen.current) { seen.current = top; if (curR.current && list.current) list.current.scrollToOffset({ offset: 0, animated: true }); } }, [top]);
  const items = useMemo(() => groupsOf(rows, filter), [rows, filter]);
  const render = useCallback(({ item }) => (item.g ? <LeagueGroup iso={iso} g={item.g} forceOpen={filter === 'live'} onOpen={onOpen} onLeague={onLeague} /> : <CountryGroup iso={iso} p={item.p} forceOpen={filter === 'live'} onOpen={onOpen} onLeague={onLeague} />), [iso, filter, onOpen, onLeague]);
  if (!items.length) return <View style={{ width: W }}><Text style={s.empty}>Nessuna partita</Text></View>;
  return (
    <View style={{ width: W }}>
      <FlatList ref={list} data={items} renderItem={render} keyExtractor={(i) => i.key} initialNumToRender={4} maxToRenderPerBatch={3} updateCellsBatchingPeriod={60} windowSize={5} contentContainerStyle={{ paddingBottom: 140 }} />
    </View>
  );
});

// Marchio ScalperLab (lente con il campo dentro) disegnato con viste: stesso disegno del logo del sito (viewBox 100).
const Logo = memo(({ size = 30 }) => {
  const { C } = useT();
  const k = size / 100;
  const ab = (l, t, w, h, st) => ({ position: 'absolute', left: l * k, top: t * k, width: w * k, height: h * k, ...st });
  return (
    <View style={{ width: size, height: size }}>
      <View style={ab(8, 8, 68, 68, { borderRadius: 34 * k, borderWidth: 8 * k, borderColor: C.ink })} />
      <View style={ab(40.25, 14, 3.5, 56, { backgroundColor: C.accent, borderRadius: 2 * k })} />
      <View style={ab(30.25, 30.25, 23.5, 23.5, { borderRadius: 12 * k, borderWidth: 3.5 * k, borderColor: C.accent })} />
      <View style={ab(13, 31, 7, 22, { borderWidth: 3 * k, borderLeftWidth: 0, borderColor: C.accent, opacity: 0.7 })} />
      <View style={ab(64, 31, 7, 22, { borderWidth: 3 * k, borderRightWidth: 0, borderColor: C.accent, opacity: 0.7 })} />
      <View style={ab(55, 71, 43, 11, { borderRadius: 5.5 * k, backgroundColor: C.accent, transform: [{ rotate: '45deg' }] })} />
      <View style={ab(38, 38, 8, 8, { borderRadius: 4 * k, backgroundColor: C.ink })} />
    </View>
  );
});

// Riga in alto: logo, barra di ricerca (tutto lo spazio che resta), Calendario, menu. Una riga sola anche su iPhone stretti.
function Header({ onSearch, onMenu, onCal }) {
  const { C, s } = useT();
  return (
    <View style={s.header}>
      <Logo size={30} />
      <Pressable onPress={onSearch} style={s.sBar} accessibilityLabel="Cerca">
        <Ionicons name="search" size={16} color={C.ink3} />
        <Text numberOfLines={1} style={s.sBarTx}>Cerca giocatori, squadre…</Text>
      </Pressable>
      <Pressable onPress={onCal} style={s.iconBtn} accessibilityLabel="Calendario"><Ionicons name="calendar-outline" size={16} color={C.ink} /></Pressable>
      <Pressable onPress={onMenu} style={s.iconBtn} accessibilityLabel="Menu"><Ionicons name="menu" size={17} color={C.ink} /></Pressable>
    </View>
  );
}

// ---------- tendina di ricerca e menu a tendina ----------
const SBAR = 52;
const OUT_EASE = Easing.bezier(0.22, 1, 0.36, 1);
const MONO_DARK = new Set(['premier-league', 'champions-league', 'ligue-1', 'conference-league']);
const hexA = (c, a) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c + a : null);
// voci che entrano a cascata (dal basso nella ricerca, da destra nel menu): solo le voci nuove, quelle gia' presenti restano ferme
const cascade = (i, dx, dy, base, step) => new Keyframe({
  0: { opacity: 0, transform: [{ translateX: dx }, { translateY: dy }] },
  100: { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }], easing: Easing.out(Easing.cubic) },
}).duration(dx ? 260 : 300).delay(base + Math.min(i, 10) * step);

function useKeyboardH() {
  const [h, setH] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const a = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setH(e.endCoordinates ? e.endCoordinates.height : 0));
    const b = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setH(0));
    return () => { a.remove(); b.remove(); };
  }, []);
  return h;
}

// Foto del giocatore: sagoma se manca o non si carica (mai l'icona rotta)
const Face = memo(({ uri, color, size }) => {
  const { C } = useT();
  const [bad, setBad] = useState(false);
  const c = color || C.hair;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: c, backgroundColor: c, overflow: 'hidden' }}>
      {uri && !bad ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition="top" cachePolicy="memory-disk" onError={() => setBad(true)} /> : (
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ width: size * 0.36, height: size * 0.36, borderRadius: size, backgroundColor: 'rgba(0,0,0,.42)', marginTop: size * 0.2 }} />
          <View style={{ width: size * 0.74, height: size * 0.5, borderRadius: size, backgroundColor: 'rgba(0,0,0,.42)', marginTop: size * 0.06 }} />
        </View>
      )}
    </View>
  );
});

// stemma o logo con le iniziali se manca
const Mark = ({ uri, size, initials, tint }) => {
  const { s } = useT();
  const [bad, setBad] = useState(false);
  if (uri && !bad) return <Image source={{ uri }} style={{ width: size, height: size }} contentFit="contain" cachePolicy="memory-disk" tintColor={tint || undefined} onError={() => setBad(true)} />;
  return <View style={[s.crestPh, { width: size, height: size, borderRadius: size / 2 }]}><Text style={s.crestTx}>{initials || ''}</Text></View>;
};

// Banner giocatore compatto (stesso disegno del banner della ricerca del sito, in piccolo)
const PlayerBannerS = memo(({ p, onPress }) => {
  const { C, s } = useT();
  const g = hexA(p.color, '66');
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.pb, pressed && { opacity: 0.6 }]}>
      <LinearGradient colors={[g || C.card1, C.card2]} locations={[0, 0.72]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      <Face uri={p.photo} color={p.color} size={36} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={s.pbName}>{p.name}</Text>
        <View style={s.pbSub}>
          {p.crest ? <Mark uri={p.crest} size={14} /> : null}
          <Text numberOfLines={1} style={s.pbTeam}>{p.team}</Text>
          {p.nat ? (
            <>
              <View style={{ width: 1, height: 14, backgroundColor: C.dim || '#5b678f', opacity: 0.5 }} />
              <Image source={{ uri: `${SITE}native-link/flags/${p.nat.fc}.png` }} style={{ width: 14, height: 14, borderRadius: 7 }} contentFit="cover" cachePolicy="memory-disk" transition={0} />
              <Text numberOfLines={1} style={s.pbTeam}>{p.nat.name}</Text>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

// Ricerca a tendina (aspetto: la barra si allarga in un pannello unico; animazione: il pannello scende dalla barra e i risultati arrivano a cascata).
// Si chiude toccando fuori, con X, con il tasto indietro (Android) o scegliendo un risultato. La Home dietro non si muove.
function SearchPanel({ open, onClose, onPick, ask, res, ready, top }) {
  const { C, s } = useT();
  const { height: winH } = useWindowDimensions();
  const kb = useKeyboardH();
  const [mounted, setMounted] = useState(open);
  const [q, setQ] = useState('');
  const [contentH, setContentH] = useState(0);
  const h = useSharedValue(SBAR); const op = useSharedValue(0); const sc = useSharedValue(0);
  const maxH = Math.max(SBAR + 80, winH - top - kb - 12);
  const data = q.trim() && res ? res : null;
  const has = !!data && (data.leagues.length + data.teams.length + data.players.length + data.referees.length) > 0;
  const target = Math.min(SBAR + (has ? contentH : 0), maxH);
  useEffect(() => {
    if (open) {
      setMounted(true); setQ(''); setContentH(0);
      h.value = SBAR; op.value = 0.4;
      op.value = withTiming(1, { duration: 400, easing: OUT_EASE });
      sc.value = withTiming(1, { duration: 260 });
      return undefined;
    }
    Keyboard.dismiss();
    sc.value = withTiming(0, { duration: 180 });
    op.value = withTiming(0, { duration: 180 }, (done) => { if (done) runOnJS(setMounted)(false); });
    return undefined;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) h.value = withTiming(target, { duration: 400, easing: OUT_EASE }); }, [open, target, h]);
  // filtro con debounce (~200 ms); si richiede di nuovo quando la pagina web diventa pronta
  useEffect(() => { if (!open) return undefined; const t = setTimeout(() => ask(q), 200); return () => clearTimeout(t); }, [q, open, ready, ask]);
  useEffect(() => {
    if (!open) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => sub.remove();
  }, [open, onClose]);
  const pStyle = useAnimatedStyle(() => ({ height: h.value, opacity: op.value }));
  const scStyle = useAnimatedStyle(() => ({ opacity: sc.value }));
  if (!mounted) return null;
  let n = 0;
  const ent = () => cascade(n++, 0, 14, 60, 45);
  const logoOf = (l) => (C.dark && l.logoDark ? l.logoDark : l.logo);
  const mono = (l) => (C.dark && !l.logoDark && MONO_DARK.has(l.id) ? '#FFFFFF' : null);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.scrim }, scStyle]}><Pressable style={{ flex: 1 }} onPress={onClose} /></Animated.View>
      <Animated.View style={[s.sPanel, { top }, pStyle]}>
        <View style={[s.sRow, has && { borderBottomColor: C.hair }]}>
          <Ionicons name="search" size={18} color={C.ink3} />
          <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Cerca giocatori, squadre…" placeholderTextColor={C.ink3} style={s.sInput} returnKeyType="search" autoCorrect={false} autoCapitalize="none" keyboardAppearance={C.dark ? 'dark' : 'light'} selectionColor={C.accent} />
          <Pressable onPress={onClose} style={s.iconBtn} accessibilityLabel="Chiudi"><Ionicons name="close" size={17} color={C.ink} /></Pressable>
        </View>
        <ScrollView style={{ height: maxH - SBAR }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
          <View onLayout={(e) => setContentH(Math.ceil(e.nativeEvent.layout.height))} style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
            {has && data.leagues.length ? (<View key="L"><Animated.Text entering={ent()} style={s.sSec}>Campionati</Animated.Text>
              {data.leagues.map((l) => (<Animated.View key={`l${l.id}`} entering={ent()}><Pressable onPress={() => onPick(l.path)} style={s.sItem}>
                <Mark uri={logoOf(l)} size={26} tint={mono(l)} initials={l.name.slice(0, 2).toUpperCase()} />
                <Text numberOfLines={1} style={[s.sName, { flex: 1 }]}>{l.name}</Text>
                {l.country ? <Text style={s.sMeta}>{l.country}</Text> : null}
              </Pressable></Animated.View>))}
              <Animated.View key="lall" entering={ent()}><Pressable onPress={() => onPick('/competizioni')} style={s.sItem}><Text style={[s.sName, { color: C.accent, fontWeight: '700', fontSize: 13.5 }]}>Tutte le competizioni per paese</Text></Pressable></Animated.View>
            </View>) : null}
            {has && data.teams.length ? (<View key="T"><Animated.Text entering={ent()} style={s.sSec}>Squadre</Animated.Text>
              {data.teams.map((t) => (<Animated.View key={`t${t.id}`} entering={ent()}><Pressable onPress={() => onPick(t.path)} style={s.sItem}>
                <Mark uri={t.crest} size={28} initials={t.initials} />
                <Text numberOfLines={1} style={[s.sName, { fontWeight: '700', flexShrink: 1 }]}>{t.name}</Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5, minWidth: 0 }}>
                  {t.logo ? <Mark uri={t.logo} size={14} /> : null}
                  <Text numberOfLines={1} style={[s.sMeta, { flexShrink: 1 }]}>{t.sub}</Text>
                </View>
              </Pressable></Animated.View>))}
            </View>) : null}
            {has && data.players.length ? (<View key="P"><Animated.Text entering={ent()} style={s.sSec}>Giocatori</Animated.Text>
              {data.players.map((p) => (<Animated.View key={`p${p.id}`} entering={ent()} style={{ paddingBottom: 6 }}><PlayerBannerS p={p} onPress={() => onPick(p.path)} /></Animated.View>))}
            </View>) : null}
            {has && data.referees.length ? (<View key="R"><Animated.Text entering={ent()} style={s.sSec}>Arbitri</Animated.Text>
              {data.referees.map((x) => (<Animated.View key={`r${x.id}`} entering={ent()}><Pressable onPress={() => onPick(x.path)} style={s.sItem}>
                <View style={[s.crestPh, { width: 26, height: 26, borderRadius: 13 }]}><Text style={s.crestTx}>{x.initials}</Text></View>
                <Text numberOfLines={1} style={[s.sName, { flex: 1 }]}>{x.name}</Text>
              </Pressable></Animated.View>))}
            </View>) : null}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const MENU = [['Home', '/', 'home-outline'], ['Competizioni', '/competizioni', 'trophy-outline'], ['Calcolatore di Affidabilità', '/calcolatore', 'speedometer-outline'], ['Migliori Giocatori', '/migliori-giocatori', 'star-outline'], ['Migliori Matchup', '/migliori-matchup', 'swap-horizontal-outline'], ['Linee guida', '/linee-guida', 'book-outline']];
const THEME_OPTS = [['light', 'Chiaro'], ['dark', 'Scuro'], ['auto', 'Auto']];

// Menu a tendina da destra: stesse voci della vecchia pagina menu, con icone, che entrano a cascata. Tema e diagnostica sono quelli del sito
// (si leggono e si cambiano nella pagina web, messaggio `ui:state`) e compaiono solo quando la pagina web li ha comunicati.
function MenuPanel({ open, onClose, onGo, ui, onCmd, top, bottom }) {
  const { C, s } = useT();
  const PW = Math.max(236, Math.min(W * 0.78, 300));
  const [mounted, setMounted] = useState(open);
  const tx = useSharedValue(PW); const sc = useSharedValue(0);
  useEffect(() => {
    if (open) {
      setMounted(true); onCmd('state');
      tx.value = PW; tx.value = withTiming(0, { duration: 420, easing: OUT_EASE });
      sc.value = withTiming(1, { duration: 380 });
      return undefined;
    }
    sc.value = withTiming(0, { duration: 300 });
    tx.value = withTiming(PW, { duration: 300, easing: OUT_EASE }, (done) => { if (done) runOnJS(setMounted)(false); });
    return undefined;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => sub.remove();
  }, [open, onClose]);
  const pStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const scStyle = useAnimatedStyle(() => ({ opacity: sc.value }));
  if (!mounted) return null;
  const ent = (i) => cascade(i, 16, 0, 150, 35);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.scrim }, scStyle]}><Pressable style={{ flex: 1 }} onPress={onClose} /></Animated.View>
      <Animated.View style={[s.mPanel, { width: PW, paddingTop: top + 14 }, pStyle]}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never" contentContainerStyle={{ paddingBottom: bottom + 40 }}>
          <View style={s.mHead}>
            <Logo size={26} />
            <Text style={s.mBrand}>ScalperLab</Text>
            <Pressable onPress={onClose} style={[s.iconBtn, { marginLeft: 'auto' }]} accessibilityLabel="Chiudi"><Ionicons name="close" size={17} color={C.ink} /></Pressable>
          </View>
          {MENU.map(([label, route, icon], i) => (
            <Animated.View key={route} entering={ent(i)}>
              <Pressable onPress={() => onGo(route)} style={({ pressed }) => [s.mItem, pressed && { opacity: 0.5 }]}>
                <Ionicons name={icon} size={19} color={C.accent} />
                <Text numberOfLines={1} style={s.mTx}>{label}</Text>
                <Ionicons name="chevron-forward" size={15} color={C.ink3} style={{ marginLeft: 'auto' }} />
              </Pressable>
            </Animated.View>
          ))}
          {ui ? (
            <Animated.View entering={ent(MENU.length)}>
              <Text style={[s.sSec, { paddingHorizontal: 0, marginTop: 22 }]}>Tema</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {THEME_OPTS.map(([v, l]) => (
                  <Pressable key={v} onPress={() => onCmd('theme', v)} style={[s.mOpt, ui.theme === v && { backgroundColor: C.ink }]}>
                    <Text style={[s.mOptTx, ui.theme === v && { color: C.bg }]}>{l}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[s.sSec, { paddingHorizontal: 0, marginTop: 22 }]}>Diagnostica</Text>
              <Pressable onPress={() => onCmd('perf', ui.perf ? 0 : 1)} style={[s.mItem, { justifyContent: 'space-between' }]}>
                <Text style={[s.mTx, { fontSize: 14 }]}>Pannello diagnosi</Text>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: ui.perf ? C.accent : C.ink3 }}>{ui.perf ? 'Attivo' : 'Spento'}</Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// Calendario: sceglie un giorno qualsiasi; la striscia dei giorni e le pagine si ricentrano su quel giorno.
const MFULL = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const WK = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
function Calendar({ visible, selected, onClose, onPick }) {
  const { C, s } = useT();
  const [mon, setMon] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  useEffect(() => { if (visible) setMon(new Date(selected.getFullYear(), selected.getMonth(), 1)); }, [visible, selected]);
  const first = (new Date(mon.getFullYear(), mon.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(mon.getFullYear(), mon.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const diffOf = (d) => Math.round((new Date(mon.getFullYear(), mon.getMonth(), d) - TODAY_MID) / 86400000);
  const selDiff = Math.round((new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()) - TODAY_MID) / 86400000);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.calBack} onPress={onClose}>
        <Pressable style={s.calBox} onPress={() => {}}>
          <View style={s.calHead}>
            <Pressable hitSlop={14} onPress={() => setMon(new Date(mon.getFullYear(), mon.getMonth() - 1, 1))}><Ionicons name="chevron-back" size={20} color={C.ink} /></Pressable>
            <Text style={s.calTitle}>{MFULL[mon.getMonth()]} {mon.getFullYear()}</Text>
            <Pressable hitSlop={14} onPress={() => setMon(new Date(mon.getFullYear(), mon.getMonth() + 1, 1))}><Ionicons name="chevron-forward" size={20} color={C.ink} /></Pressable>
          </View>
          <View style={s.calRow}>{WK.map((w, i) => <Text key={i} style={s.calWk}>{w}</Text>)}</View>
          <View style={s.calGrid}>
            {cells.map((d, i) => {
              if (!d) return <View key={i} style={s.calCell} />;
              const df = diffOf(d); const sel = df === selDiff;
              return (
                <Pressable key={i} onPress={() => onPick(df)} style={s.calCell}>
                  <View style={[s.calDay, sel && s.calSel, !sel && df === 0 && s.calToday]}><Text style={[s.calTxt, sel && s.calTxtSel]}>{d}</Text></View>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={() => onPick(0)} style={s.calTodayBtn}><Text style={{ color: C.accent, fontWeight: '700', fontSize: 14 }}>Oggi</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Una pagina del pager: posizione = (indice - pagina corrente) * larghezza, calcolata sul thread dell'interfaccia (mai dal JS)
const Pane = ({ idx, x, children }) => {
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: (idx - x.value) * W }] }));
  return <Animated.View style={[StyleSheet.absoluteFill, st]}>{children}</Animated.View>;
};

const NO_LAUNCH = "try{sessionStorage.setItem('sl-launched','1')}catch(e){};" + "(function(){var n=0;window.__slDepth=0;var send=function(){window.__slDepth=n;try{window.ReactNativeWebView.postMessage('depth:'+n)}catch(e){}};var P=history.pushState,R=history.replaceState;history.pushState=function(s,t,u){n++;var st=Object.assign({},s||{});st.__sln=n;var r=P.call(this,st,t,u);send();return r;};history.replaceState=function(s,t,u){var st=Object.assign({},s||{});st.__sln=n;return R.call(this,st,t,u);};window.addEventListener('popstate',function(){var st=history.state;if(st&&typeof st.__sln==='number'){n=st.__sln;}else{n=0;}send();if(location.hash==='#/linee-guida'&&!(window.__slQ>Date.now())){try{window.ReactNativeWebView.postMessage('home')}catch(e){}}});})();true;";
const EDGE_W = 16; // striscia nativa sul bordo (swipe fluido sul thread UI). Stretta: piu' larga copriva i tasti a sinistra (Riepilogo) e ne mangiava il tocco.
const SWIPE_GAIN = 2.2; // la pagina corre piu' veloce del dito: uno swipe leggero (~23% dello schermo) la porta oltre la meta'. Stesso valore in lib/carousel.js

const THEME_JS = "(function(){try{var send=function(){window.ReactNativeWebView.postMessage(document.documentElement.classList.contains('dark')?'dark':'light');};send();new MutationObserver(send).observe(document.documentElement,{attributes:true,attributeFilter:['class']});}catch(e){}})();true;";
const scoreStr = (sc) => { const x = /(\d+)\s*-\s*(\d+)/.exec(String(sc || '')); return x ? `${x[1]}-${x[2]}` : null; };

// Dock in basso (concept C "isola compatta", stesso disegno nel sito): Home, Calcolatore, Giocatori, Matchup. Vetro sfocato, tasselli 46 px,
// la voce attiva si allarga in pillola con il nome. Componente a parte e memoizzato: non si ridisegna quando la Home cambia giorno o scorre.
const isTabRoute = (r) => TABS.some(([, , x]) => x && String(r || '').startsWith(x));
const TABS = [['Home', 'home-outline', null], ['Calcolatore', 'calculator-outline', '/calcolatore'], ['Giocatori', 'people-outline', '/migliori-giocatori'], ['Matchup', 'sword-cross', '/migliori-matchup']];
const tabOf = (r) => (TABS.find(([, , x]) => x && String(r || '').startsWith(x)) || [])[2] || '';
const DOCK_T = LinearTransition.duration(220).easing(Easing.out(Easing.cubic));
// voce gia' attiva toccata di nuovo: la pagina torna in cima (onTop). `live`: partite live di oggi (badge su Home, solo se ce ne sono)
const TabBar = memo(({ onOpen, onHome, onTop, active, bottom, live }) => {
  const { C, s } = useT();
  return (
    <View pointerEvents="box-none" style={[s.tabWrap, { paddingBottom: Math.max(bottom, 8) }]}>
      <View style={s.dock}>
        <View pointerEvents="none" style={s.dockGlass}><BlurView intensity={40} tint={C.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /></View>
        {TABS.map(([label, icon, route], j) => {
          const Ic = icon === 'sword-cross' ? MaterialCommunityIcons : Ionicons;
          const on = active === route;
          return (
            <React.Fragment key={label}>
              {j === 1 ? <View style={s.dockSep} /> : null}
              <Animated.View layout={DOCK_T}>
                <Pressable
                  onPress={() => (on ? onTop(route) : route ? onOpen(route) : onHome())}
                  accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: on }}
                  style={({ pressed }) => [s.dockTile, on && s.dockOn, pressed && s.dockPressed]}
                >
                  <Ic name={icon} size={21} color={on ? C.accent : C.ink2} />
                  {on ? <Animated.Text entering={FadeIn.duration(180)} numberOfLines={1} style={s.dockTxt}>{label}</Animated.Text> : null}
                  {!route && live > 0 ? <View style={s.dockBadge}><Text style={s.dockBadgeTxt}>{live > 99 ? '99+' : live}</Text></View> : null}
                </Pressable>
              </Animated.View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
});


// pillola unica Tutte | Live: l'indicatore scorre da meta' a meta' e passa dal blu al rosso (stesso movimento e colore nel sito)
function LivePill({ value, onChange }) {
  const { C } = useT();
  const [w, setW] = useState(0);
  const p = useSharedValue(value === 'live' ? 1 : 0);
  useEffect(() => { p.value = withTiming(value === 'live' ? 1 : 0, { duration: 420, easing: Easing.inOut(Easing.cubic) }); }, [value, p]);
  const half = w / 2;
  const th = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * half }], backgroundColor: interpolateColor(p.value, [0, 1], [C.accent, C.live]) }), [half, C]);
  const t1 = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], ['#FFFFFF', C.ink3]) }), [C]);
  const t2 = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], [C.ink3, '#FFFFFF']) }), [C]);
  const dot = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [C.live, '#FFFFFF']) }), [C]);
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ width: 160, height: 38, borderRadius: 19, overflow: 'hidden', flexDirection: 'row', backgroundColor: C.chip, borderWidth: 1, borderColor: C.border }}>
      {w ? <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: half, borderRadius: 19 }, th]} /> : null}
      <Pressable onPress={() => onChange('all')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Animated.Text style={[{ fontSize: 13.5, fontWeight: '600' }, t1]}>Tutte</Animated.Text></Pressable>
      <Pressable onPress={() => onChange('live')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}><Animated.View style={[{ width: 7, height: 7, borderRadius: 4 }, dot]} /><Animated.Text style={[{ fontSize: 13.5, fontWeight: '600' }, t2]}>Live</Animated.Text></Pressable>
    </View>
  );
}

// Scheletro di caricamento (al posto della rotella): barre grigie del tema con un riflesso che scorre.
// Un solo valore animato per tutte le barre, driver nativo (nessun lavoro JS per fotogramma); con "Riduci movimento" resta fermo.
// Compare dopo 150 ms: un caricamento piu' corto non lampeggia.
const SkCtx = createContext(null);
function SkBox({ children, style }) {
  const v = useRef(new RNAnimated.Value(0)).current;
  const op = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    let on = true; let loop = null;
    RNAnimated.timing(op, { toValue: 1, delay: 150, duration: 160, useNativeDriver: true }).start();
    AccessibilityInfo.isReduceMotionEnabled().then((still) => {
      if (!on || still) return;
      loop = RNAnimated.loop(RNAnimated.timing(v, { toValue: 1, duration: 1500, useNativeDriver: true }));
      loop.start();
    }).catch(() => {});
    return () => { on = false; if (loop) loop.stop(); };
  }, [v, op]);
  return <SkCtx.Provider value={v}><RNAnimated.View pointerEvents="none" style={[{ opacity: op }, style]}>{children}</RNAnimated.View></SkCtx.Provider>;
}
const SkBar = ({ w, h = 12, r = 6, style }) => {
  const { C } = useT();
  const v = useContext(SkCtx);
  const tx = v ? v.interpolate({ inputRange: [0, 1], outputRange: [-w, w] }) : 0;
  return (
    <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: C.skBase, overflow: 'hidden' }, style]}>
      <RNAnimated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
        <LinearGradient colors={[C.skHi0, C.skHi, C.skHi0]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
      </RNAnimated.View>
    </View>
  );
};
const SkCard = ({ h, children }) => {
  const { C } = useT();
  return <View style={{ height: h, marginHorizontal: 16, marginBottom: 12, borderRadius: 24, padding: 16, backgroundColor: C.card2, borderWidth: StyleSheet.hairlineWidth, borderColor: C.hair, overflow: 'hidden' }}>{children}</View>;
};
const SkLines = ({ n = 3 }) => (
  <>
    {Array.from({ length: n }, (_, i) => <SkBar key={i} w={i ? (W - 64) * (i % 2 ? 0.7 : 0.55) : (W - 64) * 0.38} h={i ? 9 : 11} style={{ marginBottom: 10 }} />)}
  </>
);
// righe di partite dentro una finestra (logo, nome, orario, nome, logo): solo quante ne entrano nello schermo
const SkMatchRows = ({ n }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}>
        <SkBar w={(W - 64) * 0.3} h={10} />
        <SkBar w={22} h={22} r={11} style={{ marginLeft: 8 }} />
        <View style={{ flex: 1, alignItems: 'center' }}><SkBar w={34} h={10} /></View>
        <SkBar w={22} h={22} r={11} style={{ marginRight: 8 }} />
        <SkBar w={(W - 64) * 0.3} h={10} />
      </View>
    ))}
  </>
);
// Home ancora senza dati: giorni, pillola Tutte/Live e finestre dei paesi
function SkHome() {
  const rows = Math.max(3, Math.min(8, Math.floor((Dimensions.get('window').height - 300) / 44)));
  return (
    <SkBox style={{ paddingTop: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 18 }}>
        {[0, 1, 2, 3, 4].map((i) => <SkBar key={i} w={44} h={12} />)}
      </View>
      <SkBar w={150} h={36} r={18} style={{ marginLeft: 16, marginBottom: 18 }} />
      <SkCard h={70 + rows * 44}><SkBar w={(W - 64) * 0.4} h={12} style={{ marginBottom: 16 }} /><SkMatchRows n={rows} /></SkCard>
      <SkCard h={56}><SkBar w={(W - 64) * 0.5} h={12} /></SkCard>
      <SkCard h={56}><SkBar w={(W - 64) * 0.45} h={12} /></SkCard>
    </SkBox>
  );
}
// pagina web in apertura: stessa forma della pagina (schede della barra: elenco di riquadri; altre: banner, schede, riquadri)
function SkWeb({ route }) {
  const { C } = useT();
  const list = /^\/(migliori-giocatori|migliori-matchup)/.test(route || '');
  const n = Math.max(3, Math.min(7, Math.ceil((Dimensions.get('window').height - 200) / 108)));
  if (list) {
    return (
      <SkBox style={[StyleSheet.absoluteFill, { backgroundColor: C.bg, paddingTop: 18 }]}>
        <SkBar w={190} h={20} style={{ marginLeft: 20, marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 18 }}>{[0, 1, 2, 3, 4].map((i) => <SkBar key={i} w={44} h={12} style={{ marginRight: 18 }} />)}</View>
        {Array.from({ length: n }, (_, i) => <SkCard key={i} h={96}><SkLines n={3} /></SkCard>)}
      </SkBox>
    );
  }
  return (
    <SkBox style={[StyleSheet.absoluteFill, { backgroundColor: C.bg, paddingTop: 20 }]}>
      <View style={{ paddingLeft: 40, marginBottom: 30 }}>
        <SkBar w={W * 0.5} h={14} style={{ marginBottom: 10 }} />
        <SkBar w={W * 0.3} h={10} />
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 22 }}>{[62, 58, 70, 60].map((w, i) => <SkBar key={i} w={w} h={12} style={{ marginRight: 24 }} />)}</View>
      <SkCard h={134}><SkLines n={3} /></SkCard>
      <SkCard h={240}><SkLines n={3} /></SkCard>
      <SkCard h={180}><SkLines n={3} /></SkCard>
    </SkBox>
  );
}

function Screen({ onTheme, onReset }) {
  const { C, s } = useT();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState(null); // { dates, keys, data } cambiano insieme: mai date nuove con partite vecchie
  const [center, setCenter] = useState(0); // giorno al centro della striscia (0 = oggi)
  const [cal, setCal] = useState(false);
  const [srch, setSrch] = useState(false);   // tendina di ricerca (nativa)
  const [menu, setMenu] = useState(false);   // menu a tendina (nativo): mai aperti insieme
  const [srchRes, setSrchRes] = useState(null);
  const [ui, setUi] = useState(null);        // tema e diagnostica del sito, per il menu
  const srchSeq = useRef(0);
  const [cur, setCur] = useState(TODAY_INDEX);
  const [filter, setFilter] = useState('all');
  const [warm, setWarm] = useState(false);
  const [depth, setDepth] = useState(0); // pagine aperte nella WebView dopo la prima (0 = la prima: lo swipe indietro e' dell'app)
  const openRef = useRef(false);
  // La pagina web si prepara a riposo (2,5 s dopo l'avvio) e poi ci mette un po' a caricarsi. Un tocco prima che sia pronta
  // (tasto in basso, ricerca, menu, partita) non puo' cambiare l'hash di una pagina che non c'e' ancora: la rotta si ricorda
  // (`pendingHash`), la pagina si monta subito gia' sulla rotta giusta (`bootUri`) e al termine del caricamento si applica.
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const [webOpen, setWebOpen] = useState(false);   // la pagina web e' sopra la Home (la barra in basso e' sempre quella nativa)
  const [barOn, setBarOn] = useState(false);       // la barra nativa si vede solo in Home e nelle tre schede (Calcolatore, Giocatori, Matchup)
  const [tab, setTab] = useState('');               // voce della barra scelta: si evidenzia nell'istante del tocco (poi segue `route:` della pagina)
  const [homeTop, setHomeTop] = useState(0);        // tasto Home toccato in Home: la lista del giorno torna in cima
  const [busy, setBusy] = useState(false); // apertura in corso: rotella al posto della pagina vecchia
  const webPath = useRef('');               // percorso che la pagina web dice di mostrare (messaggio `route:`)
  const awaitRoute = useRef(null);
  const busyTimer = useRef(null);
  const endBusy = useCallback(() => { clearTimeout(busyTimer.current); awaitRoute.current = null; setBusy(false); }, []);
  const pendingHash = useRef(null);
  const startRoute = useRef('/linee-guida');
  const bootUri = useRef(null);
  const [webKey, setWebKey] = useState(0); // cambia = la pagina web si ricrea (processo di WebView terminato da iOS)
  const lastRoute = useRef('/linee-guida');
  const pongAt = useRef(0);
  const bgAt = useRef(0);
  const strip = useRef(null); const pos = useRef({}); const webRef = useRef(null);
  const lastCenter = useRef(0);
  const curRef = useRef(cur); curRef.current = cur;
  // il tasto Live vale solo per oggi: cambiando giorno (swipe o calendario) si torna a "Tutte"
  // (filtro effettivo: dipende dal giorno mostrato, non da un effetto che arriva dopo; il giorno si confronta con la data vera)
  const viewRef = useRef(null); viewRef.current = view;
  const data = view ? view.data : null;
  const keys = view ? view.keys : NOKEYS;
  const dates = view ? view.dates : NOKEYS;
  const N = OFFSETS.length;
  const todayKey = rome(new Date());
  const eff = filter === 'live' && keys[cur] === todayKey ? 'live' : 'all';
  useEffect(() => { if (filter === 'live' && keys[cur] !== todayKey) setFilter('all'); }, [cur, filter, keys, todayKey]);
  const x = useSharedValue(TODAY_INDEX);
  const x0 = useSharedValue(TODAY_INDEX);
  const ov = useSharedValue(W); // pagina web: W = fuori schermo a destra, 0 = aperta
  const ovStart = useSharedValue(0);

  useEffect(() => {
    let on = true;
    const base = new Date(); base.setDate(base.getDate() + center);
    const ds = OFFSETS.map((o) => { const d = new Date(base); d.setDate(d.getDate() + o); return d; });
    const ks = ds.map(rome);
    (async () => {
      const files = await Promise.all(ks.map((k) => getJ(`giorni/${k}.json`).catch(() => getJ(`giorni_arch/${k}.json`)).catch(() => ({ m: [] }))));
      const seen = new Set(); const by = {};
      files.forEach((f) => (f.m || []).forEach((m) => {
        if (seen.has(m[0]) || m[8] === 'c' || !m[5] || !m[6] || !m[2]) return; seen.add(m[0]);
        const k = rome(new Date(m[2])); (by[k] = by[k] || []).push(m);
      }));
      await MEM_READY;
      const nowT = Date.now();
      Object.keys(by).forEach((k) => { by[k] = by[k].map((m) => {
        if (m[8] !== 'l' || /\d/.test(m[7] || '')) return m;
        const mem = LIVE_MEM.get(String(m[0])); if (!mem || nowT - mem.t >= MEM_TTL || mem.st !== 'l') return m;
        const n = m.slice(); n[7] = mem.score; n[10] = mem.lt; return n;
      }); });
      if (!on) return;
      if (lastCenter.current !== center) { lastCenter.current = center; cancelAnimation(x); x.value = TODAY_INDEX; setCur(TODAY_INDEX); }
      setView({ dates: ds, keys: ks, data: ks.map((k) => by[k] || []) });
    })();
    return () => { on = false; };
  }, [center, x]);
  // la pagina web si prepara a riposo (leggera) cosi' aprire una partita non ricarica niente
  useEffect(() => { if (!data) return undefined; const t = setTimeout(() => setWarm(true), 700); return () => clearTimeout(t); }, [!!data]);

  // stato, risultato e minuto live veri (come la Home web): /f del giorno per top campionati e coppe europee, /fx per le altre partite
  // iniziate da meno di 5 ore, giorni/<data>.json per quelle piu' vecchie. Mai "live" per una partita finita.
  const refresh = useCallback(async (iso) => {
    const v = viewRef.current; if (!v) return;
    const i = v.keys.indexOf(iso); if (i < 0) return;
    const now = Date.now();
    const clock = (c, ht) => { if (ht || /^HT$/i.test(String(c || ''))) return 'HT'; const n = parseInt(String(c || ''), 10); return Number.isFinite(n) ? String(n) : undefined; };
    const upd = new Map(); // id partita -> { st, score, lt }
    const getF = async (p) => { const r = await fetch(p); if (!r.ok) throw new Error(p); return r.json(); };
    try {
      const d = await getF(`${WORKER}/f?date=${iso.replace(/-/g, '')}`);
      (d.m || []).forEach((y) => {
        const sc = scoreStr(y.sc);
        const uu = y.f && sc ? { st: 'f', score: sc } : y.s && !y.f ? { st: 'l', score: sc, lt: clock(y.lt) } : { st: 'n' };
        upd.set(String(y.id), uu);
        if (uu.st === 'l' && uu.score) { LIVE_MEM.set(String(y.id), { ...uu, t: now }); memSave(); }
      });
    } catch (e) { /* si riprova al prossimo giro */ }
    const rows0 = (viewRef.current && viewRef.current.keys === v.keys ? viewRef.current.data[i] : null) || [];
    // altre partite iniziate da meno di 5 ore (campionati e coppe aggiunti): una richiesta per partita, al massimo 12 per giro
    // prima quelle gia' "live" ma senza gol (il risultato deve esserci sempre), poi le altre; al massimo 36 per giro, 6 richieste insieme
    const one = rows0.filter((m) => !upd.has(String(m[0])) && m[8] !== 'f' && Date.parse(m[2]) <= now && now - Date.parse(m[2]) < 5 * 3600000)
      .sort((a, b) => (b[8] === 'l' && !/\d/.test(b[7] || '') ? 1 : 0) - (a[8] === 'l' && !/\d/.test(a[7] || '') ? 1 : 0)).slice(0, 36);
    let k = 0;
    const worker = async () => {
      while (k < one.length) {
        const m = one[k++];
        try {
          const d = await getF(`${WORKER}/fx?id=${m[0]}`);
          const sc = d.sc && d.sc[0] != null ? `${d.sc[0]}-${d.sc[1]}` : null;
          const u = d.fin && sc ? { st: 'f', score: sc } : d.st ? { st: 'l', score: sc, lt: clock(d.clk, d.ht) } : { st: 'n' };
          upd.set(String(m[0]), u);
          if (u.score) { LIVE_MEM.set(String(m[0]), { ...u, t: now }); memSave(); }
        } catch (e) { /* si riprova al prossimo giro */ }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
    // iniziate da piu' di 5 ore e ancora senza risultato: feed del giorno (aggiornato ogni 10 minuti)
    if (rows0.some((m) => m[8] !== 'f' && now - Date.parse(m[2]) >= 5 * 3600000 && now - Date.parse(m[2]) < 4 * 86400000)) {
      try {
        const f = await getF(`${SITE}giorni/${iso}.json?t=${Math.floor(now / 60000)}`);
        (f.m || []).forEach((y) => { const sc = scoreStr(y[7]); if (y[8] === 'f' && sc && !upd.has(String(y[0]))) upd.set(String(y[0]), { st: 'f', score: sc }); });
      } catch (e) { /* ignora */ }
    }
    const v2 = viewRef.current; if (!v2 || v2.keys !== v.keys) return;
    let changed = false;
    const rows = v2.data[i].map((m) => {
      let u = upd.get(String(m[0]));
      // ultimo risultato noto (anche dopo aver cambiato giorno e ricostruito le righe): mai "live" senza gol se lo conosciamo
      if (!u && m[8] === 'l' && !/\d/.test(m[7] || '')) { const mem = LIVE_MEM.get(String(m[0])); if (mem && now - mem.t < MEM_TTL) u = mem; }
      if (!u) return m;
      let st = m[8]; let score = m[7]; let lt = m[10];
      if (u.st === 'f' && u.score) { st = 'f'; score = u.score; lt = undefined; }
      else if (u.st === 'l') { st = 'l'; if (u.score) score = u.score; lt = u.lt; }
      else if (u.st === 'n' && st === 'l') { st = 'n'; score = ''; lt = undefined; }
      if (st === m[8] && score === m[7] && lt === m[10]) return m;
      changed = true;
      const n = m.slice(); n[7] = score; n[8] = st; n[10] = lt; return n;
    });
    if (changed) setView((p) => (p && p.keys === v2.keys ? { ...p, data: p.data.map((r, kk) => (kk === i ? rows : r)) } : p));
  }, []);
  useEffect(() => {
    if (!data) return undefined;
    let alive = true; let t;
    const tick = async () => {
      if (!alive) return;
      if (AppState.currentState === 'active') {
        const v = viewRef.current;
        const days = new Set([rome(new Date())]);
        if (v && v.keys[curRef.current]) days.add(v.keys[curRef.current]);
        for (const iso of days) await refresh(iso);
      }
      const v3 = viewRef.current;
      const anyLive = !!v3 && v3.data.some((d) => d.some((m) => m[8] === 'l'));
      if (alive) t = setTimeout(tick, anyLive ? 5000 : 60000);
    };
    tick();
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') { clearTimeout(t); tick(); } });
    return () => { alive = false; clearTimeout(t); sub.remove(); };
  }, [!!data, refresh]);

  const markClosed = useCallback(() => { openRef.current = false; setWebOpen(false); }, []);
  // Ogni cambio di rotta deciso dall'app porta `__slQ`: la pagina web non risponde con 'home' al ritorno alla pagina di partenza (era l'eco che, arrivando in ritardo, richiudeva la pagina appena aperta dal tocco dopo).
  const hashTo = useCallback((h) => {
    if (readyRef.current && webRef.current) { pendingHash.current = null; webRef.current.injectJavaScript(`window.__slQ=Date.now()+1500;location.hash=${JSON.stringify(h)};true;`); }
    else pendingHash.current = h; // pagina non ancora caricata: si applica appena pronta
  }, []);
  const onWebLoaded = useCallback(() => {
    readyRef.current = true;
    const h = pendingHash.current;
    pendingHash.current = null;
    if (h && webRef.current) webRef.current.injectJavaScript(`window.__slQ=Date.now()+1500;if(location.hash!==${JSON.stringify(h)})location.hash=${JSON.stringify(h)};true;`);
    setReady(true);
  }, []);
  // La pagina web e' morta (iOS termina il processo della WebView in background): si ricrea gia' sulla rotta giusta (l'ultima disegnata se la finestra e' aperta, altrimenti la pagina di partenza).
  const recover = useCallback(() => {
    const r = awaitRoute.current ? lastRoute.current : openRef.current ? (webPath.current || lastRoute.current) : '/linee-guida';
    readyRef.current = false; pendingHash.current = null; webPath.current = '';
    bootUri.current = `${SITE}aurora/#${r}`;
    setReady(false); setWebKey((k) => k + 1);
  }, []);
  // Tornando dal background: oltre 10 minuti l'app riparte da zero (come appena aperta); entro 10 minuti resta com'era e, se la pagina web
  // non risponde (processo terminato), si ricrea sulla stessa rotta.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'background') { bgAt.current = Date.now(); return; }
      if (st !== 'active' || !bgAt.current) return;
      const gap = Date.now() - bgAt.current; bgAt.current = 0;
      if (gap > 10 * 60 * 1000) { if (onReset) onReset(); return; }
      // animazioni native fermate a meta' dal sistema: la pagina web torna dov'e' (aperta = 0, chiusa = fuori schermo) e nessuna rotella resta accesa senza una pagina in arrivo
      try { ov.value = openRef.current ? 0 : W; } catch (e) { /* ignora */ }
      if (!awaitRoute.current) setBusy(false);
      if (!readyRef.current || !webRef.current) return;
      // la pagina web si rimette in sesto da sola (animazioni a meta', blocchi accesi, schermo rimisurato)
      webRef.current.injectJavaScript("try{window.dispatchEvent(new Event('sl-native-resume'))}catch(e){};true;");
      const t0 = Date.now();
      webRef.current.injectJavaScript("try{window.ReactNativeWebView.postMessage('pong')}catch(e){};true;");
      setTimeout(() => { if (pongAt.current < t0 && readyRef.current) recover(); }, 1500);
    });
    return () => sub.remove();
  }, [onReset, recover, ov]);
  const openRoute = useCallback((route) => {
    openRef.current = true; lastRoute.current = route; setWebOpen(true); setDepth(0); setBarOn(isTabRoute(route)); setTab(tabOf(route));
    if (!readyRef.current) { startRoute.current = route; setWarm(true); }
    const path = route.split('?')[0];
    // la pagina web e' gia' su questa rotta (riapertura veloce, o tocco che torna alla pagina mostrata prima che l'altra arrivasse): niente attesa.
    // Prima l'attesa della rotta precedente restava accesa: rotella per 4 s e poi pagina web ricaricata da zero.
    if (webPath.current === path) endBusy();
    else {
      awaitRoute.current = path; setBusy(true);
      // rete di sicurezza: mai rotella infinita. Dopo 4 s si chiede alla pagina se e' viva: se risponde e' solo lenta (si mostra com'e'),
      // se tace e' morta e si ricrea sulla rotta chiesta. Prima si ricreava sempre: una pagina lenta veniva ricaricata da zero.
      clearTimeout(busyTimer.current);
      busyTimer.current = setTimeout(() => {
        if (!awaitRoute.current) return;
        const t0 = Date.now();
        try { webRef.current.injectJavaScript("try{window.ReactNativeWebView.postMessage('pong')}catch(e){};true;"); } catch (e) { /* ignora */ }
        busyTimer.current = setTimeout(() => { if (awaitRoute.current && pongAt.current < t0) recover(); endBusy(); }, 1200);
      }, 4000);
    }
    hashTo(`#${route}`);
    ov.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [hashTo, ov, endBusy, recover]);
  // la pagina web lascia la scheda mostrata: riaprendo la stessa voce si aspetta il suo disegno (niente Linee guida intraviste)
  const afterClose = useCallback(() => { webPath.current = ''; hashTo('#/linee-guida'); setDepth(0); }, [hashTo]);
  const onTop = useCallback((route) => {
    if (!route) { setHomeTop((n) => n + 1); return; }
    if (readyRef.current && webRef.current) webRef.current.injectJavaScript("try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){};true;");
  }, []);
  const closeWeb = useCallback(() => { openRef.current = false; setWebOpen(false); ov.value = withTiming(W, { duration: 240, easing: Easing.out(Easing.cubic) }, (done) => { if (done) runOnJS(afterClose)(); }); }, [afterClose, ov]);
  const openMatch = useCallback((m) => {
    // sempre la scheda d'archivio della stagione in corso: il percorso del feed (x-) trova la partita solo se il sito ha gia' caricato
    // quel giorno (provato: 12 partite su 26 dei campionati minori e tutte le coppe europee davano "Partita non trovata").
    const sk = m[11] || META.cur[String(m[1])];
    openRoute(sk ? `/match/a-${m[1]}-${sk}-${m[0]}` : `/match/x-${m[1]}-${m[0]}`);
  }, [openRoute]);
  const onMsg = useCallback((e) => {
    const t = e && e.nativeEvent && e.nativeEvent.data;
    if (t === 'dark' || t === 'light') onTheme(t);
    else if (t === 'pong') pongAt.current = Date.now();
    else if (typeof t === 'string' && t.startsWith('srch:')) { const k = t.indexOf(':', 5); if (Number(t.slice(5, k)) === srchSeq.current) { try { setSrchRes(JSON.parse(t.slice(k + 1))); } catch (err) { /* ignora */ } } } // risultati della ricerca (calcolati dalla pagina web: stessi del sito)
    else if (typeof t === 'string' && t.startsWith('ui:state:')) { const [th, pf] = t.slice(9).split(':'); setUi({ theme: th, perf: pf === '1' }); }
    else if (t === 'ui:search' || t === 'ui:menu') { if (openRef.current) closeWeb(); setMenu(t === 'ui:menu'); setSrch(t === 'ui:search'); } // vecchi link /cerca e /menu: Home con la tendina aperta
    else if (typeof t === 'string' && t.startsWith('route:')) { webPath.current = t.slice(6); if (!awaitRoute.current || awaitRoute.current === webPath.current) { setTab(tabOf(webPath.current)); setBarOn(isTabRoute(webPath.current)); } if (awaitRoute.current === webPath.current) endBusy(); } // la pagina web ha disegnato questa rotta
    else if (typeof t === 'string' && t.startsWith('depth:')) setDepth(Number(t.slice(6)) || 0);
    else if (typeof t === 'string' && t.startsWith('drag:')) { const d = Number(t.slice(5)); ov.value = d < 0 ? withTiming(0, { duration: 180 }) : withTiming(d, { duration: 90, easing: Easing.linear }); } // swipe indietro partito dentro la pagina web (prima pagina dopo la Home)
    else if (t === 'home' && openRef.current) closeWeb(); // il tasto indietro del sito e' tornato alla pagina di partenza: si torna alla Home
  }, [onTheme, closeWeb, ov, endBusy]);
  const pick = useCallback((diff) => { setCal(false); setCenter(diff); }, []);
  // ricerca: la pagina web (gia' caricata, con tutti i dati) calcola i risultati e li manda indietro (`srch:<n>:<json>`)
  const askSearch = useCallback((q) => {
    const n = ++srchSeq.current;
    if (!String(q || '').trim()) { setSrchRes(null); return; }
    if (readyRef.current && webRef.current) webRef.current.injectJavaScript(`window.__slSearch&&window.__slSearch(${JSON.stringify(q)},${n});true;`);
  }, []);
  const uiCmd = useCallback((cmd, v) => { if (readyRef.current && webRef.current) webRef.current.injectJavaScript(`window.__slCmd&&window.__slCmd(${JSON.stringify(cmd)},${JSON.stringify(v === undefined ? null : v)});true;`); }, []);
  const openSearch = useCallback(() => { setMenu(false); setSrchRes(null); setSrch(true); }, []);
  const openMenuP = useCallback(() => { setSrch(false); setMenu(true); }, []);
  const closeSrch = useCallback(() => setSrch(false), []);
  const closeMenu = useCallback(() => setMenu(false), []);
  const pickSrch = useCallback((route) => { setSrch(false); openRoute(route); }, [openRoute]);
  const goMenu = useCallback((route) => { setMenu(false); if (route !== '/') openRoute(route); }, [openRoute]);

  const centre = useCallback((i) => { const p = pos.current[i]; if (p && strip.current) strip.current.scrollTo({ x: Math.max(0, p.x - W / 2 + p.w / 2), animated: true }); }, []);
  useEffect(() => { centre(cur); }, [cur, centre, view]);
  useAnimatedReaction(() => Math.round(x.value), (r, prev) => { if (r !== prev) runOnJS(setCur)(r); });
  const go = (i) => { x.value = withTiming(i, { duration: 320, easing: Easing.out(Easing.cubic) }); };

  // swipe tra i giorni: parte anche mentre la lista scorre in verticale o l'animazione precedente non e' finita
  const pan = useMemo(() => Gesture.Pan().activeOffsetX([-10, 10]).failOffsetY([-28, 28])
    .onStart(() => { cancelAnimation(x); x0.value = x.value; })
    .onUpdate((e) => {
      let v = x0.value - e.translationX / W;
      if (v < 0) v *= 0.3; else if (v > N - 1) v = N - 1 + (v - (N - 1)) * 0.3;
      x.value = v;
    })
    .onEnd((e) => {
      const base = Math.round(x0.value);
      let t = Math.round(x.value - (e.velocityX / W) * 0.2);
      t = Math.max(base - 1, Math.min(base + 1, t));
      t = Math.max(0, Math.min(N - 1, t));
      x.value = withTiming(t, { duration: 240, easing: Easing.out(Easing.cubic) });
    }), [x, x0, N]);

  // bordo sinistro: scorrimento indietro dalla pagina web
  const edge = useMemo(() => Gesture.Pan().activeOffsetX([6, 1000]).failOffsetY([-40, 40])
    .onStart(() => { ovStart.value = ov.value; })
    .onUpdate((e) => { ov.value = Math.min(W, Math.max(0, ovStart.value + e.translationX * SWIPE_GAIN)); })
    .onEnd((e) => {
      if (e.translationX > W * 0.2 || e.velocityX > 300) { runOnJS(markClosed)(); ov.value = withTiming(W, { duration: 200, easing: Easing.out(Easing.cubic) }, (done) => { if (done) runOnJS(afterClose)(); }); } else ov.value = withTiming(0, { duration: 180 });
    }), [ov, ovStart, afterClose, markClosed]);
  const ovStyle = useAnimatedStyle(() => ({ transform: [{ translateX: ov.value }] }));

  if (!data) return <View style={[s.root, { paddingTop: insets.top }]}><SkHome /></View>;
  if (warm && !bootUri.current) bootUri.current = `${SITE}aurora/#${startRoute.current}`; // fissato al primo montaggio: cambiarlo dopo ricaricherebbe la pagina
  const tIdx = keys.indexOf(todayKey); const liveN = tIdx >= 0 ? data[tIdx].reduce((n, m) => n + (m[8] === 'l' ? 1 : 0), 0) : 0; // badge del dock: partite live di oggi
  const shown = [cur - 2, cur - 1, cur, cur + 1, cur + 2].filter((i) => i >= 0 && i < N);
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={C.dark ? 'light-content' : 'dark-content'} />
      <Header onSearch={openSearch} onMenu={openMenuP} onCal={() => setCal(true)} />
      <ScrollView ref={strip} horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={s.strip}>
        {dates.map((d, i) => (
          <Pressable key={keys[i]} onPress={() => go(i)} onLayout={(e) => { pos.current[i] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width }; if (i === cur) centre(i); }}>
            <Text style={[s.dTop, i === cur && s.dOn]}>{dayLabel(d)}</Text>
            <Text style={[s.dSub, i === cur && { opacity: 0.9 }]}>{d.getDate()} {MONTHS[d.getMonth()]}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.filters}>
        <LivePill value={eff} onChange={setFilter} />
      </View>
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          {shown.map((i) => <Pane key={i} idx={i} x={x}><Day iso={keys[i]} rows={data[i]} filter={filter === 'live' && keys[i] === todayKey ? 'live' : 'all'} onOpen={openMatch} onLeague={openRoute} top={homeTop} isCur={i === cur} /></Pane>)}
        </View>
      </GestureDetector>
      <Calendar visible={cal} selected={dates[cur] || new Date()} onClose={() => setCal(false)} onPick={pick} />

      {/* pagina web (resto dell'app): gia' caricata, si apre scorrendo da destra */}
      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }, ovStyle]}>
        <View style={{ paddingTop: insets.top, flex: 1 }}>
          <Pressable onPress={closeWeb} style={s.back}><Ionicons name="chevron-back" size={20} color={C.accent} /><Text style={{ color: C.accent, fontSize: 16 }}>Home</Text></Pressable>
          <View style={{ flex: 1 }}>
            {warm ? <WebView key={webKey} ref={webRef} onContentProcessDidTerminate={recover} onRenderProcessGone={recover} source={{ uri: bootUri.current }} onLoadEnd={onWebLoaded} style={{ flex: 1, backgroundColor: C.bg }} injectedJavaScriptBeforeContentLoaded={NO_LAUNCH} injectedJavaScript={THEME_JS} onMessage={onMsg} decelerationRate={0.998} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} directionalLockEnabled={false} allowsLinkPreview={false} /> : null}
            {!ready || busy ? <View pointerEvents="auto" style={StyleSheet.absoluteFill}><SkWeb route={awaitRoute.current || lastRoute.current} /></View> : null}
          </View>
        </View>
        <GestureDetector gesture={edge}><View pointerEvents={depth > 0 ? 'none' : 'auto'} style={[s.edge, { width: EDGE_W, top: insets.top + 98 }]} /></GestureDetector>
      </Animated.View>
      {!webOpen || barOn ? <TabBar onOpen={openRoute} onHome={closeWeb} onTop={onTop} active={webOpen ? tab : null} bottom={insets.bottom} live={liveN} /> : null}
      {/* tendine della riga in alto: sopra la Home e sopra la barra (la barra non cambia) */}
      <SearchPanel open={srch} onClose={closeSrch} onPick={pickSrch} ask={askSearch} res={srchRes} ready={ready} top={insets.top + 4} />
      <MenuPanel open={menu} onClose={closeMenu} onGo={goMenu} ui={ui} onCmd={uiCmd} top={insets.top} bottom={insets.bottom} />
    </View>
  );
}

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [gen, setGen] = useState(0); // nuova generazione = tutta l'app riparte (dopo piu' di 10 minuti in background)
  const onReset = useCallback(() => setGen((g) => g + 1), []);
  useEffect(() => { AsyncStorage.getItem('sl-theme').then((v) => { if (v === 'light' || v === 'dark') setTheme(v); }).catch(() => {}); }, []);
  const onTheme = useCallback((t) => { setTheme(t); AsyncStorage.setItem('sl-theme', t).catch(() => {}); }, []);
  const T = THEMES[theme];
  return <GestureHandlerRootView style={{ flex: 1, backgroundColor: T.C.bg }}><TCtx.Provider value={T}><SafeAreaProvider><Screen key={gen} onTheme={onTheme} onReset={onReset} /></SafeAreaProvider></TCtx.Provider></GestureHandlerRootView>;
}

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  sBar: { flex: 1, minWidth: 0, height: 36, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, backgroundColor: C.chip, borderWidth: 1, borderColor: C.border },
  sBarTx: { flex: 1, color: C.ink3, fontSize: 14.5 },
  sPanel: { position: 'absolute', left: 12, right: 12, borderRadius: 26, overflow: 'hidden', backgroundColor: C.sheet, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 30, shadowOffset: { width: 0, height: 18 }, elevation: 18 },
  sRow: { height: SBAR, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 16, paddingRight: 8, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  sInput: { flex: 1, minWidth: 0, color: C.ink, fontSize: 17, paddingVertical: 0 },
  sSec: { color: C.ink3, fontSize: 11, fontWeight: '800', letterSpacing: 0.9, textTransform: 'uppercase', paddingHorizontal: 6, paddingTop: 12, paddingBottom: 6 },
  sItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6, paddingVertical: 8 },
  sName: { color: C.ink, fontSize: 14.5 },
  sMeta: { color: C.ink3, fontSize: 11.5 },
  pb: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  pbName: { color: C.ink, fontSize: 14.5, fontWeight: '800' },
  pbSub: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  pbTeam: { color: C.ink2, fontSize: 12, flexShrink: 1 },
  mPanel: { position: 'absolute', right: 0, top: 0, bottom: 0, paddingHorizontal: 18, backgroundColor: C.sheet, borderLeftWidth: 1, borderLeftColor: C.border, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 30, shadowOffset: { width: -14, height: 0 }, elevation: 20 },
  mHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 8 },
  mBrand: { color: C.ink, fontSize: 17, fontWeight: '800', letterSpacing: -0.6 },
  mItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.hair },
  mTx: { color: C.ink, fontSize: 15, flexShrink: 1 },
  mOpt: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: C.chip, borderWidth: 1, borderColor: C.border },
  mOptTx: { color: C.ink, fontSize: 13, fontWeight: '700' },
  brand: { color: C.ink, fontSize: 24, fontWeight: '800', letterSpacing: -1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip, borderWidth: 1, borderColor: C.border },
  strip: { paddingHorizontal: 20, paddingVertical: 8, gap: 24, alignItems: 'center' },
  dTop: { color: C.ink3, fontSize: 15, fontWeight: '500' },
  dOn: { color: C.ink, fontWeight: '800' },
  dSub: { color: C.ink3, fontSize: 10.5, opacity: 0.6 },
  filters: { paddingHorizontal: 20, paddingVertical: 6 },
  fBtn: { color: C.ink3, fontSize: 13.5, fontWeight: '500' },
  fOn: { color: C.ink, fontWeight: '700' },
  tabWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 8, alignItems: 'center' },
  dock: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 26, backgroundColor: C.dockBg, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: C.dark ? 0.6 : 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  dockGlass: { ...StyleSheet.absoluteFillObject, borderRadius: 26, overflow: 'hidden' },
  dockSep: { width: StyleSheet.hairlineWidth * 2, height: 26, backgroundColor: C.border },
  dockTile: { height: 46, minWidth: 46, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.tile1, borderWidth: 1, borderColor: C.border },
  dockOn: { paddingLeft: 13, paddingRight: 16, backgroundColor: C.accTint, borderWidth: 1.5, borderColor: C.accRing },
  dockPressed: { transform: [{ scale: 0.92 }], opacity: 0.85 },
  dockTxt: { color: C.accent, fontSize: 13.5, fontWeight: '800' },
  dockBadge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.live, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },
  dockBadgeTxt: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  fLive: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.live },
  card: { marginHorizontal: 16, marginTop: 16, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  inner: { borderTopWidth: 1, borderTopColor: C.hair },
  headRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 16, minHeight: 50 },
  lhRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingLeft: 16, paddingRight: 12 },
  lhName: { color: C.ink, fontSize: 12.5, fontWeight: '800', letterSpacing: 0.9, textTransform: 'uppercase', flexShrink: 1 },
  hairTop: { },
  cnt: { color: C.ink2, fontSize: 11, fontWeight: '500', marginRight: 8 },
  flag: { width: 30, height: 30, borderRadius: 15, marginLeft: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip, borderWidth: 2, shadowOpacity: 0.35, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } },
  flagImg: { width: 26, height: 26, borderRadius: 13 },
  body: { borderTopWidth: 1, borderTopColor: C.hair },
  sep: { borderTopWidth: 1, borderTopColor: C.hair },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  teamL: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  teamR: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tName: { color: C.ink, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  crest: { width: 24, height: 24 },
  crestPh: { borderRadius: 12, backgroundColor: C.dark ? 'rgba(255,255,255,.16)' : C.chip, alignItems: 'center', justifyContent: 'center' },
  crestTx: { color: C.ink3, fontSize: 9, fontWeight: '800' },
  mid: { width: 64, alignItems: 'center' },
  score: { color: C.ink, fontSize: 15.5, fontWeight: '800' },
  time: { color: C.ink2, fontSize: 13.5, fontWeight: '600' },
  fin: { color: C.ink3, fontSize: 12, fontWeight: '600' },
  kick: { color: C.ink3, fontSize: 10.5, marginTop: 2 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  liveT: { color: C.live, fontSize: 10, fontWeight: '700' },
  empty: { color: C.ink3, textAlign: 'center', padding: 50 },
  back: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 22 },
  calBack: { flex: 1, backgroundColor: 'rgba(0,0,0,.55)', justifyContent: 'center', padding: 24 },
  calBox: { backgroundColor: C.sheet, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: C.border },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 },
  calTitle: { color: C.ink, fontSize: 16, fontWeight: '800' },
  calRow: { flexDirection: 'row' },
  calWk: { width: '14.2857%', textAlign: 'center', color: C.ink3, fontSize: 12, paddingVertical: 6 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.2857%', alignItems: 'center', paddingVertical: 3 },
  calDay: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  calSel: { backgroundColor: C.accent },
  calToday: { borderWidth: 1, borderColor: C.accent },
  calTxt: { color: C.ink, fontSize: 14, fontWeight: '600' },
  calTxtSel: { color: '#FFFFFF' },
  calTodayBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20, marginTop: 6 },
});
const THEMES = { dark: { C: DARK, s: makeStyles(DARK) }, light: { C: LIGHT, s: makeStyles(LIGHT) } };
const TCtx = createContext(THEMES.dark);
const useT = () => useContext(TCtx);
