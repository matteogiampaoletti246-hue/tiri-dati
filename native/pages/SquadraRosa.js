// Squadra: scheda Squadra (rosa divisa per ruolo, allenatore). Stessi dati del sito (rose.json, giocatori dell'app, rosa/ della stagione).
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useAsync from '@/hooks/useAsync';
import { teamById } from '@/data/teams';
import { injuryOf } from '@/data/injuries';
import { realName } from '@/data/realNames';
import { loadCarriere, carriereOf, countryIt, ageOf } from '@/data/carriere';
import { playersByTeam, playerByFm, natByFm } from '@/data/players';
import { loadRose, roseOf, fullRoster } from '@/data/rose';
import { FM_ID, currentSeason, playerFace } from '@/data/archive';
import { archiveId, espnIdOfRow, espnPlayerId, espnPhoto, rosaHint } from '@/data/archivePlayer';
import { Face } from '../shared/ui';
import { InjuryIconN } from '../shared/Icons';
import PaneN from '../shared/PaneN';
import { Flag } from './Giocatore';

const GROUPS = [
  { key: 'GK', title: 'Portieri', pos: ['GK'] },
  { key: 'DEF', title: 'Difensori', pos: ['DEF'] },
  { key: 'MID', title: 'Centrocampisti', pos: ['MID'] },
  { key: 'ATT', title: 'Attaccanti', pos: ['WNG', 'ATT'] },
  { key: 'UNK', title: 'Giocatori', pos: ['UNK'] },
];
const nk = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const hex6 = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#2C3E66');

function Group({ C, color, title, count, children }) {
  return (
    <View style={{ borderRadius: 22, overflow: 'hidden', backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: color }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: `${color}1f` }}>
        <Text style={{ color, fontSize: 12.5, fontWeight: '800', letterSpacing: 0.9, textTransform: 'uppercase' }}>{title}</Text>
        {count != null ? <Text style={{ marginLeft: 'auto', color: C.ink3, fontSize: 12 }}>{count}</Text> : null}
      </View>
      <View style={{ height: 6 }} />
      {children}
    </View>
  );
}

function PRow({ C, tc, to, openRoute, photo, num, name, injured, flag, bits }) {
  const body = (
    <LinearGradient colors={[`${tc}55`, `${tc}12`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
      <Face uri={photo} color={tc} size={38} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text numberOfLines={1} style={{ color: C.ink, fontSize: 14, fontWeight: '700', flexShrink: 1 }}>{num ? <Text style={{ color: C.accent }}>{num} </Text> : null}{name}</Text>
          {injured ? <InjuryIconN size={15} /> : null}
        </View>
        {bits.length ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{flag ? <Flag name={flag} size={14} C={C} /> : null}<Text numberOfLines={1} style={{ flexShrink: 1, color: C.ink3, fontSize: 11 }}>{bits.join(' · ')}</Text></View> : null}
      </View>
    </LinearGradient>
  );
  return to ? <Pressable onPress={() => openRoute(to)} style={{ marginHorizontal: 8, marginBottom: 6, borderRadius: 18, overflow: 'hidden' }}>{body}</Pressable> : <View style={{ marginHorizontal: 8, marginBottom: 6, borderRadius: 18, overflow: 'hidden' }}>{body}</View>;
}

export default function SquadraRosa({ C, teamId, openRoute, bottom }) {
  const [, bump] = useState(0);
  useEffect(() => { let on = true; Promise.all([loadCarriere(), loadRose()]).then(() => on && bump((n) => n + 1)); return () => { on = false; }; }, []);
  const all = playersByTeam(teamId);
  const team = teamById(teamId);
  const tc = hex6(team && team.colors && team.colors[0]);
  const rose = roseOf(team);
  const mine = {};
  const byFm = {};
  all.forEach((p) => { mine[nk(p.name)] = p; if (p.fmId) byFm[String(p.fmId)] = p; });
  // ogni giocatore della rosa porta alla sua scheda: per id FotMob, per nome (anche quello mostrato), poi cognome + iniziale ("D. Scherhant" = "Derry Scherhant")
  const findMine = (r) => {
    if (r[0] > 0 && byFm[String(r[0])]) return byFm[String(r[0])];
    // nazionali (e squadre senza campionato d'archivio): il giocatore si trova per id FotMob in tutto l'indice, scheda di club, altrimenti quella della nazionale
    if (r[0] > 0) { const g = playerByFm(r[0]) || natByFm(r[0]); if (g) return g; }
    const full = nk(realName(r[0], r[1]));
    if (mine[nk(r[1])] || mine[full]) return mine[nk(r[1])] || mine[full];
    const parts = full.split(' ').filter(Boolean);
    if (parts.length < 2) return null;
    const last = parts[parts.length - 1], ini = parts[0][0];
    const c = all.filter((p) => { const q = nk(p.name).split(' ').filter(Boolean); return q.length > 1 && q[q.length - 1] === last && q[0][0] === ini; });
    return c.length === 1 ? c[0] : null;
  };
  const fmR = rose ? FM_ID[rose.lg] : null;
  const { data: skR0 } = useAsync(() => (fmR ? currentSeason(fmR) : Promise.resolve(null)), [fmR]);
  // rosa completa: tutte le fonti unite (rosa/, rose.json, giocatori dell'app, stagione), mai una lista sola
  const { data: FR } = useAsync(() => (team ? fullRoster(team, rose, all) : Promise.resolve(null)), [teamId, rose ? rose.p.length : 0, all.length]);
  const R = FR ? { p: FR.p, fm: fmR, sk: skR0 } : null;
  const coachName = (rose && rose.co) || (FR && FR.co) || null;
  const coachId = (rose && rose.ci) || (FR && FR.ci) || null;
  const skR = R && R.sk;
  const coach = coachName ? (
    <Group C={C} color={C.role.COACH} title="Allenatore">
      <PRow C={C} tc={tc} photo={coachId ? playerFace(coachId) : null} name={coachName} bits={[]} />
    </Group>
  ) : null;
  let groups;
  if (R) {
    const fmR2 = R.fm;
    groups = GROUPS.map((g) => ({ ...g, list: R.p.filter((r) => g.pos.includes(r[2]) || (g.key === 'ATT' && r[2] === 'ATT')).sort((a, b) => (b[7] || 0) - (a[7] || 0) || (b[11] || 0) - (a[11] || 0) || (a[3] || 99) - (b[3] || 99)) }))
      .filter((g) => g.list.length).map((g) => (
        <Group key={g.key} C={C} color={C.role[g.key] || C.role.UNK} title={g.title} count={g.list.length}>
          {g.list.map((r) => {
            const bits = [r[4] ? countryIt(r[4]) : null, r[6] ? `${r[6]} cm` : null, r[5] ? `${r[5]} anni` : null].filter(Boolean);
            const mp = findMine(r);
            if (!mp && r[0] > 0) rosaHint(r[0], (team && team.fmId) || (rose && rose.id) || (/teamlogo\/(\d+)\.png/.exec(String((team && team.crest) || '')) || [])[1]);
            const to = mp ? `/giocatore/${mp.id}` : espnIdOfRow(r[0]) ? `/giocatore/${espnPlayerId(espnIdOfRow(r[0]))}` : (skR || skR0) && (fmR2 || fmR) && r[0] > 0 ? `/giocatore/${archiveId(fmR2 || fmR, skR || skR0, r[0])}` : null;
            return <PRow key={r[0]} C={C} tc={tc} to={to} openRoute={openRoute} photo={r[0] > 0 ? playerFace(r[0]) : espnIdOfRow(r[0]) ? espnPhoto(espnIdOfRow(r[0])) : null} num={r[3]} name={realName(r[0], r[1])} injured={!!r[10]} flag={r[4]} bits={bits} />;
          })}
        </Group>
      ));
  } else {
    const grouped = GROUPS.map((g) => ({ ...g, list: all.filter((p) => g.pos.includes(p.position)).sort((a, b) => (b.minutes || 0) - (a.minutes || 0)) }));
    const other = all.filter((p) => !GROUPS.some((g) => g.pos.includes(p.position)));
    if (other.length) grouped.push({ key: 'OT', title: 'Altri', list: other });
    if (!all.length) return null;
    groups = grouped.filter((g) => g.list.length).map((g) => (
      <Group key={g.key} C={C} color={C.role[g.key] || C.role.UNK} title={g.title} count={g.list.length}>
        {g.list.map((p) => {
          const c = carriereOf(p.id) || {};
          const age = ageOf(c.b);
          const bits = [c.c ? countryIt(c.c) : null, c.h ? `${c.h} cm` : null, age ? `${age} anni` : null].filter(Boolean);
          return <PRow key={p.id} C={C} tc={tc} to={`/giocatore/${p.id}`} openRoute={openRoute} photo={p.photo} num={c.n} name={p.name} injured={!!injuryOf(p.id)} flag={c.c} bits={bits} />;
        })}
      </Group>
    ));
  }
  return <PaneN bottom={bottom}><View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14 }}>{groups}{coach}</View></PaneN>;
}
