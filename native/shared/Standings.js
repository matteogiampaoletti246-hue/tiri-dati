// Classifica nativa: tabella unica per campionato attuale (con FotMob fresca e risultato live) e per stagioni d'archivio / gironi.
// Stessi calcoli del sito (StandingsTable.jsx, archive/parts.jsx). Righe normalizzate: { key, rank, mv, name, logo, played, won, drawn, lost, gfga, pts, lv, zone, form, fp, to }.
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import './shim';
import { TeamCrest, Segmented } from './ui';
import { FormDots } from '../pages/PartitaHero';
import { useLiveTable, freshGroup, applyLive } from '@/data/liveTable';
import { FM_ID, teamLogo, isCurrent } from '@/data/archive';
import { teamById, teamByFm, teamByName } from '@/data/teams';
import { sameSquad } from '@/data/teamMatch';
import { standings, zoneOf } from '@/data/standings';

const W = { rank: 24, num: 22, gfga: 40, pts: 30, form: 92 };
const HEAD = { fontSize: 9.5, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' };

export function TeamLogoN({ id, name, size = 22, C }) {
  const [bad, setBad] = useState(false);
  if (!id || bad) return <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip }}><Text style={{ color: C.ink2, fontSize: Math.max(8, size * 0.36), fontWeight: '800' }}>{String(name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase()}</Text></View>;
  return <TeamCrest team={{ crest: teamLogo(id), initials: '' }} size={size} C={C} />;
}

function LivePill({ C, lv }) {
  if (!lv) return null;
  return (
    <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: C.live }}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' }} />
      <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '800' }}>{lv.us}-{lv.them}</Text>
    </View>
  );
}

// presentazione: una tabella di righe normalizzate
export function Table({ C, rows, forma, title, legend, highlight = [], onRow }) {
  if (!rows.length) return null;
  const head = forma ? ['#', 'Squadra', 'Ultime 5', 'Pt'] : ['#', 'Squadra', 'PG', 'V', 'N', 'P', 'GF:GS', 'Pt'];
  const cell = (w, txt, extra) => <Text style={[{ width: w, textAlign: 'right', color: C.ink2, fontSize: 11.5, fontVariant: ['tabular-nums'] }, extra]}>{txt}</Text>;
  return (
    <View style={{ marginTop: 12 }}>
      {title ? <Text style={{ paddingHorizontal: 20, paddingBottom: 8, paddingTop: 8, color: C.ink, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{title}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}>
        {head.map((h, i) => {
          const w = forma ? [W.rank, null, W.form, W.pts][i] : [W.rank, null, W.num, W.num, W.num, W.num, W.gfga, W.pts][i];
          return <Text key={h} style={[HEAD, { color: C.ink3 }, w ? { width: w, textAlign: 'right' } : { flex: 1 }]}>{h}</Text>;
        })}
      </View>
      {rows.map((r) => {
        const on = highlight.some((h) => String(h) === String(r.key));
        const bg = !forma && r.lv ? `${C.live}1F` : on ? C.accTint : 'transparent';
        return (
          <Pressable key={r.key} onPress={() => onRow && r.to && onRow(r.to)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.hair, backgroundColor: bg }}>
            {r.zone && !forma ? <View style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 3.5, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: r.zone }} /> : null}
            <View style={{ width: W.rank }}>
              <Text style={{ textAlign: 'right', color: C.ink3, fontSize: 11.5, fontVariant: ['tabular-nums'] }}>{r.rank}</Text>
              {!forma && r.mv ? <Text style={{ textAlign: 'right', color: r.mv > 0 ? C.good : C.bad, fontSize: 9, fontWeight: '700' }}>{r.mv > 0 ? '▲' : '▼'}{Math.abs(r.mv)}</Text> : null}
            </View>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {r.logo}
              <Text numberOfLines={1} style={{ flexShrink: 1, color: C.ink, fontSize: 13, fontWeight: '600' }}>{r.name}</Text>
              {!forma ? <LivePill C={C} lv={r.lv} /> : null}
            </View>
            {forma ? <View style={{ width: W.form, alignItems: 'flex-end' }}><FormDots C={C} form={r.form || []} size={15} /></View> : (
              <>{cell(W.num, r.played)}{cell(W.num, r.won)}{cell(W.num, r.drawn)}{cell(W.num, r.lost)}{cell(W.gfga, r.gfga, { fontSize: 11 })}</>
            )}
            <Text style={{ width: W.pts, textAlign: 'right', color: !forma && r.lv ? C.live : C.ink, fontSize: 13.5, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{forma ? r.fp : r.pts}</Text>
          </Pressable>
        );
      })}
      {legend && legend.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 8, paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16 }}>
          {legend.map((l) => (
            <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: l.color }} />
              <Text style={{ color: C.ink3, fontSize: 11 }}>{l.label}</Text>
            </View>
          ))}
        </View>
      ) : <View style={{ height: 24 }} />}
    </View>
  );
}

// campionato attuale: classifica calcolata + FotMob fresca + live (come useStandingRows del sito)
export function useStandingRows(leagueId, mode = 'total') {
  const base = standings(leagueId, mode);
  const fm = FM_ID[leagueId];
  const lt = useLiveTable(fm, !!fm && mode !== 'forma');
  return useMemo(() => {
    if (!lt || mode === 'forma' || !lt.groups || lt.groups.length !== 1) return base;
    const md = mode === 'total' ? 'all' : mode;
    const src = lt.groups[0].t[md];
    if (!src || !src.length) return base;
    const out = [];
    for (const r of applyLive(src, lt.groups[0].live || lt.live, md)) {
      const t = teamByFm(r.id) || teamByName(r.name) || teamByName(r.shortName) || base.map((x) => teamById(x.teamId)).find((x) => x && sameSquad(x.name, r.name));
      if (!t) return base;
      const b = base.find((x) => x.teamId === t.id);
      const m = /^(\d+)\D+(\d+)$/.exec(String(r.scoresStr || ''));
      const gf = m ? Number(m[1]) : 0;
      const ga = m ? Number(m[2]) : 0;
      out.push({ teamId: t.id, played: r.played, won: r.wins, drawn: r.draws, lost: r.losses, gf, ga, points: r.pts, dr: gf - ga, rank: r.idx, form: b ? b.form : [], formPoints: b ? b.formPoints : 0, lv: r.lv, mv: r.mv });
    }
    return out;
  }, [lt, base, mode]);
}

export function LeagueStandings({ C, leagueId, mode = 'total', highlight = [], openRoute }) {
  const rs = useStandingRows(leagueId, mode);
  const forma = mode === 'forma';
  const rows = rs.map((r) => {
    const team = teamById(r.teamId);
    const z = !forma && mode === 'total' ? zoneOf(leagueId, r.rank) : null;
    return { key: r.teamId, rank: r.rank, mv: r.mv, name: team ? team.name : '', logo: <TeamCrest team={team} size={22} C={C} />, played: r.played, won: r.won, drawn: r.drawn, lost: r.lost, gfga: `${r.gf}:${r.ga}`, pts: r.points, lv: r.lv, zone: z ? z.color : null, form: r.form, fp: r.formPoints, to: `/squadra/${r.teamId}`, z };
  });
  const legend = [];
  rows.forEach((r) => { if (r.z && !legend.find((l) => l.label === r.z.label)) legend.push(r.z); });
  return <Table C={C} rows={rows} forma={forma} legend={legend} highlight={highlight} onRow={openRoute} />;
}

// ---- archivio / campionati aggiunti: tabelle FotMob (`season.table` o `season.groups`)
const gfOf = (r) => { const m = /^(\d+)\D+(\d+)$/.exec(String(r.scoresStr || '')); return m ? [Number(m[1]), Number(m[2])] : [0, 0]; };
function orderRows(rows) {
  const mono = rows.every((r, i) => !i || (r.idx || 0) >= (rows[i - 1].idx || 0));
  if (mono) return rows;
  return [...rows].sort((a, b) => (b.pts || 0) - (a.pts || 0) || (gfOf(b)[0] - gfOf(b)[1]) - (gfOf(a)[0] - gfOf(a)[1]) || gfOf(b)[0] - gfOf(a)[0]).map((r, i) => ({ ...r, idx: i + 1 }));
}

// posizione e punti di una squadra nella classifica della stagione, con gli stessi calcoli della tabella (girone giusto se a gironi)
export function seasonTeamRow(season, tid, lt) {
  if (!season || tid == null) return null;
  const tables = Array.isArray(season.groups) && season.groups.length ? season.groups.map((g) => g.table) : [season.table];
  for (const t of tables) {
    if (!t || !t.all || !t.all.some((r) => String(r.id) === String(tid))) continue;
    const fg = freshGroup(lt, t);
    const rows = orderRows(fg ? applyLive(fg.t.all || [], fg.live || lt.live, 'all') : t.all);
    const i = rows.findIndex((r) => String(r.id) === String(tid));
    if (i < 0) return null;
    return { rank: rows[i].idx || i + 1, points: rows[i].pts || 0, played: rows[i].played || 0 };
  }
  return null;
}
const formOf = (season) => {
  const res = {};
  [...season.fix].filter((m) => m[6] && !m[8]).sort((a, b) => String(a[4]).localeCompare(String(b[4]))).forEach((m) => {
    const sc = String(m[5] || '').split(' - ').map(Number);
    if (sc.length !== 2 || sc.some(Number.isNaN)) return;
    const [h, a] = sc;
    (res[m[2]] = res[m[2]] || []).push(h > a ? 'V' : h === a ? 'S' : 'P');
    (res[m[3]] = res[m[3]] || []).push(a > h ? 'V' : h === a ? 'S' : 'P');
  });
  return res;
};

function ArchTable({ C, t: t0, legendSrc, title, mode, fm5, fm, sk, highlight, lt, openRoute }) {
  const forma = mode === 'form';
  const fg = freshGroup(lt, t0);
  const t = fg ? fg.t : t0;
  const src = forma
    ? (t.all || []).map((r) => { const f = (fm5[r.id] || []).slice(-5); return { ...r, f, fp: f.reduce((x, c) => x + (c === 'V' ? 3 : c === 'S' ? 1 : 0), 0) }; }).sort((a, b) => b.fp - a.fp || b.pts - a.pts)
    : orderRows(fg ? applyLive(t[mode] || t.all || [], fg.live || lt.live, mode === 'all' ? 'all' : mode) : (t[mode] || t.all || []));
  const rows = src.map((r, i) => ({ key: r.id, rank: forma ? i + 1 : r.idx || i + 1, mv: r.mv, name: r.shortName || r.name, logo: <TeamLogoN id={r.id} name={r.shortName || r.name} size={22} C={C} />, played: r.played, won: r.wins, drawn: r.draws, lost: r.losses, gfga: String(r.scoresStr || '').replace('-', ':'), pts: r.pts, lv: r.lv, zone: r.qualColor || null, form: r.f, fp: r.fp, to: `/storico/${fm}/${sk}/squadra/${r.id}` }));
  const legend = (t.all || []).some((r) => r.qualColor) ? (legendSrc || []).map((l) => ({ label: l.title, color: l.color })) : [];
  return <Table C={C} rows={rows} forma={forma} title={title} legend={forma ? [] : legend} highlight={highlight} onRow={openRoute} />;
}

export function ArchiveStandings({ C, season, fm, sk, highlight = null, openRoute }) {
  const [mode, setMode] = useState('all');
  const groups = season && Array.isArray(season.groups) && season.groups.length ? season.groups : null;
  const t = season && season.table;
  const fm5 = useMemo(() => (t || groups ? formOf(season) : {}), [season, t, groups]);
  const lt = useLiveTable(fm, !!(t || groups) && isCurrent(fm, sk));
  if (!t && !groups) return null;
  const hl = highlight == null ? [] : Array.isArray(highlight) ? highlight : [highlight];
  const props = { C, mode, fm5, fm, sk, highlight: hl, lt, openRoute };
  return (
    <View style={{ paddingTop: 12 }}>
      <View style={{ paddingHorizontal: 16 }}><Segmented C={C} options={[{ value: 'all', label: 'Totale' }, { value: 'home', label: 'Casa' }, { value: 'away', label: 'Trasferta' }, { value: 'form', label: 'Forma' }]} value={mode} onChange={setMode} /></View>
      {groups ? groups.map((g, i) => <ArchTable key={g.n || i} t={g.table} legendSrc={g.legend} title={g.n} {...props} />) : <ArchTable t={t} legendSrc={season.legend} {...props} />}
    </View>
  );
}
