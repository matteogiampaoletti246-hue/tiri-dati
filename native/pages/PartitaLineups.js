// Formazioni della partita (nativo): campo con le due squadre, voti (giocata) o affidabilita' (non iniziata), allenatore, panchina,
// infortunati; formazione a soli nomi quando la fonte non da' il campo. Stessi dati del sito.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Text as SText } from 'react-native-svg';
import { BASE } from '@/data/load';
import { playerById, playerByFm, playersByTeam } from '@/data/players';
import { openPanel, matchStarted } from '@/data/playerPanel';
import { ourPlayerId } from '@/data/playerSheet';
import { injuryOf, isOutOn } from '@/data/injuries';
import { playerReliability, loadPlayerFouls, TOP_STATS } from '@/data/topPlayers';
import { flagCodeOf } from '@/data/referees';
import { scoreColorSmooth } from '@/lib/calc';
import { comma } from '@/lib/format';
import { teamColor } from '@/lib/tint';
import { TeamCrest, Panel } from '../shared/ui';
import { BallIcon, BootIcon } from '../shared/Icons';
import { SubIcon } from './PartitaInfo';

const last = (n) => String(n || '').split(' ').slice(-1)[0];
const tone = (v) => (v == null ? 'rgba(128,128,128,.4)' : v >= 7.5 ? '#1FA45B' : v >= 7 ? '#5DBB3F' : v >= 6.5 ? '#E0B400' : v >= 6 ? '#E8892B' : '#E5484D');
const plOf = (p) => playerById(p.playerId) || (p.fmId ? playerByFm(p.fmId) : null);
// colore del nome squadra leggibile sul verde scuro: schiarito verso il bianco
const lighten = (c) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(c || '').trim());
  if (!m) return '#fff';
  const n = parseInt(m[1], 16);
  const mix = (x) => Math.round(x * 0.55 + 255 * 0.45).toString(16).padStart(2, '0');
  return `#${mix(n >> 16)}${mix((n >> 8) & 255)}${mix(n & 255)}`;
};
const tcol = (t) => lighten(t && t.colors && t.colors[0]);

function Face({ C, p, size = 46, team, ring }) {
  const cs = (team && team.colors) || ['#1B2C4E', '#0E1830'];
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2 }, ring ? { borderWidth: 2.5, borderColor: '#FFC83D', shadowColor: '#FFC83D', shadowOpacity: 0.55, shadowRadius: 7 } : null]}>
      <LinearGradient colors={[cs[0], cs[1] || cs[0]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: size / 2 }} />
      <View style={{ flex: 1, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' }}>
        {p.photo ? <Image source={{ uri: p.photo }} style={{ width: size, height: size }} contentFit="cover" cachePolicy="memory-disk" /> : <Ionicons name="person" size={size * 0.8} color="rgba(255,255,255,.55)" style={{ marginBottom: -size * 0.08 }} />}
      </View>
    </View>
  );
}

// Eventi attorno al volto: cartellino in alto a sinistra, gol e assist a destra, cambio a sinistra in basso, capitano, stella.
function Events({ p, size, mvp }) {
  const ab = { position: 'absolute' };
  const num = (n) => (n > 1 ? <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{n}</Text> : null);
  return (
    <>
      {p.card ? <View style={[ab, { left: -7, top: -5, width: size * 0.62, height: size * 0.82, borderRadius: 2.5, backgroundColor: p.card === 'red' ? '#E5484D' : '#F2C230', borderWidth: 1, borderColor: 'rgba(0,0,0,.35)' }]} /> : null}
      {p.goals || p.assists ? (
        <View style={[ab, { left: '100%', top: -5, marginLeft: -2, gap: 2 }]}>
          {p.goals ? <View style={{ flexDirection: 'row', alignItems: 'center' }}><BallIcon size={size} />{num(p.goals)}</View> : null}
          {p.assists ? <View style={{ flexDirection: 'row', alignItems: 'center' }}><BootIcon size={size} />{num(p.assists)}</View> : null}
        </View>
      ) : null}
      {p.subOut ? <View style={[ab, { right: '100%', marginRight: -6, bottom: 2 }]}><SubIcon size={size} /></View> : null}
      {p.captain ? <View style={[ab, { left: '100%', marginLeft: -3, bottom: 3, width: size * 0.95, height: size * 0.95, borderRadius: size, backgroundColor: '#F2C230', alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: size * 0.58, fontWeight: '800', color: '#222' }}>C</Text></View> : null}
      {mvp ? <Text style={[ab, { left: '50%', top: -13, marginLeft: -7, color: '#FFC83D', fontSize: 14 }]}>★</Text> : null}
    </>
  );
}

// Voto in partita (colori a fasce) o affidabilita' (scala del Calcolatore, bagliore azzurro da 8,8)
function Badge({ v, pre, inline }) {
  if (v == null) return null;
  const bg = pre ? scoreColorSmooth(v) : tone(v);
  const glow = pre && v >= 8.8 ? { shadowColor: '#38BDF8', shadowOpacity: Math.min(0.85, (v - 8.8) / 0.4), shadowRadius: 6 } : null;
  const st = inline ? { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 } : { position: 'absolute', alignSelf: 'center', bottom: -7, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1.5, borderColor: 'rgba(0,0,0,.4)' };
  return <View style={[st, { backgroundColor: bg }, glow]}><Text style={{ color: '#fff', fontSize: inline ? 11 : 10.5, fontWeight: '800' }}>{comma(v, 1)}</Text></View>;
}

function PitchNode({ C, p, team, val, match, compact, mvp, pre, openRoute }) {
  const size = compact ? 40 : 46;
  const ic = compact ? 14 : 16;
  return (
    <PlayerTap match={match} p={p} openRoute={openRoute} style={{ flex: 1, maxWidth: 72, alignItems: 'center' }}>
      <View>
        <Face C={C} p={p} team={team} size={size} ring={mvp} />
        <Events p={p} size={ic} mvp={mvp} />
        <Badge v={val} pre={pre} />
        {match.status === 'scheduled' && p.playerId && injuryOf(p.playerId) ? <View style={{ position: 'absolute', left: -4, top: -4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#E5484D', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={11} color="#fff" /></View> : null}
      </View>
      <Text numberOfLines={1} style={{ marginTop: 11, maxWidth: '100%', color: '#fff', fontSize: 10.5, fontWeight: '700', backgroundColor: 'rgba(0,0,0,.32)', borderRadius: 999, paddingHorizontal: 6, overflow: 'hidden' }}>{last(p.name)}</Text>
    </PlayerTap>
  );
}

// riga/nodo toccabile: apre pannello o scheda come PlayerLinkN, ma con un contenitore View
function PlayerTap({ match, p, openRoute, style, children }) {
  const go = () => {
    if (!p.name) return;
    const id = ourPlayerId(match, p.name, p.fmId);
    if (!id) return;
    if (matchStarted(match)) openRoute('/giocatore/' + id); else openPanel(id);
  };
  return <Pressable onPress={go} style={style}>{children}</Pressable>;
}

function rowsOf(lineup) {
  const xi = lineup.xi;
  const rows = [[xi[0]]];
  let idx = 1;
  lineup.formation.rows.forEach((c) => { rows.push(xi.slice(idx, idx + c)); idx += c; });
  return rows;
}

const ROW = 86;
const GAP = 34;
function DualPitch({ C, lh, la, home, away, valOf, match, mvpId, pre, openRoute }) {
  const rh = lh ? rowsOf(lh).map((r) => [...r].reverse()) : [];
  const ra = la ? rowsOf(la).reverse() : [];
  const h = (rh.length + ra.length) * ROW + GAP + 52;
  const line = 'rgba(255,255,255,.2)';
  const half = (rows, team) => (
    <View style={{ height: rows.length * ROW, justifyContent: 'space-between' }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ height: ROW, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', gap: 4 }}>
          {row.map((p) => <PitchNode key={p.playerId || p.name} C={C} match={match} p={p} team={team} val={valOf(p)} compact={row.length >= 5} mvp={!!mvpId && p.playerId === mvpId} pre={pre} openRoute={openRoute} />)}
        </View>
      ))}
    </View>
  );
  return (
    <View style={{ height: h, paddingTop: 26, paddingHorizontal: 6, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }}>
      <LinearGradient colors={['#12301f', '#0f2a1b']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: '22%', width: '56%', height: 86, borderWidth: 1.5, borderTopWidth: 0, borderColor: line, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }} />
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: '22%', width: '56%', height: 86, borderWidth: 1.5, borderBottomWidth: 0, borderColor: line, borderTopLeftRadius: 10, borderTopRightRadius: 10 }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: line }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: '50%', width: 92, height: 92, marginLeft: -46, marginTop: -46, borderRadius: 46, borderWidth: 1.5, borderColor: line }} />
      <Text numberOfLines={1} style={{ position: 'absolute', left: 12, top: 10, maxWidth: '60%', zIndex: 2, color: tcol(home), fontSize: 11.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{home ? home.name : ''}</Text>
      <Text numberOfLines={1} style={{ position: 'absolute', right: 12, bottom: 10, maxWidth: '60%', zIndex: 2, color: tcol(away), fontSize: 11.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{away ? away.name : ''}</Text>
      <View>
        {half(rh, home)}
        <View style={{ height: GAP }} />
        {half(ra, away)}
      </View>
    </View>
  );
}

function CoachPill({ C, lineup, team }) {
  if (!lineup || !lineup.coach) return null;
  const c = (team && team.colors) || ['#1B2C4E', '#0E1830'];
  const cc = lineup.coachCc ? flagCodeOf(lineup.coachCc) : '';
  return (
    <View style={{ borderRadius: 999, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, paddingLeft: 6, paddingRight: 20 }}>
      <LinearGradient colors={[c[0], c[1] || c[0]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.4 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,.25)', alignItems: 'center', justifyContent: 'flex-end' }}>
        {lineup.coachId ? <Image source={{ uri: `https://images.fotmob.com/image_resources/playerimages/${lineup.coachId}.png` }} style={{ width: 44, height: 44 }} contentFit="cover" cachePolicy="memory-disk" /> : <Ionicons name="person" size={34} color="rgba(255,255,255,.55)" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 10.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>Allenatore</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 15, fontWeight: '800', flexShrink: 1 }}>{lineup.coach}</Text>
          {cc ? <Image source={{ uri: `${BASE}flags/${cc}.png` }} style={{ width: 16, height: 16, borderRadius: 8 }} contentFit="cover" /> : null}
        </View>
      </View>
    </View>
  );
}

function Bench({ C, lineup, team, valOf, match, pre, openRoute }) {
  if (!lineup || !lineup.bench || !lineup.bench.length) return null;
  return (
    <Panel C={C} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Panchina</Text>
      {lineup.bench.map((p, i) => (
        <PlayerTap key={String(p.playerId) + i} match={match} p={p} openRoute={openRoute} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: C.hair }}>
          <Face C={C} p={p} team={team} size={36} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13.5, fontWeight: '700' }}><Text style={{ color: C.ink3 }}>{p.number} </Text>{p.name}</Text>
            {p.subIn ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><SubIcon size={11} /><Text style={{ color: C.good, fontSize: 10.5 }}>{p.subIn}'</Text></View> : null}
          </View>
          <Badge v={valOf(p)} pre={pre} inline />
        </PlayerTap>
      ))}
    </Panel>
  );
}

function injuredOf(team, lineup, match) {
  if (!team) return [];
  const seen = new Set();
  const out = [];
  const add = (pl) => {
    if (!pl || seen.has(pl.id) || pl.teamId !== team.id) return;
    seen.add(pl.id);
    if (!isOutOn(pl.id, match.date)) return;
    const i = injuryOf(pl.id);
    if (i) out.push({ pl, i });
  };
  playersByTeam(team.id).forEach(add);
  if (lineup) [...(lineup.xi || []), ...(lineup.bench || [])].forEach((p) => add(plOf(p)));
  return out.sort((a, b) => (b.pl.minutes || 0) - (a.pl.minutes || 0));
}

function Injured({ C, list, team }) {
  if (!list.length) return null;
  return (
    <View style={{ borderRadius: 24, overflow: 'hidden', paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(229,72,77,.40)', backgroundColor: 'rgba(229,72,77,.10)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#E5484D', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={14} color="#fff" /></View>
        <Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>Infortunati</Text>
      </View>
      {list.map(({ pl, i }, k) => (
        <Pressable key={pl.id} onPress={() => openPanel(pl.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: k ? 1 : 0, borderTopColor: C.hair }}>
          <Face C={C} p={pl} team={team} size={36} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13.5, fontWeight: '700' }}>{pl.name}</Text>
            <Text numberOfLines={1} style={{ color: C.ink3, fontSize: 11 }}>{i.reason}{i.label ? ` · Rientro: ${i.label}` : ''}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const hasSide = (l) => !!(l && (l.coach || (l.bench && l.bench.length)));
function SidePicker({ C, lh, la, home, away, valOf, match, pre, openRoute }) {
  const sides = [[lh, home], [la, away]].map(([l, t], i) => ({ l, t, i, inj: pre ? injuredOf(t, l, match) : [] })).filter((x) => hasSide(x.l) || x.inj.length);
  const [sel, setSel] = useState(0);
  const cur = sides.length > 1 ? Math.min(sel, sides.length - 1) : 0;
  if (!sides.length) return null;
  const x = sides[cur];
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {sides.length > 1 ? (
        <View style={{ flexDirection: 'row', backgroundColor: C.chip, borderRadius: 999, padding: 4, marginBottom: 12 }}>
          {sides.map((s, k) => (
            <Pressable key={s.i} onPress={() => setSel(k)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: cur === k ? C.thumb : 'transparent', borderWidth: cur === k ? 1 : 0, borderColor: C.thumbBd }}>
              <TeamCrest team={s.t} size={22} C={C} />
              <Text numberOfLines={1} style={{ color: cur === k ? C.ink : C.ink3, fontSize: 13, fontWeight: '800', flexShrink: 1 }}>{s.t ? s.t.name : ''}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={{ gap: 12 }}>
        <CoachPill C={C} lineup={x.l} team={x.t} />
        <Bench C={C} lineup={x.l} team={x.t} valOf={valOf} match={match} pre={pre} openRoute={openRoute} />
        <Injured C={C} list={x.inj} team={x.t} />
      </View>
    </View>
  );
}

const okSide = (l) => !!(l && l.xi && l.xi.length && l.formation);
const okList = (l) => !!(l && l.list && l.list.length === 11);
export const hasLineups = (view) => {
  const l = view.lineup;
  if (!l) return false;
  return (okSide(l.home) && okSide(l.away)) || (okList(l.home) && okList(l.away));
};

// ── Formazione a soli nomi: due colonne, maglietta nel colore della squadra col numero, portiere col colore evidenziatore.
const rgbOf = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(c || '').trim()); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const lumOf = (rgb) => (rgb ? (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255 : 0);
const yellowish = (rgb) => !!rgb && rgb[0] > 150 && rgb[1] > 150 && rgb[2] < 120;
function Shirt({ fill, ink, n, size = 26 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 30">
      <Path d="M8 3 L12 1 Q16 4 20 1 L24 3 L29 9 L25 13 L23 11 L23 28 L9 28 L9 11 L7 13 L3 9 Z" fill={fill} stroke="rgba(0,0,0,.25)" strokeWidth="0.8" />
      {n != null && n !== '' ? <SText x="16" y="21" textAnchor="middle" fontSize={String(n).length > 2 ? 8 : 10} fontWeight="800" fill={ink}>{String(n)}</SText> : null}
    </Svg>
  );
}
function ListColumn({ C, lineup, team, match, right, openRoute }) {
  const c = (team && team.colors && team.colors[0]) || '#1B2C4E';
  const rgb = rgbOf(c);
  const ink = lumOf(rgb) > 0.6 ? '#111' : '#fff';
  const gkFill = yellowish(rgb) ? C.gkAlt : C.gk;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, justifyContent: right ? 'flex-end' : 'flex-start' }}>
        {right ? null : <TeamCrest team={team} size={20} C={C} />}
        <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 11.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', flexShrink: 1 }}>{team ? team.name : ''}</Text>
        {right ? <TeamCrest team={team} size={20} C={C} /> : null}
      </View>
      {lineup.list.map((p, i) => (
        <PlayerTap key={p.name + i} match={match} p={p} openRoute={openRoute} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, borderTopWidth: i ? 1 : 0, borderTopColor: C.hair }}>
          <Shirt fill={p.gk ? gkFill : c} ink={p.gk ? C.gkInk : ink} n={p.number} />
          <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13, fontWeight: '700', flexShrink: 1 }}>{p.name}</Text>
        </PlayerTap>
      ))}
    </View>
  );
}

const LINES = { tiri: [0.5, 1.5, 2.5, 3.5], porta: [0.5, 1.5, 2.5], fc: [0.5, 1.5, 2.5], fs: [0.5, 1.5, 2.5] };
const FOUL_LINES = [0.5, 1.5, 2.5];
const Chip = ({ C, on, onPress, children }) => (
  <Pressable onPress={onPress} style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: on ? C.thumb : C.chip, borderWidth: on ? 1 : 0, borderColor: C.thumbBd }}>
    <Text style={{ color: on ? C.ink : C.ink3, fontSize: 12.5, fontWeight: '700' }}>{children}</Text>
  </Pressable>
);

export default function Formazioni({ C, match, view, home, away, pre, openRoute }) {
  const lh = view.lineup ? view.lineup.home : null;
  const la = view.lineup ? view.lineup.away : null;
  const okH = okSide(lh);
  const okA = okSide(la);
  const [stat, setStat] = useState('tiri');
  const [line, setLine] = useState(1.5);
  const [fouls, setFouls] = useState({});
  const isF = stat === 'fc' || stat === 'fs';
  const lastV = useRef({});
  const players = [lh, la].flatMap((l) => (l ? [...(l.xi || []), ...(l.bench || [])] : []));
  const pk = players.map((p) => p.playerId).join(',');
  useEffect(() => {
    if (!pre || !isF || fouls[stat]) return undefined;
    let on = true;
    Promise.all(players.map((p) => {
      const pl = plOf(p);
      return pl && !isOutOn(pl.id, match.date) ? loadPlayerFouls(pl, match.date, FOUL_LINES, stat) : Promise.resolve(null);
    })).then((rows) => {
      if (!on) return;
      const m = {};
      players.forEach((p, i) => { m[p.playerId] = rows[i]; });
      setFouls((f) => ({ ...f, [stat]: m }));
    });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stat, pre, pk]);
  const valOf = (p) => {
    const pl = plOf(p);
    if (pre) {
      if (!pl) return null;
      if (isF) {
        const tab = fouls[stat];
        if (!tab) return lastV.current[p.playerId] === undefined ? null : lastV.current[p.playerId];
        const row = tab[p.playerId];
        const v = row ? row[FOUL_LINES.indexOf(line)] : null;
        lastV.current[p.playerId] = v == null ? null : v;
        return v == null ? null : v;
      }
      const r = playerReliability(pl, match.date, line, false, stat === 'porta' ? 'inPorta' : 'totali');
      lastV.current[p.playerId] = r ? r.voto : null;
      return r ? r.voto : null;
    }
    return p.rating;
  };
  const onStat = (k) => { setStat(k); setLine((l) => (LINES[k].includes(l) ? l : 2.5)); };
  const official = (okH || okA) && (lh || la).confirmed !== false && view.lineupType !== undefined && /^(standard|official|confirm)/i.test(String(view.lineupType || ''));
  let mvpId = null;
  if (!pre) {
    let best = 0;
    [lh, la].forEach((l) => l && [...(l.xi || []), ...(l.bench || [])].forEach((p) => { if (p.rating != null && p.rating > best) { best = p.rating; mvpId = p.playerId; } }));
  }
  const title = pre ? (official ? 'Formazione ufficiale' : 'Formazione probabile') : 'Formazioni';
  const labels = okH && okA && (lh.formation.label || la.formation.label) ? (
    <Text style={{ marginTop: 4, fontSize: 13, fontWeight: '800', textAlign: 'center' }}>
      <Text style={{ color: C.ink2 }}>{lh.formation.label}</Text>
      {lh.formation.label && la.formation.label ? <Text style={{ color: C.ink3 }}>  ·  </Text> : null}
      <Text style={{ color: C.ink2 }}>{la.formation.label}</Text>
    </Text>
  ) : null;
  return (
    <View style={{ gap: 20, paddingTop: 12, paddingBottom: 24 }}>
      {okH && okA ? (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: C.ink, fontSize: 15, fontWeight: '800' }}>{title}</Text>
            {labels}
          </View>
          {pre ? (
            <View style={{ marginBottom: 12, gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>{TOP_STATS.map((s) => <Chip key={s.key} C={C} on={stat === s.key} onPress={() => onStat(s.key)}>{s.short}</Chip>)}</View>
              <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>{LINES[stat].map((l) => <Chip key={l} C={C} on={line === l} onPress={() => setLine(l)}>{`Over ${String(l).replace('.', ',')}`}</Chip>)}</View>
            </View>
          ) : null}
          <DualPitch C={C} lh={lh} la={la} home={home} away={away} valOf={valOf} match={match} mvpId={mvpId} pre={pre} openRoute={openRoute} />
          {pre ? null : <Text style={{ color: C.ink3, fontSize: 10.5, textAlign: 'center', marginTop: 8 }}>Voto = prestazione in partita</Text>}
        </View>
      ) : okList(lh) && okList(la) ? (
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ color: C.ink, fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>{pre ? 'Formazione ufficiale' : 'Formazioni'}</Text>
          <Panel C={C} style={{ flexDirection: 'row', gap: 12, padding: 12 }}>
            <ListColumn C={C} lineup={lh} team={home} match={match} openRoute={openRoute} />
            <ListColumn C={C} lineup={la} team={away} match={match} right openRoute={openRoute} />
          </Panel>
        </View>
      ) : null}
      <SidePicker C={C} lh={lh} la={la} home={home} away={away} valOf={valOf} match={match} pre={pre} openRoute={openRoute} />
    </View>
  );
}
