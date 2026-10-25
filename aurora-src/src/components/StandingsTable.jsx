import { Link } from 'react-router-dom';
import Crest from './Crest';
import FormDots from './FormDots';
import { teamById } from '@/data/teams';
import { standings, zoneOf } from '@/data/standings';

const COLS = { table: '18px 1fr 22px 20px 20px 20px 36px 28px', forma: '18px 1fr 92px 30px' };

export default function StandingsTable({ leagueId, mode = 'total', highlight = [] }) {
  const rows = standings(leagueId, mode);
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
        {head.map((h, i) => (
          <span key={h} className={i === 1 ? '' : 'text-right'}>{h}</span>
        ))}
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
