import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SwipeTabs from '@/components/SwipeTabs';
import TextFilter from '@/components/TextFilter';
import Skeleton from '@/components/Skeleton';
import Dropdown from './Dropdown';
import { TeamLogo, PlayerFace } from '@/components/FmImg';
import useAsync from '@/hooks/useAsync';
import { loadSeason, loadSeasonStats, SEASON_STAT_IT, prettyKey } from '@/data/archive';

const TABS = [
  { key: 'matches', label: 'Partite' },
  { key: 'standings', label: 'Classifica' },
  { key: 'players', label: 'Giocatori' },
  { key: 'teams', label: 'Squadre' },
];

const Empty = ({ children }) => (
  <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>{children}</p>
);
const Loading = () => (
  <div className="space-y-3 px-5 pt-6">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[52px] w-full rounded-2xl" />)}</div>
);

const fmtDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Rome' }).replace('.', '');
};
const fmtTime = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
};

function MatchesPanel({ fm, sk, season }) {
  const rounds = useMemo(() => {
    if (!season) return [];
    const seen = [];
    season.fix.forEach((m) => { if (!seen.includes(m[1])) seen.push(m[1]); });
    return seen;
  }, [season]);
  const lastPlayed = useMemo(() => {
    if (!season) return null;
    const played = season.fix.filter((m) => m[6]);
    return played.length ? played[played.length - 1][1] : rounds[0];
  }, [season, rounds]);
  const [round, setRound] = useState(null);
  const cur = round ?? lastPlayed;
  const strip = useRef(null);
  useEffect(() => {
    const b = strip.current;
    const el = b && b.querySelector('[data-on="1"]');
    if (b && el) b.scrollTo({ left: el.offsetLeft - b.clientWidth / 2 + el.offsetWidth / 2, behavior: 'auto' });
  }, [cur, rounds.length]);
  if (!season) return <Empty>Calendario non disponibile per questa stagione</Empty>;
  const list = season.fix.filter((m) => m[1] === cur).sort((a, b) => String(a[4]).localeCompare(String(b[4])));
  const label = (r) => {
    const x = String(r);
    const map = { final: 'Finale', playoff: 'Playoff', '1/2': 'Semifinali', '1/4': 'Quarti', '1/8': 'Ottavi', '1/16': 'Sedicesimi', '1/32': 'Trentaduesimi', '3rd': 'Finale 3°' };
    return map[x] || (/^\d+$/.test(x) ? `G${x}` : x.replace(/^\w/, (c) => c.toUpperCase()));
  };
  return (
    <div className="pt-3">
      <div ref={strip} data-no-swipe className="hide-sb flex gap-2 overflow-x-auto px-5 pb-3">
        {rounds.map((r) => {
          const on = r === cur;
          return (
            <button key={r} type="button" data-on={on ? '1' : '0'} onClick={() => setRound(r)} className="press tnum flex-none rounded-full px-3.5 py-2 text-[12.5px] font-bold" style={{ background: on ? 'var(--accent-soft)' : 'var(--pill-bg)', color: on ? 'var(--accent)' : 'var(--ink-2)', border: `1px solid ${on ? 'var(--accent)' : 'var(--glass-border)'}` }}>
              {label(r)}
            </button>
          );
        })}
      </div>
      <section className="glass mx-4 overflow-hidden rounded-[26px]">
        {list.map((m, i) => {
          const hn = season.teams[m[2]] || '—';
          const an = season.teams[m[3]] || '—';
          const played = !!m[6];
          const sc = String(m[5] || '').split(' - ');
          return (
            <Link key={m[0]} to={`/storico/${fm}/${sk}/${m[0]}`} className="press block" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
              <p className="tnum pt-2.5 text-center text-[10.5px] font-semibold" style={{ color: 'var(--ink-3)' }}>{fmtDate(m[4])}</p>
              <div className="flex items-center gap-2 px-4 pb-3 pt-1">
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
                  <span className="truncate text-right text-[14px] font-semibold">{hn}</span>
                  <TeamLogo id={m[2]} name={hn} size={24} />
                </div>
                <div className="w-[64px] shrink-0 text-center">
                  {played && sc.length === 2 ? (
                    <span className="tnum text-[15.5px] font-extrabold">{sc[0]}<span className="mx-0.5 font-medium" style={{ color: 'var(--ink-3)' }}>–</span>{sc[1]}</span>
                  ) : (
                    <span className="tnum text-[13.5px] font-semibold" style={{ color: 'var(--ink-3)' }}>{m[8] ? 'Annull.' : fmtTime(m[4])}</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <TeamLogo id={m[3]} name={an} size={24} />
                  <span className="truncate text-[14px] font-semibold">{an}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
      <div className="h-4" />
    </div>
  );
}

const COLS = '20px 1fr 22px 20px 20px 20px 40px 28px';
function StandingsPanel({ season }) {
  const [mode, setMode] = useState('all');
  const t = season && season.table;
  if (!t) return <Empty>Classifica non disponibile per questa stagione</Empty>;
  const rows = t[mode] || t.all || [];
  const legend = season.legend || [];
  const forma = mode === 'form';
  return (
    <div className="pt-3">
      <div className="px-4">
        <TextFilter options={[{ value: 'all', label: 'Totale' }, { value: 'home', label: 'Casa' }, { value: 'away', label: 'Trasferta' }, { value: 'form', label: 'Forma' }]} value={mode} onChange={setMode} />
      </div>
      <div className="mt-3">
        <div className="grid items-center gap-2 px-4 pb-2 text-[9.5px] font-bold uppercase tracking-[.1em]" style={{ gridTemplateColumns: COLS, color: 'var(--ink-3)' }}>
          {['#', 'Squadra', 'PG', 'V', 'N', 'P', 'GF:GS', 'Pt'].map((h, i) => <span key={h} className={i === 1 ? '' : 'text-right'}>{h}</span>)}
        </div>
        {rows.map((r, i) => (
          <div key={r.id} className="relative grid items-center gap-2 px-4 py-2.5" style={{ gridTemplateColumns: COLS, borderTop: '1px solid var(--hair-2)' }}>
            {r.qualColor && !forma ? <span aria-hidden="true" className="absolute bottom-1.5 left-0 top-1.5 w-[3.5px] rounded-r-full" style={{ background: r.qualColor }} /> : null}
            <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{r.idx || i + 1}</span>
            <span className="flex min-w-0 items-center gap-2"><TeamLogo id={r.id} name={r.shortName || r.name} size={22} /><span className="truncate text-[13px] font-semibold">{r.shortName || r.name}</span></span>
            <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{r.played}</span>
            <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{r.wins}</span>
            <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{r.draws}</span>
            <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{r.losses}</span>
            <span className="tnum text-right text-[11px]" style={{ color: 'var(--ink-2)' }}>{String(r.scoresStr || '').replace('-', ':')}</span>
            <span className="tnum text-right text-[13.5px] font-extrabold">{r.pts}</span>
          </div>
        ))}
        {legend.length && !forma ? (
          <div className="flex flex-wrap gap-x-4 gap-y-2 px-5 pb-6 pt-4">
            {legend.map((l) => (
              <span key={l.tKey || l.title} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                <span className="h-[9px] w-[9px] rounded-full" style={{ background: l.color }} />{l.title}
              </span>
            ))}
          </div>
        ) : <div className="h-6" />}
      </div>
    </div>
  );
}

const fmtVal = (key, v) => {
  if (v == null) return '–';
  if (/rating/.test(key)) return Number(v).toFixed(2);
  if (/per_90|percentage|_team_match|expected|_diff/.test(key)) return Number(v).toFixed(2);
  return Number.isInteger(v) ? String(v) : Number(v).toFixed(1);
};

function StatListPanel({ stats, kind, names }) {
  const lists = stats && stats[kind];
  const keys = lists ? Object.keys(lists).filter((k) => lists[k] && lists[k].length && !k.startsWith('_') ) : [];
  const ordered = keys.sort((a, b) => (SEASON_STAT_IT[a] ? 0 : 1) - (SEASON_STAT_IT[b] ? 0 : 1));
  const [key, setKey] = useState(null);
  if (!lists || !ordered.length) return <Empty>Statistiche non disponibili per questa stagione</Empty>;
  const cur = key && ordered.includes(key) ? key : ordered[0];
  const rows = lists[cur].slice(0, 50);
  const isP = kind === 'players';
  return (
    <div className="pt-3">
      <div className="px-5"><Dropdown options={ordered.map((k) => ({ key: k, label: SEASON_STAT_IT[k] || prettyKey(k) }))} value={cur} onChange={setKey} /></div>
      <section className="glass mx-4 mt-3 overflow-hidden rounded-[26px]">
        {rows.map((r, i) => (
          <div key={`${r[0]}-${i}`} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
            <span className="tnum w-5 text-right text-[12px] font-bold" style={{ color: 'var(--ink-3)' }}>{i + 1}</span>
            {isP ? <PlayerFace id={r[0]} name={r[1]} size={38} /> : <TeamLogo id={r[2]} name={r[1]} size={30} />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{r[1]}</p>
              {isP ? (
                <p className="flex items-center gap-1.5 truncate text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  <TeamLogo id={r[2]} name={names[r[2]]} size={13} />{names[r[2]] || ''}{r[5] ? ` · ${r[5]} partite` : ''}
                </p>
              ) : null}
            </div>
            <span className="tnum text-[17px] font-extrabold">{fmtVal(cur, r[3])}</span>
          </div>
        ))}
      </section>
      <div className="h-4" />
    </div>
  );
}

export default function ArchiveLeague({ fm, sk, tab, setTab }) {
  const { data: season, loading } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const { data: stats } = useAsync(() => loadSeasonStats(fm, sk), [fm, sk]);
  if (loading && !season) return <Loading />;
  const names = (season && season.teams) || {};
  const panels = [
    <MatchesPanel key="m" fm={fm} sk={sk} season={season} />,
    <StandingsPanel key="s" season={season} />,
    <StatListPanel key="p" stats={stats} kind="players" names={names} />,
    <StatListPanel key="t" stats={stats} kind="teams" names={names} />,
  ];
  return <SwipeTabs fixedBar tabs={TABS} panels={panels} index={tab} onChange={setTab} className="pt-0" />;
}
