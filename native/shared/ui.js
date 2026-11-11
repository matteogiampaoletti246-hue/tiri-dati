// Mattoni nativi condivisi tra le pagine (tappa 1+): colori sempre dal tema C, mai fissi nei componenti.
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, TextInput, Pressable, Modal, FlatList, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { makeMutable, useSharedValue, useAnimatedStyle, withTiming, withRepeat, interpolateColor, Easing, FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Dropdown from './Dropdown';

export const TeamCrest = ({ team, size = 32, C }) => {
  const [bad, setBad] = useState(false);
  if (!team) return null;
  if (team.crest && !bad) {
    const img = <Image source={{ uri: team.crest }} style={{ width: size, height: size }} contentFit="contain" cachePolicy="memory-disk" onError={() => setBad(true)} />;
    if (!(C && C.dark)) return img;
    // Night: contorno bianco sottile che segue la forma (ombra bianca senza sfocatura forte: mai riquadri)
    return <View style={{ width: size, height: size, shadowColor: '#FFFFFF', shadowOpacity: 0.95, shadowRadius: size >= 40 ? 1.6 : 1.1, shadowOffset: { width: 0, height: 0 } }}>{img}</View>;
  }
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.ink2, fontSize: Math.max(10, size * 0.4), fontWeight: '700' }}>{team.initials}</Text></View>;
};

export const Face = ({ uri, color, size = 44 }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: color || 'rgba(128,128,128,.25)' }}>
    {uri ? <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" cachePolicy="memory-disk" /> : null}
  </View>
);

// colore della scheda (squadra o campionato): le tabelle e i riquadri della pagina prendono la sfumatura di questo colore, ferma (mai animata)
export const TintCtx = createContext(null);
export const TintProvider = ({ color, children }) => <TintCtx.Provider value={color || null}>{children}</TintCtx.Provider>;
export const mixHex = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const x = p(a); const y = p(b || a); return `#${x.map((v, i) => Math.round(v * (1 - t) + y[i] * t).toString(16).padStart(2, '0')).join('')}`; };
export const lumOf = (h) => { const n = parseInt(String(h).slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
// banner colorati con testo bianco: se il colore e' troppo chiaro (bianco…) si usa il secondo colore o uno scurito, cosi' il testo resta leggibile
export const legible = (c0, c1) => {
  const f = (c) => (lumOf(c) > 0.62 ? mixHex(c, '#1B2540', 0.62) : c);
  const a = lumOf(c0) > 0.62 && c1 && lumOf(c1) <= 0.62 ? c1 : f(c0);
  return [a, f(c1 || c0)];
};
const okHex = (c) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : null);
export const tintFill = (C, color) => { const t = okHex(color); return t ? [`${t}${C.dark ? '4D' : '2E'}`, `${t}00`] : null; };
export const TintBg = ({ C, color }) => { const g = tintFill(C, color); return g ? <LinearGradient pointerEvents="none" colors={g} locations={[0, 0.78]} start={{ x: 0, y: 0.35 }} end={{ x: 1, y: 0.65 }} style={StyleSheet.absoluteFill} /> : null; };
// bordo del riquadro nel colore della scheda (squadra, nazionale o competizione); quando il colore cambia sfuma da uno all'altro
const PanelRing = ({ color, w, r = 22 }) => {
  const k = useSharedValue(1);
  const fromC = useSharedValue(color);
  const toC = useSharedValue(color);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    fromC.value = toC.value; toC.value = color; k.value = 0; k.value = withTiming(1, { duration: 380 });
  }, [color]);
  const st = useAnimatedStyle(() => ({ borderColor: interpolateColor(k.value, [0, 1], [fromC.value, toC.value]) }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, borderWidth: w }, st]} />;
};
export const Panel = ({ C, children, style, tint, ring }) => {
  const ctx = useContext(TintCtx);
  const t = okHex(tint || ctx);
  return (
    <View style={[{ borderRadius: 22, overflow: 'hidden', backgroundColor: C.card2, borderWidth: ring ? 1.5 : 1, borderColor: ring ? (t ? `${t}B3` : C.accRing) : C.border }, style]}>
      <TintBg C={C} color={tint || ctx} />
      {children}
      {t && !ring ? <PanelRing color={`${t}B3`} w={1.5} r={(StyleSheet.flatten(style) || {}).borderRadius ?? 22} /> : null}
    </View>
  );
};

export const PanelTitle = ({ C, children, right }) => (
  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, marginTop: 4 }}>
    <Text style={{ color: C.ink3, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>{children}</Text>
    {right ? <Text style={{ color: C.ink3, fontSize: 11 }}>{right}</Text> : null}
  </View>
);

// ultimo tocco sullo schermo (App.js lo aggiorna): le tendine si aprono vicino al tasto toccato
export const TOUCH = { y: 0 };

// contorno multicolore FERMO (l'animazione girevole costava un livello grafico per ogni tasto e rallentava le liste)
export function RingBox({ C, radius = 999, pad = 1.5, style, innerStyle, plain, children }) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', padding: pad }, style]}>
      <LinearGradient pointerEvents="none" colors={['#00C2FF', C.accent, '#7B6CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[{ flex: 1, borderRadius: radius - pad, overflow: 'hidden', backgroundColor: C.bg }, innerStyle]}>
        {plain ? null : <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: C.chip }]} />}
        {children}
      </View>
    </View>
  );
}

// pillola "liquid glass" (stessa del tasto Tutte | Live della Home): l'indicatore blu-viola scorre con un leggero rimbalzo da una voce all'altra
const PILL_EASE = Easing.bezier(0.34, 1.42, 0.64, 1);
const PILL_MS = 600;
function SegItem({ C, label, on, onPress, onLayout, flex, tight }) {
  const a = useSharedValue(on ? 1 : 0);
  useEffect(() => { a.value = withTiming(on ? 1 : 0, { duration: 300 }); }, [on, a]);
  const tx = useAnimatedStyle(() => ({ color: interpolateColor(a.value, [0, 1], [C.ink2, '#FFFFFF']) }), [C]);
  return (
    <Pressable onPress={onPress} onLayout={onLayout} style={{ flex: flex ? 1 : undefined, minWidth: 0, paddingHorizontal: tight ? 4 : 14, height: 38, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Text numberOfLines={1} style={[{ fontSize: tight ? 13 : 13.5, fontWeight: '600' }, tx]}>{label}</Animated.Text>
    </Pressable>
  );
}
export const Segmented = ({ C, options, value, onChange, hug }) => {
  const [cur, setCur] = useState(value);
  useEffect(() => { setCur(value); }, [value]);
  const pos = useRef({});
  const tx = useSharedValue(0);
  const tw = useSharedValue(0);
  const first = useRef(true);
  const scroller = useRef(null);
  const scroll = options.length > 5; // fino a 5 voci stanno tutte nella pillola (Tutte, Attacco, Difesa, Disciplina, Gioco)
  const place = (v, animate) => {
    const r = pos.current[String(v)];
    if (!r) return;
    if (first.current || !animate) { tx.value = r.x; tw.value = r.w; first.current = false; return; }
    tx.value = withTiming(r.x, { duration: PILL_MS, easing: PILL_EASE });
    tw.value = withTiming(r.w, { duration: PILL_MS, easing: PILL_EASE });
    if (scroll && scroller.current) scroller.current.scrollTo({ x: Math.max(0, r.x - 40), animated: true });
  };
  useEffect(() => { place(cur, true); }); // eslint-disable-line react-hooks/exhaustive-deps
  const th = useAnimatedStyle(() => ({ width: tw.value, transform: [{ translateX: tx.value }] }));
  const press = (v) => { if (v === cur) return; setCur(v); setTimeout(() => onChange(v), 60); };
  const items = options.map((o) => (
    <SegItem key={String(o.value)} C={C} label={o.label} on={o.value === cur} tight={options.length === 5} flex={!scroll && !hug} onPress={() => press(o.value)}
      onLayout={(e) => { const { x, width } = e.nativeEvent.layout; pos.current[String(o.value)] = { x, w: width }; if (String(o.value) === String(cur)) place(cur, false); }} />
  ));
  const thumb = (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 19, overflow: 'hidden' }, th]}>
      <LinearGradient colors={['#1F6BEF', C.accent, '#7B6CFF']} locations={[0, 0.55, 1]} start={{ x: 0, y: 0.4 }} end={{ x: 1, y: 0.6 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
  return (
    <RingBox C={C} style={[{ height: 41 }, hug && { alignSelf: hug === 'end' ? 'flex-end' : 'flex-start' }]}>
      {scroll ? (
        <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row' }}>{thumb}{items}</ScrollView>
      ) : (
        <View style={{ flex: hug ? 0 : 1, flexDirection: 'row' }}>{thumb}{items}</View>
      )}
    </RingBox>
  );
};

// Sede: tre tasti uguali in vetro liquido, icona sopra il nome (Casa = casetta, Neutro = bilancia, Trasferta = aereo); quello scelto si accende
const SEDE = [['casa', 'Casa', 'home-outline'], ['neutro', 'Neutro', 'scale-balance'], ['trasferta', 'Trasferta', 'airplane-outline']];
export const SedeButtonsN = ({ C, value, onChange }) => (
  <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hair }}>
    {SEDE.map(([v, label, icon]) => {
      const on = value === v;
      return (
        <Pressable key={v} onPress={() => onChange(v)} style={({ pressed }) => [{ flex: 1, borderRadius: 16, overflow: 'hidden', paddingVertical: 11, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: on ? C.accRing : C.lgBorder, backgroundColor: on ? C.accTint : C.chip }, pressed && { opacity: 0.7 }]}>
          <LinearGradient pointerEvents="none" colors={[C.lg1, C.lg2]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
          {icon === 'scale-balance' ? <MaterialCommunityIcons name="scale-balance" size={23} color={on ? C.ink : C.ink3} /> : <Ionicons name={icon} size={21} color={on ? C.ink : C.ink3} />}
          <Text style={{ color: on ? C.ink : C.ink3, fontSize: 13, fontWeight: '600' }}>{label}</Text>
        </Pressable>
      );
    })}
  </View>
);

export const FieldRow = ({ C, label, hint, first, children }) => (
  <View style={{ paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, borderTopColor: C.hair }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ color: C.ink2, fontSize: 13, fontWeight: '600' }}>{label}</Text>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>{children}</View>
    </View>
    {hint ? <Text style={{ color: C.ink3, fontSize: 11.5, marginTop: 6 }}>{hint}</Text> : null}
  </View>
);

export const NumInput = ({ C, value, onChange, placeholder, style, ring, width, tint }) => {
  const inp = (
    <TextInput
      value={value}
      onChangeText={(t) => onChange(String(t).replace('.', ',').replace(/[^0-9,]/g, ''))}
      keyboardType="decimal-pad"
      placeholder={placeholder || '—'}
      placeholderTextColor={C.ink3}
      style={[{ color: tint || C.ink, backgroundColor: ring ? 'transparent' : C.chip, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, fontSize: 16, fontWeight: tint ? '800' : '700', textAlign: ring ? 'center' : 'right' }, ring && { flex: 1, paddingVertical: 0 }, style]}
    />
  );
  // tint: bordo pieno e sfondo nel colore della fascia (verde = buono, rosso = scarso), come il campo del sito
  if (tint && ring) return <View style={{ height: 41, width: width || 112, borderRadius: 20, borderWidth: 1.5, borderColor: tint, backgroundColor: tint + '26', overflow: 'hidden' }}>{inp}</View>;
  return ring ? <RingBox C={C} radius={20} style={{ height: 41, width: width || 112 }}>{inp}</RingBox> : inp;
};

// finestra di scelta con ricerca (campionato, squadra, giocatore): scorre solo la lista
const nrm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[ı]/g, 'i').replace(/[øœ]/g, 'o').replace(/ł/g, 'l').replace(/[đð]/g, 'd').replace(/æ/g, 'ae').replace(/ß/g, 'ss');
// requireQuery: elenchi enormi (36mila giocatori): niente righe finche' non si scrive, poi al massimo 60 risultati
export function PickerModal({ C, open, title, options, onSelect, onClose, searchable, placeholder, requireQuery, value, banners }) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState(null);
  const { width: W, height: H } = useWindowDimensions();
  const top = Math.max(searchable ? 70 : 90, Math.min(TOUCH.y + 10, H * 0.5));
  const list = useMemo(() => {
    const n = nrm(q.trim());
    if (requireQuery && !n) return [];
    const base = n ? options.filter((o) => nrm(o.label).includes(n) || nrm(o.sub || '').includes(n)) : options;
    return requireQuery ? base.slice(0, 60) : base;
  }, [options, q, requireQuery]);
  const close = () => { setQ(''); setPicked(null); onClose(); };
  const choose = (o) => { setPicked(o.value); setTimeout(() => { setQ(''); setPicked(null); onSelect(o); onClose(); }, 240); };
  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: C.scrim }} onPress={close}>
        {open ? (
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={{ position: 'absolute', left: 14, right: 14, top, maxHeight: Math.min(H - top - (searchable ? 280 : 40), 430), borderRadius: 24, backgroundColor: C.sheet, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
            <Pressable onPress={() => {}}>
              {title ? <Text style={{ color: C.ink3, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 4 }}>{title}</Text> : null}
              {searchable ? <TextInput value={q} onChangeText={setQ} placeholder={placeholder || 'Cerca'} placeholderTextColor={C.ink3} autoCorrect={false} autoFocus style={{ marginHorizontal: 10, marginVertical: 6, color: C.ink, backgroundColor: C.chip, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, fontSize: 16 }} /> : null}
            </Pressable>
            <FlatList
              data={list}
              keyExtractor={(o) => String(o.value)}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 6 }}
              renderItem={({ item: o }) => {
                const on = picked != null ? o.value === picked : o.value === value;
                if (banners && okHex(o.color)) {
                  const [c0, c1] = legible(o.color, okHex(o.color2) || o.color);
                  return (
                    <Pressable onPress={() => choose(o)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 62, marginBottom: 6, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: on ? c1 : 'transparent' }, pressed && { opacity: 0.7 }]}>
                      <LinearGradient pointerEvents="none" colors={[c0, mixHex(c0, c1, 0.38)]} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }} style={StyleSheet.absoluteFill} />
                      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: o.bare ? 'transparent' : 'rgba(255,255,255,.92)' }}>{o.icon || (o.face ? <Face uri={o.face} color={o.color} size={36} /> : null)}</View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 16.5, fontWeight: '700' }}>{o.label}</Text>
                        {o.sub ? <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.78)', fontSize: 12.5, marginTop: 1, letterSpacing: o.sub === o.sub.toUpperCase() ? 0.6 : 0 }}>{o.sub}</Text> : null}
                      </View>
                      {on ? <Ionicons name="checkmark" size={20} color="#fff" /> : null}
                    </Pressable>
                  );
                }
                return (
                  <Pressable onPress={() => choose(o)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: on ? C.thumb : 'transparent' }, pressed && { opacity: 0.6 }]}>
                    {o.icon || (o.face ? <Face uri={o.face} color={o.color} size={36} /> : null)}
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ color: on ? C.ink : C.ink2, fontSize: 15, fontWeight: on ? '800' : '600' }}>{o.label}</Text>
                      {o.sub ? <Text numberOfLines={1} style={{ color: C.ink3, fontSize: 10.5, marginTop: 1, letterSpacing: 0.6 }}>{o.sub}</Text> : null}
                    </View>
                    {on ? <Animated.View entering={ZoomIn.duration(220)}><Ionicons name="checkmark-circle" size={20} color={C.good} /></Animated.View> : null}
                  </Pressable>
                );
              }}
            />
          </Animated.View>
        ) : null}
      </Pressable>
    </Modal>
  );
}

// logo di una competizione (chiaro/scuro dal tema)
// loghi scuri (Premier, Ligue 1, Champions, Europa, Conference…): Night = bianchi, Light = scuri originali
const DARK_FM = /\/leaguelogo\/(?:dark\/)?(47|53|42|73|848|10216|132|114)\.png/;
export const logoSrc = (uri, dark) => {
  if (!uri) return { uri: null, tint: undefined };
  const m = DARK_FM.test(uri);
  const base = uri.replace('/leaguelogo/dark/', '/leaguelogo/');
  if (m) return { uri: base, tint: dark ? '#FFFFFF' : undefined };
  return { uri, tint: undefined };
};
export const isDarkLogo = (uri) => !!uri && DARK_FM.test(uri);
export const CompLogo = ({ uri, size = 24, C, style }) => {
  const r = logoSrc(uri, !!(C && C.dark));
  return r.uri ? <Image source={{ uri: r.uri }} style={[{ width: size, height: size }, style]} contentFit="contain" cachePolicy="memory-disk" tintColor={r.tint} /> : <View style={{ width: size, height: size }} />;
};
export const LeagueLogo = ({ league, size = 24, C }) => {
  if (!league) return null;
  const uri = C && C.dark && league.logoDark ? league.logoDark : league.logo;
  return <CompLogo uri={uri} size={size} C={C} />;
};

// tasto a tendina (competizione / stagione): stessa tendina inline dei filtri, sotto la pillola
export function DropBtn({ C, label, icon, options, value, onChange }) {
  const hasIcon = options.some((o) => o.icon);
  return (
    <View style={{ flexShrink: 1, minWidth: 0 }}>
      <Dropdown style={{ flexShrink: 1, minWidth: 0 }} C={C} options={options.map((o) => ({ ...o, key: o.value }))} value={value} onChange={onChange} side="left" width={250} minWidth={190} compact pillKey="label" icon={hasIcon ? (o) => o.icon || null : undefined} />
    </View>
  );
}
