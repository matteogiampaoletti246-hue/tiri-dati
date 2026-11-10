// Riquadri informativi della partita (nativi): scheda stadio con meteo e arbitro, arbitro con barre e Over/Under, forma recente.
// Si usano nel Riepilogo e nella Panoramica. Stessi dati del sito (@/data/*).
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect } from 'react-native-svg';
import { BASE } from '@/data/load';
import { loadWeather } from '@/data/weather';
import { refereeById, findRefereeByName, refStatsIn, leagueRefAvg, flagCodeOf } from '@/data/referees';
import { leagueById } from '@/data/leagues';
import { teamById } from '@/data/teams';
import { teamColor } from '@/lib/tint';
import { recentMatches } from '@/data/extras';
import { BAND_COLORS, bandOf } from '@/components/player/playerCalc';
import { Panel, Face, TeamCrest, Segmented } from '../shared/ui';
import MAPPA from '../shared/stadiMappa.json';

export const SubIcon = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8 4v15M4 15l4 4 4-4" stroke="#E5484D" />
    <Path d="M16 20V5M12 9l4-4 4 4" stroke="#2FBF71" />
  </Svg>
);
export const CardIcon = ({ red = false, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Rect x="6.5" y="3.5" width="11" height="17" rx="2.2" fill={red ? '#E5484D' : '#F2C230'} /></Svg>
);

const TitleRow = ({ C, children }) => <Text style={{ color: C.ink3, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{children}</Text>;
const f1 = (v) => (v == null ? '' : (Math.round(v * 10) / 10).toString().replace('.', ','));

// ── Stadio: foto con nome e squadra di casa (foto da Wikimedia Commons, nel repository), sotto Meteo | Arbitro.
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const BY_NAME = new Map(Object.entries(MAPPA).map(([k, f]) => [norm(k), f]));
const PHOTO = 'https://raw.githubusercontent.com/matteogiampaoletti246-hue/tiri-dati/main/aurora-src/stadi/';
const photoOf = (name, team) => {
  const f = (team && BY_NAME.get(norm(`${name} ${team}`))) || BY_NAME.get(norm(name));
  return f ? PHOTO + f : null;
};
const WEATHER = { sun: ['sun', 'Sereno'], cloud: ['cloud', 'Nuvoloso'], rain: ['cloud-rain', 'Pioggia'], wind: ['wind', 'Ventoso'] };

function WxCard({ C, wx, w }) {
  return (
    <View style={{ flex: 1, borderRadius: 16, backgroundColor: C.accTint, padding: 12, justifyContent: 'space-between', minHeight: 84 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: C.ink3, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>Meteo</Text>
        <Feather name={w[0]} size={18} color={C.accent} />
      </View>
      <View>
        <Text style={{ color: C.ink, fontSize: 26, fontWeight: '800' }}>{wx.temp}°</Text>
        <Text style={{ color: C.ink2, fontSize: 11 }}>{w[1]}{wx.wind != null ? ` · ${wx.wind} km/h` : ''}</Text>
      </View>
    </View>
  );
}

function RefTile({ C, rf, name, cc, games, openRoute }) {
  const flag = cc ? flagCodeOf(cc) : '';
  const body = (
    <>
      <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' }}>
        {rf && rf.photo ? <Image source={{ uri: rf.photo }} style={{ width: 40, height: 40 }} contentFit="cover" cachePolicy="memory-disk" /> : <Ionicons name="person" size={20} color={C.ink3} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.ink3, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>Arbitro</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {flag ? <Image source={{ uri: `${BASE}flags/${flag}.png` }} style={{ width: 14, height: 14, borderRadius: 7 }} contentFit="cover" /> : null}
          <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13.5, fontWeight: '700', flexShrink: 1 }}>{name}</Text>
        </View>
        {games ? <Text style={{ color: C.ink3, fontSize: 11 }}>{games}</Text> : null}
      </View>
    </>
  );
  const st = { flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: C.chip, padding: 12, minHeight: 84 };
  return rf ? <Pressable onPress={() => openRoute('/arbitro/' + rf.id)} style={st}>{body}</Pressable> : <View style={st}>{body}</View>;
}

function WxRef({ C, match, wx, w, rf, name, openRoute }) {
  if (!w && !name) return null;
  const cc = (rf && rf.cc) || (match.refFm && match.refFm.cc) || '';
  const two = match.refTwo;
  return (
    <View style={{ flexDirection: 'row', gap: 8, padding: 10 }}>
      {w ? <WxCard C={C} wx={wx} w={w} /> : null}
      {name ? <RefTile C={C} rf={rf} name={name} cc={cc} openRoute={openRoute} games={two && two.n ? `${two.n} ${two.n === 1 ? 'gara' : 'gare'} ${two.seasons > 1 ? 'in 2 stagioni' : 'in stagione'}` : ''} /> : null}
    </View>
  );
}

export function StadioCard({ C, match, openRoute }) {
  const [, bump] = useState(0);
  useEffect(() => {
    let on = true;
    loadWeather(match).then((w) => w && on && bump((n) => n + 1));
    return () => { on = false; };
  }, [match.id]);
  const wx = match.weather && match.weather.temp != null ? match.weather : null;
  const w = wx && (WEATHER[wx.icon] || WEATHER.cloud);
  const rf = match.refereeId ? refereeById(match.refereeId) : null;
  const name = rf ? rf.name : match.refereeName;
  const home = teamById(match.homeId);
  const uri = match.stadium ? photoOf(match.stadium, home && home.name) : null;
  if (!match.stadium && !w && !name) return null;
  return (
    <Panel C={C} style={{ marginHorizontal: 20 }}>
      {uri ? (
        <View style={{ height: 150, backgroundColor: teamColor(home) }}>
          <Image source={{ uri }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.72)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 }} />
          <View style={{ position: 'absolute', left: 14, right: 14, bottom: 10 }}>
            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{match.stadium}</Text>
            {home ? <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12 }}>{home.name}</Text> : null}
          </View>
        </View>
      ) : match.stadium ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 12 }}>
          <Ionicons name="trail-sign-outline" size={15} color={C.ink3} />
          <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13.5, fontWeight: '700', flexShrink: 1 }}>{match.stadium}</Text>
        </View>
      ) : null}
      <WxRef C={C} match={match} wx={wx} w={w} rf={rf} name={name} openRoute={openRoute} />
    </Panel>
  );
}

// ── Arbitro: ammonizioni e falli a partita contro la media del campionato, poi Over/Under cartellini.
const fracIn = (sorted, v) => {
  if (!sorted || sorted.length < 2) return null;
  let below = 0;
  sorted.forEach((x) => { if (x <= v) below += 1; });
  return Math.max(0, Math.min(1, (below - 1) / (sorted.length - 1)));
};

export function RefBar({ C, label, v, avg, sorted }) {
  const top = Math.max(avg * 1.7, v * 1.05, 0.0001);
  const frac = fracIn(sorted, v);
  const col = frac !== null ? BAND_COLORS[bandOf(frac)] : C.ink;
  const w = Math.max(3, Math.min(100, (v / top) * 100));
  const ax = Math.min(100, (avg / top) * 100);
  const lx = Math.min(88, Math.max(12, ax));
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: C.ink3, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ color: col, backgroundColor: `${col}26`, fontSize: 19, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' }}>{f1(v)}</Text>
      </View>
      <View style={{ marginTop: 26, height: 9 }}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 5, backgroundColor: C.chip, overflow: 'hidden' }}>
          <LinearGradient colors={[`${col}88`, col]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${w}%`, height: '100%', borderRadius: 5 }} />
        </View>
        <View style={{ position: 'absolute', left: `${ax}%`, top: -4, bottom: -4, width: 2, backgroundColor: C.ink, opacity: 0.85 }} />
        <View style={{ position: 'absolute', left: `${lx}%`, top: -24, width: 80, marginLeft: -40, alignItems: 'center' }}>
          <Text style={{ color: C.ink2, fontSize: 9.5, fontWeight: '700', backgroundColor: C.chip, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' }}>media {f1(avg)}</Text>
        </View>
      </View>
    </View>
  );
}

// Over/Under cartellini: % delle gare arbitrate nelle ultime 2 stagioni sopra o sotto la linea, per 1T o totale.
const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const p = hex2(a); const q = hex2(b); return `#${p.map((x, i) => Math.round(x + (q[i] - x) * t).toString(16).padStart(2, '0')).join('')}`; };
const underColor = (p, dark) => {
  const S = dark ? [[0, '#EF4444'], [40, '#FB923C'], [60, '#FACC15'], [75, '#86EFAC'], [90, '#16A34A']] : [[0, '#DC2626'], [40, '#FB923C'], [60, '#EAB308'], [75, '#4ADE80'], [90, '#15803D']];
  if (p >= 90) return S[4][1];
  let i = 0;
  while (i < 3 && p >= S[i + 1][0]) i += 1;
  return mix(S[i][1], S[i + 1][1], Math.max(0, Math.min(1, (p - S[i][0]) / (S[i + 1][0] - S[i][0]))));
};
const LINES = { t: [2.5, 3.5, 4.5, 5.5, 6.5], 1: [0.5, 1.5, 2.5, 3.5] };
function useTween(target, dur = 800) {
  const [v, setV] = useState(0);
  const cur = useRef(0);
  useEffect(() => {
    const from = cur.current;
    const t0 = Date.now();
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / dur);
      cur.current = from + (target - from) * (1 - Math.pow(1 - k, 3));
      setV(cur.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}
export function UnderBar({ C, games }) {
  const [side, setSide] = useState('u');
  const [time, setTime] = useState('1');
  const [line, setLine] = useState(2.5);
  const idx = time === 't' ? 8 : 9;
  const rows = (games || []).filter((x) => typeof x[idx] === 'number');
  const lines = LINES[time];
  const ln = lines.includes(line) ? line : lines[Math.min(1, lines.length - 1)];
  const hit = rows.filter((x) => (side === 'u' ? x[idx] < ln : x[idx] > ln)).length;
  const pct = rows.length ? Math.round((hit / rows.length) * 100) : 0;
  const shownP = useTween(pct);
  if (rows.length < 5) return null;
  const col = underColor(shownP, C.dark);
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.hair }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Segmented C={C} value={side} onChange={setSide} options={[{ value: 'o', label: 'Over' }, { value: 'u', label: 'Under' }]} /></View>
        <View style={{ flex: 1 }}><Segmented C={C} value={time} onChange={(v) => { setTime(v); setLine(v === 't' ? 3.5 : 2.5); }} options={[{ value: 't', label: 'Totale' }, { value: '1', label: '1T' }]} /></View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
        {lines.map((l) => (
          <Pressable key={l} onPress={() => setLine(l)} style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 999, backgroundColor: l === ln ? C.thumb : C.chip, borderWidth: l === ln ? 1 : 0, borderColor: C.thumbBd }}>
            <Text style={{ color: l === ln ? C.ink : C.ink3, fontSize: 12.5, fontWeight: '700' }}>{String(l).replace('.', ',')}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 12 }}>
        <Text style={{ color: col, fontSize: 28, fontWeight: '800' }}>{Math.round(shownP)}%</Text>
        <Text style={{ color: C.ink3, fontSize: 10.5 }}>{hit} su {rows.length} gare</Text>
      </View>
      <View style={{ height: 12, borderRadius: 6, backgroundColor: C.chip, overflow: 'hidden', marginTop: 10 }}>
        <View style={{ width: `${Math.max(shownP, 2)}%`, height: '100%', borderRadius: 6, backgroundColor: col }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ color: C.ink3, fontSize: 9.5 }}>0%</Text><Text style={{ color: C.ink3, fontSize: 9.5 }}>50%</Text><Text style={{ color: C.ink3, fontSize: 9.5 }}>100%</Text>
      </View>
    </View>
  );
}

export function RefereeCard({ C, match, openRoute }) {
  const r = (match.refereeId && refereeById(match.refereeId)) || findRefereeByName(match.refereeName);
  const name = r ? r.name : match.refereeName;
  if (!name) return null;
  const fmRef = match.refFm;
  const ex = match.refExtra;
  const two = match.refTwo;
  const st = two || (r ? refStatsIn(r, match.leagueId) : fmRef && fmRef.ya != null ? { n: fmRef.mt || 0, y: fmRef.ya, fo: fmRef.foa || 0 } : ex ? { n: ex.n, y: ex.y, fo: ex.fo } : null);
  const lg = (two && two.lg) || (r ? leagueRefAvg(match.leagueId) : null) || match.refLg || null;
  const when = two ? (two.seasons > 1 ? 'nelle ultime 2 stagioni' : "nell'ultima stagione") : 'questa stagione';
  const barY = st && lg && st.y != null && lg.y != null;
  const barF = st && lg && st.fo != null && lg.fo != null;
  const flag = r && r.cc ? flagCodeOf(r.cc) : fmRef && fmRef.cc ? flagCodeOf(fmRef.cc) : '';
  const head = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
      <View style={{ width: 46, height: 46, borderRadius: 23, overflow: 'hidden', backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' }}>
        {r && r.photo ? <Image source={{ uri: r.photo }} style={{ width: 46, height: 46 }} contentFit="cover" cachePolicy="memory-disk" /> : <Ionicons name="person" size={22} color={C.ink3} />}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {flag ? <Image source={{ uri: `${BASE}flags/${flag}.png` }} style={{ width: 18, height: 18, borderRadius: 9 }} contentFit="cover" /> : null}
          <Text numberOfLines={1} style={{ color: C.ink, fontSize: 15, fontWeight: '800', flexShrink: 1 }}>{name}</Text>
        </View>
        <Text style={{ color: C.ink3, fontSize: 11.5 }}>{st ? `${st.n} ${st.n === 1 ? 'gara' : 'gare'} ${when}` : 'Arbitro'}</Text>
      </View>
    </View>
  );
  const lgName = (leagueById(match.leagueId) || match.leagueObj || {}).name || '';
  return (
    <Panel C={C} style={{ marginHorizontal: 16 }}>
      {r ? <Pressable onPress={() => openRoute('/arbitro/' + r.id)}>{head}</Pressable> : head}
      {barY || barF ? (
        <View style={{ borderTopWidth: 1, borderTopColor: C.hair }}>
          {barY ? <RefBar C={C} label={two ? 'Cartellini / partita' : 'Ammonizioni / partita'} v={st.y} avg={lg.y} sorted={lg.ys} /> : null}
          {barF ? <View style={barY ? { borderTopWidth: 1, borderTopColor: C.hair } : null}><RefBar C={C} label="Falli fischiati / partita" v={st.fo} avg={lg.fo} sorted={lg.fos} /></View> : null}
          <Text style={{ color: C.ink3, fontSize: 10.5, paddingHorizontal: 16, paddingBottom: 12 }}>| {two ? `media ${two.seasons > 1 ? 'ultime 2 stagioni' : 'stagione'} arbitri` : 'media stagionale arbitri'} {lgName}</Text>
        </View>
      ) : null}
      {two && two.m ? <UnderBar C={C} games={two.m} /> : null}
    </Panel>
  );
}

// ── Forma: ultime 5 partite della squadra in tutte le competizioni, prima di questa partita.
const PTS = { V: 3, S: 1, P: 0 };
const keyOf = (m) => `${m.date}|${[m.homeId, m.awayId].sort().join('|')}`;
const recentOfMatch = (match, id) => {
  const seen = new Set();
  const out = [];
  const a = match.recentOf ? match.recentOf(id) : [];
  const b = recentMatches(id, 80).filter((m) => m.id !== match.id && (!match.ts || m.ts < match.ts));
  [...b, ...a].forEach((m) => { const k = keyOf(m); if (!seen.has(k) && Array.isArray(m.score)) { seen.add(k); out.push(m); } });
  return out.sort((x, y) => y.ts - x.ts).slice(0, 5);
};
const resOf = (m, teamId) => {
  if (!Array.isArray(m.score)) return null;
  const isHome = m.homeId === teamId;
  const gf = isHome ? m.score[0] : m.score[1];
  const ga = isHome ? m.score[1] : m.score[0];
  return { r: gf > ga ? 'V' : gf === ga ? 'S' : 'P', gf, ga, opp: teamById(isHome ? m.awayId : m.homeId) };
};
const MON = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

export function FormCard({ C, match, home, away, openRoute }) {
  const sides = [{ team: home, id: match.homeId }, { team: away, id: match.awayId }].filter(({ id }) => recentOfMatch(match, id).some((m) => resOf(m, id)));
  if (!sides.length) return null;
  const COL = { V: C.good, S: C.ink3, P: C.bad };
  return (
    <Panel C={C} style={{ marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 14 }}>
      <TitleRow C={C}>Forma recente</TitleRow>
      <Text style={{ color: C.ink3, fontSize: 9, textAlign: 'right', marginTop: 4 }}>più recente</Text>
      {sides.map(({ team, id }, i) => {
        const list = recentOfMatch(match, id).slice().reverse();
        return (
          <View key={i} style={{ paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: C.hair }}>
            <Pressable onPress={() => team && openRoute('/squadra/' + team.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <TeamCrest team={team} size={20} C={C} /><Text style={{ color: C.ink, fontSize: 13, fontWeight: '700' }}>{team ? team.name : ''}</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {list.map((m, k) => {
                const x = resOf(m, id);
                if (!x) return null;
                const [, mm, dd] = String(m.date).split('-').map(Number);
                const col = COL[x.r];
                const last = k === list.length - 1;
                return (
                  <Pressable key={m.id} onPress={() => openRoute('/match/' + m.id)} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6, borderRadius: 12, backgroundColor: `${col}1F`, borderBottomWidth: 2, borderBottomColor: col, borderWidth: last ? 1.5 : 0, borderColor: col }}>
                    <TeamCrest team={x.opp} size={17} C={C} />
                    <Text style={{ color: C.ink, fontSize: 11.5, fontWeight: '700' }}>{x.gf}–{x.ga}</Text>
                    <Text style={{ color: C.ink3, fontSize: 8.5, textTransform: 'uppercase' }}>{dd} {MON[mm - 1]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </Panel>
  );
}
