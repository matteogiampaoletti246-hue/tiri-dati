// Squadra: scheda Statistiche. Stagione in corso = medie a partita con posizione in campionato (e confronto con la prossima avversaria);
// stagioni passate = riquadri + barre dall'archivio (stesso aspetto della stagione attuale).
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import useAsync from '@/hooks/useAsync';
import useNextMatch from '@/hooks/useNextMatch';
import { CATEGORY_DEFS, TILE_METRICS, metricOf as metricOf0, teamsInComp, hasMetrics as hasMetrics0 } from '@/data/standings';
import { teamById } from '@/data/teams';
import { teamCompetitions } from '@/data/competitions';
import { loadSeason, teamIdByName, loadTeamStats, teamPartStats, SEASON_STAT_IT, STAT_IT, prettyKey } from '@/data/archive';
import { teamFmId } from '@/data/teamIndex';
import { comma } from '@/lib/format';
import { bandColor } from '@/components/player/playerCalc';
import { Segmented, TeamCrest } from '../shared/ui';
import { Bar, BarRow, groupOf, fmtVal, standingOf } from '../shared/StatBars';
import { useTeamView, useAnnounceComp } from '../shared/teamView';
import CompBarN from '../shared/CompBarN';
import SwapN from '../shared/SwapN';
import PaneN from '../shared/PaneN';
import { PanelSkN } from '../shared/TabsN';

export const NEG = ['golSubiti', 'xgSubiti', 'tiriConcessi', 'tiriInPortaConcessi', 'occasioniConcesse', 'cornerConcessi', 'fuorigioco'];
const rankInC = (comp, team, key, part) => {
  const neg = NEG.includes(key);
  const rows = teamsInComp(comp).filter((t) => hasMetrics0(t.id, comp)).map((t) => ({ id: t.id, v: metricOf0(t.id, key, part, comp) })).filter((r) => Number.isFinite(r.v));
  const mine = rows.find((r) => r.id === team.id);
  if (!mine) return null;
  const rank = 1 + rows.filter((r) => (neg ? r.v < mine.v : r.v > mine.v)).length;
  const total = rows.length;
  const avg = rows.reduce((a, r) => a + r.v, 0) / total;
  const max = rows.reduce((m, r) => Math.max(m, r.v), 0);
  return { rank, total, avg, max, frac: total > 1 ? (total - rank) / (total - 1) : 1 };
};
const VS = {
  tiri: { opp: 'tiriConcessi', mode: 'att', t: 'concede' },
  tiriInPorta: { opp: 'tiriInPortaConcessi', mode: 'att', t: 'concede' },
  corner: { opp: 'cornerConcessi', mode: 'att', t: 'concede' },
  falli: { opp: 'fallisubiti', mode: 'foul', t: 'subisce' },
  gialli: { opp: 'gialli', mode: 'cmp', t: 'ne ha' },
  fuorigioco: { opp: 'fuorigioco', mode: 'cmp', more: true, t: 'ne ha' },
};
const hex6 = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#2C3E66');
let VS_ON = true; // il confronto con la prossima avversaria si ricorda finche' l'app e' aperta
const PARTS_N = [{ value: 0, label: 'Totale' }, { value: 1, label: 'Casa' }, { value: 2, label: 'Trasferta' }];
const PARTS_S = [{ value: 'tot', label: 'Totale' }, { value: 'home', label: 'Casa' }, { value: 'away', label: 'Trasferta' }];
const CATS_S = [{ value: 'all', label: 'Tutte' }, { value: 'Attacco', label: 'Attacco' }, { value: 'Difesa', label: 'Difesa' }, { value: 'Disciplina', label: 'Disciplina' }, { value: 'Gioco', label: 'Gioco' }];
const f2 = (v) => Number(v).toFixed(2).replace('.', ',');

function Tile({ C, label, value, rank, col }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', borderRadius: 18, paddingHorizontal: 6, paddingVertical: 10, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border }}>
      <Text numberOfLines={1} style={{ color: C.ink3, fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color: C.ink, fontSize: 17, fontWeight: '800', marginTop: 4, fontVariant: ['tabular-nums'] }}>{value}</Text>
      <View style={{ marginTop: 4, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1, backgroundColor: col }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{rank}°</Text></View>
    </View>
  );
}

function NextRow({ C, team, comp, openRoute }) {
  const next = useNextMatch(team.id, comp);
  const opp = next ? teamById(next.homeId === team.id ? next.awayId : next.homeId) : null;
  if (!next || !opp) return null;
  const isHome = next.homeId === team.id;
  return (
    <Pressable onPress={() => openRoute(`/match/${next.id}`)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 12, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border }, pressed && { opacity: 0.6 }]}>
      <TeamCrest team={team} size={22} C={C} />
      <Text style={{ color: C.ink3, fontSize: 12.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>Prossima</Text>
      <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        <Text style={{ color: C.ink, fontSize: 13.5, fontWeight: '800' }}>VS</Text>
        <TeamCrest team={opp} size={22} C={C} />
        <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13.5, fontWeight: '800', flexShrink: 1 }}>{opp.name}</Text>
        <View style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1, backgroundColor: C.chip }}><Text style={{ color: C.ink2, fontSize: 10.5, fontWeight: '700' }}>{isHome ? 'Casa' : 'Trasferta'}</Text></View>
      </View>
    </Pressable>
  );
}

function DomesticStats({ C, team, comp, openRoute }) {
  const metricOf = (id, k, p = 0) => metricOf0(id, k, p, comp);
  const hasMetrics = (id) => hasMetrics0(id, comp);
  const rankIn = (t, k, p) => rankInC(comp, t, k, p);
  const [part, setPart] = useState(0);
  const [cat, setCat] = useState('all');
  const [vsOn, setVsOn0] = useState(VS_ON);
  const setVsOn = (v) => { VS_ON = v; setVsOn0(v); };
  const next = useNextMatch(team.id, comp);
  const opp = next ? teamById(next.homeId === team.id ? next.awayId : next.homeId) : null;
  const oppOk = opp && hasMetrics(opp.id) && hasMetrics(team.id);
  const tc = hex6(team.colors && team.colors[0]);
  const cats = CATEGORY_DEFS.filter((c) => cat === 'all' || c.key === cat);
  const vsOf = (key) => {
    const cfg = VS[key];
    if (!oppOk || !cfg) return null;
    const ro = rankIn(opp, cfg.opp, 0);
    const vo = metricOf(opp.id, cfg.opp, 0);
    const rm = rankIn(team, key, part);
    const vm = metricOf(team.id, key, part);
    if (!ro || !rm) return null;
    let fav;
    if (cfg.mode === 'att') { const q = ro.avg > 0 ? vo / ro.avg : 1; fav = q >= 1.08 ? 2 : q <= 0.92 ? 0 : 1; }
    else if (cfg.mode === 'foul') { const q = ((rm.avg > 0 ? vm / rm.avg : 1) + (ro.avg > 0 ? vo / ro.avg : 1)) / 2; fav = q >= 1.08 ? 0 : q <= 0.92 ? 2 : 1; }
    else { const q = vo > 0 ? vm / vo : 1; fav = cfg.more ? (q >= 1.1 ? 2 : q <= 0.9 ? 0 : 1) : (q <= 0.9 ? 2 : q >= 1.1 ? 0 : 1); }
    return { v: vo, mine: vm, rank: ro.rank, total: ro.total, fav, cfg };
  };
  const favColor = (f) => [C.bad, C.gold, C.good][f];
  const verdict = (f) => ['sfavorevole', 'equilibrato', 'favorevole'][f];
  return (
    <View style={{ paddingTop: 12, paddingBottom: 24, gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
        {TILE_METRICS.slice(0, 4).map((t) => {
          const r = rankIn(team, t.key, part);
          if (!r) return <View key={t.key} style={{ flex: 1 }} />;
          return <Tile key={t.key} C={C} label={t.label} value={`${comma(metricOf(team.id, t.key, part), t.key === 'possesso' ? 0 : 1)}${t.key === 'possesso' ? '%' : ''}`} rank={r.rank} col={bandColor(r.frac)} />;
        })}
      </View>
      {opp ? <View style={{ marginTop: -12 }}><NextRow C={C} team={team} comp={comp} openRoute={openRoute} /></View> : null}
      <View style={{ paddingHorizontal: 16, gap: 8 }}>
        <Segmented C={C} options={PARTS_N} value={part} onChange={setPart} />
        <Segmented C={C} options={[{ value: 'all', label: 'Tutte' }, ...CATEGORY_DEFS.map((c) => ({ value: c.key, label: c.title }))]} value={cat} onChange={setCat} />
        {oppOk ? (
          <Pressable onPress={() => setVsOn(!vsOn)} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: vsOn ? C.accent : C.chip }}>
            <TeamCrest team={opp} size={16} C={C} />
            <Text style={{ color: vsOn ? '#fff' : C.ink2, fontSize: 12.5, fontWeight: '700' }}>Confronta con {opp.short || opp.name}</Text>
          </Pressable>
        ) : null}
      </View>
      {cats.map((c) => (
        <View key={c.key} style={{ marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: `${tc}1c`, borderWidth: 1, borderColor: `${tc}55` }}>
          <Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>{c.title}</Text>
          {c.metrics.map((mt) => {
            const r = rankIn(team, mt.key, part);
            if (!r) return null;
            const v = metricOf(team.id, mt.key, part);
            const col = bandColor(r.frac);
            const o = oppOk && vsOn ? vsOf(mt.key) : null;
            const top = Math.max(r.max * 1.08, r.avg * 1.6, o ? o.v * 1.06 : 0, 0.0001);
            const w = Math.max(3, Math.min(100, (v / top) * 100));
            const ax = Math.min(100, (r.avg / top) * 100);
            return (
              <View key={mt.key} style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.hair }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text numberOfLines={1} style={{ flex: 1, color: C.ink, fontSize: 13.5 }}>{mt.label}</Text>
                  <Text style={{ color: col, backgroundColor: `${col}26`, paddingHorizontal: 9, paddingVertical: 1, borderRadius: 99, overflow: 'hidden', fontSize: 14, fontWeight: '800' }}>{comma(v, 2)}</Text>
                  <Text style={{ width: 34, textAlign: 'right', color: C.ink3, fontSize: 11, fontWeight: '700' }}>{r.rank}°</Text>
                </View>
                <Bar C={C} width={w} col={col} avgPos={ax} avgText={`media ${comma(r.avg, 2)}`} />
                {o ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <TeamCrest team={opp} size={14} C={C} />
                    <Text numberOfLines={2} style={{ flex: 1, color: C.ink2, fontSize: 11 }}>{o.cfg.mode === 'cmp' ? `${opp.short || opp.name}: ${comma(o.v, 2)} (tu ${comma(o.mine, 2)})` : `${opp.short || opp.name} ${o.cfg.t} ${comma(o.v, 2)} · ${o.rank}° su ${o.total}`}</Text>
                    <View style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1, backgroundColor: favColor(o.fav) }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{verdict(o.fav)}</Text></View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/* ---------- stagioni passate ---------- */
const TILES = [['gol', 'Gol'], ['expected_goals', 'xG'], ['total_shots', 'Tiri'], ['ShotsOnTarget', 'Tiri in porta']];
function useTiles(fm, sk, tid) {
  return useAsync(async () => {
    const [ps, season] = await Promise.all([teamPartStats(fm, sk, 'tot').catch(() => null), loadSeason(fm, sk).catch(() => null)]);
    const goals = {};
    ((season && season.fix) || []).forEach((m) => {
      const sc = String(m[5] || '').match(/(\d+)\s*-\s*(\d+)/);
      if (!m[6] || !sc) return;
      [[m[2], +sc[1]], [m[3], +sc[2]]].forEach(([t, g]) => { const a = (goals[t] = goals[t] || { s: 0, n: 0 }); a.s += g; a.n += 1; });
    });
    const lists = {};
    const gl = Object.entries(goals).filter(([, a]) => a.n > 0).map(([t, a]) => [null, '', Number(t), a.s / a.n, 0, a.n]).sort((a, b) => b[3] - a[3]);
    if (gl.length >= 3) lists.gol = gl;
    TILES.slice(1).forEach(([k]) => { const l = ps && ps.teams && ps.teams[k]; if (l && l.length >= 3) lists[k] = l; });
    const out = [];
    TILES.forEach(([k, label]) => {
      const l = lists[k]; if (!l) return;
      const i = l.findIndex((r) => String(r[2]) === String(tid));
      if (i < 0) return;
      out.push({ k, label, v: Number(l[i][3]), rank: i + 1, total: l.length, frac: l.length > 1 ? 1 - i / (l.length - 1) : 1 });
    });
    return out;
  }, [fm, sk, tid]);
}
const catOfMatchKey = (k) => (/yellow|red_cards|fouls|Offsides/.test(k) ? 'Disciplina' : /tackles|interceptions|shot_blocks|clearances|keeper_saves/.test(k) ? 'Difesa' : /expected_goals|shots|ShotsOn|ShotsOff|big_chance|corners|touches_opp_box|woodwork/.test(k) ? 'Attacco' : 'Gioco');
const catOfSeasonGroup = (g) => (['Attacco', 'Difesa', 'Disciplina'].includes(g) ? g : 'Gioco');
const GROUP_ORDER = ['Attacco', 'Difesa', 'Disciplina', 'Gioco'];

function TeamSeasonStats({ C, fm, sk, tid, part, cat, tc }) {
  const wantMatch = part !== 'tot';
  const { data: res, loading } = useAsync(async () => ({ byMatch: wantMatch, stats: await (wantMatch ? teamPartStats(fm, sk, part) : loadTeamStats(fm, sk)) }), [fm, sk, part]);
  const stats = res ? res.stats : undefined;
  const byMatch = res ? res.byMatch : wantMatch;
  if (loading && !stats) return <PanelSkN C={C} />;
  const lists = stats && stats.teams;
  const Msg = ({ children }) => <Text style={{ color: C.ink3, fontSize: 13, textAlign: 'center', paddingVertical: 56 }}>{children}</Text>;
  if (!lists) return null;
  const groups = {};
  let me = null;
  Object.keys(lists).forEach((k) => {
    if (k.startsWith('_')) return;
    const list = lists[k];
    const idx = list.findIndex((r) => String(r[2]) === String(tid));
    if (idx < 0) return;
    me = me || list[idx];
    const g = byMatch ? catOfMatchKey(k) : catOfSeasonGroup(groupOf(k.replace(/_team$/, '')));
    if (cat !== 'all' && g !== cat) return;
    (groups[g] = groups[g] || []).push({ k, st: standingOf(list, idx, k, null), title: byMatch ? (STAT_IT[k] || prettyKey(k)) : (SEASON_STAT_IT[k] || prettyKey(k)) });
  });
  if (!me) return <Msg>Nessuna presenza in questa stagione</Msg>;
  const order = Object.keys(groups).sort((a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b));
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 }}>
      {order.map((g) => (
        <View key={g} style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: `${tc}1c`, borderWidth: 1, borderColor: `${tc}55` }}>
          <Text style={{ color: C.ink, fontSize: 14, fontWeight: '600', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>{g}</Text>
          {groups[g].map((r, i) => (
            <BarRow key={r.k} C={C} first={i === 0} label={r.title} valueText={byMatch ? (/BallPossesion/.test(r.k) ? `${Math.round(r.st.v)}%` : Number(r.st.v).toFixed(Number.isInteger(r.st.v) ? 0 : 2).replace('.', ',')) : fmtVal(r.k, r.st.v)}
              frac={r.st.frac} width={r.st.width} avgPos={r.st.avgPos} avgText={byMatch ? f2(r.st.avg) : fmtVal(r.k, r.st.avg)} rank={r.st.rank} delay={Math.min(i, 8) * 40} />
          ))}
        </View>
      ))}
      <Text style={{ color: C.ink3, fontSize: 10.5, paddingHorizontal: 4 }}>La lineetta con il numero è la media del campionato. Colori: rosso = parte bassa della classifica, giallo = metà, verde = parte alta.</Text>
    </View>
  );
}

function PastTeamStats({ C, fm, sk, team, comp, cur, openRoute }) {
  const [part, setPart] = useState('tot');
  const [cat, setCat] = useState('all');
  const { data: season, loading } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const tc = hex6(team.colors && team.colors[0]);
  const fid = teamFmId(team);
  const tid = season ? (fid && season.teams && season.teams[fid] ? String(fid) : teamIdByName(season.teams, team.name)) : null;
  const { data: tiles } = useTiles(fm, sk, tid);
  if (loading) return <PanelSkN C={C} />;
  if (!season || !tid) return null;
  return (
    <View>
      {tiles && tiles.length ? <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 }}>{tiles.map((t) => <Tile key={t.k} C={C} label={t.label} value={comma(t.v, 1)} rank={t.rank} col={bandColor(t.frac)} />)}</View> : null}
      {cur && comp ? <NextRow C={C} team={team} comp={comp} openRoute={openRoute} /> : null}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
        <Segmented C={C} options={PARTS_S} value={part} onChange={setPart} />
        <Segmented C={C} options={CATS_S} value={cat} onChange={setCat} />
      </View>
      <TeamSeasonStats C={C} fm={fm} sk={sk} tid={tid} part={part} cat={cat} tc={tc} />
    </View>
  );
}

export default function SquadraStat({ C, teamId, openRoute, bottom }) {
  const team = teamById(teamId);
  const { comp, setComp, season, eff, setSeason, comps, seasons, fm, noCur } = useTeamView(team, 'sx', teamCompetitions(teamId), team.leagueId);
  const tap = useAnnounceComp(teamId, comp, season);
  return (
    <PaneN bottom={bottom}>
      <CompBarN C={C} comps={comps} comp={comp} onComp={tap(setComp)} seasons={seasons} season={season} onSeason={tap(setSeason)} noCur={noCur} />
      <SwapN k={`${comp}|${eff}`}>
      {eff !== 'cur' && fm ? <PastTeamStats C={C} fm={fm} sk={eff} team={team} comp={comp} cur={season === 'cur'} openRoute={openRoute} /> : <DomesticStats key={comp} C={C} team={team} comp={comp} openRoute={openRoute} />}
      </SwapN>
    </PaneN>
  );
}
