// ScalperLab nativa - Home (React Native). Stesse regole della Home web: finestre per paese, top campionati in alto,
// colori e loghi delle competizioni, righe partita. Metadati da meta.json (generato da data/leagues.js e data/countries.js).
import React, { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, StatusBar, Dimensions, StyleSheet, ActivityIndicator, LayoutAnimation, Platform, UIManager, AppState, Modal } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedReaction, withTiming, cancelAnimation, runOnJS, Easing } from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import META from './meta.json';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);

const SITE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/';
const W = Dimensions.get('window').width;
const DARK = { dark: true, bg: '#05070D', ink: '#F1F5FB', ink2: '#A9B6CC', ink3: '#6D7A91', hair: 'rgba(255,255,255,.10)', border: 'rgba(255,255,255,.12)', accent: '#4DA8FF', live: '#FF6464', chip: 'rgba(255,255,255,.08)', wash: 'rgba(255,255,255,0.03)', card1: 'rgba(255,255,255,0.10)', card2: 'rgba(255,255,255,0.035)', sheet: '#0E1626' };
const LIGHT = { dark: false, bg: '#F3F6FB', ink: '#0F172A', ink2: '#475569', ink3: '#8592A6', hair: 'rgba(15,23,42,.08)', border: 'rgba(15,23,42,.10)', accent: '#1F6BEF', live: '#E5484D', chip: 'rgba(15,23,42,.06)', wash: 'rgba(255,255,255,0.85)', card1: 'rgba(255,255,255,0.95)', card2: 'rgba(255,255,255,0.8)', sheet: '#FFFFFF' };
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
const useOpen = (key, init) => {
  const [open, setOpen] = useState(() => (key in OPEN_KEY ? OPEN_KEY[key] : init));
  const toggle = () => { LayoutAnimation.configureNext(LayoutAnimation.create(260, 'easeInEaseOut', 'opacity')); setOpen((o) => { OPEN_KEY[key] = !o; return !o; }); };
  return [open, toggle];
};
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

const LeagueGroup = memo(({ iso, g, forceOpen, onOpen }) => {
  const { s } = useT();
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
  const { C, s } = useT();
  const [open, toggle] = useOpen(`${iso}|paese:${p.k}`, false);
  const isOpen = forceOpen || open;
  const total = p.comps.reduce((n, x) => n + x.matches.length, 0);
  return (
    <Card tint={p.tint}>
      <Pressable onPress={toggle} style={s.headRow}>
        <Flag fc={p.fc} tint={p.tint} />
        <Text numberOfLines={1} style={[s.lhName, { flex: 1, marginLeft: 12 }]}>{p.name}</Text>
        <Text style={s.cnt}>{total}</Text><Chev open={isOpen} />
      </Pressable>
      {isOpen ? p.comps.map((x) => (
        <View key={x.fm} style={s.inner}>
          <View style={s.hairTop}><LeagueHead c={x.c} size={20} small /></View>
          {x.matches.map((m) => <View key={m[0]} style={s.sep}><Row m={m} onOpen={onOpen} /></View>)}
        </View>
      )) : null}
    </Card>
  );
});

const Day = memo(({ iso, rows, filter, onOpen }) => {
  const { s } = useT();
  const items = useMemo(() => groupsOf(rows, filter), [rows, filter]);
  const render = useCallback(({ item }) => (item.g ? <LeagueGroup iso={iso} g={item.g} forceOpen={filter === 'live'} onOpen={onOpen} /> : <CountryGroup iso={iso} p={item.p} forceOpen={filter === 'live'} onOpen={onOpen} />), [iso, filter, onOpen]);
  if (!items.length) return <View style={{ width: W }}><Text style={s.empty}>Nessuna partita</Text></View>;
  return (
    <View style={{ width: W }}>
      <FlatList data={items} renderItem={render} keyExtractor={(i) => i.key} initialNumToRender={4} maxToRenderPerBatch={3} updateCellsBatchingPeriod={60} windowSize={5} contentContainerStyle={{ paddingBottom: 90 }} />
    </View>
  );
});

function Header({ onSearch, onMenu, onCal }) {
  const { C, s } = useT();
  return (
    <View style={s.header}>
      <Text style={s.brand}>Scalper<Text style={{ color: C.accent }}>Lab</Text></Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={onCal} style={s.iconBtn}><Ionicons name="calendar-outline" size={16} color={C.ink} /></Pressable>
        <Pressable onPress={onSearch} style={s.iconBtn}><Ionicons name="search" size={16} color={C.ink} /></Pressable>
        <Pressable onPress={onMenu} style={s.iconBtn}><Ionicons name="menu" size={17} color={C.ink} /></Pressable>
      </View>
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

const NO_LAUNCH = "try{sessionStorage.setItem('sl-launched','1')}catch(e){};" + "(function(){var n=0;window.__slDepth=0;var send=function(){window.__slDepth=n;try{window.ReactNativeWebView.postMessage('depth:'+n)}catch(e){}};var P=history.pushState,R=history.replaceState;history.pushState=function(s,t,u){n++;var st=Object.assign({},s||{});st.__sln=n;var r=P.call(this,st,t,u);send();return r;};history.replaceState=function(s,t,u){var st=Object.assign({},s||{});st.__sln=n;return R.call(this,st,t,u);};window.addEventListener('popstate',function(){var st=history.state;if(st&&typeof st.__sln==='number'){n=st.__sln;}else{n=0;}send();if(location.hash==='#/linee-guida'){try{window.ReactNativeWebView.postMessage('home')}catch(e){}}});})();true;";
const EDGE_W = 60; // zona dello swipe indietro (px dal bordo): larga, cosi' parte anche senza essere precisi

const THEME_JS = "(function(){try{var send=function(){window.ReactNativeWebView.postMessage(document.documentElement.classList.contains('dark')?'dark':'light');};send();new MutationObserver(send).observe(document.documentElement,{attributes:true,attributeFilter:['class']});}catch(e){}})();true;";
const scoreStr = (sc) => { const x = /(\d+)\s*-\s*(\d+)/.exec(String(sc || '')); return x ? `${x[1]}-${x[2]}` : null; };

function Screen({ onTheme }) {
  const { C, s } = useT();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState(null); // { dates, keys, data } cambiano insieme: mai date nuove con partite vecchie
  const [center, setCenter] = useState(0); // giorno al centro della striscia (0 = oggi)
  const [cal, setCal] = useState(false);
  const [cur, setCur] = useState(TODAY_INDEX);
  const [filter, setFilter] = useState('all');
  const [warm, setWarm] = useState(false);
  const [depth, setDepth] = useState(0); // pagine aperte nella WebView dopo la prima (0 = la prima: lo swipe indietro e' dell'app)
  const openRef = useRef(false);
  const strip = useRef(null); const pos = useRef({}); const webRef = useRef(null);
  const lastCenter = useRef(0);
  const curRef = useRef(cur); curRef.current = cur;
  const viewRef = useRef(null); viewRef.current = view;
  const data = view ? view.data : null;
  const keys = view ? view.keys : NOKEYS;
  const dates = view ? view.dates : NOKEYS;
  const N = OFFSETS.length;
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
      const files = await Promise.all(ks.map((k) => getJ(`giorni/${k}.json`).catch(() => ({ m: [] }))));
      const seen = new Set(); const by = {};
      files.forEach((f) => (f.m || []).forEach((m) => {
        if (seen.has(m[0]) || m[8] === 'c' || !m[5] || !m[6] || !m[2]) return; seen.add(m[0]);
        const k = rome(new Date(m[2])); (by[k] = by[k] || []).push(m);
      }));
      if (!on) return;
      if (lastCenter.current !== center) { lastCenter.current = center; cancelAnimation(x); x.value = TODAY_INDEX; setCur(TODAY_INDEX); }
      setView({ dates: ds, keys: ks, data: ks.map((k) => by[k] || []) });
    })();
    return () => { on = false; };
  }, [center, x]);
  // la pagina web si prepara a riposo (leggera) cosi' aprire una partita non ricarica niente
  useEffect(() => { if (!data) return undefined; const t = setTimeout(() => setWarm(true), 2500); return () => clearTimeout(t); }, [!!data]);

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
        upd.set(String(y.id), y.f && sc ? { st: 'f', score: sc } : y.s && !y.f ? { st: 'l', score: sc, lt: clock(y.lt) } : { st: 'n' });
      });
    } catch (e) { /* si riprova al prossimo giro */ }
    const rows0 = (viewRef.current && viewRef.current.keys === v.keys ? viewRef.current.data[i] : null) || [];
    // altre partite iniziate da meno di 5 ore (campionati e coppe aggiunti): una richiesta per partita, al massimo 12 per giro
    const one = rows0.filter((m) => !upd.has(String(m[0])) && m[8] !== 'f' && Date.parse(m[2]) <= now && now - Date.parse(m[2]) < 5 * 3600000).slice(0, 12);
    let k = 0;
    const worker = async () => {
      while (k < one.length) {
        const m = one[k++];
        try {
          const d = await getF(`${WORKER}/fx?id=${m[0]}`);
          const sc = d.sc && d.sc[0] != null ? `${d.sc[0]}-${d.sc[1]}` : null;
          upd.set(String(m[0]), d.fin && sc ? { st: 'f', score: sc } : d.st ? { st: 'l', score: sc, lt: clock(d.clk, d.ht) } : { st: 'n' });
        } catch (e) { /* si riprova al prossimo giro */ }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
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
      const u = upd.get(String(m[0])); if (!u) return m;
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
      if (alive) t = setTimeout(tick, anyLive ? 15000 : 60000);
    };
    tick();
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') { clearTimeout(t); tick(); } });
    return () => { alive = false; clearTimeout(t); sub.remove(); };
  }, [!!data, refresh]);

  const markClosed = useCallback(() => { openRef.current = false; }, []);
  const hashTo = useCallback((h) => { if (webRef.current) webRef.current.injectJavaScript(`location.hash=${JSON.stringify(h)};true;`); }, []);
  const openRoute = useCallback((route) => { openRef.current = true; setDepth(0); hashTo(`#${route}`); ov.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) }); }, [hashTo, ov]);
  const afterClose = useCallback(() => { hashTo('#/linee-guida'); setDepth(0); }, [hashTo]);
  const closeWeb = useCallback(() => { openRef.current = false; ov.value = withTiming(W, { duration: 240, easing: Easing.out(Easing.cubic) }, (done) => { if (done) runOnJS(afterClose)(); }); }, [afterClose, ov]);
  const openMatch = useCallback((m) => {
    // sempre la scheda d'archivio della stagione in corso: il percorso del feed (x-) trova la partita solo se il sito ha gia' caricato
    // quel giorno (provato: 12 partite su 26 dei campionati minori e tutte le coppe europee davano "Partita non trovata").
    const sk = META.cur[String(m[1])];
    openRoute(sk ? `/match/a-${m[1]}-${sk}-${m[0]}` : `/match/x-${m[1]}-${m[0]}`);
  }, [openRoute]);
  const onMsg = useCallback((e) => {
    const t = e && e.nativeEvent && e.nativeEvent.data;
    if (t === 'dark' || t === 'light') onTheme(t);
    else if (typeof t === 'string' && t.startsWith('depth:')) setDepth(Number(t.slice(6)) || 0);
    else if (t === 'home' && openRef.current) closeWeb(); // il tasto indietro del sito e' tornato alla pagina di partenza: si torna alla Home
  }, [onTheme, closeWeb]);
  const pick = useCallback((diff) => { setCal(false); setCenter(diff); }, []);

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
    .onUpdate((e) => { ov.value = Math.max(0, ovStart.value + e.translationX); })
    .onEnd((e) => {
      if (e.translationX > W * 0.25 || e.velocityX > 500) { runOnJS(markClosed)(); ov.value = withTiming(W, { duration: 200, easing: Easing.out(Easing.cubic) }, (done) => { if (done) runOnJS(afterClose)(); }); } else ov.value = withTiming(0, { duration: 180 });
    }), [ov, ovStart, afterClose, markClosed]);
  const ovStyle = useAnimatedStyle(() => ({ transform: [{ translateX: ov.value }] }));

  if (!data) return <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={C.accent} /></View>;
  const shown = [cur - 2, cur - 1, cur, cur + 1, cur + 2].filter((i) => i >= 0 && i < N);
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={C.dark ? 'light-content' : 'dark-content'} />
      <Header onSearch={() => openRoute('/')} onMenu={() => openRoute('/menu')} onCal={() => setCal(true)} />
      <ScrollView ref={strip} horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={s.strip}>
        {dates.map((d, i) => (
          <Pressable key={keys[i]} onPress={() => go(i)} onLayout={(e) => { pos.current[i] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width }; if (i === cur) centre(i); }}>
            <Text style={[s.dTop, i === cur && s.dOn]}>{dayLabel(d)}</Text>
            <Text style={[s.dSub, i === cur && { opacity: 0.9 }]}>{d.getDate()} {MONTHS[d.getMonth()]}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.filters}>
        <Pressable onPress={() => setFilter('all')}><Text style={[s.fBtn, filter === 'all' && s.fOn]}>Tutte</Text></Pressable>
        <Pressable onPress={() => setFilter('live')} style={s.fLive}><View style={s.liveDot} /><Text style={[s.fBtn, filter === 'live' && s.fOn]}>Live</Text></Pressable>
      </View>
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          {shown.map((i) => <Pane key={i} idx={i} x={x}><Day iso={keys[i]} rows={data[i]} filter={filter} onOpen={openMatch} /></Pane>)}
        </View>
      </GestureDetector>
      <Calendar visible={cal} selected={dates[cur] || new Date()} onClose={() => setCal(false)} onPick={pick} />

      {/* pagina web (resto dell'app): gia' caricata, si apre scorrendo da destra */}
      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }, ovStyle]}>
        <View style={{ paddingTop: insets.top, flex: 1 }}>
          <Pressable onPress={closeWeb} style={s.back}><Ionicons name="chevron-back" size={20} color={C.accent} /><Text style={{ color: C.accent, fontSize: 16 }}>Home</Text></Pressable>
          {warm ? <WebView ref={webRef} source={{ uri: `${SITE}aurora/#/linee-guida` }} style={{ flex: 1, backgroundColor: C.bg }} injectedJavaScriptBeforeContentLoaded={NO_LAUNCH} injectedJavaScript={THEME_JS} onMessage={onMsg} decelerationRate={0.998} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} directionalLockEnabled={false} allowsLinkPreview={false} /> : null}
        </View>
        <GestureDetector gesture={edge}><View pointerEvents={depth > 0 ? 'none' : 'auto'} style={[s.edge, { width: EDGE_W, top: insets.top + 98 }]} /></GestureDetector>
      </Animated.View>
    </View>
  );
}

export default function App() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => { AsyncStorage.getItem('sl-theme').then((v) => { if (v === 'light' || v === 'dark') setTheme(v); }).catch(() => {}); }, []);
  const onTheme = useCallback((t) => { setTheme(t); AsyncStorage.setItem('sl-theme', t).catch(() => {}); }, []);
  const T = THEMES[theme];
  return <GestureHandlerRootView style={{ flex: 1, backgroundColor: T.C.bg }}><TCtx.Provider value={T}><SafeAreaProvider><Screen onTheme={onTheme} /></SafeAreaProvider></TCtx.Provider></GestureHandlerRootView>;
}

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  brand: { color: C.ink, fontSize: 24, fontWeight: '800', letterSpacing: -1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip, borderWidth: 1, borderColor: C.border },
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
