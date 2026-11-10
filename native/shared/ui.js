// Mattoni nativi condivisi tra le pagine (tappa 1+): colori sempre dal tema C, mai fissi nei componenti.
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

export const TeamCrest = ({ team, size = 32, C }) => {
  const [bad, setBad] = useState(false);
  if (!team) return null;
  if (team.crest && !bad) return <Image source={{ uri: team.crest }} style={{ width: size, height: size }} contentFit="contain" cachePolicy="memory-disk" onError={() => setBad(true)} />;
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.ink2, fontSize: Math.max(10, size * 0.4), fontWeight: '700' }}>{team.initials}</Text></View>;
};

export const Face = ({ uri, color, size = 44 }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: color || 'rgba(128,128,128,.25)' }}>
    {uri ? <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" cachePolicy="memory-disk" /> : null}
  </View>
);

export const Panel = ({ C, children, style }) => (
  <View style={[{ borderRadius: 22, overflow: 'hidden', backgroundColor: C.card2, borderWidth: 1, borderColor: C.border }, style]}>{children}</View>
);

export const PanelTitle = ({ C, children, right }) => (
  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, marginTop: 4 }}>
    <Text style={{ color: C.ink3, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{children}</Text>
    {right ? <Text style={{ color: C.ink3, fontSize: 11 }}>{right}</Text> : null}
  </View>
);

// selettore a pillole (Over/Under, Totali/In porta...)
export const Segmented = ({ C, options, value, onChange }) => (
  <View style={{ flexDirection: 'row', backgroundColor: C.chip, borderRadius: 999, padding: 3 }}>
    {options.map((o) => {
      const on = o.value === value;
      return (
        <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, alignItems: 'center', backgroundColor: on ? C.thumb : 'transparent', borderWidth: on ? 1 : 0, borderColor: C.thumbBd }}>
          <Text numberOfLines={1} style={{ color: on ? C.ink : C.ink3, fontSize: 13, fontWeight: '700' }}>{o.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

export const FieldRow = ({ C, label, hint, first, children }) => (
  <View style={{ paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, borderTopColor: C.hair }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ color: C.ink2, fontSize: 13, fontWeight: '600' }}>{label}</Text>
      <View style={{ flex: 1, maxWidth: 220 }}>{children}</View>
    </View>
    {hint ? <Text style={{ color: C.ink3, fontSize: 11.5, marginTop: 6 }}>{hint}</Text> : null}
  </View>
);

export const NumInput = ({ C, value, onChange, placeholder, style }) => (
  <TextInput
    value={value}
    onChangeText={(t) => onChange(String(t).replace('.', ',').replace(/[^0-9,]/g, ''))}
    keyboardType="decimal-pad"
    placeholder={placeholder || '—'}
    placeholderTextColor={C.ink3}
    style={[{ color: C.ink, backgroundColor: C.chip, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, fontSize: 16, fontWeight: '700', textAlign: 'right' }, style]}
  />
);

// finestra di scelta con ricerca (campionato, squadra, giocatore): scorre solo la lista
const nrm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[ı]/g, 'i').replace(/[øœ]/g, 'o').replace(/ł/g, 'l').replace(/[đð]/g, 'd').replace(/æ/g, 'ae').replace(/ß/g, 'ss');
// requireQuery: elenchi enormi (36mila giocatori): niente righe finche' non si scrive, poi al massimo 60 risultati
export function PickerModal({ C, open, title, options, onSelect, onClose, searchable, placeholder, requireQuery, top = 0 }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const t = nrm(q.trim());
    if (!t) return requireQuery ? [] : options;
    const out = [];
    for (let i = 0; i < options.length && (!requireQuery || out.length < 60); i += 1) {
      const o = options[i];
      if (!o._h) o._h = nrm(o.label + ' ' + (o.sub || '') + ' ' + (o.alias || ''));
      if (o._h.includes(t)) out.push(o);
    }
    return out;
  }, [q, options, requireQuery]);
  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onDismiss={() => setQ('')}>
      <View style={{ flex: 1, backgroundColor: C.sheet }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <Text style={{ flex: 1, color: C.ink, fontSize: 18, fontWeight: '800' }}>{title}</Text>
          <Pressable onPress={() => { setQ(''); onClose(); }} hitSlop={10}><Ionicons name="close" size={24} color={C.ink2} /></Pressable>
        </View>
        {searchable ? (
          <TextInput value={q} onChangeText={setQ} placeholder={placeholder || 'Cerca'} placeholderTextColor={C.ink3} autoCorrect={false} style={{ marginHorizontal: 16, marginBottom: 8, color: C.ink, backgroundColor: C.chip, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, fontSize: 16 }} />
        ) : null}
        <FlatList
          data={list}
          keyExtractor={(o) => String(o.value)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          renderItem={({ item: o }) => (
            <Pressable onPress={() => { setQ(''); onSelect(o); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, padding: 12, borderRadius: 16, backgroundColor: o.color ? o.color + '33' : C.card2, borderWidth: 1, borderColor: C.border }}>
              {o.icon || (o.face ? <Face uri={o.face} color={o.color} size={44} /> : null)}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: C.ink, fontSize: 16, fontWeight: '700' }}>{o.label}</Text>
                {o.sub ? <Text numberOfLines={1} style={{ color: C.ink3, fontSize: 11, marginTop: 2, letterSpacing: 0.6 }}>{o.sub}</Text> : null}
              </View>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
