// Tendina a pillola (stessa dei filtri del sito): pillola in vetro che apre un elenco sotto di se', voce scelta con la spunta.
// Scorre solo la lista; si chiude toccando fuori. `side`: allineamento dell'elenco rispetto alla pillola.
import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { RingBox } from './ui';
import { Ionicons } from '@expo/vector-icons';

export default function Dropdown({ C, options, value, onChange, side = 'right', icon, width = 222, minWidth, labelKey = 'label', pillKey = 'short', compact }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const [picked, setPicked] = useState(null);
  const { width: W, height: H } = useWindowDimensions();
  const cur = options.find((o) => o.key === value) || options[0];
  const open = () => ref.current && ref.current.measureInWindow((x, y, w, h) => setPos({ x, y, w, h }));
  const close = () => { setPos(null); setPicked(null); };
  const choose = (o) => { if (o.key === cur.key) { close(); return; } setPicked(o.key); setTimeout(() => { close(); onChange(o.key); }, 240); };
  const wid = Math.max(width, minWidth || 0);
  let left = 12;
  let top = 0;
  let maxH = 320;
  if (pos) {
    left = side === 'left' ? pos.x : pos.x + pos.w - wid;
    left = Math.max(12, Math.min(W - wid - 12, left));
    top = pos.y + pos.h + 8;
    maxH = Math.max(160, H - top - 24);
  }
  return (
    <View>
      <Pressable ref={ref} onPress={open} style={({ pressed }) => pressed && { opacity: 0.75 }}>
        <RingBox C={C} style={{ height: 41 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: compact ? 14 : 10, paddingRight: 10 }}>
            {icon ? icon(cur, C.ink) : null}
            <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13.5, fontWeight: '800' }}>{cur[pillKey] || cur[labelKey]}</Text>
            <Ionicons name={pos ? 'chevron-up' : 'chevron-down'} size={14} color={C.ink2} />
          </View>
        </RingBox>
      </Pressable>
      <Modal visible={!!pos} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: C.scrim }} onPress={close}>
          {pos ? (
            <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={{ position: 'absolute', left, top, width: wid, maxHeight: maxH, borderRadius: 22, backgroundColor: C.sheet, borderWidth: 1, borderColor: C.border, padding: 6, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {options.map((o) => {
                  const on = picked != null ? o.key === picked : o.key === cur.key;
                  return (
                    <Pressable key={o.key} onPress={() => choose(o)} style={({ pressed }) => [{ height: 46, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, borderRadius: 16, backgroundColor: on ? C.thumb : 'transparent' }, pressed && { opacity: 0.6 }]}>
                      {icon ? <View style={{ width: 22, alignItems: 'center' }}>{icon(o, on ? C.accent : C.ink3)}</View> : null}
                      <Text style={{ flex: 1, color: on ? C.ink : C.ink2, fontSize: 14, fontWeight: on ? '800' : '600' }}>{o[labelKey]}</Text>
                      {on ? <Animated.View entering={ZoomIn.duration(220)}><Ionicons name="checkmark-circle" size={19} color={C.good} /></Animated.View> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}
