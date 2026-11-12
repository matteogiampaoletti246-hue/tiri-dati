// Tendina inline (stessa dei filtri del sito): pillola con contorno che gira; sotto di lei si apre l'elenco con lo stesso contorno,
// voce scelta in azzurro con la spunta. Scorre solo la lista; si chiude toccando fuori. Mai schermata a parte.
// `side`: allineamento dell'elenco; `fill`: la pillola riempie il contenitore e l'elenco ha la sua larghezza.
import React, { startTransition, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, Easing, cancelAnimation } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { RingBox, mixHex, legible } from './ui';
import { Ionicons } from '@expo/vector-icons';
import { useFx, PickLabel, useRipple } from './fx';

const ROW = 46;
const RROW = 66;
const okHex = (c) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : null);

// Evidenziatore della voce scelta (prova animazioni): A scivola dalla voce attuale alla nuova, B salta veloce, C compare con un "pop"
function SlideHl({ C, variant, rowH, step, from, to, rich }) {
  const y = useSharedValue(6 + from * step);
  const sc = useSharedValue(1);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    cancelAnimation(y);
    if (variant === 'A') y.value = withTiming(6 + to * step, { duration: 300, easing: Easing.bezier(0.34, 1.35, 0.64, 1) });
    else if (variant === 'B') y.value = withTiming(6 + to * step, { duration: 150, easing: Easing.out(Easing.quad) });
    else { y.value = 6 + to * step; sc.value = 0.92; sc.value = withSequence(withTiming(1.04, { duration: 120 }), withSpring(1, { damping: 8, stiffness: 240 })); }
  }, [to]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { scale: sc.value }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 6, right: 6, top: 0, height: rowH, borderRadius: 16, borderWidth: 1.5, borderColor: C.accent, backgroundColor: rich ? 'transparent' : C.accTint }, st]} />;
}
export default function Dropdown({ C, options, value, onChange, side = 'right', icon, width = 222, minWidth, labelKey = 'label', pillKey = 'short', compact, fill, placeholder, style, slim }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const [picked, setPicked] = useState(null);
  const { pick: fxv } = useFx();
  const ripple = useRipple(C.accent);
  const glow = useSharedValue(0);
  const glowSt = useAnimatedStyle(() => ({ opacity: 0.9 * (1 - glow.value) * (glow.value > 0 ? 1 : 0), transform: [{ scale: 1 + glow.value * 0.14 }] }));
  const { width: W, height: H } = useWindowDimensions();
  const kOf = (o) => (o.key !== undefined ? o.key : o.value);
  const cur = options.find((o) => kOf(o) === value) || (placeholder === undefined ? options[0] : null);
  const open = () => ref.current && ref.current.measureInWindow((x, y, w, h) => setPos({ x, y, w, h }));
  const close = () => { setPos(null); setPicked(null); };
  const choose = (o, i, ev) => {
    if (cur && kOf(o) === kOf(cur)) { close(); return; }
    setPicked(kOf(o));
    if (fxv === 'C' && ev && ev.nativeEvent) ripple.fire(6 + (ev.nativeEvent.locationX || 0), 6 + i * stepY + (ev.nativeEvent.locationY || 0));
    const wait = fxv === 'A' ? 340 : fxv === 'C' ? 400 : 240;
    setTimeout(() => {
      close();
      setTimeout(() => {
        startTransition(() => onChange(kOf(o)));
        if (fxv === 'C') { cancelAnimation(glow); glow.value = 0; glow.value = withTiming(1, { duration: 620, easing: Easing.out(Easing.quad) }); }
      }, 60);
    }, wait);
  };
  const rich = options.some((o) => okHex(o.color));
  const rowH = rich ? RROW : ROW;
  const stepY = rich ? RROW + 6 : ROW;
  const curIdx = Math.max(0, options.findIndex((o) => cur && kOf(o) === kOf(cur)));
  const pickIdx = picked != null ? Math.max(0, options.findIndex((o) => kOf(o) === picked)) : curIdx;
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
  const label = cur ? cur[pillKey] || cur[labelKey] : placeholder;
  return (
    <View style={style}>
      <Pressable ref={ref} onPress={open} style={({ pressed }) => pressed && { opacity: 0.75 }}>
        <RingBox C={C} radius={fill ? 20 : 999} style={{ height: 41 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: slim ? 5 : 8, paddingLeft: slim ? 10 : compact || fill ? 14 : 10, paddingRight: slim ? 9 : 12 }}>
            {icon && cur ? icon(cur, C.ink) : null}
            <PickLabel variant={fxv} label={label || '—'} style={{ color: cur ? C.ink : C.ink3, fontSize: fill ? 15 : slim ? 12.5 : 13.5, fontWeight: fill ? '600' : '800' }} />
            <Ionicons name={pos ? 'chevron-up' : 'chevron-down'} size={14} color={C.ink2} />
          </View>
        </RingBox>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: fill ? 20 : 999, borderWidth: 2, borderColor: C.accent }, glowSt]} />
      </Pressable>
      <Modal visible={!!pos} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: C.scrim }} onPress={close}>
          {pos ? (
            <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)} style={{ position: 'absolute', left, top, width: wid, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
              <RingBox C={C} radius={24} plain style={{ height: listH }} innerStyle={{ backgroundColor: C.sheet }}>
                <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ padding: 6 }}>
                  {options.map((o, i) => {
                    // concept A "Cascata": le voci scendono una dopo l'altra (dal basso se la tendina si apre verso l'alto)
                    const cas = (node) => <Animated.View key={String(kOf(o))} entering={(up ? FadeInDown : FadeInUp).delay(40 + Math.min(i, 9) * 32).duration(240)}>{node}</Animated.View>;
                    const on = picked != null ? kOf(o) === picked : !!cur && kOf(o) === kOf(cur);
                    if (rich && okHex(o.color)) {
                      const [c0, c1] = legible(o.color, okHex(o.color2) || o.color);
                      return cas(
                        <Pressable onPress={(e) => choose(o, i, e)} style={({ pressed }) => [{ height: RROW, marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: on ? c1 : 'transparent' }, pressed && { opacity: 0.7 }]}>
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
                      <Pressable onPress={(e) => choose(o, i, e)} style={({ pressed }) => [{ height: ROW, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, borderRadius: 16 }, pressed && { opacity: 0.6 }]}>
                        {icon ? <View style={{ width: 24, alignItems: 'center' }}>{icon(o, on ? C.accent : C.ink)}</View> : null}
                        <Text numberOfLines={1} style={{ flex: 1, color: on ? C.accent : C.ink, fontSize: 15.5, fontWeight: on ? '800' : '500' }}>{o[labelKey]}</Text>
                        {on ? <Ionicons name="checkmark" size={20} color={C.accent} /> : null}
                      </Pressable>
                    );
                  })}
                  <SlideHl C={C} rich={rich} variant={fxv} rowH={rowH} step={stepY} from={curIdx} to={pickIdx} />
                  {fxv === 'C' ? ripple.node : null}
                </ScrollView>
              </RingBox>
            </Animated.View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}
