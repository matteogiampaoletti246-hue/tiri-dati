// Tendina inline (stessa dei filtri del sito): pillola con contorno che gira; sotto di lei si apre l'elenco con lo stesso contorno,
// voce scelta in azzurro con la spunta. Scorre solo la lista; si chiude toccando fuori. Mai schermata a parte.
// `side`: allineamento dell'elenco; `fill`: la pillola riempie il contenitore e l'elenco ha la sua larghezza.
import React, { startTransition, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, withDelay, Easing, cancelAnimation } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { RingBox, mixHex, legible } from './ui';
import { Ionicons } from '@expo/vector-icons';

// Scelta di una voce (concept B "Cambio carta", 12/11/2026): la voce lampeggia, la tendina si ripiega verso l'alto, il tasto si gira come una carta e mostra la nuova voce
const INOUT = Easing.bezier(0.65, 0, 0.25, 1);
const ROW = 46;
const RROW = 66;
const okHex = (c) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : null);
export default function Dropdown({ C, options, value, onChange, side = 'right', icon, width = 222, minWidth, labelKey = 'label', pillKey = 'short', compact, fill, placeholder, style, slim }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const [picked, setPicked] = useState(null);
  const [ov, setOv] = useState(null); // voce scelta mostrata nel tasto mentre il valore vero si aggiorna
  const busy = useRef(false);
  const fl = useSharedValue(0); // cornice sulla voce scelta
  const cl = useSharedValue(0); // tendina che si ripiega
  const sc = useSharedValue(1); // velo scuro
  const flip = useSharedValue(0); // rotazione del tasto
  const flash = useSharedValue(0);
  const glow = useSharedValue(0);
  const { width: W, height: H } = useWindowDimensions();
  const kOf = (o) => (o.key !== undefined ? o.key : o.value);
  const cur0 = options.find((o) => kOf(o) === value) || (placeholder === undefined ? options[0] : null);
  const cur = cur0;
  const disp = ov || cur0;
  React.useEffect(() => { if (ov && cur0 && kOf(cur0) === kOf(ov)) setOv(null); }, [cur0, ov]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = () => { if (busy.current) return; fl.value = 0; cl.value = 0; sc.value = 1; ref.current && ref.current.measureInWindow((x, y, w, h) => setPos({ x, y, w, h })); };
  const close = () => { setPos(null); setPicked(null); };
  const choose = (o) => {
    if (cur && kOf(o) === kOf(cur)) { close(); return; }
    if (busy.current) return;
    busy.current = true;
    setPicked(kOf(o));
    fl.value = withTiming(1, { duration: 175 });
    // 450 ms: la tendina si ripiega e il velo si schiarisce
    setTimeout(() => { cl.value = withTiming(1, { duration: 275, easing: INOUT }); sc.value = withTiming(0, { duration: 175 }); }, 225);
    // 750 ms: il tasto si gira (a 90 gradi cambia la voce, poi torna con una molla)
    setTimeout(() => { flip.value = withSequence(withTiming(90, { duration: 175, easing: Easing.in(Easing.quad) }), withTiming(-90, { duration: 0 }), withSpring(0, { damping: 17, stiffness: 560, mass: 0.9 })); }, 375);
    setTimeout(() => { close(); }, 510);
    setTimeout(() => {
      setOv(o);
      startTransition(() => onChange(kOf(o)));
      cancelAnimation(flash); cancelAnimation(glow);
      flash.value = 0.45; flash.value = withTiming(0, { duration: 400 });
      glow.value = 0; glow.value = withDelay(50, withTiming(1, { duration: 500 }));
    }, 550);
    setTimeout(() => { busy.current = false; }, 850);
  };
  const rich = options.some((o) => okHex(o.color));
  const wid = fill && pos ? Math.max(pos.w, minWidth || 0, rich ? 270 : 200) : Math.max(width, minWidth || 0);
  let left = 12;
  let top = 0;
  let maxH = 320;
  let up = false;
  const want = options.length * (rich ? RROW + 6 : ROW) + 14;
  let listH = Math.min(320, want);
  if (pos) {
    left = fill ? pos.x + pos.w - wid : side === 'left' ? pos.x : pos.x + pos.w - wid;
    left = Math.max(12, Math.min(W - wid - 12, left));
    top = pos.y + pos.h + 6;
    const below = H - top - 24; // spazio sotto la pillola
    const above = pos.y - 6 - 54; // spazio sopra (sotto la barra di stato)
    // non entra sotto: si apre verso l'alto se li' c'e' piu' posto, cosi' l'elenco non si taglia mai
    if (want > below && above > below) { up = true; maxH = Math.max(160, above); } else maxH = Math.max(160, below);
    listH = Math.min(maxH, want);
    if (up) top = pos.y - 6 - listH;
  }
  const label = disp ? disp[pillKey] || disp[labelKey] : placeholder;
  const flipSt = useAnimatedStyle(() => ({ transform: [{ perspective: 700 }, { rotateX: `${flip.value}deg` }] }));
  const flashSt = useAnimatedStyle(() => ({ opacity: flash.value }));
  const glowSt = useAnimatedStyle(() => ({ opacity: glow.value < 0.3 ? (glow.value / 0.3) * (glow.value > 0 ? 1 : 0) : (1 - glow.value) / 0.7 }));
  const frameSt = useAnimatedStyle(() => ({ opacity: fl.value }));
  const scrimSt = useAnimatedStyle(() => ({ opacity: sc.value }));
  const listSt = useAnimatedStyle(() => { const s = 1 - 0.8 * cl.value; const sh = (listH * (1 - s)) / 2 + 10 * cl.value; return { opacity: 1 - cl.value, transform: [{ translateY: up ? sh : -sh }, { scaleY: s }] }; });
  return (
    <View style={style}>
      <Pressable ref={ref} onPress={open} style={({ pressed }) => pressed && { opacity: 0.75 }}>
        <Animated.View style={flipSt}>
        <RingBox C={C} radius={fill ? 20 : 999} style={{ height: 41 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: slim ? 5 : 8, paddingLeft: slim ? 10 : compact || fill ? 14 : 10, paddingRight: slim ? 9 : 12 }}>
            {icon && disp ? icon(disp, C.ink) : null}
            <Text numberOfLines={1} style={{ flexShrink: slim ? 0 : 1, color: disp ? C.ink : C.ink3, fontSize: fill ? 15 : slim ? 12.5 : 13.5, fontWeight: fill ? '600' : '800' }}>{label || '—'}</Text>
            <Ionicons name={pos ? 'chevron-up' : 'chevron-down'} size={14} color={C.ink2} />
          </View>
        </RingBox>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: fill ? 20 : 999, backgroundColor: C.accent }, flashSt]} />
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: -2, right: -2, top: -2, bottom: -2, borderRadius: fill ? 22 : 999, borderWidth: 2, borderColor: C.accent }, glowSt]} />
        </Animated.View>
      </Pressable>
      <Modal visible={!!pos} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
        <Pressable style={{ flex: 1 }} onPress={close}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: C.scrim }, scrimSt]} />
          {pos ? (
            <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)} style={{ position: 'absolute', left, top, width: wid, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
              <Animated.View style={listSt}>
              <RingBox C={C} radius={24} plain style={{ height: listH }} innerStyle={{ backgroundColor: C.sheet }}>
                <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ padding: 6 }}>
                  {options.map((o, i) => {
                    // concept A "Cascata": le voci scendono una dopo l'altra (dal basso se la tendina si apre verso l'alto)
                    const cas = (node) => <Animated.View key={String(kOf(o))} entering={(up ? FadeInDown : FadeInUp).delay(40 + Math.min(i, 9) * 32).duration(240)}>{node}</Animated.View>;
                    const on = picked != null ? kOf(o) === picked : !!cur && kOf(o) === kOf(cur);
                    if (rich && okHex(o.color)) {
                      const [c0, c1] = legible(o.color, okHex(o.color2) || o.color);
                      return cas(
                        <Pressable onPress={() => choose(o)} style={({ pressed }) => [{ height: RROW, marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: on ? c1 : 'transparent' }, pressed && { opacity: 0.7 }]}>
                          <LinearGradient pointerEvents="none" colors={[c0, mixHex(c0, c1, 0.38)]} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }} style={StyleSheet.absoluteFill} />
                          <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: o.bare ? 'transparent' : 'rgba(255,255,255,.92)' }}>{o.logoNode || null}</View>
                          <View style={{ flex: 1 }}>
                            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{o[labelKey]}</Text>
                            {o.sub ? <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, marginTop: 1 }}>{o.sub}</Text> : null}
                          </View>
                          {on ? <Ionicons name="checkmark" size={21} color="#fff" /> : null}
                        </Pressable>
                      );
                    }
                    return cas(
                      <Pressable onPress={() => choose(o)} style={({ pressed }) => [{ height: ROW, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, borderRadius: 16 }, pressed && { opacity: 0.6 }]}>
                        {icon ? <View style={{ width: 24, alignItems: 'center' }}>{icon(o, on ? C.accent : C.ink)}</View> : null}
                        <Text numberOfLines={1} style={{ flex: 1, color: on ? C.accent : C.ink, fontSize: 15.5, fontWeight: on ? '800' : '500' }}>{o[labelKey]}</Text>
                        {on ? <Ionicons name="checkmark" size={20} color={C.accent} /> : null}
                      </Pressable>
                    );
                  })}
                  {picked != null ? <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 6, right: 6, top: 6 + Math.max(0, options.findIndex((o) => kOf(o) === picked)) * (rich ? RROW + 6 : ROW), height: rich ? RROW : ROW, borderRadius: 16, borderWidth: 1.5, borderColor: C.accent, backgroundColor: rich ? 'transparent' : C.accTint }, frameSt]} /> : null}
                </ScrollView>
              </RingBox>
              </Animated.View>
            </Animated.View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}
