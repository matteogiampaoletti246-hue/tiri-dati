import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import { metricOf, metricRows } from '@/data/standings';
import { teamById } from '@/data/teams';
import { comma } from '@/lib/format';

export const SHOT_COLUMNS = [
  { key: 'tiri', label: 'Tir' },
  { key: 'tiriInPorta', label: 'Por' },
  { key: 'tiriFuori', label: 'Fuo' },
  { key: 'xg', label: 'xG' },
];

const COLS = '22px 1fr 32px 32px 30px 36px';

const fmt = (key, value) => (value === null || value === undefined ? '—' : key === 'xg' ? comma(value, 2) : comma(value, Number.isInteger(value) ? 0 : 1));

export default function TeamShotsTable({ leagueId, sortKey }) {
  const rows = metricRows(leagueId, sortKey);
  if (!rows.length) return null;

  return (
    <div>
      <div
        className="grid items-center gap-2 px-5 pb-2 text-[9.5px] uppercase tracking-[.1em]"
        style={{ gridTemplateColumns: COLS, color: 'var(--ink-3)' }}
      >
        <span>#</span>
        <span>Squadra</span>
        {SHOT_COLUMNS.map((c) => (
          <span key={c.key} className="text-right">
            {c.label}
          </span>
        ))}
      </div>

      {rows.map((row) => {
        const team = teamById(row.teamId);
        return (
          <Link
            key={row.teamId}
            to={`/squadra/${row.teamId}`}
            className="grid items-center gap-2 px-5 py-2.5 transition-opacity active:opacity-60"
            style={{ gridTemplateColumns: COLS, borderTop: '1px solid var(--hair-2)' }}
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
            {SHOT_COLUMNS.map((c) => {
              const on = c.key === sortKey;
              return (
                <span
                  key={c.key}
                  className={`tnum text-right ${on ? 'text-[13px] font-medium' : 'text-[11.5px]'}`}
                  style={{ color: on ? 'var(--ink)' : 'var(--ink-2)' }}
                >
                  {fmt(c.key, metricOf(row.teamId, c.key))}
                </span>
              );
            })}
          </Link>
        );
      })}
    </div>
  );
}
