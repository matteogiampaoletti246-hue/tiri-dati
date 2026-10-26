import { useState } from 'react';
import { Link } from 'react-router-dom';
import Crest from './Crest';
import FormDots from './FormDots';
import { teamById } from '@/data/teams';
import { standings, zoneOf } from '@/data/standings';

const COLS = { table: '18px 1fr 22px 20px 20px 20px 36px 28px', forma: '18px 1fr 92px 30px' };

const cptOf = () => { try { return localStorage.getItem('sl-concept-sort') || 'a'; } catch { return 'a'; } };
const SORTS = { 'PG': (r) => r.played, V: (r) => r.won, N: (r) => r.drawn, P: (r) => r.lost, 'GF:GS': (r) => r.gf - r.ga, Pt: (r) => r.points };

export default function StandingsTable({ leagueId, mode = 'total', highlight = [], concept = cptOf(), init = null }) {
  const base = standings(leagueId, mode);
  // ordinamento: di default dal migliore al peggiore; si inverte toccando un'intestazione gia' presente
  const [sort, setSort] = useState(init || { k: '#', dir: 1 });
  const rows = (() => {
    const f = SORTS[sort.k];
    if (sort.k === '#' || !f || mode === 'forma') return sort.dir === 1 ? base : [...base].reverse();
    return [...base].sort((a, b) => (f(b) - f(a)) * sort.dir || a.rank - b.rank);
  })();
  if (!rows.length) return null;
  const forma = mode === 'forma';
  const cols = forma ? COLS.forma : COLS.table;
  const head = forma ? ['#', 'Squadra', 'Ultime 5', 'Pt'] : ['#', 'Squadra', 'PG', 'V', 'N', 'P', 'GF:GS', 'Pt'];
  const legend = [];
  if (!forma && mode === 'total') {
    rows.forEach((r) => {
      const z = zoneOf(leagueId, r.rank);
      if (z && !legend.find((l) => l.label === z.label)) legend.push(z);
    });
  }

  return (
    <div>
      <div className="grid items-center gap-2 px-4 pb-2 text-[9.5px] font-bold uppercase tracking-[.1em]" style={{ gridTemplateColumns: cols, color: 'var(--ink-3)' }}>
        {head.map((h, i) => {
          const key = h === 'Squadra' || h === 'Ultime 5' ? null : concept !== 'c' && h === 'Pt' ? '#' : h;
          const can = key && (concept === 'c' ? true : concept === 'a' ? h === '#' : h === 'Pt');
          const on = can && sort.k === key;
          const arrow = on ? (sort.dir === 1 ? '↓' : '↑') : '';
          return can ? (
            <button
              key={h}
              type="button"
              onClick={() => setSort((s0) => (s0.k === key ? { k: key, dir: -s0.dir } : { k: key, dir: 1 }))}
              className="press text-right font-bold uppercase"
              style={{ color: on ? 'var(--accent)' : 'inherit', letterSpacing: 'inherit', fontSize: 'inherit', padding: 0 }}
            >
              {h}{arrow ? <span className="text-[9px]">{arrow}</span> : null}
            </button>
          ) : (
            <span key={h} className={i === 1 ? '' : 'text-right'}>{h}</span>
          );
        })}
      </div>

      {rows.map((row) => {
        const team = teamById(row.teamId);
        const on = highlight.includes(row.teamId);
        const z = !forma && mode === 'total' ? zoneOf(leagueId, row.rank) : null;
        const pts = forma ? row.formPoints : row.points;
        return (
          <Link
            key={row.teamId}
            to={`/squadra/${row.teamId}`}
            className="press relative grid items-center gap-2 px-4 py-2.5"
            style={{ gridTemplateColumns: cols, borderTop: '1px solid var(--hair-2)', background: on ? 'var(--accent-soft)' : 'transparent' }}
          >
            {z ? <span aria-hidden="true" className="absolute left-0 top-1.5 bottom-1.5 w-[3.5px] rounded-r-full" style={{ background: z.color }} /> : null}
            <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{row.rank}</span>
            <span className="flex min-w-0 items-center gap-2">
              <Crest team={team} size={22} />
              <span className="truncate text-[13px] font-semibold">{team ? team.name : '—'}</span>
            </span>
            {forma ? (
              <span className="flex justify-end"><FormDots form={row.form} size={15} /></span>
            ) : (
              <>
                <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{row.played}</span>
                <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{row.won}</span>
                <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{row.drawn}</span>
                <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{row.lost}</span>
                <span className="tnum text-right text-[11px]" style={{ color: 'var(--ink-2)' }}>{row.gf}:{row.ga}</span>
              </>
            )}
            <span className="tnum text-right text-[13.5px] font-extrabold">{pts}</span>
          </Link>
        );
      })}

      {legend.length ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2 px-5 pb-6 pt-4">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
              <span className="h-[9px] w-[9px] rounded-full" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
