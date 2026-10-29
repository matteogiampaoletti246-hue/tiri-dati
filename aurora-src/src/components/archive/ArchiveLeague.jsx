import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import SwipeTabs from '@/components/SwipeTabs';
import TextFilter from '@/components/TextFilter';
import StatLists from '@/components/stats/StatLists';
import Skeleton from '@/components/Skeleton';
import { TeamLogo, PlayerFace } from '@/components/FmImg';
import useAsync from '@/hooks/useAsync';
import useArchFresh from '@/hooks/useArchFresh';
import { RefereesView } from '@/components/league/LeagueRefereesPanel';
import { RAW } from '@/data/load';
import { currentSeason, refsAllSeasons, refsAllowed, loadSeason, loadTeamStats, loadPlayerStats, loadSeasonMatches, SEASON_STAT_IT, STAT_IT, STAT_GROUPS, prettyKey } from '@/data/archive';
import { tintGrad } from '@/lib/tint';
import ClassificaSwitch from '@/components/bracket/ClassificaSwitch';
import Bracket from '@/components/bracket/Bracket';
import { isPureCup, loadBracket } from '@/data/bracket';
import { roundBlocks, blockTag, currentBlock } from '@/data/rounds';
import { ArchRow, StandingsPanel, fmtDate, dayKey, useTeamColors, rowBg } from './parts';

const TABS = [
  { key: 'matches', label: 'Partite' },
  { key: 'standings', label: 'Classifica' },
  { key: 'teams', label: 'Stat. squadre' },
  { key: 'players', label: 'Giocatori' },
  { key: 'referees', label: 'Arbitri' },
];

const Empty = ({ children }) => (
  <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>{children}</p>
);
const Loading = () => (
  <div className="px-5 pt-8">
    <Skeleton className="h-[42px] w-full" />
    <div className="mt-6 space-y-4">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[52px] w-full" />)}</div>
  </div>
);

const ROUND = { final: 'Finale', playoff: 'Playoff', '1/2': 'Semifinali', '1/4': 'Quarti di finale', '1/8': 'Ottavi di finale', '1/16': 'Sedicesimi', '1/32': 'Trentaduesimi', '3rd': 'Finale 3° posto' };
const roundTitle = (r) => {
  const x = String(r);
  return ROUND[x] || (/^\d+$/.test(x) ? `Giornata ${x}` : x.replace(/^\w/, (c) => c.toUpperCase()));
};

const MATCH = {
  all: () => true,
  live: (m) => m[7] && !m[6] && !m[8],
  results: (m) => !!m[6],
  upcoming: (m) => !m[6] && !m[7] && !m[8],
};

// Partite: stesso schema del campionato attuale (filtri, giornate in riquadri col colore del campionato)
function MatchesPanel({ fm, sk, season, tint }) {
  const [filter, setFilter] = useState('all');
  const [extra, setExtra] = useState(0);
  const fix = season ? season.fix : [];
  // giornate dalle date: recuperi nella loro data, "in corso"/"prossima" dal calendario (data/rounds.js)
  const blocks = useMemo(() => roundBlocks(fix), [fix]);
  if (!season || !fix.length) return null;
  const pass = MATCH[filter];
  const vis0 = blocks.map((b) => ({ ...b, shown: b.list.filter(pass) }));
  const shownN = vis0.reduce((n, b) => n + b.shown.length, 0);
  const curI = currentBlock(blocks);
  const from = Math.max(0, curI - extra);
  const vis = vis0.slice(from).filter((b) => b.shown.length);
  const hiddenPrev = vis0.slice(0, from).filter((b) => b.shown.length);
  const prev = hiddenPrev[hiddenPrev.length - 1];
  const prevI = prev ? vis0.indexOf(prev) : null;
  const names = season.teams || {};
  return (
    <div className="pt-2">
      <div className="px-5">
        <TextFilter options={[{ value: 'all', label: 'Tutte' }, { value: 'live', label: 'Live' }, { value: 'results', label: 'Risultati' }, { value: 'upcoming', label: 'Programmate' }]} value={filter} onChange={(v) => { setFilter(v); setExtra(0); }} />
      </div>
      {!shownN ? <Empty>Nessuna partita</Empty> : (
        <div>
          {prev ? (
            <button type="button" onClick={() => setExtra(curI - prevI)} className="glass press mx-auto mt-4 flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold">
              <ChevronUp size={15} />{ prev.rec || /^\d+$/.test(String(prev.r)) ? 'Giornate precedenti' : 'Turni precedenti' }
            </button>
          ) : null}
          {vis.map((b) => {
            const list = [...b.shown].sort((x, y) => String(x[4]).localeCompare(String(y[4])));
            const tag = blockTag(b.list);
            const days = [];
            list.forEach((m) => { const k = dayKey(m[4]); const l = days[days.length - 1]; if (l && l.k === k) l.m.push(m); else days.push({ k, m: [m] }); });
            const range = days.length > 1 ? `${fmtDate(days[0].m[0][4])} – ${fmtDate(days[days.length - 1].m[0][4])}` : fmtDate(days[0].m[0][4]);
            return (
              <section key={b.key} data-round={b.rec ? 'rec' : String(b.r)} className="glass mx-4 mt-5 overflow-hidden rounded-[24px] pb-1" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 420px', ...(tint ? { background: tintGrad(tint, 0x45) } : null) }}>
                <div className="flex items-center gap-2 px-4 pb-1 pt-3.5">
                  <h3 className="text-[15px] font-extrabold">{b.rec ? 'Recuperi' : roundTitle(b.r)}</h3>
                  <span className="rounded-full px-2 py-[2px] text-[9.5px] font-extrabold uppercase tracking-wider" style={{ background: tag === 'Conclusa' ? 'var(--hair-2)' : 'var(--accent-soft)', color: tag === 'Conclusa' ? 'var(--ink-3)' : 'var(--accent)' }}>{tag}</span>
                  <span className="ml-auto text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{range}</span>
                </div>
                {days.map((d) => (
                  <div key={d.k}>
                    <div className="px-4 pb-0.5 pt-2.5 text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)', borderTop: '1px solid var(--hair-2)' }}>{fmtDate(d.m[0][4])}{b.rec ? ` · ${[...new Set(d.m.map((m) => roundTitle(m[1])))].join(', ')}` : ''}</div>
                    {d.m.map((m) => <ArchRow key={m[0]} m={m} names={names} fm={fm} sk={sk} />)}
                  </div>
                ))}
              </section>
            );
          })}
          <div className="h-4" />
        </div>
      )}
    </div>
  );
}

export const fmtVal = (key, v) => {
  if (v == null) return '–';
  if (/rating/.test(key)) return Number(v).toFixed(2).replace('.', ',');
  if (/per_90|percentage|_team_match|expected|_diff/.test(key)) return Number(v).toFixed(2).replace('.', ',');
  return Number.isInteger(v) ? String(v) : Number(v).toFixed(1).replace('.', ',');
};
const GROUPS = [
  ['Difesa', /conced|clean|faced|saves|save_|saved|keeper|error|last_man|clearance|owngoal/i],
  ['Attacco', /goal|shot|scoring_att|assist|chance|xg|expected|penalty_won|won_contest|dribble/i],
  ['Passaggi', /pass|cross|long|lbp|touch/i],
  ['Difesa', /tackle|intercept|clear|block|recover|defens|duel|aerial|poss_won|save|clean|conced/i],
  ['Disciplina', /card|foul|offside/i],
  ['Rendimento', /rating|min|match|appear/i],
];
export const groupOf = (k) => (GROUPS.find(([, re]) => re.test(k)) || ['Altro'])[0];
export const ORDER = ['Attacco', 'Rendimento', 'Passaggi', 'Difesa', 'Disciplina', 'Altro'];

// Classifiche statistiche: stesso componente delle statistiche del campionato attuale
const NO90 = /rating|mins_played|percentage|^_|per_90|clean_sheet|matches|appear/i;
export function statSections(stats, kind, names, col, fm, sk, mode = 'tot', onlyTeam = null) {
  const lists = stats && stats[kind];
  if (!lists) return [];
  const isP = kind === 'players';
  const p90 = isP && mode === 'p90';
  const secs = [];
  Object.keys(lists).forEach((k) => {
    let list = lists[k];
    if (list && onlyTeam) list = list.filter((r) => String(r[2]) === String(onlyTeam));
    if (!list || !list.length || k.startsWith('_')) return;
    let title = SEASON_STAT_IT[k] || prettyKey(k);
    let kk = k;
    if (isP) {
      const isRate = /per_90/.test(k);
      if (p90) {
        if (isRate) { /* gia' ogni 90' */ } else if (NO90.test(k)) return;
        else {
          list = list.filter((r) => r[4] >= (onlyTeam ? 180 : 450) && r[3] != null)
            .map((r) => [r[0], r[1], r[2], (Number(r[3]) * 90) / r[4], r[4], r[5], r[6]])
            .sort((x, y) => y[3] - x[3]);
          if (!list.length) return;
          title = `${title} / 90'`;
          kk = `${k}_per_90`;
        }
      } else if (isRate) return;
    }
    secs.push({
      id: kk,
      group: groupOf(k),
      title,
      rows: list.slice(0, 50).map((r, i) => ({
        id: `${r[0]}-${i}`,
        to: isP ? `/storico/${fm}/${sk}/giocatore/${r[0]}` : `/storico/${fm}/${sk}/squadra/${r[2]}`,
        left: isP ? <PlayerFace id={r[0]} name={r[1]} size={30} /> : <TeamLogo id={r[2]} name={r[1]} size={24} />,
        name: r[1],
        sub: isP ? (names[r[2]] || '') : undefined,
        bg: rowBg(col, r[2], names[r[2]] || r[1], 0x55),
        value: fmtVal(p90 && kk !== k ? 'per_90' : k, r[3]),
      })),
    });
  });
  secs.sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group) || (SEASON_STAT_IT[a.id] ? 0 : 1) - (SEASON_STAT_IT[b.id] ? 0 : 1));
  return secs;
}

export function ArchStatPanel({ stats, kind, names, col, fm, sk }) {
  const [mode, setMode] = useState('tot');
  const sections = statSections(stats, kind, names, col, fm, sk, mode);
  if (!sections.length) return null;
  const controls = kind === 'players'
    ? <TextFilter options={[{ value: 'tot', label: 'Totale' }, { value: 'p90', label: "Ogni 90'" }]} value={mode} onChange={setMode} />
    : null;
  return <StatLists sections={sections} controls={controls} />;
}


// Statistiche di squadra con Totale / Casa / Trasferta: medie a partita ricavate dalle partite archiviate della stagione.
const TEAM_PART = [{ value: 0, label: 'Totale' }, { value: 1, label: 'Casa' }, { value: 2, label: 'Trasferta' }];
const TS_KEYS = STAT_GROUPS.flatMap(([title, keys]) => keys.map((k) => [k, title]));
const TS_EXTRA = ['expected_goals_open_play', 'expected_goals_non_penalty', 'expected_goals_on_target'];
function teamAverages(season, det) {
  const m = (det && det.m) || {};
  const acc = {}; // tid -> part -> key -> {s,n}
  const bump = (tid, part, k, v) => {
    const t = (acc[tid] = acc[tid] || [{}, {}, {}]);
    const x = (t[part][k] = t[part][k] || { s: 0, n: 0 });
    x.s += v; x.n += 1;
  };
  (season.fix || []).forEach((f) => {
    if (!f[6] || f[8]) return;
    const sc = String(f[5] || '').split(' - ').map(Number);
    const d = m[String(f[0])];
    const sides = [[f[2], 1, 0], [f[3], 2, 1]];
    sides.forEach(([tid, part, i]) => {
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
    });
  });
  return acc;
}
const TS_LABEL = { goals_for: 'Gol fatti', goals_against: 'Gol subiti' };
function ArchTeamStatPanel({ season, det, stats, names, col, fm, sk }) {
  const [part, setPart] = useState(0);
  const acc = useMemo(() => (season && det && det.m ? teamAverages(season, det) : null), [season, det]);
  const has = acc && Object.keys(acc).length > 0 && Object.values(acc).some((t) => Object.keys(t[0]).some((k) => k !== 'goals_for' && k !== 'goals_against'));
  if (!has) return <ArchStatPanel stats={stats} kind="teams" names={names} col={col} fm={fm} sk={sk} />;
  const sections = [];
  const groupOfKey = (k) => (TS_KEYS.find((x) => x[0] === k) || [null, 'Altro'])[1];
  const keys = new Set(['goals_for', 'goals_against']);
  Object.values(acc).forEach((t) => Object.keys(t[0]).forEach((k) => keys.add(k)));
  const wanted = [...keys].filter((k) => TS_LABEL[k] || STAT_IT[k] || TS_EXTRA.includes(k));
  wanted.forEach((k) => {
    const rows = Object.entries(acc)
      .map(([tid, t]) => ({ tid, x: t[part][k] }))
      .filter((r) => r.x && r.x.n)
      .map((r) => ({ tid: r.tid, v: r.x.s / r.x.n }))
      .sort((a, b) => b.v - a.v);
    if (rows.length < 2 || rows.every((r) => !r.v)) return;
    sections.push({
      id: k,
      group: TS_LABEL[k] ? 'Principali' : groupOfKey(k),
      title: TS_LABEL[k] || STAT_IT[k] || prettyKey(k),
      rows: rows.map((r, i) => ({
        id: `${r.tid}-${i}`,
        to: `/storico/${fm}/${sk}/squadra/${r.tid}`,
        left: <TeamLogo id={r.tid} name={names[r.tid]} size={24} />,
        name: names[r.tid] || '—',
        bg: rowBg(col, r.tid, names[r.tid], 0x55),
        value: fmtVal(k === 'BallPossesion' ? 'percentage' : 'expected', r.v),
      })),
    });
  });
  const order = ['Principali', ...STAT_GROUPS.map((g) => g[0]).filter((g) => g !== 'Principali'), 'Altro'];
  sections.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
  if (!sections.length) return <ArchStatPanel stats={stats} kind="teams" names={names} col={col} fm={fm} sk={sk} />;
  return (
    <StatLists
      sections={sections}
      controls={<TextFilter options={TEAM_PART} value={part} onChange={setPart} />}
    />
  );
}

// arbitri della stagione: medie calcolate dalle partite archiviate (arbitro, cartellini, falli, rigori)
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

export default function ArchiveLeague({ fm, sk, tab, setTab, tint }) {
  useArchFresh(fm, sk); // risultati nuovi della stagione in corso: si ridisegna con le righe aggiornate
  const { data: season, loading } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const { data: stats, loading: l3 } = useAsync(() => loadTeamStats(fm, sk), [fm, sk]);
  const { data: pstats, loading: l5 } = useAsync(() => loadPlayerStats(fm, sk), [fm, sk]);
  const { data: det, loading: l2 } = useAsync(() => loadSeasonMatches(fm, sk), [fm, sk]);
  const col = useTeamColors();
  const pure = isPureCup(fm);
  const { data: br, loading: l4 } = useAsync(() => (pure ? loadBracket(fm, sk) : null), [fm, sk]);
  const { data: curSk } = useAsync(() => currentSeason(fm), [fm]);
  const refsOk = refsAllowed(fm) && (refsAllSeasons(fm) || (!!curSk && curSk === sk) || (RAW.extra && RAW.extra.sk && RAW.extra.sk[String(fm)] === sk));
  const refs = useMemo(() => (refsOk ? refsOf(det) : []), [det, refsOk]);
  if ((loading && !season) || l2 || l3 || l4 || l5) return <Loading />;
  const names = (season && season.teams) || {};
  // una scheda senza dati non si mostra (mai "non disponibile")
  const has = {
    matches: !!(season && season.fix && season.fix.length),
    standings: pure ? !!(br && br.rounds && br.rounds.length) : !!(season && (season.table || (season.groups && season.groups.length))),
    teams: !!(det && det.m && Object.keys(det.m).length) || statSections(stats, 'teams', names, col, fm, sk, 'tot').length > 0,
    players: statSections(pstats, 'players', names, col, fm, sk, 'tot').length > 0,
    referees: refs.length > 0,
  };
  const PANEL = {
    matches: () => <MatchesPanel key="m" fm={fm} sk={sk} season={season} tint={tint} />,
    standings: () => (pure ? <Bracket key="s" fm={fm} sk={sk} /> : <ClassificaSwitch key="s" fm={fm} sk={sk}><StandingsPanel season={season} fm={fm} sk={sk} /></ClassificaSwitch>),
    teams: () => <ArchTeamStatPanel key="t" season={season} det={det} stats={stats} names={names} col={col} fm={fm} sk={sk} />,
    players: () => <ArchStatPanel key="p" stats={pstats} kind="players" names={names} col={col} fm={fm} sk={sk} />,
    referees: () => <RefereesView key="r" base={refs} />,
  };
  const baseTabs = pure ? TABS.map((t) => (t.key === 'standings' ? { ...t, label: 'Tabellone' } : t)) : TABS;
  const tabs = baseTabs.filter((t) => has[t.key]);
  const panels = tabs.map((t) => PANEL[t.key]());
  return <SwipeTabs fixedBar tabs={tabs} panels={panels} index={Math.min(tab, tabs.length - 1)} onChange={setTab} className="pt-0" />;
}
