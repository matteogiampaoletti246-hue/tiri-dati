// Campionato: stagioni d'archivio (e competizioni solo d'archivio). Schede Partite / Classifica (o Tabellone) / Stat. squadre / Giocatori / Arbitri,
// mostrate solo se hanno dati. Stessi calcoli di ArchiveLeague.jsx del sito.
import React, { useDeferredValue, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import useAsync from '@/hooks/useAsync';
import useArchFresh from '@/hooks/useArchFresh';
import { RAW } from '@/data/load';
import { currentSeason, refsAllSeasons, refsAllowed, loadSeason, loadTeamStats, loadLeaguePlayerStats, loadSeasonMatches, statsFromMatches, STAT_IT, STAT_GROUPS, prettyKey } from '@/data/archive';
import { isPureCup, loadBracket, hasCup, peekBracket } from '@/data/bracket';
import { Segmented } from '../shared/ui';
import { ArchiveStandings } from '../shared/Standings';
import { TeamLogoN } from '../shared/Standings';
import { ArchRoundsN, MATCH_FILTERS } from '../shared/MatchdayN';
import { statSections } from '../shared/statSections';
import { fmtVal } from '../shared/StatBars';
import StatListsN from '../shared/StatListsN';
import RefereesN from '../shared/RefereesN';
import PaneN from '../shared/PaneN';
import SwapN from '../shared/SwapN';
import TabsN, { PanelSkN } from '../shared/TabsN';
import Tabellone from './PartitaBracket';
import { useTeamColors } from './GiocatorePast';

const TABS = [
  { key: 'matches', label: 'Partite' },
  { key: 'standings', label: 'Classifica' },
  { key: 'teams', label: 'Stat. squadre' },
  { key: 'players', label: 'Giocatori' },
  { key: 'referees', label: 'Arbitri' },
];
const hex6 = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#2C3E66');

export function ArchMatchesN({ C, fm, sk, season, tint, openRoute, bottom }) {
  const [filter, setFilter] = useState('all');
  const anchor = useRef({ on: false }).current;
  return (
    <PaneN bottom={bottom} anchor={anchor}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}><Segmented C={C} options={MATCH_FILTERS} value={filter} onChange={setFilter} /></View>
      <SwapN k={filter}><ArchRoundsN C={C} season={season} fm={fm} sk={sk} filter={filter} tint={tint} openRoute={openRoute} anchor={anchor} /></SwapN>
    </PaneN>
  );
}

// Classifica | Tabellone: il Tabellone c'e' solo se la stagione ha turni a eliminazione
export function ClassificaSwitchN({ C, fm, sk, children, openRoute }) {
  const [view, setView] = useState('cl');
  const { data: br } = useAsync(() => (hasCup(fm) && sk ? loadBracket(fm, sk) : null), [fm, sk]);
  const b = br || (hasCup(fm) && sk ? peekBracket(fm, sk) : null);
  const has = !!(b && b.rounds && b.rounds.length);
  if (!has) return children;
  return (
    <View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}><Segmented C={C} options={[{ value: 'cl', label: 'Classifica' }, { value: 'tb', label: 'Tabellone' }]} value={view} onChange={setView} /></View>
      <SwapN k={view}>{view === 'tb' ? <Tabellone C={C} match={{ archive: { fm, sk } }} openRoute={openRoute} /> : children}</SwapN>
    </View>
  );
}

// medie a partita di ogni squadra dalle partite archiviate (totale / casa / trasferta)
const TS_KEYS = STAT_GROUPS.flatMap(([title, keys]) => keys.map((k) => [k, title]));
const TS_EXTRA = ['expected_goals_open_play', 'expected_goals_non_penalty', 'expected_goals_on_target'];
const TS_LABEL = { goals_for: 'Gol fatti', goals_against: 'Gol subiti' };
function teamAverages(season, det) {
  const m = (det && det.m) || {};
  const acc = {};
  const bump = (tid, part, k, v) => {
    const t = (acc[tid] = acc[tid] || [{}, {}, {}]);
    const x = (t[part][k] = t[part][k] || { s: 0, n: 0 });
    x.s += v; x.n += 1;
  };
  (season.fix || []).forEach((f) => {
    if (!f[6] || f[8]) return;
    const sc = String(f[5] || '').split(' - ').map(Number);
    const d = m[String(f[0])];
    [[f[2], 1, 0], [f[3], 2, 1]].forEach(([tid, part, i]) => {
      if (sc.length === 2 && !sc.some(Number.isNaN)) {
        bump(tid, 0, 'goals_for', sc[i]); bump(tid, part, 'goals_for', sc[i]);
        bump(tid, 0, 'goals_against', sc[1 - i]); bump(tid, part, 'goals_against', sc[1 - i]);
      }
      if (!d || !d.s) return;
      Object.entries(d.s).forEach(([k, v]) => {
        const n = Number(Array.isArray(v) ? v[i] : NaN);
        if (!Number.isFinite(n)) return;
        bump(tid, 0, k, n); bump(tid, part, k, n);
      });
      const fs = Number(Array.isArray(d.s.fouls) ? d.s.fouls[1 - i] : NaN);
      if (Number.isFinite(fs)) { bump(tid, 0, 'fouls_suffered', fs); bump(tid, part, 'fouls_suffered', fs); }
    });
  });
  return acc;
}

export function ArchPlayersN({ C, fm, sk, stats, names, col, openRoute, bottom }) {
  const [mode, setMode] = useState('tot');
  const dMode = useDeferredValue(mode);
  const { data: exact } = useAsync(() => statsFromMatches(fm, sk), [fm, sk]);
  const sections = useMemo(() => statSections(C, stats, 'players', names, col, fm, sk, dMode, null, exact), [stats, dMode, exact, names, col]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!sections.length && mode === 'tot') return null;
  return <StatListsN C={C} sections={sections} pending={dMode !== mode} podium openRoute={openRoute} bottom={bottom} header={<View style={{ paddingHorizontal: 16, paddingTop: 8 }}><Segmented C={C} options={[{ value: 'tot', label: 'Totale' }, { value: 'p90', label: "Ogni 90'" }]} value={mode} onChange={setMode} /></View>} />;
}

function ArchTeamsN({ C, season, det, stats, names, col, fm, sk, openRoute, bottom }) {
  const [part, setPart] = useState(0);
  const dPart = useDeferredValue(part);
  const acc = useMemo(() => (season && det && det.m ? teamAverages(season, det) : null), [season, det]);
  const has = !!acc && Object.keys(acc).length > 0 && Object.values(acc).some((t) => Object.keys(t[0]).some((k) => k !== 'goals_for' && k !== 'goals_against'));
  const official = useMemo(() => (has ? [] : statSections(C, stats, 'teams', names, col, fm, sk, 'tot')), [has, stats, names, col]); // eslint-disable-line react-hooks/exhaustive-deps
  const sections = useMemo(() => {
    if (!acc || Object.keys(acc).length < 2) return official;
    const out = [];
    const groupOfKey = (k) => (TS_KEYS.find((x) => x[0] === k) || [null, 'Altro'])[1];
    const keys = new Set(['goals_for', 'goals_against']);
    Object.values(acc).forEach((t) => Object.keys(t[0]).forEach((k) => keys.add(k)));
    [...keys].filter((k) => TS_LABEL[k] || STAT_IT[k] || TS_EXTRA.includes(k)).forEach((k) => {
      const rows = Object.entries(acc).map(([tid, t]) => ({ tid, x: t[part][k] })).filter((r) => r.x && r.x.n).map((r) => ({ tid: r.tid, v: r.x.s / r.x.n })).sort((a, b) => b.v - a.v);
      if (rows.length < 2 || rows.every((r) => !r.v)) return;
      out.push({
        id: k, group: TS_LABEL[k] ? 'Principali' : groupOfKey(k), title: TS_LABEL[k] || STAT_IT[k] || prettyKey(k),
        rows: rows.map((r, i) => ({ id: `${r.tid}-${i}`, to: `/storico/${fm}/${sk}/squadra/${r.tid}`, left: <TeamLogoN id={r.tid} name={names[r.tid]} size={24} C={C} />, name: names[r.tid] || '', bg: true, tc: hex6(col(r.tid, names[r.tid]).colors[0]), value: fmtVal(k === 'BallPossesion' ? 'percentage' : 'expected', r.v) })),
      });
    });
    const order = ['Principali', ...STAT_GROUPS.map((g) => g[0]).filter((g) => g !== 'Principali'), 'Altro'];
    out.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
    return [...out, ...official];
  }, [acc, dPart, official, names, col]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!sections.length) return null;
  const split = !!acc && Object.keys(acc).length >= 2;
  return <StatListsN C={C} sections={sections} pending={dPart !== part} podium openRoute={openRoute} bottom={bottom} />;
}

// arbitri della stagione: medie dalle partite archiviate (cartellini, falli, rigori)
function refsOf(det) {
  const by = {};
  Object.values((det && det.m) || {}).forEach((x) => {
    const name = x.i && x.i.ref;
    if (!name) return;
    const r = (by[name] = by[name] || { id: name, name, country: '', n: 0, y: 0, r: 0, fo: 0, pen: 0 });
    r.n += 1;
    (x.e || []).forEach((e) => {
      if (e.type === 'Card') { if (/Yellow/i.test(e.card || '')) r.y += 1; if (/Red/i.test(e.card || '')) r.r += 1; }
      if (e.type === 'MissedPenalty' || (e.type === 'Goal' && e.goalDescription === 'Penalty')) r.pen += 1;
    });
    const f = x.s && x.s.fouls;
    if (f) r.fo += (Number(f[0]) || 0) + (Number(f[1]) || 0);
  });
  return Object.values(by).map((r) => ({ ...r, y: r.y / r.n, r: r.r / r.n, fo: r.fo / r.n, pen: r.pen / r.n }));
}

export default function ArchiveLeagueN({ C, fm, sk, tint, tabKey, onTab, openRoute, bottom }) {
  useArchFresh(fm, sk);
  const { data: season, loading } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const { data: stats, loading: l3 } = useAsync(() => loadTeamStats(fm, sk), [fm, sk]);
  const { data: pstats, loading: l5 } = useAsync(() => loadLeaguePlayerStats(fm, sk), [fm, sk]);
  const { data: det, loading: l2 } = useAsync(() => loadSeasonMatches(fm, sk), [fm, sk]);
  const col = useTeamColors();
  const pure = isPureCup(fm);
  const { data: br, loading: l4 } = useAsync(() => (pure ? loadBracket(fm, sk) : null), [fm, sk]);
  const { data: curSk } = useAsync(() => currentSeason(fm), [fm]);
  const refsOk = refsAllowed(fm) && (refsAllSeasons(fm) || (!!curSk && curSk === sk) || (RAW.extra && RAW.extra.sk && RAW.extra.sk[String(fm)] === sk));
  const refs = useMemo(() => (refsOk ? refsOf(det) : []), [det, refsOk]);
  if ((loading && !season) || l2 || l3 || l4 || l5) return <PanelSkN C={C} />;
  const names = (season && season.teams) || {};
  const has = {
    matches: !!(season && season.fix && season.fix.length),
    standings: pure ? !!(br && br.rounds && br.rounds.length) : !!(season && (season.table || (season.groups && season.groups.length))),
    teams: !!(det && det.m && Object.keys(det.m).length) || statSections(C, stats, 'teams', names, col, fm, sk, 'tot').length > 0,
    players: statSections(C, pstats, 'players', names, col, fm, sk, 'tot').length > 0,
    referees: refs.length > 0,
  };
  const base = pure ? TABS.map((t) => (t.key === 'standings' ? { ...t, label: 'Tabellone' } : t)) : TABS;
  const tabs = base.filter((t) => has[t.key]);
  if (!tabs.length) return null;
  const idx = Math.max(0, tabs.findIndex((t) => t.key === tabKey));
  const render = (i) => {
    const k = tabs[i].key;
    if (k === 'matches') return <ArchMatchesN key={k} C={C} fm={fm} sk={sk} season={season} tint={tint} openRoute={openRoute} bottom={bottom} />;
    if (k === 'standings') return pure ? <PaneN key={k} bottom={bottom}><Tabellone C={C} match={{ archive: { fm, sk } }} openRoute={openRoute} /></PaneN> : <PaneN key={k} bottom={bottom}><ClassificaSwitchN C={C} fm={fm} sk={sk} openRoute={openRoute}><ArchiveStandings C={C} season={season} fm={fm} sk={sk} openRoute={openRoute} /></ClassificaSwitchN></PaneN>;
    if (k === 'teams') return <ArchTeamsN key={k} C={C} season={season} det={det} stats={stats} names={names} col={col} fm={fm} sk={sk} openRoute={openRoute} bottom={bottom} />;
    if (k === 'players') return <ArchPlayersN key={k} C={C} fm={fm} sk={sk} stats={pstats} names={names} col={col} openRoute={openRoute} bottom={bottom} />;
    return <RefereesN key={k} C={C} base={refs} bottom={bottom} />;
  };
  return <TabsN C={C} tabs={tabs} index={idx} onIndex={(i) => onTab(tabs[i].key)} render={render} />;
}
