// Tutte le competizioni (app + archivio) raggruppate per paese: internazionali, paesi principali, poi gli altri in ordine alfabetico (Competitions.jsx del sito).
import React, { useMemo } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import './../shared/shim';
import useAsync from '@/hooks/useAsync';
import { archIndex } from '@/data/archive';
import { LEAGUES } from '@/data/leagues';
import { bootShared } from '../shared/boot';
import { LeagueLogo } from '../shared/ui';

const INTL = new Set(['Europa', 'Internazionale', 'Mondo', '']);
const PRIO = ['Italia', 'Inghilterra', 'Spagna', 'Germania', 'Francia', 'Portogallo', 'Paesi Bassi', 'Turchia', 'Belgio', 'Scozia', 'Brasile', 'Argentina', 'Stati Uniti', 'Messico'];
function groups() {
  const by = new Map();
  LEAGUES.forEach((l) => { const c = INTL.has(l.country || '') ? 'Internazionali' : l.country; if (!by.has(c)) by.set(c, []); by.get(c).push(l); });
  const rank = (c) => (c === 'Internazionali' ? -1 : PRIO.includes(c) ? PRIO.indexOf(c) : PRIO.length);
  return [...by.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0], 'it')).map(([c, list]) => ({ c, list: [...list].sort((a, b) => (a.arch ? 1 : 0) - (b.arch ? 1 : 0)) }));
}

export default function Competizioni({ C, top, onBack, bottom = 90, openRoute }) {
  const { data } = useAsync(async () => { await bootShared(); return archIndex(); }, []);
  const gs = useMemo(() => (data ? groups() : []), [data]);
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent', paddingTop: top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 48 }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ width: 32, height: 40, justifyContent: 'center' }}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
        <Text style={{ color: C.ink, fontSize: 17, fontWeight: '800', marginLeft: 6 }}>Competizioni</Text>
      </View>
      {!data ? (
        <View style={{ padding: 20, gap: 12 }}>{[0, 1, 2, 3, 4, 5, 6].map((i) => <View key={i} style={{ height: 47, borderRadius: 14, backgroundColor: C.skBase }} />)}</View>
      ) : (
        <FlatList data={gs} keyExtractor={(g) => g.c} initialNumToRender={4} windowSize={7} contentContainerStyle={{ paddingBottom: bottom + 24 }}
          renderItem={({ item: g }) => (
            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              <Text style={{ color: C.ink3, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', paddingBottom: 4 }}>{g.c}</Text>
              {g.list.map((l) => (
                <Pressable key={l.id} onPress={() => openRoute(`/campionato/${l.id}`)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.hair }, pressed && { opacity: 0.6 }]}>
                  <LeagueLogo league={l} size={26} C={C} />
                  <Text numberOfLines={1} style={{ flex: 1, color: C.ink, fontSize: 14.5 }}>{l.name}</Text>
                  <Ionicons name="chevron-forward" size={15} color={C.ink3} />
                </Pressable>
              ))}
            </View>
          )} />
      )}
    </View>
  );
}
