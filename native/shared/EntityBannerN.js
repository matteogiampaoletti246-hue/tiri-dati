// Banner di squadra / campionato (nativo): fondo scuro con alone del colore, stemma grande a destra, nome, sottotitolo, riga meta e riga sotto.
// Colori sempre dal tema C; il colore della squadra o del campionato arriva da `colors`.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

export default function EntityBannerN({ C, top = 0, onBack, name, subtitle, meta, below, colors = ['#1E4BD8', '#7FB6E8'], logoUrl = null, flagUrl = null, liveCount = 0, tall = true, photoUrl = null, nameExtra = null, logoTint = null }) {
  const c0 = (colors && colors[0]) || '#1E4BD8';
  const big = tall ? 210 : 170;
  const hex = /^#[0-9a-f]{6}$/i.test(c0) ? c0 : '#1E4BD8';
  return (
    <View style={{ backgroundColor: C.sheet, overflow: 'hidden', borderBottomWidth: 2, borderBottomColor: hex, paddingTop: top }}>
      <LinearGradient pointerEvents="none" colors={[`${hex}b3`, `${hex}40`, `${hex}00`]} start={{ x: 0, y: 0 }} end={{ x: 0.85, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <LinearGradient pointerEvents="none" colors={[`${hex}00`, `${hex}77`]} start={{ x: 0.35, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      {photoUrl ? (
        // volto intero: riquadro quadrato poco piu' alto del banner (sotto la barra di stato), appoggiato in basso; si taglia solo la cima dei capelli
        <View pointerEvents="none" style={{ position: 'absolute', right: 0, top, bottom: 0, width: '60%', overflow: 'hidden' }}>
          <Image source={{ uri: photoUrl }} style={{ position: 'absolute', right: 12, bottom: 0, height: '118%', aspectRatio: 1 }} contentFit="contain" contentPosition="bottom right" cachePolicy="memory-disk" />
        </View>
      ) : flagUrl ? (
        <Image source={{ uri: flagUrl }} pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '46%', opacity: 0.55 }} contentFit="cover" cachePolicy="memory-disk" />
      ) : logoUrl ? (
        <Image source={{ uri: logoUrl }} pointerEvents="none" style={{ position: 'absolute', right: -big * 0.14, top: '50%', marginTop: -big / 2 + (top ? top / 2 : 0), width: big, height: big, opacity: 0.55 }} contentFit="contain" tintColor={logoTint || undefined} cachePolicy="memory-disk" />
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 6, paddingRight: 16, paddingTop: 10, paddingBottom: tall ? 22 : 12 }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ width: 32, height: 38, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text numberOfLines={1} style={{ color: C.ink, fontSize: 22, fontWeight: '800', letterSpacing: -0.6, flexShrink: 1 }}>{name}</Text>{nameExtra}</View>
          {subtitle ? <Text numberOfLines={1} style={{ color: C.ink3, fontSize: 12 }}>{subtitle}</Text> : null}
          {meta ? <View style={{ marginTop: 4 }}>{meta}</View> : null}
          {below ? <View style={{ marginTop: 10 }}>{below}</View> : null}
        </View>
        {liveCount > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.live }} />
            <Text style={{ color: C.ink, fontSize: 11, fontWeight: '800' }}>{liveCount} LIVE</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
