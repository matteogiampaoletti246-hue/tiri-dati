import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import SwipeTabs from '@/components/SwipeTabs';
import TextFilter from '@/components/TextFilter';
import StatLists from '@/components/stats/StatLists';
import Skeleton from '@/components/Skeleton';
import { TeamLogo, PlayerFace } from '@/components/FmImg';
import useAsync from '@/hooks/useAsync';
import { loadSeason, loadSeasonStats, SEASON_STAT_IT, prettyKey } from '@/data/archive';
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
              <section key={r} className="glass mx-4 mt-5 overflow-hidden rounded-[24px] pb-1" style={tint ? { background: tintGrad(tint, 0x45) } : undefined}>
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

const fmtVal = (key, v) => {
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
const groupOf = (k) => (GROUPS.find(([, re]) => re.test(k)) || ['Altro'])[0];
const ORDER = ['Attacco', 'Rendimento', 'Passaggi', 'Difesa', 'Disciplina', 'Altro'];

// Classifiche statistiche: stesso componente delle statistiche del campionato attuale
function statSections(stats, kind, names, col, fm, sk) {
  const lists = stats && stats[kind];
  if (!lists) return [];
  const isP = kind === 'players';
  const keys = Object.keys(lists).filter((k) => lists[k] && lists[k].length && !k.startsWith('_'));
  const secs = keys.map((k) => ({
    id: k,
    group: groupOf(k),
    title: SEASON_STAT_IT[k] || prettyKey(k),
    rows: lists[k].slice(0, 50).map((r, i) => ({
      id: `${r[0]}-${i}`,
      to: isP ? `/storico/${fm}/${sk}/giocatore/${r[0]}` : `/storico/${fm}/${sk}/squadra/${r[2]}`,
      left: isP ? <PlayerFace id={r[0]} name={r[1]} size={30} /> : <TeamLogo id={r[2]} name={r[1]} size={24} />,
      name: r[1],
      sub: isP ? (names[r[2]] || '') : undefined,
      bg: rowBg(col, r[2], names[r[2]] || r[1], 0x55),
      value: fmtVal(k, r[3]),
    })),
  }));
  secs.sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group) || (SEASON_STAT_IT[a.id] ? 0 : 1) - (SEASON_STAT_IT[b.id] ? 0 : 1));
  return secs;
}

export function ArchStatPanel({ stats, kind, names, col, fm, sk, filterTeam = null }) {
  let sections = statSections(stats, kind, names, col, fm, sk);
  if (filterTeam != null) {
    sections = sections.map((s) => ({ ...s, rows: s.rows.filter((r) => String(r.to).includes('/giocatore/') && true) })).filter((s) => s.rows.length);
  }
  if (!sections.length) return <Empty>Statistiche non disponibili per questa stagione</Empty>;
  return <StatLists sections={sections} />;
}

export default function ArchiveLeague({ fm, sk, tab, setTab, tint }) {
  const { data: season, loading } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const { data: stats } = useAsync(() => loadSeasonStats(fm, sk), [fm, sk]);
  const col = useTeamColors();
  if (loading && !season) return <Loading />;
  const names = (season && season.teams) || {};
  const panels = [
    <MatchesPanel key="m" fm={fm} sk={sk} season={season} tint={tint} />,
    <StandingsPanel key="s" season={season} fm={fm} sk={sk} />,
    <ArchStatPanel key="t" stats={stats} kind="teams" names={names} col={col} fm={fm} sk={sk} />,
    <ArchStatPanel key="p" stats={stats} kind="players" names={names} col={col} fm={fm} sk={sk} />,
    <Empty key="r">Arbitri non disponibili per questa stagione</Empty>,
  ];
  return <SwipeTabs fixedBar tabs={TABS} panels={panels} index={tab} onChange={setTab} className="pt-0" />;
}
