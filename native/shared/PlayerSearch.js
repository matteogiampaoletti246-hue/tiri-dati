// Ricerca giocatore a pagina intera (Calcolatore): stessa pagina della ricerca del sito, un banner colorato grande per ogni giocatore.
import React, { memo, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchN } from './searchN';
import { RingBox } from './ui';

import { FlagN } from './FlagN';
const SITE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/';
const okHex = (c) => (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : null);

const Hl = ({ C, text, hl, style }) => {
  if (!hl || !Array.isArray(hl)) return <Text numberOfLines={1} style={style}>{text}</Text>;
  return <Text numberOfLines={1} style={style}>{text.slice(0, hl[0])}<Text style={{ color: C.accent }}>{text.slice(hl[0], hl[1])}</Text>{text.slice(hl[1])}</Text>;
};

const Row = memo(({ C, p, onPress }) => {
  const c0 = okHex(p.color) || C.accent;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ marginHorizontal: 16, marginBottom: 10 }, pressed && { opacity: 0.7 }]}>
      <View style={{ borderRadius: 22, borderWidth: 1.5, borderColor: c0 + 'F2', overflow: 'hidden', backgroundColor: C.sheet }}>
        <View style={{ overflow: 'hidden', backgroundColor: C.sheet }}>
          <LinearGradient pointerEvents="none" colors={[c0 + '57', c0 + '22', c0 + '0F']} locations={[0, 0.6, 1]} start={{ x: 0, y: 0.3 }} end={{ x: 1, y: 0.7 }} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: c0, overflow: 'hidden', backgroundColor: c0 + '55' }}>
              {p.photo ? <Image source={{ uri: p.photo }} style={{ width: 48, height: 48 }} contentFit="cover" cachePolicy="memory-disk" /> : null}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Hl C={C} text={p.name} hl={p.hl} style={{ color: C.ink, fontSize: 16, fontWeight: '600' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                {p.crest ? <Image source={{ uri: p.crest }} style={{ width: 16, height: 16 }} contentFit="contain" cachePolicy="memory-disk" /> : null}
                <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 12.5, flexShrink: 1 }}>{p.team}</Text>
                {p.nat ? <View style={{ width: 1, height: 14, backgroundColor: C.ink3, opacity: 0.6 }} /> : null}
                {p.nat && p.nat.fc ? <FlagN code={p.nat.fc} size={16} C={C} /> : null}
                {p.nat ? <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 12.5, flexShrink: 1 }}>{p.nat.name}</Text> : null}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

export default function PlayerSearch({ C, open, onClose, onSelect }) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const list = useMemo(() => (q.trim().length >= 2 ? searchN(q).players.slice(0, 40) : []), [q]);
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
          <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Cerca giocatore" placeholderTextColor={C.ink3} autoCorrect={false} autoCapitalize="none" keyboardAppearance={C.dark ? 'dark' : 'light'} selectionColor={C.accent} style={{ flex: 1, color: C.ink, fontSize: 17 }} />
          <Pressable onPress={close} hitSlop={12}><Ionicons name="close" size={22} color={C.ink2} /></Pressable>
        </View>
        {list.length ? <Text style={{ color: C.ink3, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, paddingHorizontal: 20, marginTop: 10, marginBottom: 10 }}>GIOCATORE</Text> : null}
        <FlatList data={list} keyExtractor={(p) => String(p.id)} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
          renderItem={({ item }) => <Row C={C} p={item} onPress={() => pick(item.id)} />} />
      </View>
    </Modal>
  );
}
