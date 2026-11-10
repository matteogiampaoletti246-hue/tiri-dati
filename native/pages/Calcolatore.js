// Calcolatore Affidabilità (nativo, tappa 2): testata con le due schede (Giocatore / Squadra), dati e calcoli condivisi col sito.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import './../shared/shim';
import { bootShared } from '../shared/boot';
import { CALC_KEEP, saveCalcKeep } from '@/data/calcKeep';
import { Segmented } from '../shared/ui';
import CalcPlayer from './CalcPlayer';
import CalcTeam from './CalcTeam';
import { CALC_IN } from '../shared/calcIn';

const TABS = [{ value: 0, label: 'Giocatore' }, { value: 1, label: 'Squadra' }];

// scheletro con la forma della pagina (banner giocatore, righe, pannelli)
const Skel = ({ C }) => {
  const b = (h, w) => <View style={{ height: h, width: w || '100%', borderRadius: 16, backgroundColor: C.skBase, marginBottom: 14 }} />;
  return <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>{b(14, 90)}{b(250)}{b(14, 160)}{b(120)}{b(14, 120)}{b(150)}</View>;
};

export default function Calcolatore({ C, top, onSearch, openRoute, bottom = 90 }) {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(false);
  const [index, setIndexRaw] = useState(CALC_IN.v ? 0 : CALC_KEEP.index || 0);
  const setIndex = (i) => { CALC_KEEP.index = i; saveCalcKeep(); setIndexRaw(i); };
  useEffect(() => { let live = true; bootShared().then(() => { if (live) setReady(true); }, () => { if (live) setErr(true); }); return () => { live = false; }; }, []);
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent', paddingTop: top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 20 }}>
        <Text style={{ flex: 1, color: C.ink, fontSize: 22, fontWeight: '800' }}>Calcolatore Affidabilità</Text>
        {onSearch ? <Pressable onPress={onSearch} hitSlop={10}><Ionicons name="search" size={22} color={C.ink2} /></Pressable> : null}
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 6, paddingTop: 6 }}><Segmented C={C} options={TABS} value={index} onChange={setIndex} /></View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: bottom + 20 }}>
          {ready ? (index === 0 ? <CalcPlayer C={C} openRoute={openRoute} /> : <CalcTeam C={C} />) : err ? null : <Skel C={C} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
