// Scelta a pagina intera (campionato, squadra): barra di ricerca in alto e un banner colorato grande per ogni voce, come il sito.
import React, { memo, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mixHex } from './ui';

const okHex = (c) => (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : null);
const nrm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const Row = memo(({ C, o, on, onPress }) => {
  const c0 = okHex(o.color) || '#1F2A44'; const c1 = okHex(o.color2) || c0;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ marginHorizontal: 16, marginBottom: 8, minHeight: 64, borderRadius: 20, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: on ? c1 : 'transparent' }, pressed && { opacity: 0.7 }]}>
      <LinearGradient pointerEvents="none" colors={[c0, mixHex(c0, c1, 0.38)]} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }} style={StyleSheet.absoluteFill} />
      <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.93)' }}>{o.icon}</View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{o.label}</Text>
        {o.sub ? <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.8)', fontSize: 11.5, marginTop: 2, letterSpacing: 0.6 }}>{o.sub}</Text> : null}
      </View>
      {on ? <Ionicons name="checkmark" size={20} color="#fff" /> : null}
    </Pressable>
  );
});

export default function FullPicker({ C, open, title, options, value, onSelect, onClose, searchable = true, placeholder = 'Cerca' }) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const list = useMemo(() => { const n = nrm(q.trim()); return n ? options.filter((o) => nrm(o.label).includes(n) || nrm(o.sub || '').includes(n)) : options; }, [options, q]);
  // la scelta si applica a finestra chiusa (altrimenti il ricalcolo blocca l'animazione di chiusura e l'app resta ferma qualche secondo)
  const later = useRef(null);
  const run = () => { const f = later.current; later.current = null; if (f) f(); };
  const pick = (v) => { setQ(''); later.current = () => onSelect(v); onClose(); setTimeout(run, 420); };
  const close = () => { setQ(''); onClose(); };
  return (
    <Modal visible={open} animationType="slide" onRequestClose={close} onDismiss={run} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, height: 44 }}>
          <Ionicons name="search" size={18} color={C.ink3} />
          <TextInput value={q} onChangeText={setQ} placeholder={placeholder} placeholderTextColor={C.ink3} autoCorrect={false} autoCapitalize="none" keyboardAppearance={C.dark ? 'dark' : 'light'} selectionColor={C.accent} style={{ flex: 1, color: C.ink, fontSize: 17 }} />
          <Pressable onPress={close} hitSlop={12}><Ionicons name="close" size={22} color={C.ink2} /></Pressable>
        </View>
        {title ? <Text style={{ color: C.ink3, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, paddingHorizontal: 20, marginTop: 10, marginBottom: 10 }}>{String(title).toUpperCase()}</Text> : null}
        <FlatList data={list} keyExtractor={(o) => String(o.value)} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
          initialNumToRender={10} windowSize={7} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
          renderItem={({ item }) => <Row C={C} o={item} on={item.value === value} onPress={() => pick(item)} />} />
      </View>
    </Modal>
  );
}
