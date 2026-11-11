// Testata della partita (nativa): campionato, due squadre, risultato / orario / conto alla rovescia, marcatori. Stessi dati del sito.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TeamCrest, LeagueLogo } from '../shared/ui';
import { matchColors } from '@/lib/tint';
import { matchTint } from '@/data/matchTint';
import { teamForm } from '@/data/matches';
import { longDate } from '@/lib/format';

const short = (n) => {
  if (/^\(?\s*(tbd|tba|n\/a|unknown)\s*\)?$/i.test(String(n || '').trim())) return '';
  const p = String(n || '').trim().split(/\s+/);
  return p.length < 2 ? p[0] || '' : `${p[0][0]}. ${p.slice(1).join(' ')}`;
};
const darkCrest = (t) => {
  if (!t) return false;
  if (/jablonec/i.test(t.name || '')) return true;
  const c = t.colors && t.colors[0];
  if (!/^#[0-9a-f]{6}$/i.test(c || '')) return false;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 62;
};
const pad = (n) => String(n).padStart(2, '0');
export const showCountdown = (ts, now = Date.now()) => {
  if (!ts || now >= ts) return false;
  const d0 = new Date(ts); d0.setHours(0, 0, 0, 0);
  return now >= d0.getTime();
};

export function FormDots({ C, form = [], size = 13 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {form.map((r, i) => {
        const col = r === 'V' ? C.good : r === 'P' ? C.bad : C.ink3;
        return (
          <View key={i} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: r === 'V' ? `${C.good}2E` : r === 'P' ? `${C.bad}29` : C.chip }}>
            <Text style={{ color: col, fontSize: Math.round(size * 0.62), fontWeight: '700' }}>{r}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Countdown({ C, ts, onDone }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, Math.floor((ts - now) / 1000));
  useEffect(() => { if (!left && onDone) onDone(); }, [left]);
  return <Text style={{ color: C.ink, fontSize: 25, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{`${pad(Math.floor(left / 3600))}:${pad(Math.floor(left / 60) % 60)}:${pad(left % 60)}`}</Text>;
}

function Scorers({ C, events, side, align }) {
  const goals = (events || []).filter((e) => e.type === 'goal' && e.team === side);
  if (!goals.length) return <View style={{ flex: 1 }} />;
  return (
    <View style={{ flex: 1, gap: 3, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {goals.map((g, i) => (
        <Text key={i} numberOfLines={1} style={{ color: C.ink2, fontSize: 11.5 }}>
          <Text style={{ color: C.ink3 }}>{g.minute}&apos;</Text> {short(g.name)}{g.pen ? ' (rig.)' : ''}{g.og ? ' (aut.)' : ''}
        </Text>
      ))}
    </View>
  );
}

export default function PartitaHero({ C, match, view, league, home, away, onBack, openRoute }) {
  const live = match.status === 'live';
  const finished = match.status === 'finished';
  const date = new Date(match.ts);
  const score = view.score ? `${view.score[0]} – ${view.score[1]}` : '0 – 0';
  const [cdOn, setCdOn] = useState(() => !live && !finished && showCountdown(match.ts));
  useEffect(() => {
    if (live || finished || cdOn || !match.ts) return undefined;
    const d0 = new Date(match.ts); d0.setHours(0, 0, 0, 0);
    const wait = d0.getTime() - Date.now();
    if (wait > 864e5 || Date.now() >= match.ts) return undefined;
    const t = setTimeout(() => setCdOn(showCountdown(match.ts)), Math.max(0, wait) + 50);
    return () => clearTimeout(t);
  }, [live, finished, cdOn, match.ts]);
  const counting = cdOn && !live && !finished;
  const [c1, c2] = matchColors(home, away);
  const tint = league ? matchTint(league.id, league) : null;
  const goTeam = (t) => t && openRoute && openRoute(`/squadra/${t.id}`);
  const Side = ({ team, id }) => (
    <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      <Pressable onPress={() => goTeam(team)} style={{ alignItems: 'center', gap: 8 }}>
        {darkCrest(team) ? <View style={{ width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.9)' }}><TeamCrest team={team} size={48} C={C} /></View> : <TeamCrest team={team} size={54} C={C} />}
        <Text style={{ color: C.ink, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{team ? team.name : ''}</Text>
      </Pressable>
      {!live && !finished ? <FormDots C={C} form={match.formOf ? match.formOf(id) : teamForm(id)} /> : null}
    </View>
  );
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 40, gap: 8 }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip }}><Ionicons name="chevron-back" size={20} color={C.ink} /></Pressable>
        <Pressable onPress={() => league && openRoute && openRoute(`/campionato/${league.id}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LeagueLogo league={league} size={20} C={C} />
          <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{league ? league.name : ''}{match.seasonLabel ? ` · ${match.seasonLabel}` : ''}</Text>
        </Pressable>
        <View style={{ width: 36 }} />
      </View>
      <View style={{ marginTop: 12, borderRadius: 28, overflow: 'hidden', borderWidth: 2, borderColor: tint || C.border, backgroundColor: C.card2, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 }}>
        <LinearGradient pointerEvents="none" colors={[`${c1}${C.dark ? '8C' : '59'}`, `${c1}00`, `${c2}00`, `${c2}${C.dark ? '80' : '55'}`]} locations={[0, 0.38, 0.62, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Side team={home} id={match.homeId} />
          <View style={{ width: counting ? 124 : 104, alignItems: 'center', paddingTop: 12 }}>
            {live || finished ? <Text style={{ color: live ? C.live : C.ink, fontSize: 32, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{score}</Text>
              : counting ? (<><Text style={{ alignSelf: 'stretch', textAlign: 'center', color: C.ink3, fontSize: 9.5, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>Calcio d&apos;inizio tra</Text><Countdown C={C} ts={match.ts} onDone={() => setCdOn(false)} /></>)
                : <Text style={{ color: C.ink, fontSize: 30, fontWeight: '800' }}>{match.kickoff}</Text>}
            {live ? (
              <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.live }} />
                <Text style={{ color: C.live, fontSize: 11.5, fontWeight: '700' }}>{view.liveHalf ? 'Intervallo' : `${view.minute}'`}</Text>
              </View>
            ) : <Text style={{ marginTop: 6, textAlign: 'center', color: C.ink3, fontSize: 11 }}>{counting ? `Oggi · ${match.kickoff}` : finished ? 'Finita' : longDate(date)}</Text>}
            {finished && match.seasonLabel ? <Text style={{ marginTop: 2, color: C.ink3, fontSize: 10.5, textAlign: 'center' }}>{longDate(date)}</Text> : null}
          </View>
          <Side team={away} id={match.awayId} />
        </View>
        {(live || finished) && (view.events || []).some((e) => e.type === 'goal') ? (
          <View style={{ marginTop: 4, flexDirection: 'row', gap: 12 }}>
            <Scorers C={C} events={view.events} side="home" align="left" />
            <Scorers C={C} events={view.events} side="away" align="right" />
          </View>
        ) : null}
      </View>
    </View>
  );
}
