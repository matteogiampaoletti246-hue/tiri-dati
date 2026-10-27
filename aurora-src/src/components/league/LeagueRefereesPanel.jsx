import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import TextFilter from '@/components/TextFilter';
import { refereesOf } from '@/data/referees';
import { comma } from '@/lib/format';

const METRICS = [
  { key: 'y', label: 'Gialli', f: 'y', d: 1 },
  { key: 'r', label: 'Rossi', f: 'r', d: 2 },
  { key: 'fo', label: 'Falli', f: 'fo', d: 1 },
  { key: 'pen', label: 'Rigori', f: 'pen', d: 2 },
  { key: 'n', label: 'Partite', f: 'n', d: 0 },
];
const Wrap = ({ to: t, children, ...rest }) => (t ? <Link to={t} {...rest}>{children}</Link> : <div {...rest}>{children}</div>);
const GRID = '20px minmax(0,1fr) repeat(5, 40px)';

// Classifica arbitri del campionato: la statistica scelta ordina la lista e la sua colonna e' evidenziata.
// I dati sono quelli del campionato (non di tutte le competizioni).
export default function LeagueRefereesPanel({ leagueId }) {
  const base = useMemo(
    () =>
      refereesOf(leagueId)
        .map((r) => {
          const b = (r.by && r.by[leagueId]) || { n: r.games, y: r.yellowsAvg, r: r.redsAvg, fo: r.foulsAvg, pen: r.penaltiesAvg };
          return { id: r.id, name: r.name, country: r.country, n: b.n || 0, y: b.y || 0, r: b.r || 0, fo: b.fo || 0, pen: b.pen || 0 };
        })
        .filter((r) => r.n > 0),
    [leagueId]
  );
  return <RefereesView base={base} to={(r) => `/arbitro/${r.id}`} />;
}

// Classifica arbitri (medie a partita o totali): usata dal campionato attuale e dalle stagioni passate
export function RefereesView({ base, to = null }) {
  const [mode, setMode] = useState('avg');
  const [sel, setSel] = useState('y');
  if (!base.length) return <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessun arbitro disponibile</p>;

  const val = (r, m) => (m.key === 'n' ? r.n : mode === 'avg' ? r[m.f] : Math.round(r[m.f] * r.n));
  const fmt = (v, m) => (m.key === 'n' || mode === 'tot' ? String(v) : comma(v, m.d));
  const cur = METRICS.find((m) => m.key === sel);
  const rows = [...base].sort((a, b) => val(b, cur) - val(a, cur) || b.n - a.n || a.name.localeCompare(b.name));

  return (
    <div className="pb-6 pt-2">
      <div className="mb-3 px-4">
        <TextFilter options={[{ value: 'avg', label: 'A partita' }, { value: 'tot', label: 'Totale' }]} value={mode} onChange={setMode} />
      </div>

      <div className="flex items-center gap-5 overflow-x-auto px-5 hide-sb">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setSel(m.key)}
            className="press relative shrink-0 pb-1.5 text-[13.5px]"
            style={{ fontWeight: m.key === sel ? 800 : 500, color: m.key === sel ? 'var(--ink)' : 'var(--ink-3)' }}
          >
            {m.label}
            {m.key === sel ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full" style={{ background: 'var(--accent)' }} /> : null}
          </button>
        ))}
      </div>

      <div className="mt-2">
        <div className="grid items-center gap-1.5 px-4 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[.08em]" style={{ gridTemplateColumns: GRID, color: 'var(--ink-3)' }}>
          <span />
          <span>Arbitro</span>
          {METRICS.map((m) => (
            <button key={m.key} type="button" onClick={() => setSel(m.key)} className="text-right font-bold uppercase" style={{ color: m.key === sel ? 'var(--accent)' : 'inherit', letterSpacing: 'inherit', fontSize: 'inherit' }}>
              {m.label}
            </button>
          ))}
        </div>
        {rows.map((r, i) => (
          <Wrap key={r.id} to={to ? to(r) : null} className="grid items-center gap-1.5 px-4 py-2.5" style={{ gridTemplateColumns: GRID, borderTop: '1px solid var(--hair-2)' }}>
            <span className="tnum text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{i + 1}</span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-semibold">{r.name}</span>
              <span className="block truncate text-[9px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{r.country || ''}</span>
            </span>
            {METRICS.map((m) =>
              m.key === sel ? (
                <span key={m.key} className="tnum text-right text-[13.5px] font-extrabold" style={{ color: 'var(--accent)' }}>{fmt(val(r, m), m)}</span>
              ) : (
                <span key={m.key} className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{fmt(val(r, m), m)}</span>
              )
            )}
          </Wrap>
        ))}
      </div>
    </div>
  );
}
