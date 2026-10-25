import PanelTitle from '@/components/PanelTitle';
import { per90 } from '@/data/players';
import { comma } from '@/lib/format';

const ROWS = [
  { key: 'goals', label: 'Gol' },
  { key: 'assists', label: 'Assist' },
  { key: 'shots', label: 'Tiri' },
  { key: 'shotsOnTarget', label: 'Tiri in porta' },
  { key: 'xg', label: 'xG', format: (v) => comma(v, 2) },
  { key: 'foulsCommitted', label: 'Falli commessi' },
];

const COLS = '1fr 44px 54px';

export default function PlayerPer90Panel({ player }) {
  return (
    <section className="px-5">
      <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{player.minutes} minuti</span>}>
        Per 90&apos;
      </PanelTitle>

      <div
        className="grid items-center gap-2 pb-2 text-[9.5px] uppercase tracking-[.1em]"
        style={{ gridTemplateColumns: COLS, color: 'var(--ink-3)' }}
      >
        <span />
        <span className="text-right">Totale</span>
        <span className="text-right">Per 90&apos;</span>
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
              {r.format ? r.format(player[r.key]) : player[r.key]}
            </span>
            <span className="tnum text-right text-[13.5px] font-medium" style={{ color: 'var(--ink)' }}>
              {comma(per90(player[r.key], player.minutes), 2)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
