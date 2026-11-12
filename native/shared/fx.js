// Prova animazioni (12/11/2026): tre concept A/B/C per il banner del giocatore e per le scelte nelle tendine / tasti.
// La scelta si cambia dal selettore in cima al Calcolatore e resta salvata. Quando l'utente sceglie, si tolgono le altre due.
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, withSequence, Easing, cancelAnimation } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sl-fx';
let S = { banner: 'A', pick: 'A' };
const subs = new Set();
const sub = (f) => { subs.add(f); return () => subs.delete(f); };
export const getFx = () => S;
export const setFx = (k, v) => { S = { ...S, [k]: v }; subs.forEach((f) => f()); AsyncStorage.setItem(KEY, JSON.stringify(S)).catch(() => {}); };
AsyncStorage.getItem(KEY).then((v) => {
  try { const o = JSON.parse(v); if (o && /^[ABC]$/.test(o.banner) && /^[ABC]$/.test(o.pick)) { S = { banner: o.banner, pick: o.pick }; subs.forEach((f) => f()); } } catch (e) { /* resta A */ }
}).catch(() => {});
export const useFx = () => useSyncExternalStore(sub, getFx, getFx);

const OUT = Easing.bezier(0.2, 0.8, 0.2, 1);

// Selettore provvisorio in cima al Calcolatore: due righe di tre lettere
export function FxSwitch({ C }) {
  const fx = useFx();
  const row = (k, label) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ color: C.ink2, fontSize: 12.5, fontWeight: '600', width: 118 }}>{label}</Text>
      {['A', 'B', 'C'].map((l) => {
        const on = fx[k] === l;
        return (
          <Pressable key={l} onPress={() => setFx(k, l)} style={{ width: 40, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.accent : C.chip, borderWidth: 1, borderColor: on ? C.accRing : C.lgBorder }}>
            <Text style={{ color: on ? '#fff' : C.ink2, fontSize: 13, fontWeight: '700' }}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
  return (
    <View style={{ marginBottom: 14, padding: 12, borderRadius: 16, backgroundColor: C.chip, borderWidth: 1, borderColor: C.lgBorder, gap: 8 }}>
      <Text style={{ color: C.ink3, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 }}>PROVA ANIMAZIONI</Text>
      {row('banner', 'Banner giocatore')}
      {row('pick', 'Tendine e tasti')}
    </View>
  );
}

// Entrata del banner del giocatore. `ready` = la foto e' gia' caricata: fino ad allora il banner resta invisibile al suo posto,
// poi entra con la foto gia' visibile. Cambiando `k` (altro giocatore) l'animazione riparte.
//  A: scende dalla ricerca (dall'alto) con dissolvenza; B: sale dal basso con molla e la foto fa "pop"; C: si apre da sinistra a destra con la foto che scivola.
export function BannerIn({ variant, k, ready, still, children }) {
  const p = useSharedValue(0); // 0 = nascosto, 1 = al suo posto
  const ph = useSharedValue(0); // foto
  const [w, setW] = useState(0);
  const seen = useRef(null);
  useEffect(() => {
    if (seen.current === null && still != null && k === still) { seen.current = k; p.value = 1; ph.value = 1; return; }
    if (!ready || seen.current === k) return;
    seen.current = k;
    cancelAnimation(p); cancelAnimation(ph);
    p.value = 0; ph.value = 0;
    if (variant === 'B') {
      p.value = withSpring(1, { damping: 13, stiffness: 170, mass: 0.8 });
      ph.value = withDelay(120, withSpring(1, { damping: 9, stiffness: 190, mass: 0.7 }));
    } else if (variant === 'C') {
      p.value = withTiming(1, { duration: 620, easing: Easing.bezier(0.65, 0, 0.2, 1) });
      ph.value = withTiming(1, { duration: 620, easing: Easing.bezier(0.65, 0, 0.2, 1) });
    } else {
      p.value = withTiming(1, { duration: 520, easing: OUT });
      ph.value = 1;
    }
  }, [ready, k, variant, p, ph]);
  const box = useAnimatedStyle(() => {
    const v = p.value;
    if (variant === 'B') return { opacity: Math.min(1, v * 2.2), transform: [{ translateY: (1 - v) * 40 }, { scale: 0.86 + 0.14 * v }] };
    if (variant === 'C') return { opacity: v > 0.01 ? 1 : 0, width: w ? w * v : 0 };
    return { opacity: Math.min(1, v * 1.6), transform: [{ translateY: (1 - v) * -34 }, { scaleY: 0.55 + 0.45 * v }] };
  }, [variant, w]);
  const photo = useAnimatedStyle(() => {
    const v = ph.value;
    if (variant === 'B') return { transform: [{ scale: 0.5 + 0.5 * v }] };
    if (variant === 'C') return { transform: [{ translateX: (1 - v) * -26 }] };
    return {};
  }, [variant]);
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {variant === 'C' ? (
        <Animated.View style={[{ overflow: 'hidden' }, box]}><View style={{ width: w || undefined }}>{children(photo)}</View></Animated.View>
      ) : (
        <Animated.View style={[{ opacity: 0 }, box]}>{children(photo)}</Animated.View>
      )}
    </View>
  );
}

// Etichetta della tendina (nel tasto) che cambia quando si sceglie una voce.
//  A: dissolvenza con piccolo scorrimento; B: la vecchia sale e la nuova entra dal basso; C: pop con molla e numeri che contano fino al nuovo valore.
export function PickLabel({ variant, label, style, nodeLeft }) {
  const [shown, setShown] = useState(label);
  const [prev, setPrev] = useState(null);
  const t = useSharedValue(1);
  const first = useRef(true);
  const id = useRef(null);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    if (label === shown) return undefined;
    const old = shown;
    const num = (s) => { const n = parseFloat(String(s).replace(',', '.')); return Number.isFinite(n) && /^[0-9.,\s]+$/.test(String(s)) ? n : null; };
    cancelAnimation(t);
    if (variant === 'C') {
      const a = num(old); const b = num(label);
      setPrev(null);
      if (a != null && b != null) {
        const t0 = Date.now(); const dec = /[.,]/.test(String(label)) ? 1 : 0;
        const tick = () => { const p = Math.min(1, (Date.now() - t0) / 420); const e = 1 - Math.pow(1 - p, 3); setShown(p >= 1 ? label : (a + (b - a) * e).toFixed(dec).replace('.', ',')); if (p < 1) id.current = requestAnimationFrame(tick); };
        id.current = requestAnimationFrame(tick);
      } else setShown(label);
      t.value = 0.86; t.value = withSpring(1, { damping: 7, stiffness: 220, mass: 0.6 });
      return undefined;
    }
    setPrev(old); setShown(label);
    t.value = 0;
    t.value = withTiming(1, { duration: variant === 'B' ? 320 : 240, easing: OUT });
    const to = setTimeout(() => setPrev(null), variant === 'B' ? 340 : 260);
    return () => clearTimeout(to);
  }, [label]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (id.current) cancelAnimationFrame(id.current); }, []);
  const H = 22;
  const cur = useAnimatedStyle(() => {
    const v = t.value;
    if (variant === 'B') return { opacity: v, transform: [{ translateY: (1 - v) * H }] };
    if (variant === 'C') return { transform: [{ scale: v }] };
    return { opacity: v, transform: [{ translateX: (1 - v) * 10 }] };
  }, [variant]);
  const old = useAnimatedStyle(() => {
    const v = t.value;
    if (variant === 'B') return { opacity: 1 - v, transform: [{ translateY: -v * H }] };
    return { opacity: 1 - v };
  }, [variant]);
  return (
    <View style={{ flexShrink: 1, minWidth: 0, overflow: variant === 'B' ? 'hidden' : 'visible', height: variant === 'B' ? H : undefined, justifyContent: 'center' }}>
      <Animated.Text numberOfLines={1} style={[style, cur]}>{shown}</Animated.Text>
      {prev != null && variant !== 'C' ? <Animated.Text numberOfLines={1} style={[style, { position: 'absolute', left: 0, right: 0 }, old]}>{prev}</Animated.Text> : null}
    </View>
  );
}

// Onda dal punto toccato + rimbalzo: per le voci/tasti scelti (concept C). `ripple.fire(x, y)`.
export function useRipple(color) {
  const s = useSharedValue(0);
  const [pt, setPt] = useState({ x: 0, y: 0 });
  const fire = (x, y) => { setPt({ x, y }); cancelAnimation(s); s.value = 0; s.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.quad) }); };
  const st = useAnimatedStyle(() => ({ opacity: 0.34 * (1 - s.value), transform: [{ scale: 0.05 + s.value * 5 }] }));
  const node = <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: pt.x - 30, top: pt.y - 30, width: 60, height: 60, borderRadius: 30, backgroundColor: color }, st]} />;
  return { fire, node };
}

// Rimbalzo breve di un elemento (scala 1 -> 1.1 -> 1)
export function useBounce(amount = 1.1) {
  const b = useSharedValue(1);
  const go = () => { cancelAnimation(b); b.value = withSequence(withTiming(amount, { duration: 110 }), withSpring(1, { damping: 6, stiffness: 260 })); };
  const st = useAnimatedStyle(() => ({ transform: [{ scale: b.value }] }));
  return { go, st };
}
