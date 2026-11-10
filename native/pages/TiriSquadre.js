// Tiri squadre (/tiri-squadre): tabella per campionato con tiri, in porta, fuori e xG, ordinabile (TeamShots.jsx del sito).
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import './../shared/shim';
import { bootShared } from '../shared/boot';
import { LEAGUES } from '@/data/leagues';
import { metricOf, metricRows } from '@/data/standings';
import { teamById } from '@/data/teams';
import { comma } from '@/lib/format';
import { Segmented, TeamCrest } from '../shared/ui';

const COLS = [{ key: 'tiri', label: 'Tir' }, { key: 'tiriInPorta', label: 'Por' }, { key: 'tiriFuori', label: 'Fuo' }, { key: 'xg', label: 'xG' }];
const METRICS = [['tiri', 'Tiri'], ['tiriInPorta', 'In porta'], ['tiriFuori', 'Fuori'], ['tiriFuoriArea', 'Da fuori'], ['xg', 'xG'], ['corner', 'Corner']].map(([value, label]) => ({ value, label }));
const fmt = (k, v) => (v === null || v === undefined ? '' : k === 'xg' ? comma(v, 2) : comma(v, Number.isInteger(v) ? 0 : 1));

export default function TiriSquadre({ C, top, onBack, bottom = 90, openRoute }) {
  const [ok, setOk] = useState(false);
  const [lid, setLid] = useState('serie-a');
  const [key, setKey] = useState('tiri');
  useEffect(() => { bootShared().then(() => setOk(true)).catch(() => {}); }, []);
  const rows = useMemo(() => (ok ? metricRows(lid, key) : []), [ok, lid, key]);
  const leagues = useMemo(() => (ok ? LEAGUES.filter((l) => !l.extra).map((l) => ({ value: l.id, label: l.name })) : []), [ok]);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'transparent' }} contentContainerStyle={{ paddingTop: top, paddingBottom: bottom + 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 48 }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ width: 32, height: 40, justifyContent: 'center' }}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
        <View style={{ marginLeft: 6 }}><Text style={{ color: C.ink, fontSize: 17, fontWeight: '800' }}>Tiri Squadre</Text><Text style={{ color: C.ink3, fontSize: 11 }}>Tiri e xG per campionato</Text></View>
      </View>
      {ok ? (
        <>
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}><Segmented C={C} options={leagues} value={lid} onChange={setLid} /></View>
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <Text style={{ color: C.ink3, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Ordina per</Text>
            <Segmented C={C} options={METRICS} value={key} onChange={setKey} />
          </View>
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 8 }}>
              <Text style={{ width: 22, color: C.ink3, fontSize: 9.5, letterSpacing: 1 }}>#</Text>
              <Text style={{ flex: 1, color: C.ink3, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase' }}>Squadra</Text>
              {COLS.map((c) => <Text key={c.key} style={{ width: 34, textAlign: 'right', color: C.ink3, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase' }}>{c.label}</Text>)}
            </View>
            {rows.map((r) => {
              const t = teamById(r.teamId);
              return (
                <Pressable key={r.teamId} onPress={() => openRoute(`/squadra/${r.teamId}`)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.hair }, pressed && { opacity: 0.6 }]}>
                  <Text style={{ width: 22, color: C.ink3, fontSize: 11.5, fontVariant: ['tabular-nums'] }}>{r.rank}</Text>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}><TeamCrest team={t} size={20} C={C} /><Text numberOfLines={1} style={{ flexShrink: 1, color: C.ink, fontSize: 13 }}>{t ? t.name : ''}</Text></View>
                  {COLS.map((c) => { const on = c.key === key; return <Text key={c.key} style={{ width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], color: on ? C.ink : C.ink2, fontSize: on ? 13 : 11.5, fontWeight: on ? '700' : '400' }}>{fmt(c.key, metricOf(r.teamId, c.key))}</Text>; })}
                </Pressable>
              );
            })}
            <Text style={{ paddingHorizontal: 20, paddingTop: 16, color: C.ink3, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase' }}>Tir · Por · Fuo · xG</Text>
          </View>
        </>
      ) : <View style={{ margin: 20, height: 200, borderRadius: 22, backgroundColor: C.skBase }} />}
    </ScrollView>
  );
}
