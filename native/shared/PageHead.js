// Testata delle pagine principali (Calcolatore, Migliori Giocatori, Matchup): titolo con barra azzurra sotto e i due tasti tondi in vetro (cerca, menu)
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RingBox } from './ui';

const Round = ({ C, icon, onPress }) => (
  <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => pressed && { opacity: 0.7 }}>
    <RingBox C={C} radius={19} style={{ width: 38, height: 38 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={19} color={C.ink} /></View>
    </RingBox>
  </Pressable>
);
export default function PageHead({ C, title, onSearch, onMenu }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, height: 58 }}>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: C.ink, fontSize: 24, fontWeight: '800' }}>{title}</Text>
        <View style={{ width: 120, height: 3.5, borderRadius: 2, marginTop: 2, backgroundColor: C.accent }} />
      </View>
      {onSearch ? <Round C={C} icon="search" onPress={onSearch} /> : null}
      {onMenu ? <Round C={C} icon="menu" onPress={onMenu} /> : null}
    </View>
  );
}
