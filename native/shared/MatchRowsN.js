// Righe partita delle liste (squadra, campionato): partita dell'app (MatchRowN) e partita d'archivio (ArchRowN).
// Stesso disegno del sito: squadra di casa, risultato/ora al centro, squadra ospite; con `teamId` il cerchio V / S / P.
import React, { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { TeamCrest } from './ui';
import { TeamLogoN } from './Standings';
import { teamById } from '@/data/teams';
import { viewMatch } from '@/data/matches';
import { prepareMatch } from '@/data/prepare';
import { fmtTime } from './fmt';

let pf = 0;
const warm = (id) => { clearTimeout(pf); pf = setTimeout(() => prepareMatch(id), 90); };
const cool = () => clearTimeout(pf);

export const resColor = (C, r) => (r === 'V' ? C.good : r === 'P' ? C.bad : C.ink3);

function Shell({ C, home, away, centre, res, to, openRoute, warmId }) {
  return (
    <Pressable onPress={() => openRoute && openRoute(to)} onPressIn={() => warmId && warm(warmId)} onPressOut={cool} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 }, pressed && { opacity: 0.6 }]}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: C.ink, fontSize: 14, fontWeight: '600', textAlign: 'right', flexShrink: 1 }}>{home.name}</Text>
        {home.logo}
      </View>
      <View style={{ width: 64, alignItems: 'center' }}>{centre}</View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {away.logo}
        <Text numberOfLines={1} style={{ color: C.ink, fontSize: 14, fontWeight: '600', flexShrink: 1 }}>{away.name}</Text>
      </View>
      {res !== undefined ? <View style={{ width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: res ? resColor(C, res) : 'transparent' }}><Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>{res || ''}</Text></View> : null}
    </Pressable>
  );
}

export const MatchRowN = memo(({ C, match, teamId = null, openRoute }) => {
  const m = viewMatch(match);
  const home = teamById(m.homeId);
  const away = teamById(m.awayId);
  const live = m.status === 'live';
  const finished = m.status === 'finished';
  const hasScore = !!m.score;
  let res = null;
  if (teamId && finished && hasScore) {
    const gf = m.homeId === teamId ? m.score[0] : m.score[1];
    const ga = m.homeId === teamId ? m.score[1] : m.score[0];
    res = gf > ga ? 'V' : gf === ga ? 'S' : 'P';
  }
  const centre = (
    <>
      {(live || finished) && hasScore ? (
        <Text style={{ color: live ? C.live : res ? resColor(C, res) : C.ink, fontSize: 15.5, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{m.score[0]}<Text style={{ color: C.ink3, fontWeight: '500' }}> – </Text>{m.score[1]}</Text>
      ) : finished ? <Text style={{ color: C.ink3, fontSize: 12, fontWeight: '600' }}>Finita</Text>
        : <Text style={{ color: C.ink3, fontSize: 13.5, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{m.timeKnown === false ? '—' : m.kickoff}</Text>}
      {finished ? <Text style={{ color: C.ink3, fontSize: 10.5, marginTop: 2, minHeight: 13 }}>{m.timeKnown !== false ? m.kickoff : ' '}</Text> : null}
      {live ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}><View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.live }} /><Text style={{ color: C.live, fontSize: 10, fontWeight: '700' }}>{m.liveHalf ? 'Int.' : `${m.minute}'`}</Text></View> : null}
    </>
  );
  return (
    <Shell C={C} home={{ name: home ? home.name : '—', logo: <TeamCrest team={home} size={24} C={C} /> }} away={{ name: away ? away.name : '—', logo: <TeamCrest team={away} size={24} C={C} /> }}
      centre={centre} res={teamId ? res : undefined} to={m.href || `/match/${m.id}`} openRoute={openRoute} warmId={m.id} />
  );
});

export const ArchRowN = memo(({ C, m, names, fm, sk, tid = null, openRoute }) => {
  const hn = names[m[2]] || '—';
  const an = names[m[3]] || '—';
  const played = !!m[6];
  const sc = String(m[5] || '').split(' - ');
  const hasScore = played && sc.length === 2;
  let res = null;
  if (hasScore && tid != null) {
    const h = Number(sc[0]); const a = Number(sc[1]);
    const mine = String(m[2]) === String(tid) ? [h, a] : [a, h];
    res = mine[0] > mine[1] ? 'V' : mine[0] === mine[1] ? 'S' : 'P';
  }
  const id = `a-${fm}-${sk}-${m[0]}`;
  const centre = hasScore ? <Text style={{ color: C.ink, fontSize: 15.5, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{sc[0]}<Text style={{ color: C.ink3, fontWeight: '500' }}> – </Text>{sc[1]}</Text>
    : played ? <Text style={{ color: C.ink3, fontSize: 12, fontWeight: '600' }}>Finita</Text>
      : <Text style={{ color: C.ink3, fontSize: 13.5, fontWeight: '600' }}>{m[8] ? 'Annull.' : fmtTime(m[4])}</Text>;
  return (
    <Shell C={C} home={{ name: hn, logo: <TeamLogoN id={m[2]} name={hn} size={24} C={C} /> }} away={{ name: an, logo: <TeamLogoN id={m[3]} name={an} size={24} C={C} /> }}
      centre={centre} res={tid != null ? res : undefined} to={`/match/${id}`} openRoute={openRoute} warmId={id} />
  );
});
