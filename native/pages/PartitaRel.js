// Scheda Affidabilita' (partite non iniziate): i giocatori con voto alto sulla linea di tiri scelta (Over 0,5 / 1,5 / 2,5).
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { matchReliability } from '@/data/topPlayers';
import { PLAYERS } from '@/data/players';
import { teamById } from '@/data/teams';
import { matchStarted, openPanel } from '@/data/playerPanel';
import { scoreColorSmooth } from '@/lib/calc';
import { comma } from '@/lib/format';
import { TeamCrest, Face, Segmented } from '../shared/ui';

// la scheda c'e' solo se almeno un giocatore ha voto valido su una delle tre soglie (cache breve: il calcolo e' pesante)
export const hasReliability = (match) => {
  const c = match._hasRel;
  if (c && Date.now() - c.at < (c.v ? 120000 : 3000) && c.n === PLAYERS.length) return c.v;
  const v = [0.5, 1.5, 2.5].some((l) => matchReliability(match, l).length > 0);
  match._hasRel = { at: Date.now(), v, n: PLAYERS.length };
  return v;
};

const LINES = [{ value: 0.5, label: 'Over 0,5' }, { value: 1.5, label: 'Over 1,5' }, { value: 2.5, label: 'Over 2,5' }];

export default function Affidabilita({ C, match, openRoute }) {
  const [line, setLine] = useState(0.5);
  const list = matchReliability(match, line).slice(0, 40);
  const go = (id) => { if (!matchStarted(match)) openPanel(id); else openRoute('/giocatore/' + id); };
  return (
    <View style={{ paddingTop: 12, paddingBottom: 24, gap: 12 }}>
      <View style={{ paddingHorizontal: 16 }}><Segmented C={C} options={LINES} value={line} onChange={setLine} /></View>
      <View>
        {list.map((r) => {
          const t = teamById(r.player.teamId);
          const c1 = t && t.colors ? t.colors[0] : '#2C3E66';
          return (
            <Pressable key={r.player.id} onPress={() => go(r.player.id)} style={({ pressed }) => [{ marginHorizontal: 16, marginBottom: 8, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border }, pressed && { opacity: 0.8 }]}>
              <LinearGradient colors={[c1 + '66', 'rgba(255,255,255,0.03)']} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 8 }}>
                <Face uri={r.player.photo} color={c1} size={38} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13, fontWeight: '800' }}>{r.player.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
                    <TeamCrest team={t} size={13} C={C} />
                    <Text style={{ color: C.ink3, fontSize: 10.5 }}>tiri attesi {comma(r.lam, 2)}</Text>
                  </View>
                </View>
                <Text style={{ color: scoreColorSmooth(r.voto), fontSize: 20, fontWeight: '800' }}>{comma(r.voto, 1)}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
