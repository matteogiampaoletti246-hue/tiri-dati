// Entrata del banner del giocatore nel Calcolatore (concept B "La riga si trasforma", 12/11/2026, velocita' normale).
// La riga "Cerca e seleziona" cresce e diventa il banner: lo sfondo colorato si accende, la foto (gia' caricata) torna con un rimbalzo,
// i testi salgono uno dopo l'altro, il tasto Cambia fa "pop" e un alone passa sul bordo. Prima che la foto sia pronta resta la riga di ricerca:
// niente banner "gia' applicato" prima dell'animazione. Alla prima apertura della scheda (giocatore gia' scelto) nessuna animazione.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, cancelAnimation, Easing } from 'react-native-reanimated';

const PH = 62; // altezza della riga "Cerca e seleziona"
const GROW = Easing.bezier(0.3, 1.25, 0.5, 1);
const OUT = Easing.bezier(0.2, 0.8, 0.2, 1);

export default function BannerMorph({ C, color, k, ready, still, children }) {
  const init = still != null && k === still ? 1 : 0;
  const g = useSharedValue(init); // altezza
  const bg = useSharedValue(init);
  const ring = useSharedValue(init ? 1 : 0);
  const face = useSharedValue(init);
  const n1 = useSharedValue(init);
  const n2 = useSharedValue(init);
  const chg = useSharedValue(init);
  const nxt = useSharedValue(init);
  const [H, setH] = useState(0);
  const lastK = useRef(init ? k : null);
  const started = useRef(!!init);
  const tK = useRef(Date.now());
  const had = useRef(!!init);
  const all = [bg, ring, face, n1, n2, chg, nxt];
  // cambio giocatore: il banner vecchio sparisce subito (resta nascosto dietro alla finestra di ricerca che si chiude)
  useEffect(() => {
    if (lastK.current === k) return;
    lastK.current = k; started.current = false; tK.current = Date.now();
    all.forEach((v) => { cancelAnimation(v); v.value = 0; });
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  // l'animazione parte subito (150 ms dal tocco, mentre la finestra scende) se la foto e' gia' pronta, senza aspettare il ricalcolo
  useEffect(() => {
    if (!ready || started.current || lastK.current !== k) return undefined;
    const to = setTimeout(() => {
      started.current = true;
      if (!had.current) { cancelAnimation(g); g.value = 0; g.value = withTiming(1, { duration: 900, easing: GROW }); had.current = true; }
      bg.value = withDelay(200, withTiming(1, { duration: 800 }));
      ring.value = withDelay(400, withTiming(1, { duration: 1500 }));
      face.value = withDelay(400, withSpring(1, { damping: 11, stiffness: 150, mass: 0.9 }));
      n1.value = withDelay(650, withTiming(1, { duration: 650, easing: OUT }));
      n2.value = withDelay(780, withTiming(1, { duration: 650, easing: OUT }));
      chg.value = withDelay(950, withSpring(1, { damping: 10, stiffness: 200, mass: 0.8 }));
      nxt.value = withDelay(850, withTiming(1, { duration: 750, easing: OUT }));
    }, Math.max(0, 150 - (Date.now() - tK.current)));
    return () => clearTimeout(to);
  }, [ready, k]); // eslint-disable-line react-hooks/exhaustive-deps
  const box = useAnimatedStyle(() => ({ height: H ? PH + (H - PH) * g.value : init ? undefined : PH }), [H]);
  const ph = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - g.value * 3.4) }));
  const fx = {
    bg: useAnimatedStyle(() => ({ opacity: bg.value })),
    face: useAnimatedStyle(() => ({ opacity: Math.min(1, face.value * 3), transform: [{ translateY: (1 - face.value) * 26 }, { scale: 0.2 + 0.8 * face.value }] })),
    n1: useAnimatedStyle(() => ({ opacity: n1.value, transform: [{ translateY: (1 - n1.value) * 22 }] })),
    n2: useAnimatedStyle(() => ({ opacity: n2.value, transform: [{ translateY: (1 - n2.value) * 22 }] })),
    chg: useAnimatedStyle(() => ({ opacity: Math.min(1, chg.value * 2.5), transform: [{ scale: 0.4 + 0.6 * chg.value }] })),
    nxt: useAnimatedStyle(() => ({ opacity: nxt.value, transform: [{ translateY: (1 - nxt.value) * 26 }] })),
  };
  const glow = useAnimatedStyle(() => { const v = ring.value; return { opacity: v <= 0 || v >= 1 ? 0 : v < 0.4 ? v / 0.4 : v < 0.7 ? 1 : (1 - v) / 0.3 }; });
  return (
    <Animated.View style={[{ backgroundColor: C.sheet, overflow: 'hidden' }, box]}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: 0, height: PH, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 }, ph]}>
        <Text style={{ color: C.accent, fontSize: 15, fontWeight: '700' }}>Cerca e seleziona</Text>
        <Ionicons name="search" size={18} color={C.ink3} />
      </Animated.View>
      <View onLayout={(e) => { const h = Math.round(e.nativeEvent.layout.height); if (h && h !== H) setH(h); }} style={{ position: H || !init ? 'absolute' : 'relative', left: 0, right: 0, top: 0 }}>
        {children(fx)}
      </View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderWidth: 2, borderColor: color, borderRadius: 0 }, glow]} />
    </Animated.View>
  );
}
