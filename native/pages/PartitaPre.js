// Statistiche della partita non iniziata (nativo): Previste e tabelle "fatti vs subiti" per squadra.
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { teamsOf } from '@/data/teams';
import { hasMetrics, metricOf } from '@/data/standings';
import { archiveMetrics } from '@/data/archiveMetrics';
import { bandColor } from '@/components/player/playerCalc';
import { comma } from '@/lib/format';
import { Panel, TeamCrest, Segmented } from '../shared/ui';

// ── Previste: per ogni squadra (fatti suoi + subiti dall'avversaria) / 2; fattore casa +15% / -15% solo su tiri, in porta, corner.
const HOME_F = 1.15;
const AWAY_F = 0.85;
const ROWS = [
  ['Tiri', 'tiri', 'tiriConcessi', true],
  ['Tiri in porta', 'tiriInPorta', 'tiriInPortaConcessi', true],
  ['Corner', 'corner', 'cornerConcessi', true],
  ['Falli', 'falli', 'fallisubiti', false],
  ['Fuorigioco', 'fuorigioco', 'fuorigiocoAvv', false],
  ['Cartellini', 'gialli', 'gialliAvv', false],
];
const hex = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : null);
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const dist = (a, b) => { const x = rgb(a); const y = rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
const lift = (c) => `#${rgb(c).map((v) => Math.round(v * 0.62 + 255 * 0.38).toString(16).padStart(2, '0')).join('')}`;
const pick = (t, i = 0) => hex(t && t.colors && t.colors[i]) || '#4A78F0';
const bright = (c) => { const x = rgb(c); return 0.299 * x[0] + 0.587 * x[1] + 0.114 * x[2]; };

export function predictedRows(home, away, match) {
  if (!home || !away) return [];
  const am = match && match.archive ? archiveMetrics(match) : null;
  const val = (team, key) => (am ? am.value(team.id === home.id ? match.archive.hid : match.archive.aid, key) : metricOf(team.id, key));
  return ROWS.map(([label, own, conc, hf]) => {
    const a1 = val(home, own); const a2 = val(away, conc);
    const b1 = val(away, own); const b2 = val(home, conc);
    if ([a1, a2, b1, b2].some((v) => v === null || v === undefined || Number.isNaN(v))) return null;
    const h = ((a1 + a2) / 2) * (hf ? HOME_F : 1);
    const a = ((b1 + b2) / 2) * (hf ? AWAY_F : 1);
    if (!(h + a > 0)) return null;
    return { label, h, a, hf };
  }).filter(Boolean);
}

function Predicted({ C, home, away, match, openRoute }) {
  const rows = predictedRows(home, away, match);
  if (!rows.length) return null;
  let ch = pick(home);
  let ca = pick(away);
  if (dist(ch, ca) < 90) ca = pick(away, 1);
  if (dist(ch, ca) < 90) ca = '#8592A6';
  const base = (c) => (bright(c) < 70 ? lift(c) : c);
  const f = (v) => comma(v, 1);
  return (
    <Panel C={C} style={{ marginHorizontal: 16, borderRadius: 26 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.hair }}>
        <Pressable onPress={() => openRoute('/squadra/' + home.id)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}><TeamCrest team={home} size={34} C={C} /><Text numberOfLines={1} style={{ color: C.ink, fontSize: 14, fontWeight: '700', flexShrink: 1 }}>{home.name}</Text></Pressable>
        <Text style={{ color: C.ink3, fontSize: 10.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>Previste</Text>
        <Pressable onPress={() => openRoute('/squadra/' + away.id)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}><Text numberOfLines={1} style={{ color: C.ink, fontSize: 14, fontWeight: '700', flexShrink: 1 }}>{away.name}</Text><TeamCrest team={away} size={34} C={C} /></Pressable>
      </View>
      {rows.map((r, i) => {
        const pa = (r.h / (r.h + r.a)) * 100;
        return (
          <View key={r.label} style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 15, borderTopWidth: i ? 1 : 0, borderTopColor: C.hair }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: C.ink, fontSize: 22, fontWeight: '800' }}>{f(r.h)}</Text>
              <View style={{ alignItems: 'center', gap: 3 }}>
                <Text style={{ color: C.ink2, fontSize: 12, fontWeight: '700' }}>{r.label}</Text>
                {r.hf ? <Text style={{ color: C.accent, backgroundColor: C.accTint, fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' }}>Fattore casa</Text> : null}
              </View>
              <Text style={{ color: C.ink, fontSize: 22, fontWeight: '800' }}>{f(r.a)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 3, height: 10, marginTop: 10 }}>
              <LinearGradient colors={[base(ch), lift(base(ch))]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${pa}%`, borderTopLeftRadius: 5, borderBottomLeftRadius: 5, borderTopRightRadius: 2, borderBottomRightRadius: 2 }} />
              <LinearGradient colors={[lift(base(ca)), base(ca)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderTopRightRadius: 5, borderBottomRightRadius: 5, borderTopLeftRadius: 2, borderBottomLeftRadius: 2 }} />
            </View>
          </View>
        );
      })}
    </Panel>
  );
}

// ── Tabelle "fatti vs subiti" con la posizione in campionato (concept A).
const PAIRS = [
  ['gol', 'golSubiti', 'Gol'], ['xg', 'xgSubiti', 'xG'], ['tiri', 'tiriConcessi', 'Tiri'], ['tiriInPorta', 'tiriInPortaConcessi', 'Tiri in porta'],
  ['occasioni', 'occasioniConcesse', 'Occasioni nitide'], ['corner', 'cornerConcessi', 'Corner'], ['falli', 'fallisubiti', 'Falli'],
];
const rk = (team, key, ctx) => {
  const rows = (ctx ? ctx.am.tids().map((tid) => ({ id: tid, v: ctx.am.value(tid, key) })) : teamsOf(team.leagueId).filter((t) => hasMetrics(t.id)).map((t) => ({ id: t.id, v: metricOf(t.id, key) })))
    .filter((r) => r.v !== null && r.v !== undefined).sort((a, b) => b.v - a.v);
  const me = ctx ? ctx.tid(team) : team.id;
  const mine = rows.find((r) => String(r.id) === String(me));
  if (!mine) return null;
  return { rank: 1 + rows.filter((r) => r.v > mine.v).length, total: rows.length, v: mine.v, max: rows[0].v };
};
const frac = (r) => (r.total > 1 ? (r.total - r.rank) / (r.total - 1) : 1);
const f2 = (v) => comma(v, 2);
const ord = (r) => `${r.rank}º`;
function build(me, op, ctx) {
  const rows = PAIRS.map(([a, b, label]) => {
    const m = rk(me, a, ctx); const o = rk(op, b, ctx);
    if (!m || !o) return null;
    return { key: a, label, m, o, s: (frac(m) + frac(o)) / 2, hl: a !== 'falli' };
  }).filter(Boolean);
  return { rows, best: rows.filter((r) => r.hl && frac(r.m) >= 0.6 && frac(r.o) >= 0.6).sort((x, y) => y.s - x.s).slice(0, 3) };
}
const ctxOf = (match, home) => {
  if (!(match && match.archive)) return null;
  const am = archiveMetrics(match);
  return am ? { am, tid: (t) => (t.id === home.id ? match.archive.hid : match.archive.aid) } : null;
};
export function preStatsOk(match, home, away) {
  if (!home || !away) return false;
  if (match && match.archive) { const am = archiveMetrics(match); return !!am && am.has(match.archive.hid) && am.has(match.archive.aid); }
  return hasMetrics(home.id) && hasMetrics(away.id);
}
export function preTableOk(match, home, away, side) {
  if (!home || !away) return false;
  const ctx = ctxOf(match, home);
  const [me, op] = side === 'away' ? [away, home] : [home, away];
  if (!(ctx ? ctx.am.has(ctx.tid(me)) && ctx.am.has(ctx.tid(op)) : hasMetrics(me.id) && hasMetrics(op.id))) return false;
  return build(me, op, ctx).rows.length > 0;
}

const Pill = ({ r }) => <Text style={{ color: '#fff', backgroundColor: bandColor(frac(r)), fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, overflow: 'hidden' }}>{ord(r)}</Text>;

function TeamTable({ C, me, op, side, ctx, openRoute }) {
  if (!me || !op || !(ctx ? ctx.am.has(ctx.tid(me)) && ctx.am.has(ctx.tid(op)) : hasMetrics(me.id) && hasMetrics(op.id))) return null;
  const { rows, best } = build(me, op, ctx);
  if (!rows.length) return null;
  const isBest = (k) => best.some((b) => b.key === k);
  return (
    <Panel C={C} style={{ marginHorizontal: 16, paddingBottom: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
        <TeamCrest team={me} size={26} C={C} />
        <Pressable onPress={() => openRoute('/squadra/' + me.id)} style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: C.ink, fontSize: 14.5, fontWeight: '800' }}>{me.name}</Text>
          <Text numberOfLines={1} style={{ color: C.ink3, fontSize: 10.5 }}>{side} · {me.short || me.name} fatti vs {op.short || op.name} subiti</Text>
        </Pressable>
        <TeamCrest team={op} size={20} C={C} />
      </View>
      {best.length ? (
        <View style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.accTint, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ color: C.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Punti forti del match</Text>
          {best.map((b) => (
            <View key={b.key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3 }}>
              <Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '700', flex: 1 }}>{b.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Pill r={b.m} /><Text style={{ color: C.ink2, fontSize: 12.5 }}>fatti</Text><Text style={{ color: C.ink3, fontSize: 12.5 }}>vs</Text><Pill r={b.o} /><Text style={{ color: C.ink2, fontSize: 12.5 }}>subiti</Text></View>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 4 }}>
        <Text style={{ flex: 1, color: C.ink3, fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>Statistica</Text>
        <Text style={{ width: 78, textAlign: 'right', color: C.ink3, fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase' }} numberOfLines={1}>{me.short || me.name} fatti</Text>
        <Text style={{ width: 78, textAlign: 'right', color: C.ink3, fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase' }} numberOfLines={1}>{op.short || op.name} subiti</Text>
      </View>
      {rows.map((r) => (
        <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.hair, backgroundColor: isBest(r.key) ? C.accTint : 'transparent' }}>
          <Text style={{ flex: 1, color: C.ink, fontSize: 12.5, fontWeight: '600' }}>{r.label}</Text>
          <View style={{ width: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}><Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '800' }}>{f2(r.m.v)}</Text><Pill r={r.m} /></View>
          <View style={{ width: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}><Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '800' }}>{f2(r.o.v)}</Text><Pill r={r.o} /></View>
        </View>
      ))}
    </Panel>
  );
}

// una pillola alla volta: squadra di casa, squadra in trasferta, Previste (predefinita); solo i blocchi con dati
export default function StatistichePre({ C, match, home, away, openRoute }) {
  const [tab, setTab] = useState('pred');
  const opts = [
    home && away && preTableOk(match, home, away, 'home') ? { value: 'home', team: home } : null,
    home && away && preTableOk(match, home, away, 'away') ? { value: 'away', team: away } : null,
    predictedRows(home, away, match).length ? { value: 'pred', label: 'Previste' } : null,
  ].filter(Boolean);
  if (!opts.length) return null;
  const cur = opts.some((o) => o.value === tab) ? tab : opts[opts.length - 1].value;
  const ctx = ctxOf(match, home);
  return (
    <View style={{ paddingTop: 12, paddingBottom: 16, gap: 12 }}>
      <View style={{ marginHorizontal: 16 }}>
        <Segmented C={C} value={cur} onChange={setTab} options={opts.map((o) => ({ value: o.value, label: o.team ? (o.team.name.length <= 10 ? o.team.name : o.team.short || o.team.name) : o.label, icon: o.team ? <TeamCrest team={o.team} size={18} C={C} /> : null }))} />
      </View>
      {cur === 'pred' ? <Predicted C={C} home={home} away={away} match={match} openRoute={openRoute} />
        : cur === 'home' ? <TeamTable C={C} me={home} op={away} side="In casa" ctx={ctx} openRoute={openRoute} />
        : <TeamTable C={C} me={away} op={home} side="In trasferta" ctx={ctx} openRoute={openRoute} />}
    </View>
  );
}
