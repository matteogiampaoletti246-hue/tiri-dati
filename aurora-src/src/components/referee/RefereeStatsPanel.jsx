import PanelTitle from '@/components/PanelTitle';
import { comma } from '@/lib/format';

const TILES = [
  { key: 'games', label: 'Gare' },
  { key: 'yellows', label: 'Gialli' },
  { key: 'reds', label: 'Rossi' },
  { key: 'penalties', label: 'Rigori' },
];

const ROWS = [
  { key: 'yellows', label: 'Cartellini gialli' },
  { key: 'reds', label: 'Cartellini rossi' },
  { key: 'fouls', label: 'Falli fischiati' },
  { key: 'penalties', label: 'Rigori assegnati' },
];

const COLS = '1fr 44px 54px';

export default function RefereeStatsPanel({ referee }) {
  const per = (value) => comma(referee.games ? value / referee.games : null, 2);

  return (
    <div className="flex flex-col gap-7">
      <section className="px-5">
        <div className="grid grid-cols-4 gap-3">
          {TILES.map((t) => (
            <div key={t.key}>
              <p className="text-[9.5px] uppercase tracking-[.1em]" style={{ color: 'var(--ink-3)' }}>
                {t.label}
              </p>
              <p className="tnum mt-1 text-[20px] font-light" style={{ color: 'var(--ink)' }}>
                {referee[t.key]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5">
        <PanelTitle>Medie</PanelTitle>
        <div
          className="grid items-center gap-2 pb-2 text-[9.5px] uppercase tracking-[.1em]"
          style={{ gridTemplateColumns: COLS, color: 'var(--ink-3)' }}
        >
          <span />
          <span className="text-right">Totale</span>
          <span className="text-right">Per gara</span>
        </div>
        <div className="panel-solid px-4 py-1">
          {ROWS.map((r, i) => (
            <div
              key={r.key}
              className="grid items-center gap-2 py-2.5"
              style={{ gridTemplateColumns: COLS, borderTop: i ? '1px solid var(--hair-2)' : 'none' }}
            >
              <span className="truncate text-[13px]" style={{ color: 'var(--ink-2)' }}>
                {r.label}
              </span>
              <span className="tnum text-right text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                {referee[r.key]}
              </span>
              <span className="tnum text-right text-[13.5px] font-medium" style={{ color: 'var(--ink)' }}>
                {per(referee[r.key])}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
