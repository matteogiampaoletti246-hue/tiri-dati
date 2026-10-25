import { Link } from 'react-router-dom';
import Crest from './Crest';
import FormDots from './FormDots';
import { teamById } from '@/data/teams';
import { standings } from '@/data/standings';

const HEAD = ['#', 'Squadra', 'PG', 'V', 'N', 'P', 'DR', 'Pt', 'Forma'];
const COLS = '20px 1fr 24px 20px 20px 20px 30px 26px 44px';

export default function StandingsTable({ leagueId, mode = 'total', highlight = [] }) {
  const rows = standings(leagueId, mode);
  if (!rows.length) return null;

  return (
    <div>
      <div
        className="grid items-center gap-2 px-5 pb-2 text-[9.5px] uppercase tracking-[.1em]"
        style={{ gridTemplateColumns: COLS, color: 'var(--ink-3)' }}
      >
        {HEAD.map((h, i) => (
          <span key={h} className={i === 1 ? '' : 'text-right'}>
            {h}
          </span>
        ))}
      </div>

      {rows.map((row) => {
        const team = teamById(row.teamId);
        const on = highlight.includes(row.teamId);
        return (
          <Link
            key={row.teamId}
            to={`/squadra/${row.teamId}`}
            className="grid items-center gap-2 px-5 py-2.5 transition-opacity active:opacity-60"
            style={{
              gridTemplateColumns: COLS,
              borderTop: '1px solid var(--hair-2)',
              background: on ? 'var(--accent-soft)' : 'transparent',
            }}
          >
            <span className="tnum text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
              {row.rank}
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <Crest team={team} size={20} />
              <span className="truncate text-[13px]" style={{ color: 'var(--ink)' }}>
                {team ? team.name : '—'}
              </span>
            </span>
            <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
              {row.played}
            </span>
            <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
              {row.won}
            </span>
            <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
              {row.drawn}
            </span>
            <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
              {row.lost}
            </span>
            <span className="tnum text-right text-[11.5px]" style={{ color: row.dr > 0 ? 'var(--good)' : row.dr < 0 ? 'var(--bad)' : 'var(--ink-2)' }}>
              {row.dr > 0 ? `+${row.dr}` : row.dr}
            </span>
            <span className="tnum text-right text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
              {row.points}
            </span>
            <span className="flex justify-end">
              <FormDots form={row.form} size={13} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
