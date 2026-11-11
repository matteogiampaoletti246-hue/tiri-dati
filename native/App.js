// ScalperLab nativa - Home (React Native). Stesse regole della Home web: finestre per paese, top campionati in alto,
// colori e loghi delle competizioni, righe partita. Metadati da meta.json (generato da data/leagues.js e data/countries.js).
import React, { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable as RNPressable, ScrollView, StatusBar, Dimensions, useColorScheme, StyleSheet, Animated as RNAnimated, Easing as RNEasing, AccessibilityInfo, LayoutAnimation, Platform, UIManager, AppState, InteractionManager, Modal, TextInput, Keyboard, BackHandler, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView, Pressable } from 'react-native-gesture-handler'; // tasti di Home, Dock e barre: riconoscimento nativo (come swipe e scroll), non il sistema di tocco di JS
import { Image } from 'expo-image';
import Animated, { makeMutable, interpolate, useSharedValue, useAnimatedStyle, useAnimatedReaction, useAnimatedScrollHandler, withTiming, withDelay, withRepeat, withSequence, cancelAnimation, runOnJS, Easing, interpolateColor, Keyframe, LinearTransition, FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TOUCH, CompLogo, logoSrc } from './shared/ui';
import { backAny, backScoped, pagerTouch, LiveLayerCtx } from './shared/backGate';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAutoUpdate } from './shared/AutoUpdate';
import META from './meta.json';
import './shared/shim';
import GuidelinesPage from './pages/Guidelines';
import CalcolatorePage from './pages/Calcolatore';
import TopPlayersPage from './pages/TopPlayers';
import TopMatchupsPage from './pages/TopMatchups';
import GiocatorePage from './pages/Giocatore';
import PlayerPanelHost from './shared/PlayerPanel';
import PlayerSheetHost from './shared/PlayerSheet';
import { usePlayerSheet, closePlayer } from '@/data/playerSheet';
import { usePlayerPanel, closePanel } from '@/data/playerPanel';
import PartitaPage from './pages/Partita';
import SquadraPage from './pages/Squadra';
import CampionatoPage from './pages/Campionato';
import ArbitroPage from './pages/Arbitro';
import CompetizioniPage from './pages/Competizioni';
import TiriSquadrePage from './pages/TiriSquadre';
import { searchN } from './shared/searchN';
import { FlagN, useNatFor } from './shared/FlagN';
import { bootShared } from './shared/boot';
import { ArchTeamRoute, ArchPlayerRoute } from './pages/ArchiveRoute';
// pagine gia' native (migrazione a tappe): la rotta si apre senza WebView
const NATIVE_PAGES = { '/linee-guida': GuidelinesPage, '/calcolatore': CalcolatorePage, '/migliori-giocatori': TopPlayersPage, '/migliori-matchup': TopMatchupsPage, '/competizioni': CompetizioniPage, '/tiri-squadre': TiriSquadrePage };
// pagine nostre con un parametro nel percorso (/giocatore/:id): si attivano qui solo quando la pagina e' completa
const NATIVE_DYN = [
  [/^\/giocatore\/([^/]+)$/, GiocatorePage, 'id'],
  [/^\/match\/([^/]+)$/, PartitaPage, 'id'],
  [/^\/squadra\/([^/]+)$/, SquadraPage, 'id'],
  [/^\/campionato\/([^/]+)$/, CampionatoPage, 'id'],
  [/^\/arbitro\/([^/]+)$/, ArbitroPage, 'id'],
  [/^\/storico\/([^/]+)\/([^/]+)\/squadra\/([^/]+)$/, ArchTeamRoute, 'p', (m) => ({ fm: m[1], sk: m[2], tid: m[3] })],
  [/^\/storico\/([^/]+)\/([^/]+)\/giocatore\/([^/]+)$/, ArchPlayerRoute, 'p', (m) => ({ fm: m[1], sk: m[2], pid: m[3] })],
  [/^\/storico\/([^/]+)\/([^/]+)\/([^/]+)$/, PartitaPage, 'id', (m) => `a-${m[1]}-${m[2]}-${m[3]}`], // partita d'archivio: stesso id del sito
];
const nativeOf = (path) => {
  if (NATIVE_PAGES[path]) return { Comp: NATIVE_PAGES[path], params: {} };
  for (const [re, Comp, key, map] of NATIVE_DYN) { const m = re.exec(path); if (m) return { Comp, params: { [key]: map ? map(m) : m[1] } }; }
  return null;
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);

const SITE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/';
const W = Dimensions.get('window').width;
const DARK = { dark: true, gold: '#F2C14E', bg: '#05070D', ink: '#F1F5FB', ink2: '#A9B6CC', ink3: '#6D7A91', hair: 'rgba(255,255,255,.10)', border: 'rgba(255,255,255,.12)', accent: '#4DA8FF', good: '#3DD68C', bad: '#FF6B6B', role: { GK: '#E8B923', DEF: '#38A2FF', MID: '#3FCF8E', ATT: '#EF5B5B', UNK: '#8EA0BD', COACH: '#B48CFF' }, medal: ['#F5C84C', '#C5CEDB', '#D98F5C'], goldHi: '#FFE9A8', goldInk: '#1a1405', storyBase: '#0E1A33', storyScrim: 'rgba(2,4,10,.64)', gk: '#E6FF00', gkAlt: '#39FF14', gkInk: '#18210A', live: '#FF6464', liveLo: '#C93B3B', liveHi: '#FF5C8A', liveWarm: '#FF9A4D', chip: 'rgba(255,255,255,.08)', wash: 'rgba(255,255,255,0.03)', card1: 'rgba(255,255,255,0.10)', card2: 'rgba(255,255,255,0.035)', sheet: '#0E1626', tileBg: 'rgba(7,10,18,0.62)', scrim: 'rgba(0,0,0,.5)', dockBg: 'rgba(14,22,38,0.62)', tile1: 'rgba(255,255,255,0.08)', accTint: 'rgba(77,168,255,0.16)', accRing: 'rgba(77,168,255,0.6)', skBase: 'rgba(255,255,255,0.075)', skHi: 'rgba(255,255,255,0.10)', skHi0: 'rgba(255,255,255,0)', lg1: 'rgba(255,255,255,0.20)', lg2: 'rgba(255,255,255,0.05)', lgBorder: 'rgba(255,255,255,0.24)', lgHi: 'rgba(255,255,255,0.38)', beam0: 'rgba(77,168,255,0)', beam1: 'rgba(77,168,255,0.11)', beam2: 'rgba(77,168,255,0.065)', thumb: 'rgba(255,255,255,0.12)', thumbBd: 'rgba(255,255,255,0.18)', pillHi: 'rgba(255,255,255,0.34)', pillMid: 'rgba(255,255,255,0)', pillLo: 'rgba(0,0,0,0.16)' };
const LIGHT = { dark: false, gold: '#C58A00', bg: '#F3F6FB', ink: '#0F172A', ink2: '#475569', ink3: '#8592A6', hair: 'rgba(15,23,42,.08)', border: 'rgba(15,23,42,.10)', accent: '#1F6BEF', good: '#12A06A', bad: '#D9453F', role: { GK: '#E8B923', DEF: '#38A2FF', MID: '#3FCF8E', ATT: '#EF5B5B', UNK: '#8EA0BD', COACH: '#B48CFF' }, medal: ['#F5C84C', '#C5CEDB', '#D98F5C'], goldHi: '#FFE9A8', goldInk: '#1a1405', storyBase: '#1B2C4E', storyScrim: 'rgba(8,14,28,.58)', gk: '#D9F200', gkAlt: '#2EE02E', gkInk: '#18210A', live: '#E5484D', liveLo: '#B5262B', liveHi: '#F0457A', liveWarm: '#F08A3C', chip: 'rgba(15,23,42,.06)', wash: 'rgba(255,255,255,0.85)', card1: 'rgba(255,255,255,0.95)', card2: 'rgba(255,255,255,0.8)', sheet: '#FFFFFF', tileBg: 'rgba(247,249,252,0.62)', scrim: 'rgba(15,23,42,.28)', dockBg: 'rgba(255,255,255,0.6)', tile1: 'rgba(255,255,255,0.9)', accTint: 'rgba(31,107,239,0.12)', accRing: 'rgba(31,107,239,0.55)', skBase: 'rgba(15,23,42,0.085)', skHi: 'rgba(255,255,255,0.8)', skHi0: 'rgba(255,255,255,0)', lg1: 'rgba(255,255,255,0.95)', lg2: 'rgba(255,255,255,0.62)', lgBorder: 'rgba(15,23,42,0.10)', lgHi: '#FFFFFF', beam0: 'rgba(31,107,239,0)', beam1: 'rgba(31,107,239,0.07)', beam2: 'rgba(31,107,239,0.045)', thumb: 'rgba(15,23,42,0.08)', thumbBd: 'rgba(15,23,42,0.12)', pillHi: 'rgba(255,255,255,0.40)', pillMid: 'rgba(255,255,255,0)', pillLo: 'rgba(0,0,0,0.12)' };
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
// Giorno senza partite delle competizioni con la finestra aperta (top 5, coppe europee, Nations League): le 3 competizioni con il
// ranking piu' alto del giorno salgono in cima, aperte, come i top campionati (regola fissa 10/11/2026). Ranking = ordine dell'indice
// (pr): le coppe nazionali valgono come il loro paese (Copa del Rey prima della Bolivia), femminili/giovanili dietro.
// Si decide su tutte le partite del giorno, anche col filtro Live.
const PROMO_N = 3;
// amichevoli (nazionali e di club) mai promosse: si passa alla successiva del ranking
const FRIENDLY = /friendl|amichevol/i;
const prOf = (c) => (c.pr != null ? c.pr : c.rank);
function promoOf(rows) {
  const seen = new Set();
  for (const m of rows) { const c = META.comps[m[1]]; if (!c) continue; if (c.open) return null; if (!FRIENDLY.test(c.name || '')) seen.add(m[1]); }
  return new Set([...seen].sort((a, b) => prOf(META.comps[a]) - prOf(META.comps[b])).slice(0, PROMO_N));
}
function groupsOf(rows, filter) {
  const promo = promoOf(rows);
  const up = [];
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
    // promossa: aperta, con la tinta della sua finestra (bandiera del paese, come la pagina partita)
    if (promo && promo.has(fm)) { up.push({ ...g, open: true, tint: (c.solo < 0 && META.tints && META.tints[c.fc]) || c.tint }); return; }
    if (c.solo >= 0) { top.push(g); return; }
    const k = c.cc || `N:${c.country}`;
    if (!countries.has(k)) countries.set(k, { k, flag: c.flag, fc: c.fc || '', tint: (META.tints && META.tints[c.fc]) || '', name: c.country || '', comps: [] });
    countries.get(k).comps.push(g);
  });
  top.sort((a, b) => a.c.solo - b.c.solo);
  const cs = [...countries.values()].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  cs.forEach((x) => x.comps.sort((a, b) => a.c.rank - b.c.rank));
  up.sort((a, b) => prOf(a.c) - prOf(b.c));
  return [...up.map((g) => ({ key: `l${g.fm}`, g })), ...top.map((g) => ({ key: `l${g.fm}`, g })), ...cs.map((x) => ({ key: `p${x.k}`, p: x }))];
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

// Finestra a una sola tinta (concept B): sfumatura a 135 gradi dalla tinta (.34) quasi a vuoto (.06 al 70%).
// Accordion concept B (21st, Wensity): ogni paese/campionato e' una carta a se'; aperta, il bordo prende la tinta della finestra.
// Anello (bordo colorato) FERMO (10/11/2026): niente movimento dei colori; sfumatura fissa tinta -> secondo colore
const Ring = ({ colors, w = 1.5, radius, style, children }) => {
  const { C } = useT();
  const cc = colors || [C.accent, '#7B6CFF'];
  return (
    <View style={[{ borderRadius: radius, padding: w, overflow: 'hidden', backgroundColor: C.border }, style]}>
      <LinearGradient pointerEvents="none" colors={[cc[0], cc[1] || cc[0]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
};
const Card = ({ tint, style, open, children }) => {
  const { C, s } = useT();
  const t = /^#[0-9a-f]{6}$/i.test(tint || '') ? tint : '#6D7A91';
  return (
    <Ring colors={[t, `${t}`]} radius={26} style={s.cardRing}>
      <LinearGradient colors={[`${t}${C.dark ? '57' : '33'}`, `${t}${C.dark ? '0F' : '0A'}`]} locations={[0, 0.7]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.card, style]}>{children}</LinearGradient>
    </Ring>
  );
};
// Bandiera rotonda vera, con anello e alone della tinta del paese; senza bandiera, un globo
const Flag = memo(({ fc, tint }) => {
  const { C, s } = useT();
  const t = /^#[0-9a-f]{6}$/i.test(tint || '') ? tint : '#6D7A91';
  const ring = { borderColor: `${t}8C`, shadowColor: t };
  return (
    <View style={[s.flag, ring]}>
      {fc ? <Image source={{ uri: `${SITE}native-link/flags43/${fc}.png` }} style={s.flagImg} contentFit="cover" cachePolicy="memory-disk" transition={0} />
        : <Ionicons name="globe-outline" size={18} color={C.ink2} />}
    </View>
  );
});
const Chev = ({ open }) => { const { C } = useT(); return <Ionicons name="chevron-down" size={17} color={C.ink2} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />; };
const useOpen = (key, init) => {
  const [open, setOpen] = useState(() => (key in OPEN_KEY ? OPEN_KEY[key] : init));
  const toggle = () => setOpen((o) => { OPEN_KEY[key] = !o; return !o; });
  return [open, toggle];
};
// Tendina classica (10/11/2026, regola fissa): l'animazione e' la LayoutAnimation nativa di iOS/Android, chiesta un attimo prima di
// cambiare stato. Le righe si montano gia' alla loro altezza e il sistema anima da solo la carta che si allunga e le finestre sotto
// che scendono; in chiusura il contrario. Niente altezze misurate ne' animate da noi (Animated o Reanimated): quelle versioni in
// apertura restavano ferme e comparivano gia' aperte. La carta ritaglia (overflow hidden) cosi' le righe non escono mentre cresce.
const TEND_MS = 260;
const TEND = { duration: TEND_MS, create: { type: 'easeInEaseOut', property: 'opacity' }, update: { type: 'easeInEaseOut' }, delete: { type: 'easeInEaseOut', property: 'opacity' } };
const tendAnim = () => LayoutAnimation.configureNext(TEND);
// Apertura in due tempi: prima le righe si creano di nascosto dentro un contenitore alto zero (il lavoro pesante: viste, loghi),
// poi, a righe pronte, si chiede l'animazione e si toglie il vincolo: quel passaggio e' leggerissimo e l'animazione parte pulita.
// Creando le righe nello stesso passaggio dell'animazione, con piu' di 4 partite il telefono era ancora occupato e ne saltava l'inizio.
// In chiusura si smonta subito (l'animazione l'ha gia' chiesta chi ha toccato).
const Collapse = ({ open, instant, children }) => {
  const [shown, setShown] = useState(open);
  const sRef = useRef(open), t = useRef(null), raf = useRef(0);
  const stop = () => { clearTimeout(t.current); cancelAnimationFrame(raf.current); raf.current = 0; };
  const show = () => { stop(); if (sRef.current) return; sRef.current = true; tendAnim(); setShown(true); };
  useEffect(() => stop, []);
  useEffect(() => {
    stop();
    if (!open) { sRef.current = false; setShown(false); return; }
    if (sRef.current) return;
    if (instant) { sRef.current = true; setShown(true); return; }
    t.current = setTimeout(show, 350); // rete di sicurezza: si apre comunque
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const onLayout = () => { if (!sRef.current && !raf.current) raf.current = requestAnimationFrame(() => { raf.current = requestAnimationFrame(show); }); };
  if (!open) return null;
  return <View style={shown ? null : { height: 0, overflow: 'hidden' }}><View onLayout={onLayout}>{children}</View></View>;
};
// Righe montate a pezzi: le prime subito (sono quelle che si vedono mentre la tendina si apre), il resto solo ad animazione finita
// (un pezzo montato durante l'animazione la interromperebbe), un pezzo per volta.
const FIRST_ROWS = 8, STEP_ROWS = 10;
const useChunk = (total) => {
  const [n, setN] = useState(Math.min(total, FIRST_ROWS));
  useEffect(() => {
    if (n >= total) return undefined;
    const t = setTimeout(() => setN((v) => Math.min(total, v + STEP_ROWS)), n <= FIRST_ROWS ? 2 * TEND_MS + 200 : 40);
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
  return (
    <View style={[s.lhRow, small && { paddingVertical: 12 }]}>
      <CompLogo uri={c.logoFm === EL_FM || /\/leaguelogo\/73\.png/.test(c.logo || '') ? `${SITE}aurora/${C.dark ? 'el-night' : 'el-light'}.png` : (C.dark ? darkLogo(c.logo) : c.logo)} size={size} C={C} />
      <Text numberOfLines={1} style={[s.lhName, small && { fontSize: 12, fontWeight: '700' }]}>{c.name}</Text>
    </View>
  );
};

const LeagueGroup = memo(({ iso, g, forceOpen, onOpen, onLeague }) => {
  const { s } = useT();
  const [open, toggle] = useOpen(`${iso}|${g.fm}`, g.open || g.c.open);
  const isOpen = forceOpen || open;
  return (
    <Card tint={g.tint || g.c.tint} open={isOpen}>
      <View style={s.headRow}>
        <Pressable onPress={() => onLeague(leagueRoute(g.c, g.fm))} style={({ pressed }) => [{ flex: 1, minWidth: 0 }, pressed && { opacity: 0.6 }]}><LeagueHead c={g.c} /></Pressable>
        <Pressable onPress={() => { if (!forceOpen && isOpen) tendAnim(); toggle(); }} hitSlop={{ top: 14, bottom: 14, right: 14 }} style={s.tail}><Text numberOfLines={1} style={s.cnt}>{g.matches.length}</Text><Chev open={isOpen} /></Pressable>
      </View>
      <Collapse open={isOpen} instant={!!forceOpen}><LeagueBody g={g} onOpen={onOpen} /></Collapse>
    </Card>
  );
});

const CountryGroup = memo(({ iso, p, forceOpen, onOpen, onLeague }) => {
  const { C, s } = useT();
  const total = p.comps.reduce((n, x) => n + x.matches.length, 0);
  const [open, toggle] = useOpen(`${iso}|paese:${p.k}`, false);
  const isOpen = forceOpen || open;
  return (
    <Card tint={p.tint} open={isOpen}>
      <Pressable onPress={() => { if (!forceOpen && isOpen) tendAnim(); toggle(); }} style={s.headRow}>
        <Flag fc={p.fc} tint={p.tint} />
        <Text numberOfLines={1} style={[s.lhName, { flex: 1, marginLeft: 12 }]}>{p.name}</Text>
        <View style={s.tail}><Text numberOfLines={1} style={s.cnt}>{total}</Text><Chev open={isOpen} /></View>
      </Pressable>
      <Collapse open={isOpen} instant={!!forceOpen}><CountryBody p={p} onLeague={onLeague} onOpen={onOpen} /></Collapse>
    </Card>
  );
});


// Barra di scorrimento laterale (21st "Scroll Area", concept C): sottile, compare mentre si scorre e sparisce dopo 1 s.
// Si limita a leggere lo scorrimento sul thread UI (useAnimatedScrollHandler): velocita', inerzia e regole dello scroll restano quelle di prima.
function useThumb() {
  const y = useSharedValue(0); const vh = useSharedValue(1); const ch = useSharedValue(1); const op = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => { y.value = e.contentOffset.y; op.value = withTiming(1, { duration: 120 }); },
    onEndDrag: () => { op.value = withDelay(1000, withTiming(0, { duration: 350 })); },
    onMomentumEnd: () => { op.value = withDelay(1000, withTiming(0, { duration: 350 })); },
  });
  const onLayout = useCallback((e) => { vh.value = e.nativeEvent.layout.height; }, [vh]);
  const onSize = useCallback((w, h) => { ch.value = h; }, [ch]);
  return useMemo(() => ({ y, vh, ch, op, onScroll, onLayout, onSize }), [y, vh, ch, op, onScroll, onLayout, onSize]);
}
const Thumb = memo(({ t }) => {
  const { C } = useT();
  const st = useAnimatedStyle(() => {
    const track = t.vh.value - 150; // sopra il dock
    const ratio = t.vh.value / Math.max(t.ch.value, 1);
    const h = Math.max(36, track * Math.min(1, ratio));
    const max = Math.max(1, t.ch.value - t.vh.value);
    const p = Math.min(1, Math.max(0, t.y.value / max));
    return { height: h, opacity: ratio >= 1 ? 0 : t.op.value, transform: [{ translateY: 6 + p * (track - h) }] };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', right: 3, top: 0, width: 4, borderRadius: 2, backgroundColor: C.dark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.30)' }, st]} />;
});


// Giorno senza partite (Empty State concept B, 21st vijayksingh): carta tratteggiata con l'icona incassata, il primo giorno
// vicino con partite vere e i tasti per andarci (solo quelli che esistono: mai giorni o numeri inventati).
const EmptyDay = memo(({ iso, live, near, onDay, onJump }) => {
  const { C, s } = useT();
  const d = new Date(`${iso}T12:00:00`);
  const lab = dayLabel(d);
  const p = near && near(-1); const n0 = near && near(1);
  // nessun giorno vicino gia' caricato con partite: si chiede al feed del giorno (worker /f) dei giorni successivi, fino a 3 settimane
  const [far, setFar] = useState(null);
  useEffect(() => {
    if (live || n0) return undefined;
    let dead = false;
    (async () => {
      for (let k = 1; k <= 21 && !dead; k++) {
        const t = new Date(d); t.setDate(t.getDate() + k);
        const ki = `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}`;
        try { const r = await fetch(`${WORKER}/f?date=${ki}`); const j = r.ok ? await r.json() : null; if (j && j.m && j.m.length) { if (!dead) setFar({ d: t, n: j.m.length }); return; } } catch (e) { /* giorno successivo */ }
      }
    })();
    return () => { dead = true; };
  }, [iso, live, !!n0]); // eslint-disable-line react-hooks/exhaustive-deps
  const n = n0 || (far ? { label: dayLabel(far.d), n: far.n, diff: Math.round((new Date(far.d.getFullYear(), far.d.getMonth(), far.d.getDate()) - TODAY_MID) / 86400000), date: far.d } : null);
  const tit = live ? 'Nessuna partita in diretta' : /^(Oggi|Ieri|Domani)$/.test(lab) ? `Nessuna partita ${lab.toLowerCase()}` : `Nessuna partita ${lab}`;
  const nx = n || p;
  const dateOf = (x) => { const t = x.date || null; return t ? `${t.getDate()} ${MONTHS[t.getMonth()]}` : ''; };
  const goNext = () => { if (!n) return; if (n.i !== undefined) onDay(n.i); else if (onJump) onJump(n.diff); };
  return (
    <Animated.View entering={FadeIn.duration(260)} style={s.emBox}>
      <View style={s.emWell}><Ionicons name={live ? 'radio-outline' : 'calendar-outline'} size={26} color={C.ink2} /></View>
      <Text style={s.emTitle}>{tit}</Text>
      {!live && nx ? <Text style={s.emSub}>{n ? 'Prossime partite' : 'Ultime partite'}: {nx.label.toLowerCase()}{dateOf(nx) ? ` ${dateOf(nx)}` : ''} · {nx.n} {nx.n === 1 ? 'partita' : 'partite'}</Text> : null}
      {!live && (p || n) ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {p ? <Pressable onPress={() => onDay(p.i)} style={({ pressed }) => [s.emBtn, pressed && { opacity: 0.7 }]}><Ionicons name="chevron-back" size={14} color={C.ink} /><Text style={s.emBtnTx}>{p.label}</Text></Pressable> : null}
          {n ? <Pressable onPress={goNext} style={({ pressed }) => [s.emBtn, { backgroundColor: C.accent, borderColor: C.accent }, pressed && { opacity: 0.8 }]}><Text style={[s.emBtnTx, { color: C.dark ? '#04121F' : '#fff' }]}>{n.label}</Text><Ionicons name="chevron-forward" size={14} color={C.dark ? '#04121F' : '#fff'} /></Pressable> : null}
        </View>
      ) : null}
    </Animated.View>
  );
});

const Day = memo(({ iso, rows, filter, onOpen, onLeague, top, isCur, near, onDay, onJump }) => {
  const { s } = useT();
  const list = useRef(null);
  // tasto Home toccato in Home: torna in cima solo il giorno mostrato (gli altri e quelli montati dopo non si muovono)
  const seen = useRef(top); const curR = useRef(isCur); curR.current = isCur;
  useEffect(() => { if (top !== seen.current) { seen.current = top; if (curR.current && list.current) list.current.scrollToOffset({ offset: 0, animated: true }); } }, [top]);
  const items = useMemo(() => groupsOf(rows, filter), [rows, filter]);
  const thumb = useThumb();
  const render = useCallback(({ item }) => (item.g ? <LeagueGroup iso={iso} g={item.g} forceOpen={filter === 'live'} onOpen={onOpen} onLeague={onLeague} /> : <CountryGroup iso={iso} p={item.p} forceOpen={filter === 'live'} onOpen={onOpen} onLeague={onLeague} />), [iso, filter, onOpen, onLeague]);
  if (!items.length) return <View style={{ width: W }}><EmptyDay iso={iso} live={filter === 'live'} near={near} onDay={onDay} onJump={onJump} /></View>;
  return (
    <View style={{ width: W }}>
      <Animated.FlatList ref={list} data={items} renderItem={render} keyExtractor={(i) => i.key} initialNumToRender={4} maxToRenderPerBatch={3} updateCellsBatchingPeriod={60} windowSize={5} contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false} onScroll={thumb.onScroll} scrollEventThrottle={16} onLayout={thumb.onLayout} onContentSizeChange={thumb.onSize} />
      <Thumb t={thumb} />
    </View>
  );
});

// Marchio ScalperLab: diamante a otto facce (concept A "Facet", 10/11/2026), stesso disegno del logo del sito.
// Immagine SVG (expo-image): lo spazio tra le facce ha il colore dello sfondo del tema.
const GEM_P = { T0: [28, 10], T1: [50, 10], T2: [72, 10], G0: [6, 32], G1: [36, 32], G2: [64, 32], G3: [94, 32], C: [50, 86] };
const GEM_F = [['T0 G0 G1', '#7DD3FC'], ['T0 G1 T1', '#BAE6FD'], ['T1 G1 G2', '#F0F9FF'], ['T1 G2 T2', '#93C5FD'], ['T2 G2 G3', '#3B82F6'], ['G0 G1 C', '#38BDF8'], ['G1 G2 C', '#2563EB'], ['G2 G3 C', '#1E3A8A']];
const gemUri = (gap) => 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -2 100 100">' + GEM_F.map(([k, c]) => `<polygon points="${k.split(' ').map((n) => GEM_P[n].join(',')).join(' ')}" fill="${c}" stroke="${gap}" stroke-width="1.8" stroke-linejoin="round"/>`).join('') + '</svg>');
const Logo = memo(({ size = 30 }) => {
  const { C } = useT();
  return <Image source={{ uri: gemUri(C.bg) }} style={{ width: size, height: size }} contentFit="contain" />;
});


// Sfondo concept B "Beams Background" (21st, Kokonut UI): fasci di luce diagonali che scorrono piano, solo sul fondale
// (sotto righe, finestre e tabelle, che restano dei loro colori). Thread UI, fermo con Riduci movimento.
const BH = Dimensions.get('window').height;
const BEAMS = [[-0.15, 70, 0], [0.18, 46, 1], [0.45, 90, 0], [0.78, 56, 1]];
const Beam = memo(({ left, w, alt, dur, reduce }) => {
  const { C } = useT();
  const y = useSharedValue(-40);
  useEffect(() => { if (!reduce) y.value = withRepeat(withTiming(40, { duration: dur, easing: Easing.inOut(Easing.sin) }), -1, true); return () => cancelAnimation(y); }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ transform: [{ rotate: '-35deg' }, { translateY: y.value }] }));
  const c = alt ? C.beam2 : C.beam1;
  return (
    <Animated.View style={[{ position: 'absolute', top: -BH * 0.4, left: W * left, width: w, height: BH * 1.8 }, st]}>
      <LinearGradient colors={[C.beam0, c, C.beam0]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
    </Animated.View>
  );
});
const Beams = memo(({ still }) => {
  const [reduce0, setReduce] = useState(false);
  const reduce = reduce0 || !!still;
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {}); }, []);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {BEAMS.map(([l, w, a], i) => <Beam key={i} left={l} w={w} alt={a} dur={9000 + i * 2300} reduce={reduce} />)}
    </View>
  );
});


// Tasto tondo in vetro liquido (21st "Liquid Glass Button", concept B): sfumatura a 158 gradi, riflesso in alto, ombra sotto.
const GlassBtn = ({ onPress, label, children, style }) => {
  const { C, s } = useT();
  return (
    <Ring radius={18} w={1.5} style={[s.lgRing, style]}>
      <Pressable onPress={onPress} accessibilityLabel={label} style={({ pressed }) => [s.lgBtn, pressed && { transform: [{ scale: 0.94 }] }]}>
        <LinearGradient colors={[C.lg1, C.lg2]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[s.lgHi, { backgroundColor: C.lgHi }]} />
        {children}
      </Pressable>
    </Ring>
  );
};


// Barra di ricerca concept B (21st "Animated Glowing Search Bar"): bordo luminoso che gira attorno alla barra (thread UI) e alone sotto
const GlowBar = ({ children, style, radius = 18 }) => {
  const { C } = useT();
  const r = useSharedValue(0);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then((red) => { if (!red) r.value = withRepeat(withTiming(360, { duration: 3200, easing: Easing.linear }), -1, false); }).catch(() => {}); return () => cancelAnimation(r); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return (
    <Animated.View style={[{ borderRadius: radius, padding: 1.5, overflow: 'hidden', backgroundColor: C.border, shadowColor: C.accent, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, style]}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 520, height: 520, left: '50%', top: '50%', marginLeft: -260, marginTop: -260 }, st]}>
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', C.accent, '#7B6CFF', 'rgba(0,0,0,0)']} locations={[0, 0.42, 0.5, 0.56, 0.62]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
      {children}
    </Animated.View>
  );
};

// Avvio (concept C "Dock", 10/11/2026): il diamante compare al centro (rimbalzo, alone, scintilla), vola nel posto del logo
// dell'intestazione, da dietro esce la scritta ScalperLab mentre la ricerca resta nascosta, poi tutto si dissolve sul logo vero.
const brandRef = React.createRef();
const LOGO_OP = makeMutable(1);
const SEARCH_OP = makeMutable(1);
let LAUNCHED = true; // intro del logo tolta (10/11/2026): la Home parte subito
const GEM = 116, FLY_MS = 750, MIN_POP = 2100, START_DELAY = 750, HOME_AT = 1650;
// alone sfumato (gradiente radiale): niente bordo netto
const GLOW_URI = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g"><stop offset="0" stop-color="#38BDF8" stop-opacity="0.34"/><stop offset="0.35" stop-color="#2563EB" stop-opacity="0.2"/><stop offset="0.7" stop-color="#2563EB" stop-opacity="0.05"/><stop offset="1" stop-color="#2563EB" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/></svg>');
const SPARK_URI = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6Z" fill="#BAE6FD"/></svg>');
const LaunchOverlay = memo(({ onPop }) => {
  const { C, s } = useT();
  const { width: W, height: H } = useWindowDimensions();
  const [gone, setGone] = useState(LAUNCHED);
  const [dock, setDock] = useState(null);
  const pop = useSharedValue(0), fly = useSharedValue(0), txt = useSharedValue(0), fade = useSharedValue(1), spark = useSharedValue(0);
  const to = useSharedValue({ x: 0, y: 0, s: 1 });
  const cx = W / 2, cy = H / 2 - 12;
  useEffect(() => {
    if (gone) return undefined;
    let over = false, started = false, poll = null;
    const ts = [];
    const finish = () => { if (over) return; over = true; LAUNCHED = true; LOGO_OP.value = 1; SEARCH_OP.value = 1; setGone(true); };
    // prima si vede lo schermo scuro vuoto (la schermata di Expo Go sparisce), poi il diamante spunta
    pop.value = withDelay(START_DELAY, withTiming(1, { duration: 850, easing: Easing.bezier(0.34, 1.2, 0.64, 1) }));
    spark.value = withDelay(START_DELAY + 900, withTiming(1, { duration: 650, easing: OUT_EASE }));
    // la Home (pesante) si monta solo quando il diamante e' gia' comparso: cosi' il rimbalzo non va a scatti
    ts.push(setTimeout(() => { if (onPop) onPop(); }, HOME_AT));
    const t0 = Date.now() + START_DELAY;
    const go = (x, y, w, h) => {
      started = true;
      setDock({ x, y, w, h });
      to.value = { x: x + w / 2 - cx, y: y + h / 2 - cy, s: w / GEM };
      // il volo parte solo dopo che il testo e' montato (altrimenti il primo tratto salta)
      ts.push(setTimeout(() => { fly.value = withTiming(1, { duration: FLY_MS, easing: Easing.bezier(0.7, 0, 0.2, 1) }); }, 90));
      const D = 90;
      ts.push(setTimeout(() => { txt.value = withTiming(1, { duration: 650, easing: OUT_EASE }); }, D + FLY_MS - 150));
      ts.push(setTimeout(() => { LOGO_OP.value = withTiming(1, { duration: 200 }); }, D + FLY_MS));
      ts.push(setTimeout(() => { SEARCH_OP.value = withTiming(1, { duration: 450 }); fade.value = withTiming(0, { duration: 400 }); }, D + FLY_MS - 150 + 1250));
      ts.push(setTimeout(finish, D + FLY_MS - 150 + 1250 + 480));
    };
    // dopo il tempo minimo e quando l'intestazione esiste (dati pronti) il diamante vola nel posto del suo logo
    // il volo parte solo quando la Home ha finito di montarsi/caricare (3 giri di timer senza ritardo): cosi' il tragitto resta fluido
    let last = Date.now(), calm = 0;
    poll = setInterval(() => {
      const now = Date.now(), drift = now - last - 120; last = now;
      calm = drift < 35 ? calm + 1 : 0;
      if (started || over) return;
      if (now - t0 > 12000) { clearInterval(poll); finish(); return; }
      if (now - t0 < MIN_POP) return;
      if (calm < 3 && now - t0 < MIN_POP + 3000) return;
      const r = brandRef.current;
      if (r && r.measureInWindow) r.measureInWindow((x, y, w, h) => { if (!started && !over && w > 0) { clearInterval(poll); go(x, y, w, h); } });
    }, 120);
    return () => { clearInterval(poll); ts.forEach(clearTimeout); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const rootSt = useAnimatedStyle(() => ({ opacity: fade.value }));
  const bgSt = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, fly.value * 1.8) }));
  const glowSt = useAnimatedStyle(() => ({ opacity: Math.min(1, pop.value * 3) * (1 - Math.min(1, fly.value * 2)), transform: [{ scale: 0.8 + 0.25 * pop.value }] }));
  const gemSt = useAnimatedStyle(() => {
    const k = to.value;
    return { opacity: Math.min(1, pop.value * 4), transform: [{ translateX: k.x * fly.value }, { translateY: k.y * fly.value }, { scale: interpolate(pop.value, [0, 0.6, 1], [0.3, 1.1, 1]) * (1 + (k.s - 1) * fly.value) }] };
  });
  const sparkSt = useAnimatedStyle(() => ({ opacity: Math.min(1, spark.value * 5) * (1 - Math.min(1, fly.value * 2)), transform: [{ scale: interpolate(spark.value, [0, 0.65, 1], [0, 1.35, 1]) }, { rotate: `${interpolate(spark.value, [0, 0.65, 1], [-120, 15, 0])}deg` }] }));
  const txtSt = useAnimatedStyle(() => ({ opacity: txt.value, transform: [{ translateX: (1 - txt.value) * -150 }] }));
  if (gone) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 999, elevation: 999 }, rootSt]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }, bgSt]} />
      <Animated.View shouldRasterizeIOS renderToHardwareTextureAndroid style={[{ position: 'absolute', left: cx - 190, top: cy - 190, width: 380, height: 380 }, glowSt]}>
        <Image source={{ uri: GLOW_URI }} style={{ width: 380, height: 380 }} contentFit="contain" />
      </Animated.View>
      <Animated.View shouldRasterizeIOS renderToHardwareTextureAndroid style={[{ position: 'absolute', left: cx - GEM / 2, top: cy - GEM / 2, width: GEM, height: GEM }, gemSt]}>
        <Image source={{ uri: gemUri(C.bg) }} style={{ width: GEM, height: GEM }} contentFit="contain" />
        <Animated.View style={[{ position: 'absolute', left: GEM * 0.8, top: -GEM * 0.04, width: 22, height: 22 }, sparkSt]}>
          <Image source={{ uri: SPARK_URI }} style={{ width: 22, height: 22 }} contentFit="contain" />
        </Animated.View>
      </Animated.View>
      {dock ? (
        <View style={{ position: 'absolute', left: dock.x + dock.w + 4, top: dock.y, height: dock.h, width: 150, overflow: 'hidden', justifyContent: 'center' }}>
          <Animated.Text numberOfLines={1} style={[s.mBrand, { fontSize: 22, letterSpacing: -0.9, paddingLeft: 4 }, txtSt]}>Scalper<Text style={{ color: C.accent }}>Lab</Text></Animated.Text>
        </View>
      ) : null}
    </Animated.View>
  );
});

// Riga in alto: logo, barra di ricerca (tutto lo spazio che resta), Calendario, menu. Una riga sola anche su iPhone stretti.
function Header({ onSearch, onMenu, onCal }) {
  const { C, s } = useT();
  const logoSt = useAnimatedStyle(() => ({ opacity: LOGO_OP.value }));
  const searchSt = useAnimatedStyle(() => ({ opacity: SEARCH_OP.value }));
  return (
    <View style={s.header}>
      <View ref={brandRef} collapsable={false}><Animated.View style={logoSt}><Logo size={30} /></Animated.View></View>
      <GlowBar style={[{ flex: 1, minWidth: 0 }, searchSt]}>
        <Pressable onPress={onSearch} style={[s.sBar, { borderWidth: 0, backgroundColor: C.dark ? '#0A1020' : 'rgba(255,255,255,0.96)', height: 33 }]} accessibilityLabel="Cerca">
          <Ionicons name="search" size={16} color={C.accent} />
          <Text numberOfLines={1} style={s.sBarTx}>Cerca giocatori, squadre…</Text>
        </Pressable>
      </GlowBar>
      <GlassBtn onPress={onCal} label="Calendario"><Ionicons name="calendar-outline" size={16} color={C.ink} /></GlassBtn>
      <GlassBtn onPress={onMenu} label="Menu"><Ionicons name="menu" size={17} color={C.ink} /></GlassBtn>
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
const Mark = ({ uri: uri0, size, initials, tint: tint0 }) => {
  const { s, C } = useT();
  const lg = logoSrc(uri0, C.dark); const uri = lg.uri || uri0; const tint = tint0 || lg.tint;
  const [bad, setBad] = useState(false);
  if (uri && !bad) return <Image source={{ uri }} style={{ width: size, height: size }} contentFit="contain" cachePolicy="memory-disk" tintColor={tint || undefined} onError={() => setBad(true)} />;
  return <View style={[s.crestPh, { width: size, height: size, borderRadius: size / 2 }]}><Text style={s.crestTx}>{initials || ''}</Text></View>;
};

// Banner giocatore compatto (stesso disegno del banner della ricerca del sito, in piccolo)

// parte del nome che corrisponde a quanto scritto, in accento (concept "Smart Tag Input"; la calcola la pagina web: `hl`)
const HlName = ({ text, hl }) => {
  const { C } = useT();
  if (!hl || !Array.isArray(hl)) return text;
  return <>{text.slice(0, hl[0])}<Text style={{ color: C.accent, fontWeight: '800' }}>{text.slice(hl[0], hl[1])}</Text>{text.slice(hl[1])}</>;
};

const PlayerBannerS = memo(({ p, onPress }) => {
  const { C, s } = useT();
  const nat = useNatFor(p);
  const g = hexA(p.color, '57');
  const ring = hexA(p.color, 'F2');
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.pb, ring ? { borderWidth: 1.5, borderColor: ring } : null, pressed && { opacity: 0.6 }]}>
      <LinearGradient colors={[g || C.card1, hexA(p.color, '0F') || C.card2]} locations={[0, 0.85]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,.35)' }} />
      <Face uri={p.photo} color={p.color} size={36} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={s.pbName}><HlName text={p.name} hl={p.hl} /></Text>
        <View style={s.pbSub}>
          {p.crest ? <Mark uri={p.crest} size={14} /> : null}
          <Text numberOfLines={1} style={s.pbTeam}>{p.team}</Text>
          {nat ? (
            <>
              <View style={{ width: 1, height: 14, backgroundColor: C.dim || '#5b678f', opacity: 0.5 }} />
              <FlagN code={nat.fc} size={14} C={C} />
              <Text numberOfLines={1} style={s.pbTeam}>{nat.name}</Text>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

// Squadra nella ricerca: stesso banner colorato dei giocatori (colore sociale, stemma, nome, campionato)
const TeamBannerS = memo(({ t, onPress }) => {
  const { C, s } = useT();
  const cols = t.flagColors || [t.color, t.color2].filter(Boolean);
  const gc = cols.map((c, i) => hexA(c, i === 0 ? '57' : '33')).filter(Boolean);
  const ring = hexA(cols[0] || t.color, 'E6');
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.pb, ring ? { borderWidth: 1.5, borderColor: ring } : null, pressed && { opacity: 0.6 }]}>
      <LinearGradient colors={gc.length > 1 ? [...gc, C.card2] : [gc[0] || C.card1, C.card2]} locations={gc.length > 2 ? [0, 0.3, 0.55, 0.85] : gc.length > 1 ? [0, 0.4, 0.8] : [0, 0.72]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
        {t.flag ? <FlagN code={t.flag} size={32} C={C} bare /> : <Mark uri={t.crest} size={30} initials={t.initials} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={s.pbName}><HlName text={t.name} hl={t.hl} /></Text>
        <View style={s.pbSub}>
          {t.logo ? <Mark uri={t.logo} size={14} /> : null}
          <Text numberOfLines={1} style={s.pbTeam}>{t.sub}</Text>
        </View>
      </View>
    </Pressable>
  );
});

// Campionato nella ricerca: stesso banner colorato di squadre e giocatori (colore del campionato, logo, nome, paese)
const COMP_TINT = {}; Object.values(META.comps || {}).forEach((c) => { if (c && c.id && c.tint && !COMP_TINT[c.id]) COMP_TINT[c.id] = c.tint; });
const LeagueBannerS = memo(({ l, uri, tint, onPress }) => {
  const { C, s } = useT();
  const g = hexA(l.color || COMP_TINT[l.id], '66');
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.pb, pressed && { opacity: 0.6 }]}>
      <LinearGradient colors={[g || C.card1, C.card2]} locations={[0, 0.72]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}><Mark uri={uri} size={28} tint={tint} initials={l.name.slice(0, 2).toUpperCase()} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={s.pbName}><HlName text={l.name} hl={l.hl} /></Text>
        {l.country ? <View style={s.pbSub}><Text numberOfLines={1} style={s.pbTeam}>{l.country}</Text></View> : null}
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
            {has && data.fuzzy ? <Animated.Text key="fz" entering={ent()} style={[s.sMeta, { paddingHorizontal: 8, paddingTop: 10 }]}>Risultati simili a «{q.trim()}»</Animated.Text> : null}
            {has && data.leagues.length ? (<View key="L"><Animated.Text entering={ent()} style={s.sSec}>Campionati</Animated.Text>
              {data.leagues.map((l) => (<Animated.View key={`l${l.id}`} entering={ent()} style={{ paddingBottom: 6 }}><LeagueBannerS l={l} uri={logoOf(l)} tint={mono(l)} onPress={() => onPick(l.path)} /></Animated.View>))}
              <Animated.View key="lall" entering={ent()}><Pressable onPress={() => onPick('/competizioni')} style={s.sItem}><Text style={[s.sName, { color: C.accent, fontWeight: '700', fontSize: 13.5 }]}>Tutte le competizioni per paese</Text></Pressable></Animated.View>
            </View>) : null}
            {has && data.teams.length ? (<View key="T"><Animated.Text entering={ent()} style={s.sSec}>Squadre</Animated.Text>
              {data.teams.map((t) => (<Animated.View key={`t${t.id}`} entering={ent()} style={{ paddingBottom: 6 }}><TeamBannerS t={t} onPress={() => onPick(t.path)} /></Animated.View>))}
            </View>) : null}
            {has && data.players.length ? (<View key="P"><Animated.Text entering={ent()} style={s.sSec}>Giocatori</Animated.Text>
              {data.players.map((p) => (<Animated.View key={`p${p.id}`} entering={ent()} style={{ paddingBottom: 6 }}><PlayerBannerS p={p} onPress={() => onPick(p.path)} /></Animated.View>))}
            </View>) : null}
            {has && data.referees.length ? (<View key="R"><Animated.Text entering={ent()} style={s.sSec}>Arbitri</Animated.Text>
              {data.referees.map((x) => (<Animated.View key={`r${x.id}`} entering={ent()}><Pressable onPress={() => onPick(x.path)} style={s.sItem}>
                <View style={[s.crestPh, { width: 26, height: 26, borderRadius: 13 }]}><Text style={s.crestTx}>{x.initials}</Text></View>
                <Text numberOfLines={1} style={[s.sName, { flex: 1 }]}><HlName text={x.name} hl={x.hl} /></Text>
              </Pressable></Animated.View>))}
            </View>) : null}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// icone uguali a quelle del dock (TabBar): Home, Calcolatore, Giocatori, Matchup
const MENU = [['Home', '/', 'home-outline'], ['Competizioni', '/competizioni', 'trophy-outline'], ['Calcolatore di Affidabilità', '/calcolatore', 'calculator-outline'], ['Migliori Giocatori', '/migliori-giocatori', 'people-outline'], ['Migliori Matchup', '/migliori-matchup', 'sword-cross'], ['Linee guida', '/linee-guida', 'book-outline']];
const MROW = 50;
const THEME_OPTS = [['light', 'Chiaro', 'sunny-outline'], ['dark', 'Scuro', 'moon-outline'], ['auto', 'Auto (segue il telefono)', 'phone-portrait-outline']];
// Theme Toggle concept C (21st, Efferd): pillola a tre posizioni, il cursore in vetro scivola con una molla (thread UI).
const TT_W = 44;
const ThemeTri = ({ value, onPick }) => {
  const { C } = useT();
  const i = Math.max(0, THEME_OPTS.findIndex(([v]) => v === value));
  const x = useSharedValue(i * TT_W);
  useEffect(() => { x.value = withTiming(i * TT_W, { duration: 420, easing: Easing.bezier(0.34, 1.5, 0.5, 1) }); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const th = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: C.chip, borderWidth: 1, borderColor: C.border }}>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 4, top: 4, width: TT_W, height: 36, borderRadius: 999, backgroundColor: C.thumb, borderWidth: 1, borderColor: C.thumbBd }, th]} />
        {THEME_OPTS.map(([v, l, ic], k) => (
          <Pressable key={v} accessibilityRole="radio" accessibilityLabel={l} accessibilityState={{ checked: k === i }} onPress={() => onPick(v)} style={{ width: TT_W, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={ic} size={18} color={k === i ? C.ink : C.ink3} />
          </Pressable>
        ))}
      </View>
      <Text style={{ color: C.ink, fontSize: 13, fontWeight: '700' }}>{THEME_OPTS[i][1]}</Text>
    </View>
  );
};

// Menu a tendina da destra (21st "Sheet" + "Sidebar" concept A): voci con le icone del dock dentro un riquadro, un evidenziatore
// scivola sotto la voce attiva (anche al tocco, poi si apre la pagina); swipe verso destra per chiudere. Tema e diagnostica sono quelli del sito
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
  const [hi, setHi] = useState(0);
  const hy = useSharedValue(0);
  useEffect(() => { if (open) { setHi(0); hy.value = 0; } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const hiStyle = useAnimatedStyle(() => ({ transform: [{ translateY: hy.value }] }));
  const pick = (i, route) => { setHi(i); hy.value = withTiming(i * MROW, { duration: 320, easing: OUT_EASE }); setTimeout(() => onGo(route), 170); };
  // swipe verso destra: il pannello segue il dito (thread UI), oltre 90 px o con un colpo veloce si chiude
  const pan = Gesture.Pan().activeOffsetX(12).failOffsetY([-12, 12])
    .onUpdate((e) => { tx.value = Math.max(0, e.translationX); })
    .onEnd((e) => { if (e.translationX > 90 || e.velocityX > 600) runOnJS(onClose)(); else tx.value = withTiming(0, { duration: 260, easing: OUT_EASE }); });
  if (!mounted) return null;
  const ent = (i) => cascade(i, 16, 0, 150, 35);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.scrim }, scStyle]}><Pressable style={{ flex: 1 }} onPress={onClose} /></Animated.View>
      <GestureDetector gesture={pan}>
      <Animated.View style={[s.mPanel, { width: PW, paddingTop: top + 14 }, pStyle]}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never" contentContainerStyle={{ paddingBottom: bottom + 40 }}>
          <View style={s.mHead}>
            <Logo size={26} />
            <Text style={s.mBrand}>ScalperLab</Text>
            <GlassBtn onPress={onClose} label="Chiudi" style={{ marginLeft: 'auto' }}><Ionicons name="close" size={17} color={C.ink} /></GlassBtn>
          </View>
          <View style={s.mBox}>
            <Animated.View pointerEvents="none" style={[s.mHi, hiStyle]} />
            {MENU.map(([label, route, icon], i) => {
              const Ic = icon === 'sword-cross' ? MaterialCommunityIcons : Ionicons;
              const on = hi === i;
              return (
                <Animated.View key={route} entering={ent(i)}>
                  <Pressable onPress={() => pick(i, route)} style={({ pressed }) => [s.mItem2, pressed && { opacity: 0.7 }]}>
                    <Ic name={icon} size={21} color={on ? C.accent : C.ink2} />
                    <Text numberOfLines={1} style={[s.mTx, { fontWeight: '700', fontSize: 14.5, color: on ? C.accent : C.ink }]}>{label}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
          {ui ? (
            <Animated.View entering={ent(MENU.length)}>
              <Text style={[s.sSec, { paddingHorizontal: 0, marginTop: 22 }]}>Tema</Text>
              <ThemeTri value={ui.theme} onPick={(v) => onCmd('theme', v)} />
            </Animated.View>
          ) : null}
        </ScrollView>
      </Animated.View>
      </GestureDetector>
    </View>
  );
}

// Calendario: sceglie un giorno qualsiasi; la striscia dei giorni e le pagine si ricentrano su quel giorno.
// Date Picker concept B (21st, serayudigital): griglia del mese stile iOS, si cambia mese anche con uno swipe orizzontale
// (la griglia segue il dito sul thread UI ed entra dal lato giusto).
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
  const gx = useSharedValue(0);
  const step = useCallback((d) => setMon((m) => new Date(m.getFullYear(), m.getMonth() + d, 1)), []);
  const GW = Math.min(W - 48, 360);
  const slide = (d) => { gx.value = withTiming(-d * GW, { duration: 180, easing: Easing.in(Easing.cubic) }, (done) => { if (!done) return; runOnJS(step)(d); gx.value = d * GW; gx.value = withTiming(0, { duration: 260, easing: OUT_EASE }); }); };
  const swipe = Gesture.Pan().activeOffsetX([-14, 14]).failOffsetY([-14, 14])
    .onUpdate((e) => { gx.value = e.translationX; })
    .onEnd((e) => {
      const d = e.translationX < -60 || e.velocityX < -500 ? 1 : e.translationX > 60 || e.velocityX > 500 ? -1 : 0;
      if (!d) { gx.value = withTiming(0, { duration: 220, easing: OUT_EASE }); return; }
      gx.value = withTiming(-d * GW, { duration: 160, easing: Easing.out(Easing.cubic) }, (done) => { if (!done) return; runOnJS(step)(d); gx.value = d * GW; gx.value = withTiming(0, { duration: 260, easing: OUT_EASE }); });
    });
  const gStyle = useAnimatedStyle(() => ({ transform: [{ translateX: gx.value }], opacity: 1 - Math.min(0.6, Math.abs(gx.value) / (GW * 1.4)) }));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <RNPressable style={s.calBack} onPress={onClose}>
        <RNPressable style={s.calBox} onPress={() => {}}>
          <View style={s.calHead}>
            <Text style={s.calTitle}>{MFULL[mon.getMonth()]} <Text style={{ color: C.accent }}>{mon.getFullYear()}</Text></Text>
            <View style={{ flexDirection: 'row', gap: 22 }}>
              <RNPressable hitSlop={14} onPress={() => slide(-1)}><Ionicons name="chevron-back" size={20} color={C.accent} /></RNPressable>
              <RNPressable hitSlop={14} onPress={() => slide(1)}><Ionicons name="chevron-forward" size={20} color={C.accent} /></RNPressable>
            </View>
          </View>
          <View style={s.calRow}>{WK.map((w, i) => <Text key={i} style={s.calWk}>{w}</Text>)}</View>
          <GestureDetector gesture={swipe}>
          <Animated.View style={[s.calGrid, gStyle]}>
            {cells.map((d, i) => {
              if (!d) return <View key={i} style={s.calCell} />;
              const df = diffOf(d); const sel = df === selDiff;
              return (
                <RNPressable key={i} onPress={() => onPick(df)} style={s.calCell}>
                  <View style={[s.calDay, sel && s.calSel, !sel && df === 0 && s.calToday]}><Text style={[s.calTxt, sel && s.calTxtSel, !sel && df === 0 && { color: C.accent }]}>{d}</Text></View>
                </RNPressable>
              );
            })}
          </Animated.View>
          </GestureDetector>
          <RNPressable onPress={() => onPick(0)} style={s.calTodayBtn}><Text style={{ color: C.accent, fontWeight: '700', fontSize: 14 }}>Oggi</Text></RNPressable>
        </RNPressable>
      </RNPressable>
    </Modal>
  );
}

// Giorno della striscia (carousel concept B, 21st Motion Primitives): colore, grandezza e LINEA SOTTO il giorno seguono la pagina mentre si
// scorre (thread UI, `x` = pagina frazionaria): la linea del giorno che si lascia si accorcia e svanisce, quella del giorno che arriva
// cresce, quindi sembra scivolare da un giorno all'altro. Ogni giorno ha la sua linea: niente misure ne' array condivisi, solo opacita'/scala.
function DayBtn({ i, x, on, top, sub, onPress, onLayout }) {
  const { C, s } = useT();
  const near = useAnimatedStyle(() => { const p = Math.max(0, 1 - Math.abs(x.value - i)); return { color: interpolateColor(p, [0, 1], [C.ink3, C.ink]), transform: [{ scale: 1 + 0.07 * p }] }; }, [C]);
  const subSt = useAnimatedStyle(() => { const p = Math.max(0, 1 - Math.abs(x.value - i)); return { opacity: 0.6 + 0.3 * p }; });
  const ul = useAnimatedStyle(() => { const p = Math.max(0, 1 - Math.abs(x.value - i)); return { opacity: Math.min(1, p * 1.5), transform: [{ scaleX: 0.2 + 0.8 * p }] }; });
  return (
    <Pressable onPress={onPress} onLayout={onLayout} style={s.dBtn}>
      <Animated.Text style={[s.dTop, on && s.dOnW, near]}>{top}</Animated.Text>
      <Animated.Text style={[s.dSub, subSt]}>{sub}</Animated.Text>
      <Animated.View pointerEvents="none" style={[s.dUnder, ul]} />
    </Pressable>
  );
}

// Una pagina del pager: posizione = (indice - pagina corrente) * larghezza, calcolata sul thread dell'interfaccia (mai dal JS)
const Pane = ({ idx, x, children }) => {
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: (idx - x.value) * W }] }));
  return <Animated.View style={[StyleSheet.absoluteFill, st]}>{children}</Animated.View>;
};

const EDGE_W = 22; // striscia nativa sul bordo (swipe fluido sul thread UI). Stretta: piu' larga copriva i tasti a sinistra (Riepilogo) e ne mangiava il tocco.
const SWIPE_GAIN = 2.2; // la pagina corre piu' veloce del dito: uno swipe leggero (~23% dello schermo) la porta oltre la meta'. Stesso valore in lib/carousel.js

const scoreStr = (sc) => { const x = /(\d+)\s*-\s*(\d+)/.exec(String(sc || '')); return x ? `${x[1]}-${x[2]}` : null; };

// Dock in basso (concept C "isola compatta", stesso disegno nel sito): Home, Calcolatore, Giocatori, Matchup. Vetro sfocato, tasselli 46 px,
// la voce attiva si allarga in pillola con il nome. Componente a parte e memoizzato: non si ridisegna quando la Home cambia giorno o scorre.
const isTabRoute = (r) => TABS.some(([, , x]) => x && String(r || '').startsWith(x));
// pila di pagine native: ognuna sta sotto la successiva (stato e scorrimento restano); scorre di lato solo quella indicata da nvIdx
function NatLayer({ i, nv, nvIdx, tsOn, ts, tsDir, hidden, live, children }) {
  const { C } = useT();
  // cambio voce dal dock (carosello): le due pagine scorrono attaccate, 1:1
  const st = useAnimatedStyle(() => {
    if (tsOn.value) return { transform: [{ translateX: i === 0 ? -tsDir.value * W * ts.value : tsDir.value * W * (1 - ts.value) }] };
    return { transform: [{ translateX: nvIdx.value === i ? nv.value : 0 }] };
  });
  return <Animated.View pointerEvents={hidden ? 'none' : 'auto'} style={[StyleSheet.absoluteFill, { zIndex: 5 + i, backgroundColor: C.bg }, hidden ? { display: 'none' } : null, st]}><Beams still={!live} /><LiveLayerCtx.Provider value={!!live && !hidden}>{children}</LiveLayerCtx.Provider></Animated.View>;
}
const TABS = [['Home', 'home-outline', null], ['Calcolatore', 'calculator-outline', '/calcolatore'], ['Giocatori', 'people-outline', '/migliori-giocatori'], ['Matchup', 'sword-cross', '/migliori-matchup']];
const tabOf = (r) => (TABS.find(([, , x]) => x && String(r || '').startsWith(x)) || [])[2] || '';
const DOCK_T = LinearTransition.duration(220).easing(Easing.out(Easing.cubic));
// Notification Badge concept B (21st, ham7a311 "Bell Ring"): attorno al numero delle partite live parte un'onda continua;
// quando ne inizia una nuova l'icona Home oscilla e il numero fa un piccolo salto. Solo transform/opacity, thread UI.
const RM = { v: false };
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { RM.v = !!v; }).catch(() => {});
const BellHome = ({ icon, color, live }) => {
  const r = useSharedValue(0);
  const prev = useRef(live);
  useEffect(() => {
    if (live > prev.current && !RM.v) r.value = withSequence(withTiming(14, { duration: 130 }), withTiming(-12, { duration: 150 }), withTiming(7, { duration: 140 }), withTiming(-4, { duration: 130 }), withTiming(0, { duration: 150 }));
    prev.current = live;
  }, [live]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return <Animated.View style={st}><Ionicons name={icon} size={21} color={color} /></Animated.View>;
};
const LiveBadge = ({ n }) => {
  const { s } = useT();
  const w = useSharedValue(0), k = useSharedValue(1);
  const prev = useRef(n);
  useEffect(() => { if (!RM.v) w.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false); return () => cancelAnimation(w); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (n !== prev.current && !RM.v) { k.value = 0.4; k.value = withTiming(1, { duration: 450, easing: Easing.bezier(0.34, 1.5, 0.5, 1) }); } prev.current = n; }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  const wave = useAnimatedStyle(() => ({ opacity: 0.8 * (1 - w.value), transform: [{ scale: 1 + w.value * 0.8 }] }));
  const pop = useAnimatedStyle(() => ({ transform: [{ scale: k.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[s.dockBadge, pop]}>
      <Animated.View style={[s.dockWave, wave]} />
      <Text style={s.dockBadgeTxt}>{n > 99 ? '99+' : n}</Text>
    </Animated.View>
  );
};
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
                  {route ? <Ic name={icon} size={21} color={on ? C.accent : C.ink2} /> : <BellHome icon={icon} color={on ? C.accent : C.ink2} live={live} />}
                  {on ? <Animated.Text entering={FadeIn.duration(180)} numberOfLines={1} style={s.dockTxt}>{label}</Animated.Text> : null}
                  {!route && live > 0 ? <LiveBadge n={live} /> : null}
                </Pressable>
              </Animated.View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
});


// pillola unica Tutte | Live: l'indicatore scorre da meta' a meta' con lo stesso gradiente blu-viola e lo stesso contorno che gira di tutti i selettori del sito; su Live pillola e contorno sfumano al rosso
// pillola "liquid glass" unica (come nel sito: AnimatedTabs, TextFilter): riflesso in alto, ombra sotto, scorrimento con leggero rimbalzo
const PILL_EASE = Easing.bezier(0.34, 1.42, 0.64, 1);
const PILL_MS = 600;
function LivePill({ value, onChange }) {
  const { C } = useT();
  const [w, setW] = useState(0);
  const p = useSharedValue(value === 'live' ? 1 : 0);
  useEffect(() => { p.value = withTiming(value === 'live' ? 1 : 0, { duration: PILL_MS, easing: PILL_EASE }); }, [value, p]);
  const half = w / 2;
  // l'indicatore parte subito (thread UI, non aspetta il rendering della lista); il filtro cambia un istante dopo, a pillola gia' in moto
  const press = (v) => {
    p.value = withTiming(v === 'live' ? 1 : 0, { duration: PILL_MS, easing: PILL_EASE });
    setTimeout(() => onChange(v), 60);
  };
  const th = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * half }] }), [half]);
  const t1 = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], ['#FFFFFF', C.ink3]) }), [C]);
  const t2 = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], [C.ink3, '#FFFFFF']) }), [C]);
  const dot = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [C.live, '#FFFFFF']) }), [C]);
  // contorno multicolore che gira (come le tendine e tutti i selettori del sito): un gradiente piu' grande della pillola ruota dietro, se ne vede solo il bordo
  const rot = useSharedValue(0);
  useEffect(() => { rot.value = withRepeat(withTiming(360, { duration: 4000, easing: Easing.linear }), -1, false); return () => cancelAnimation(rot); }, [rot]);
  // su Live pillola e contorno sfumano dal blu al rosso seguendo lo scorrimento (il rosso sale sopra il blu)
  const red = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, p.value)) }));
  const ring = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return (
    <View style={{ width: 163, height: 41, borderRadius: 20.5, overflow: 'hidden', padding: 1.5 }}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 180, height: 180, left: -8.5, top: -69.5 }, ring]}><LinearGradient colors={[C.accent, '#7B6CFF', '#00C2FF', C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /><Animated.View style={[StyleSheet.absoluteFill, red]}><LinearGradient colors={[C.live, C.liveWarm, C.liveHi, C.live]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /></Animated.View></Animated.View>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flex: 1, borderRadius: 19, overflow: 'hidden', flexDirection: 'row', backgroundColor: C.bg }}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: C.chip }]} />
        {w ? <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: half, borderRadius: 19, overflow: 'hidden' }, th]}><LinearGradient colors={['#1F6BEF', C.accent, '#7B6CFF']} locations={[0, 0.55, 1]} start={{ x: 0, y: 0.4 }} end={{ x: 1, y: 0.6 }} style={StyleSheet.absoluteFill} /><Animated.View style={[StyleSheet.absoluteFill, red]}><LinearGradient colors={[C.liveLo, C.live, C.liveHi]} locations={[0, 0.55, 1]} start={{ x: 0, y: 0.4 }} end={{ x: 1, y: 0.6 }} style={StyleSheet.absoluteFill} /></Animated.View></Animated.View> : null}
        <Pressable onPress={() => press('all')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Animated.Text style={[{ fontSize: 13.5, fontWeight: '600' }, t1]}>Tutte</Animated.Text></Pressable>
        <Pressable onPress={() => press('live')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}><Animated.View style={[{ width: 7, height: 7, borderRadius: 4 }, dot]} /><Animated.Text style={[{ fontSize: 13.5, fontWeight: '600' }, t2]}>Live</Animated.Text></Pressable>
      </View>
    </View>
  );
}

// Scheletro di caricamento (al posto della rotella): barre grigie del tema con un riflesso che scorre.
// Un solo valore animato per tutte le barre, driver nativo (nessun lavoro JS per fotogramma); con "Riduci movimento" resta fermo.
// Compare dopo 150 ms: un caricamento piu' corto non lampeggia.
const SkCtx = createContext(null);
function SkBox({ children, style, delay = 150 }) {
  const v = useRef(new RNAnimated.Value(0)).current;
  const op = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    let on = true; let loop = null;
    RNAnimated.timing(op, { toValue: 1, delay, duration: 160, useNativeDriver: true }).start();
    AccessibilityInfo.isReduceMotionEnabled().then((still) => {
      if (!on || still) return;
      loop = RNAnimated.loop(RNAnimated.timing(v, { toValue: 1, duration: 1500, useNativeDriver: true }));
      loop.start();
    }).catch(() => {});
    return () => { on = false; if (loop) loop.stop(); };
  }, [v, op, delay]);
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

function Screen({ onTheme, onReset, themePref }) {
  const { C, s } = useT();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState(null); // { dates, keys, data } cambiano insieme: mai date nuove con partite vecchie
  const [center, setCenter] = useState(0); // giorno al centro della striscia (0 = oggi)
  const [cal, setCal] = useState(false);
  const [srch, setSrch] = useState(false);   // tendina di ricerca (nativa)
  const [menu, setMenu] = useState(false);   // menu a tendina (nativo): mai aperti insieme
  const [srchRes, setSrchRes] = useState(null);
  const ui = useMemo(() => ({ theme: themePref }), [themePref]); // tema scelto, per il menu
  const srchSeq = useRef(0);
  const [cur, setCur] = useState(TODAY_INDEX);
  const [filter, setFilter] = useState('all');
  const openRef = useRef(false);
  // dati condivisi (squadre, partite, giocatori ~3 MB) scaricati a riposo poco dopo l'avvio: la prima partita aperta non deve aspettarli (prima partivano al tocco e valevano la maggior parte dei 7 s)
  useEffect(() => { const t = setTimeout(() => { bootShared().catch(() => {}); }, 2500); return () => clearTimeout(t); }, []);
  // La pagina web si prepara a riposo (2,5 s dopo l'avvio) e poi ci mette un po' a caricarsi. Un tocco prima che sia pronta
  // (tasto in basso, ricerca, menu, partita) non puo' cambiare l'hash di una pagina che non c'e' ancora: la rotta si ricorda
  // (`pendingHash`), la pagina si monta subito gia' sulla rotta giusta (`bootUri`) e al termine del caricamento si applica.
  const [webOpen, setWebOpen] = useState(false);   // la pagina web e' sopra la Home (la barra in basso e' sempre quella nativa)
  const [natStack, setNatStack] = useState([]); // pagine native aperte (l'ultima e' in cima)
  const [natHidden, setNatHidden] = useState(false); // una pagina del sito e' aperta sopra la pila
  const natStackRef = useRef([]); const natHiddenRef = useRef(false);
  natStackRef.current = natStack; natHiddenRef.current = natHidden;
  const sheetS = usePlayerSheet(); const panelS = usePlayerPanel(); // due hook sempre chiamati: con '||' il secondo saltava quando la tendina era aperta e React rompeva tutta la schermata
  const sheetOpen = !!sheetS || !!panelS; // Dock nascosto mentre una tendina/pannello giocatore e' aperta
  const [barOn, setBarOn] = useState(false);       // la barra nativa si vede solo in Home e nelle tre schede (Calcolatore, Giocatori, Matchup)
  const [tab, setTab] = useState('');               // voce della barra scelta: si evidenzia nell'istante del tocco (poi segue `route:` della pagina)
  const [homeTop, setHomeTop] = useState(0);        // tasto Home toccato in Home: la lista del giorno torna in cima
  // pagina web chiusa e parcheggiata su /linee-guida: resta coperta da un fondo pieno, cosi' aprendo una scheda il primo fotogramma
  // dello scorrimento non mostra mai le Linee guida (prima la copertura arrivava dopo il disegno JS + 150 ms: ~1 s di pannello fantasma)
  const bgAt = useRef(0);
  const strip = useRef(null); const pos = useRef({});
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
  // Live toccato da un altro giorno: si scorre a Oggi e li' si attiva il filtro (wantLive)
  const [wantLive, setWantLive] = useState(false);
  const wantRef = useRef(false);
  // il filtro si imposta SUBITO (la lista di oggi si ricostruisce prima dello scorrimento, non a fine corsa: niente scatti all'arrivo)
  useEffect(() => {
    if (keys[cur] === todayKey) { if (wantLive) { wantRef.current = false; setWantLive(false); } }
    else if (filter === 'live' && !wantLive) setFilter('all');
  }, [cur, filter, keys, todayKey, wantLive]);
  const x = useSharedValue(TODAY_INDEX);
  const x0 = useSharedValue(TODAY_INDEX);
  const ov = useSharedValue(W); // pagina web: W = fuori schermo a destra, 0 = aperta
  const ovStart = useSharedValue(0);
  const hx = useSharedValue(0); const ts = useSharedValue(0); const tsOn = useSharedValue(0); const tsDir = useSharedValue(1); // dock: Home e pagine scorrono insieme
  const nv = useSharedValue(0); const nvIdx = useSharedValue(-1); const stackN = useSharedValue(0); const natBelow = useSharedValue(0);

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
      if (AppState.currentState === 'active' && !openRef.current) { // con una pagina aperta sopra la Home non serve ridisegnarla
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
    // al ritorno dal background l'aggiornamento parte con calma: prima l'app deve tornare a rispondere al tocco
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') { clearTimeout(t); t = setTimeout(() => InteractionManager.runAfterInteractions(tick), 2500); } });
    return () => { alive = false; clearTimeout(t); sub.remove(); };
  }, [!!data, refresh]);

  const markClosed = useCallback(() => { openRef.current = false; setWebOpen(false); }, []);
  // Ritorno dal background: come tutte le app. Entro 10 minuti non si tocca niente (stessa pagina, stessi gesti, stessi tasti);
  // oltre 10 minuti l'app riparte da zero. In background l'app non fa nulla e al ritorno i dati in rete aspettano qualche secondo.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'background') { bgAt.current = Date.now(); return; }
      if (st !== 'active') return;
      globalThis.__resumeUntil = Date.now() + 5000;
      const gap = bgAt.current ? Date.now() - bgAt.current : 0;
      bgAt.current = 0;
      if (gap > 10 * 60 * 1000) { try { Image.clearMemoryCache(); } catch (e) { /* ignora */ } if (onReset) onReset(); }
    });
    const mw = AppState.addEventListener('memoryWarning', () => { try { Image.clearMemoryCache(); } catch (e) { /* ignora */ } });
    return () => { sub.remove(); mw.remove(); };
  }, [onReset]);
  const finishTab = useCallback((p) => { tsOn.value = 0; ts.value = 0; stackN.value = 1; setNatStack([p]); }, [tsOn, ts, stackN]);
  const openRoute = useCallback((route) => {
    const path0 = route.split('?')[0];
    if (!nativeOf(path0)) return; // pagina senza versione nativa (mai usata dall'app)
    try { Keyboard.dismiss(); } catch (e) { /* ignora */ } // una pagina aperta da un campo in modifica (Calcolatore) non deve tenere la tastiera
    const st = natStackRef.current;
    const TABI = (p) => TABS.findIndex(([, , x]) => x && String(p || '').startsWith(x));
    if (openRef.current && st.length === 1 && !natHiddenRef.current && isTabRoute(path0) && isTabRoute(st[0]) && st[0] !== path0 && !tsOn.value) { // voce del dock -> altra voce: carosello
      const dir = TABI(path0) > TABI(st[0]) ? 1 : -1;
      tsDir.value = dir; ts.value = 0; tsOn.value = 1; stackN.value = 2; nvIdx.value = -1; nv.value = 0;
      setNatStack([st[0], path0]); setTab(tabOf(path0)); setBarOn(true);
      ts.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }, (d) => { if (d) runOnJS(finishTab)(path0); });
      return;
    }
    if (openRef.current && st.length && !natHiddenRef.current && !isTabRoute(path0)) { // da una pagina a un'altra: si impila
      nvIdx.value = st.length; nv.value = W; stackN.value = st.length + 1; setNatStack([...st, path0]);
      nv.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
      return;
    }
    nvIdx.value = -1; nv.value = 0; stackN.value = 1; natBelow.value = 0; setNatHidden(false); setNatStack([path0]);
    openRef.current = true; setWebOpen(true); setBarOn(isTabRoute(path0)); if (isTabRoute(path0)) setTab(tabOf(path0)); ov.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
    if (isTabRoute(path0)) { hx.value = 0; hx.value = withTiming(-W, { duration: 260, easing: Easing.out(Easing.cubic) }); } // dalla Home: la Home esce a sinistra insieme alla pagina che entra
  }, [ov, nv, nvIdx, stackN, natBelow, hx, ts, tsOn, tsDir, finishTab]);
  // la pagina web lascia la scheda mostrata: riaprendo la stessa voce si aspetta il suo disegno (niente Linee guida intraviste)
  const afterClose = useCallback(() => { setNatStack([]); setNatHidden(false); stackN.value = 0; natBelow.value = 0; nvIdx.value = -1; nv.value = 0; }, [stackN, natBelow, nvIdx, nv]);
  const onTop = useCallback((route) => {
    if (!route) { setHomeTop((n) => n + 1); return; }
  }, []);
  const closeWeb = useCallback(() => { hx.value = 0; openRef.current = false; setWebOpen(false); ov.value = withTiming(W, { duration: 240, easing: Easing.out(Easing.cubic) }, (done) => { if (done) runOnJS(afterClose)(); }); }, [afterClose, ov, hx]);
  const dockHome = useCallback(() => { closeWeb(); hx.value = -W; hx.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) }); }, [closeWeb, hx]); // Home dal dock: Home rientra da sinistra insieme alla pagina che esce
  const finishPop = useCallback(() => { setNatStack((q) => q.slice(0, -1)); }, []);
  const popNat = useCallback(() => {
    const n = natStackRef.current.length;
    if (n > 1) { nvIdx.value = n - 1; stackN.value = n - 1; nv.value = withTiming(W, { duration: 240, easing: Easing.out(Easing.cubic) }, (d) => { if (d) runOnJS(finishPop)(); }); }
    else closeWeb();
  }, [closeWeb, finishPop, nv, nvIdx, stackN]);
  const revealNat = useCallback(() => { const q = natStackRef.current; setNatHidden(false); stackN.value = q.length; natBelow.value = 0; if (q.length) setBarOn(isTabRoute(q[q.length - 1])); }, [stackN, natBelow]);
  const openMatch = useCallback((m) => {
    // sempre la scheda d'archivio della stagione in corso: il percorso del feed (x-) trova la partita solo se il sito ha gia' caricato
    // quel giorno (provato: 12 partite su 26 dei campionati minori e tutte le coppe europee davano "Partita non trovata").
    const sk = m[11] || META.cur[String(m[1])];
    openRoute(sk ? `/match/a-${m[1]}-${sk}-${m[0]}` : `/match/x-${m[1]}-${m[0]}`);
  }, [openRoute]);
  const pick = useCallback((diff) => { setCal(false); wantRef.current = false; setWantLive(false); setCenter(diff); }, []);
  // ricerca nativa: stessi risultati del sito (lib/search.js), calcolati qui
  const askSearch = useCallback((q) => {
    const n = ++srchSeq.current;
    if (!String(q || '').trim()) { setSrchRes(null); return; }
    bootShared().then(() => { if (n === srchSeq.current) setSrchRes(searchN(q)); }).catch(() => {});
  }, []);
  const uiCmd = useCallback((cmd, v) => { if (cmd === 'theme') onTheme(v); }, [onTheme]);
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
  const cancelWant = () => { wantRef.current = false; setWantLive(false); };
  // giorno vicino con partite (per la carta del giorno vuoto): al massimo 14 giorni, solo giorni gia' caricati
  const nearDay = (i, dir) => { for (let j = i + dir; j >= 0 && j < N && Math.abs(j - i) <= 14; j += dir) { const r = data && data[j]; if (r && r.length) return { i: j, label: dayLabel(dates[j]), n: r.length, date: dates[j] }; } return null; };
  // solo i giorni vuoti ricevono questi valori: le pagine con partite restano memoizzate (nessun ridisegno in piu')
  const nearOf = (i) => { const p = nearDay(i, -1); const n = nearDay(i, 1); return (dir) => (dir < 0 ? p : n); };
  const goDayBtn = (i) => { if (keys[i] !== todayKey) { wantRef.current = false; setWantLive(false); } go(i); };
  const onLivePill = (v) => {
    if (v !== 'live') { wantRef.current = false; setWantLive(false); setFilter(v); return; }
    if (keys[cur] === todayKey) { setFilter('live'); return; }
    const t = keys.indexOf(todayKey); if (t < 0) return;
    wantRef.current = true; setWantLive(true); setFilter('live');
    setTimeout(() => { if (wantRef.current) go(t); }, 90); // il tempo di ricostruire la lista di oggi prima di scorrere
  };

  // swipe tra i giorni: parte anche mentre la lista scorre in verticale o l'animazione precedente non e' finita
  const pan = useMemo(() => Gesture.Pan().activeOffsetX([-10, 10]).failOffsetY([-28, 28])
    .onStart(() => { cancelAnimation(x); x0.value = x.value; runOnJS(cancelWant)(); })
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
  const bx = useSharedValue(0); const by = useSharedValue(0); const sheetSV = useSharedValue(0);
  useEffect(() => { sheetSV.value = sheetOpen ? 1 : 0; }, [sheetOpen, sheetSV]);
  const edgeOn = useSharedValue(0); // 1 mentre il dito trascina: onFinalize chiude comunque il gesto se onEnd non arriva (gesto interrotto da un'altra scheda/scroll)
  const edgeSettle = (e) => {
    'worklet';
    if (!edgeOn.value) return;
    edgeOn.value = 0;
    const multi = stackN.value > 1;
    const cur = multi ? nv.value : ov.value;
    const go = cur > W * 0.38 || e.velocityX > 300;
    if (multi) { if (go) { stackN.value = stackN.value - 1; nv.value = withTiming(W, { duration: 200, easing: Easing.out(Easing.cubic) }, (d) => { if (d) runOnJS(finishPop)(); }); } else nv.value = withTiming(0, { duration: 180 }); return; }
    if (go && natBelow.value > 0) { runOnJS(revealNat)(); ov.value = withTiming(0, { duration: 180 }); return; }
    if (go) { runOnJS(markClosed)(); ov.value = withTiming(W, { duration: 200, easing: Easing.out(Easing.cubic) }, (done) => { if (done) runOnJS(afterClose)(); }); } else ov.value = withTiming(0, { duration: 180 });
  };
  const edge = useMemo(() => Gesture.Pan().activeOffsetX([6, 1000]).failOffsetY([-40, 40])
    .onStart(() => { cancelAnimation(ov); cancelAnimation(nv); edgeOn.value = 1; hx.value = 0; if (stackN.value > 1) { nvIdx.value = stackN.value - 1; ovStart.value = nv.value; } else ovStart.value = ov.value; })
    .onUpdate((e) => { const v = Math.min(W, Math.max(0, ovStart.value + e.translationX * SWIPE_GAIN)); if (stackN.value > 1) nv.value = v; else ov.value = v; })
    .onEnd((e) => { edgeSettle(e); })
    .onFinalize((e) => { edgeSettle(e); }), [ov, ovStart, nv, nvIdx, stackN, natBelow, afterClose, markClosed, finishPop, revealNat, edgeOn, hx]); // eslint-disable-line react-hooks/exhaustive-deps
  // swipe indietro da qualunque punto dello schermo (sulla prima scheda o nelle pagine senza schede)
  const anyBack = useMemo(() => Gesture.Pan().manualActivation(true)
    .onTouchesDown((e) => { const t = e.allTouches[0]; if (t) { bx.value = t.absoluteX; by.value = t.absoluteY; } })
    .onTouchesMove((e, st) => {
      if (!backAny.value || (backScoped.value && pagerTouch.value) || sheetSV.value) { st.fail(); return; }
      const t = e.allTouches[0]; if (!t) return;
      const dx = t.absoluteX - bx.value, dy = t.absoluteY - by.value;
      if (dx > 12 && Math.abs(dy) < dx * 0.7) st.activate(); else if (Math.abs(dy) > 16 || dx < -12) st.fail();
    })
    .onStart(() => { cancelAnimation(ov); cancelAnimation(nv); edgeOn.value = 1; hx.value = 0; if (stackN.value > 1) { nvIdx.value = stackN.value - 1; ovStart.value = nv.value; } else ovStart.value = ov.value; })
    .onUpdate((e) => { const v = Math.min(W, Math.max(0, ovStart.value + e.translationX * SWIPE_GAIN)); if (stackN.value > 1) nv.value = v; else ov.value = v; })
    .onEnd((e) => { edgeSettle(e); })
    .onFinalize((e) => { edgeSettle(e); }), [ov, ovStart, nv, nvIdx, stackN, natBelow, afterClose, markClosed, finishPop, revealNat, edgeOn, bx, by, sheetSV, hx]); // eslint-disable-line react-hooks/exhaustive-deps
  const homeSt = useAnimatedStyle(() => ({ transform: [{ translateX: hx.value }] }));
  const ovStyle = useAnimatedStyle(() => ({ transform: [{ translateX: ov.value }] }));

  if (!data) return <View style={[s.root, { paddingTop: insets.top }]}><SkHome /></View>;
  const tIdx = keys.indexOf(todayKey); const liveN = tIdx >= 0 ? data[tIdx].reduce((n, m) => n + (m[8] === 'l' ? 1 : 0), 0) : 0; // badge del dock: partite live di oggi
  const shown = [cur - 2, cur - 1, cur, cur + 1, cur + 2].filter((i) => i >= 0 && i < N);
  return (
    <View style={[s.root, { paddingTop: insets.top }]} onTouchStart={(e) => { TOUCH.y = e.nativeEvent.pageY; }}>
      <Beams />
      <StatusBar barStyle={C.dark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[{ flex: 1 }, homeSt]}>
      <Header onSearch={openSearch} onMenu={openMenuP} onCal={() => setCal(true)} />
      <ScrollView ref={strip} horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={s.strip}>
        {dates.map((d, i) => (
          <DayBtn key={keys[i]} i={i} x={x} on={i === cur} top={dayLabel(d)} sub={`${d.getDate()} ${MONTHS[d.getMonth()]}`} onPress={() => goDayBtn(i)}
            onLayout={(e) => { const { x: lx, width } = e.nativeEvent.layout; pos.current[i] = { x: lx, w: width }; if (i === curRef.current) centre(i); }} />
        ))}
      </ScrollView>
      <View style={s.filters}>
        <LivePill value={wantLive ? 'live' : eff} onChange={onLivePill} />
      </View>
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          {shown.map((i) => <Pane key={i} idx={i} x={x}><Day iso={keys[i]} rows={data[i]} filter={filter === 'live' && keys[i] === todayKey ? 'live' : 'all'} onOpen={openMatch} onLeague={openRoute} top={homeTop} isCur={i === cur} {...(data[i] && data[i].length ? null : { near: nearOf(i), onDay: goDayBtn, onJump: pick })} /></Pane>)}
        </View>
      </GestureDetector>
      </Animated.View>
      <Calendar visible={cal} selected={dates[cur] || new Date()} onClose={() => setCal(false)} onPick={pick} />

      {/* pagina web (resto dell'app): gia' caricata, si apre scorrendo da destra */}
      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }, ovStyle]}>
        <GestureDetector gesture={anyBack}><View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {natStack.map((p, i) => { const n = nativeOf(p); if (!n) return null; return <NatLayer key={p} i={i} nv={nv} nvIdx={nvIdx} tsOn={tsOn} ts={ts} tsDir={tsDir} hidden={natHidden} live={i === natStack.length - 1 && !natHidden}><Guard key={`g${p}`} onError={() => setTimeout(popNat, 0)}>{React.createElement(n.Comp, { params: n.params, C, top: insets.top, onBack: popNat, bottom: insets.bottom + 90, openRoute, onSearch: () => setSrch(true), onMenu: openMenuP })}</Guard></NatLayer>; })}
        </View></GestureDetector>
        <Guard autoReset key="gp" onError={() => closePanel()}><PlayerPanelHost C={C} top={insets.top} bottom={insets.bottom} openRoute={openRoute} /></Guard>
        <Guard autoReset key="gs" onError={() => closePlayer()}><PlayerSheetHost C={C} bottom={insets.bottom} openRoute={openRoute} /></Guard>
        <GestureDetector gesture={edge}><View pointerEvents="auto" style={[s.edge, { width: EDGE_W, top: insets.top + 98, zIndex: 200, elevation: 200 }]} /></GestureDetector>
      </Animated.View>
      {!webOpen || barOn ? <View pointerEvents={sheetOpen ? 'none' : 'box-none'} style={[StyleSheet.absoluteFill, sheetOpen && { opacity: 0, transform: [{ translateY: 200 }] }]}><TabBar onOpen={openRoute} onHome={dockHome} onTop={onTop} active={webOpen ? tab : null} bottom={insets.bottom} live={liveN} /></View> : null}
      {/* tendine della riga in alto: sopra la Home e sopra la barra (la barra non cambia) */}
      <SearchPanel open={srch} onClose={closeSrch} onPick={pickSrch} ask={askSearch} res={srchRes} ready top={insets.top + 4} />
      <MenuPanel open={menu} onClose={closeMenu} onGo={goMenu} ui={ui} onCmd={uiCmd} top={insets.top} bottom={insets.bottom} />
    </View>
  );
}

// rete di sicurezza: un errore di disegno in un pezzo (tendina giocatore, pannello) non deve lasciare lo schermo bianco
class Guard extends React.Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { try { globalThis.__lastErr = String((err && err.stack) || err).slice(0, 600); if (this.props.onError) this.props.onError(err); if (this.props.autoReset) setTimeout(() => this.setState({ err: null }), 300); } catch (e) { /* ignora */ } }
  render() { return this.state.err ? null : this.props.children; }
}

export default function App() {
  useAutoUpdate();
  const [pref, setPref] = useState('dark'); // scelta nel menu: light | dark | system
  const sysScheme = useColorScheme();
  const [gen, setGen] = useState(0); // nuova generazione = tutta l'app riparte (dopo piu' di 10 minuti in background)
  const [rootKey, setRootKey] = useState(0); // anche il contenitore dei gesti riparte: se il tocco nativo e' rimasto 'rotto' dopo il background, un Screen nuovo da solo non basta
  const onReset = useCallback(() => { setGen((g) => g + 1); setRootKey((k) => k + 1); }, []);
  useEffect(() => { AsyncStorage.getItem('sl-theme').then((v) => { if (v === 'light' || v === 'dark' || v === 'system') setPref(v); }).catch(() => {}); }, []);
  const onTheme = useCallback((t) => { setPref(t); AsyncStorage.setItem('sl-theme', t).catch(() => {}); }, []);
  const [homeOn, setHomeOn] = useState(LAUNCHED);
  const onPop = useCallback(() => setHomeOn(true), []);
  const theme = pref === 'system' ? (sysScheme === 'light' ? 'light' : 'dark') : pref;
  const T = THEMES[theme];
  return <GestureHandlerRootView key={rootKey} style={{ flex: 1, backgroundColor: T.C.bg }}><TCtx.Provider value={T}><SafeAreaProvider>{homeOn ? <Guard key={gen} onError={() => setTimeout(onReset, 50)}><Screen onTheme={onTheme} onReset={onReset} themePref={pref} /></Guard> : null}</SafeAreaProvider><LaunchOverlay onPop={onPop} /></TCtx.Provider></GestureHandlerRootView>;
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
  mBox: { marginTop: 8, padding: 6, borderRadius: 18, backgroundColor: C.wash, borderWidth: 1, borderColor: C.hair },
  mHi: { position: 'absolute', left: 6, right: 6, top: 6, height: MROW, borderRadius: 13, backgroundColor: C.accTint, borderWidth: 1, borderColor: C.accRing },
  mItem2: { height: MROW, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 },
  lgRing: { width: 39, height: 39, borderRadius: 19.5, shadowColor: '#000', shadowOpacity: C.dark ? 0.45 : 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  lgBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#000', shadowOpacity: C.dark ? 0.45 : 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  lgHi: { position: 'absolute', top: 0, left: 8, right: 8, height: 1, opacity: 0.9 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip, borderWidth: 1, borderColor: C.border },
  strip: { paddingHorizontal: 20, paddingVertical: 8, gap: 24, alignItems: 'center' },
  dBtn: { paddingBottom: 7 },
  dUnder: { position: 'absolute', left: '10%', right: '10%', bottom: 0, height: 3, borderRadius: 2, backgroundColor: C.accent, shadowColor: C.accent, shadowOpacity: 0.55, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  dTop: { color: C.ink3, fontSize: 15, fontWeight: '500' },
  dOnW: { fontWeight: '800' },
  dSub: { color: C.ink3, fontSize: 10.5 },
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
  dockWave: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: 13, borderWidth: 2, borderColor: C.live },
  fLive: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.live },
  cardRing: { marginHorizontal: 16, marginTop: 16 },
  card: { borderRadius: 24.5, overflow: 'hidden', backgroundColor: C.bg }, // fondo pieno: lo sfondo a fasci si vede solo fuori dalle finestre
  inner: { borderTopWidth: 1, borderTopColor: C.hair },
  headRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 16, minHeight: 50 },
  lhRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingLeft: 16, paddingRight: 12 },
  lhName: { color: C.ink, fontSize: 12.5, fontWeight: '800', letterSpacing: 0.9, textTransform: 'uppercase', flexShrink: 1 },
  hairTop: { },
  cnt: { color: C.ink2, fontSize: 11, fontWeight: '500', width: 28, marginRight: 6, textAlign: 'right' },
  // numero e freccia: zona fissa a destra, stessa posizione in tutte le testate (nome lungo troncato prima)
  tail: { width: 52, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 },
  flag: { width: 36, height: 28, borderRadius: 7, marginLeft: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip, borderWidth: 2, shadowOpacity: 0.35, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } },
  flagImg: { width: 30, height: 22, borderRadius: 4 },
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
  emBox: { marginHorizontal: 16, marginTop: 24, paddingVertical: 26, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.2, borderStyle: 'dashed', borderColor: C.border, alignItems: 'center' },
  emWell: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: C.dark ? 'rgba(0,0,0,0.38)' : 'rgba(15,23,42,0.06)', borderWidth: 1, borderColor: C.hair },
  emTitle: { color: C.ink, fontSize: 15.5, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  emSub: { color: C.ink2, fontSize: 12.5, marginTop: 4, textAlign: 'center' },
  emBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: C.border, backgroundColor: C.chip },
  emBtnTx: { color: C.ink, fontSize: 12.5, fontWeight: '700' },
  back: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 22 },
  calBack: { flex: 1, backgroundColor: 'rgba(0,0,0,.55)', justifyContent: 'center', padding: 24 },
  calBox: { backgroundColor: C.sheet, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 },
  calTitle: { color: C.ink, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  calRow: { flexDirection: 'row' },
  calWk: { width: '14.2857%', textAlign: 'center', color: C.ink3, fontSize: 12, paddingVertical: 6 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.2857%', alignItems: 'center', paddingVertical: 3 },
  calDay: { width: 38, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  calSel: { backgroundColor: C.accent },
  calToday: { backgroundColor: C.accTint },
  calTxt: { color: C.ink, fontSize: 14, fontWeight: '600' },
  calTxtSel: { color: '#FFFFFF' },
  calTodayBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20, marginTop: 6 },
});
const THEMES = { dark: { C: DARK, s: makeStyles(DARK) }, light: { C: LIGHT, s: makeStyles(LIGHT) } };
const TCtx = createContext(THEMES.dark);
const useT = () => useContext(TCtx);
