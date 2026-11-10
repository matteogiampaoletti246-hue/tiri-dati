// Tendina inline (stessa dei filtri del sito): pillola con contorno che gira; sotto di lei si apre l'elenco con lo stesso contorno,
// voce scelta in azzurro con la spunta. Scorre solo la lista; si chiude toccando fuori. Mai schermata a parte.
// `side`: allineamento dell'elenco; `fill`: la pillola riempie il contenitore e l'elenco ha la sua larghezza.
import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { RingBox } from './ui';
import { Ionicons } from '@expo/vector-icons';

const ROW = 46;
export default function Dropdown({ C, options, value, onChange, side = 'right', icon, width = 222, minWidth, labelKey = 'label', pillKey = 'short', compact, fill, placeholder }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const [picked, setPicked] = useState(null);
  const { width: W, height: H } = useWindowDimensions();
  const kOf = (o) => (o.key !== undefined ? o.key : o.value);
  const cur = options.find((o) => kOf(o) === value) || (placeholder === undefined ? options[0] : null);
  const open = () => ref.current && ref.current.measureInWindow((x, y, w, h) => setPos({ x, y, w, h }));
  const close = () => { setPos(null); setPicked(null); };
  const choose = (o) => { if (cur && kOf(o) === kOf(cur)) { close(); return; } setPicked(kOf(o)); setTimeout(() => { close(); onChange(kOf(o)); }, 200); };
  const wid = fill && pos ? Math.max(pos.w, minWidth || 0) : Math.max(width, minWidth || 0);
  let left = 12;
  let top = 0;
  let maxH = 320;
  if (pos) {
    left = fill ? pos.x : side === 'left' ? pos.x : pos.x + pos.w - wid;
    left = Math.max(12, Math.min(W - wid - 12, left));
    top = pos.y + pos.h + 6;
    maxH = Math.max(160, H - top - 24);
  }
  const listH = Math.min(maxH, options.length * ROW + 14);
  const label = cur ? cur[pillKey] || cur[labelKey] : placeholder;
  return (
    <View style={fill ? { alignSelf: 'stretch' } : null}>
      <Pressable ref={ref} onPress={open} style={({ pressed }) => pressed && { opacity: 0.75 }}>
        <RingBox C={C} radius={fill ? 20 : 999} style={{ height: 41 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: compact || fill ? 14 : 10, paddingRight: 12 }}>
            {icon && cur ? icon(cur, C.ink) : null}
            <Text numberOfLines={1} style={{ flex: fill ? 1 : undefined, flexShrink: 1, color: cur ? C.ink : C.ink3, fontSize: fill ? 15 : 13.5, fontWeight: fill ? '600' : '800' }}>{label || '—'}</Text>
            <Ionicons name={pos ? 'chevron-up' : 'chevron-down'} size={14} color={C.ink2} />
          </View>
        </RingBox>
      </Pressable>
      <Modal visible={!!pos} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: C.scrim }} onPress={close}>
          {pos ? (
            <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)} style={{ position: 'absolute', left, top, width: wid, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
              <RingBox C={C} radius={24} plain style={{ height: listH }} innerStyle={{ backgroundColor: C.sheet }}>
                <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ padding: 6 }}>
                  {options.map((o) => {
                    const on = picked != null ? kOf(o) === picked : !!cur && kOf(o) === kOf(cur);
                    return (
                      <Pressable key={String(kOf(o))} onPress={() => choose(o)} style={({ pressed }) => [{ height: ROW, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, borderRadius: 16 }, pressed && { opacity: 0.6 }]}>
                        {icon ? <View style={{ width: 24, alignItems: 'center' }}>{icon(o, on ? C.accent : C.ink)}</View> : null}
                        <Text numberOfLines={1} style={{ flex: 1, color: on ? C.accent : C.ink, fontSize: 15.5, fontWeight: on ? '800' : '500' }}>{o[labelKey]}</Text>
                        {on ? <Ionicons name="checkmark" size={20} color={C.accent} /> : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </RingBox>
            </Animated.View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}
