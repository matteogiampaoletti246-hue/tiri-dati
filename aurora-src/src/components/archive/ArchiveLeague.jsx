import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import SwipeTabs from '@/components/SwipeTabs';
import TextFilter from '@/components/TextFilter';
import StatLists from '@/components/stats/StatLists';
import Skeleton from '@/components/Skeleton';
import { TeamLogo, PlayerFace } from '@/components/FmImg';
import useAsync from '@/hooks/useAsync';
import { RefereesView } from '@/components/league/LeagueRefereesPanel';
import { loadSeason, loadSeasonStats, loadSeasonMatches, SEASON_STAT_IT, prettyKey } from '@/data/archive';
import { tintGrad } from '@/lib/tint';
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
  const rounds = useMemo(() => {
    const seen = [];
    fix.forEach((m) => { if (!seen.includes(m[1])) seen.push(m[1]); });
    return seen;
  }, [fix]);
  if (!season || !fix.length) return <Empty>Calendario non disponibile per questa stagione</Empty>;
  const shown = fix.filter(MATCH[filter]);
  const byR = {};
  shown.forEach((m) => { (byR[m[1]] = byR[m[1]] || []).push(m); });
  const firstOpen = fix.find((m) => !m[6]);
  const curI = Math.max(0, rounds.indexOf(firstOpen ? firstOpen[1] : rounds[rounds.length - 1]));
  const from = Math.max(0, curI - extra);
  const vis = rounds.slice(from).filter((r) => byR[r]);
  const hiddenPrev = rounds.slice(0, from).filter((r) => byR[r]);
  const prev = hiddenPrev[hiddenPrev.length - 1];
  const prevI = prev !== undefined ? rounds.indexOf(prev) : null;
  const names = season.teams || {};
  return (
    <div className="pt-2">
      <div className="px-5">
        <TextFilter options={[{ value: 'all', label: 'Tutte' }, { value: 'live', label: 'Live' }, { value: 'results', label: 'Risultati' }, { value: 'upcoming', label: 'Programmate' }]} value={filter} onChange={(v) => { setFilter(v); setExtra(0); }} />
      </div>
      {!shown.length ? <Empty>Nessuna partita</Empty> : (
        <div>
          {prev !== undefined ? (
            <button type="button" onClick={() => setExtra(curI - prevI)} className="glass press mx-auto mt-4 flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold">
              <ChevronUp size={15} />{ /^\d+$/.test(String(prev)) ? 'Giornate precedenti' : 'Turni precedenti' }
            </button>
          ) : null}
          {vis.map((r) => {
            const list = [...byR[r]].sort((a, b) => String(a[4]).localeCompare(String(b[4])));
            const done = list.filter((m) => m[6]).length;
            const tag = done === list.length ? 'Conclusa' : done ? 'In corso' : 'Prossima';
            const days = [];
            list.forEach((m) => { const k = dayKey(m[4]); const l = days[days.length - 1]; if (l && l.k === k) l.m.push(m); else days.push({ k, m: [m] }); });
            const range = days.length > 1 ? `${fmtDate(days[0].m[0][4])} – ${fmtDate(days[days.length - 1].m[0][4])}` : fmtDate(days[0].m[0][4]);
            return (
              <section key={r} className="glass mx-4 mt-5 overflow-hidden rounded-[24px] pb-1" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 420px', ...(tint ? { background: tintGrad(tint, 0x45) } : null) }}>
                <div className="flex items-center gap-2 px-4 pb-1 pt-3.5">
                  <h3 className="text-[15px] font-extrabold">{roundTitle(r)}</h3>
                  <span className="rounded-full px-2 py-[2px] text-[9.5px] font-extrabold uppercase tracking-wider" style={{ background: tag === 'Conclusa' ? 'var(--hair-2)' : 'var(--accent-soft)', color: tag === 'Conclusa' ? 'var(--ink-3)' : 'var(--accent)' }}>{tag}</span>
                  <span className="ml-auto text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{range}</span>
                </div>
                {days.map((d) => (
                  <div key={d.k}>
                    <div className="px-4 pb-0.5 pt-2.5 text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)', borderTop: '1px solid var(--hair-2)' }}>{fmtDate(d.m[0][4])}</div>
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
  if (!sections.length) return <Empty>Statistiche non disponibili per questa stagione</Empty>;
  const controls = kind === 'players'
    ? <TextFilter options={[{ value: 'tot', label: 'Totale' }, { value: 'p90', label: "Ogni 90'" }]} value={mode} onChange={setMode} />
    : null;
  return <StatLists key={mode} sections={sections} controls={controls} />;
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
  const { data: season, loading } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const { data: stats } = useAsync(() => loadSeasonStats(fm, sk), [fm, sk]);
  const { data: det, loading: l2 } = useAsync(() => loadSeasonMatches(fm, sk), [fm, sk]);
  const col = useTeamColors();
  const refs = useMemo(() => refsOf(det), [det]);
  if ((loading && !season) || l2) return <Loading />;
  const names = (season && season.teams) || {};
  const panels = [
    <MatchesPanel key="m" fm={fm} sk={sk} season={season} tint={tint} />,
    <StandingsPanel key="s" season={season} fm={fm} sk={sk} />,
    <ArchStatPanel key="t" stats={stats} kind="teams" names={names} col={col} fm={fm} sk={sk} />,
    <ArchStatPanel key="p" stats={stats} kind="players" names={names} col={col} fm={fm} sk={sk} />,
    refs.length ? <RefereesView key="r" base={refs} /> : null,
  ].filter(Boolean);
  const tabs = refs.length ? TABS : TABS.filter((t) => t.key !== 'referees');
  return <SwipeTabs fixedBar tabs={tabs} panels={panels} index={Math.min(tab, tabs.length - 1)} onChange={setTab} className="pt-0" />;
}
