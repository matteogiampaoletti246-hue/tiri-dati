// Ricerca giocatore a pagina intera (Calcolatore): stessa pagina della ricerca del sito, un banner colorato grande per ogni giocatore.
import React, { memo, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchN } from './searchN';
import { RingBox } from './ui';

const SITE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/';
const okHex = (c) => (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : null);

const Hl = ({ C, text, hl, style }) => {
  if (!hl || !Array.isArray(hl)) return <Text numberOfLines={1} style={style}>{text}</Text>;
  return <Text numberOfLines={1} style={style}>{text.slice(0, hl[0])}<Text style={{ color: C.accent }}>{text.slice(hl[0], hl[1])}</Text>{text.slice(hl[1])}</Text>;
};

const Row = memo(({ C, p, onPress }) => {
  const c0 = okHex(p.color) || C.accent;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ marginHorizontal: 12, marginBottom: 12 }, pressed && { opacity: 0.7 }]}>
      <RingBox C={C} radius={30} pad={1.5} innerStyle={{ flex: 0 }}>
        <View style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: C.sheet }}>
          <LinearGradient pointerEvents="none" colors={[c0 + '88', c0 + '30', c0 + '00']} locations={[0, 0.6, 1]} start={{ x: 0, y: 0.3 }} end={{ x: 1, y: 0.7 }} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 18 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: c0, overflow: 'hidden', backgroundColor: c0 + '55' }}>
              {p.photo ? <Image source={{ uri: p.photo }} style={{ width: 74, height: 74 }} contentFit="cover" cachePolicy="memory-disk" /> : null}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Hl C={C} text={p.name} hl={p.hl} style={{ color: C.ink, fontSize: 21, fontWeight: '700' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                {p.crest ? <Image source={{ uri: p.crest }} style={{ width: 20, height: 20 }} contentFit="contain" cachePolicy="memory-disk" /> : null}
                <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 16, flexShrink: 1 }}>{p.team}</Text>
                {p.nat ? <Image source={{ uri: `${SITE}native-link/flags/${p.nat.fc}.png` }} style={{ width: 16, height: 16, borderRadius: 8 }} contentFit="cover" /> : null}
              </View>
            </View>
          </View>
        </View>
      </RingBox>
    </Pressable>
  );
});

export default function PlayerSearch({ C, open, onClose, onSelect }) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const list = useMemo(() => (q.trim().length >= 2 ? searchN(q).players.slice(0, 40) : []), [q]);
  const close = () => { setQ(''); onClose(); };
  return (
    <Modal visible={open} animationType="slide" onRequestClose={close} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, height: 52 }}>
          <Ionicons name="search" size={22} color={C.ink3} />
          <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Cerca giocatore" placeholderTextColor={C.ink3} autoCorrect={false} autoCapitalize="none" keyboardAppearance={C.dark ? 'dark' : 'light'} selectionColor={C.accent} style={{ flex: 1, color: C.ink, fontSize: 24 }} />
          <Pressable onPress={close} hitSlop={12}><Ionicons name="close" size={26} color={C.ink2} /></Pressable>
        </View>
        {list.length ? <Text style={{ color: C.ink3, fontSize: 14, fontWeight: '800', letterSpacing: 1.4, paddingHorizontal: 20, marginTop: 14, marginBottom: 12 }}>GIOCATORE</Text> : null}
        <FlatList data={list} keyExtractor={(p) => String(p.id)} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
          renderItem={({ item }) => <Row C={C} p={item} onPress={() => { setQ(''); onSelect(item.id); onClose(); }} />} />
      </View>
    </Modal>
  );
}
