import PanelTitle from '@/components/PanelTitle';
import { comma } from '@/lib/format';

const STATS = [
  { key: 'appearances', label: 'Presenze' },
  { key: 'minutes', label: 'Minuti' },
  { key: 'goals', label: 'Gol' },
  { key: 'assists', label: 'Assist' },
  { key: 'shots', label: 'Tiri' },
  { key: 'shotsOnTarget', label: 'In porta' },
  { key: 'xg', label: 'xG', format: (v) => comma(v, 2) },
  { key: 'foulsCommitted', label: 'Falli fatti' },
  { key: 'foulsDrawn', label: 'Falli subiti' },
];

const LABEL = { fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)' };

export default function PlayerSeasonGrid({ player }) {
  return (
    <section className="px-5">
      <PanelTitle>Statistiche stagione</PanelTitle>
      <div className="grid grid-cols-3 gap-x-3">
        {STATS.map((s, i) => (
          <div key={s.key} className="py-3" style={{ borderTop: i > 2 ? '1px solid var(--hair-2)' : 'none' }}>
            <p style={LABEL}>{s.label}</p>
            <p className="tnum mt-1 text-[18px] font-light" style={{ color: 'var(--ink)' }}>
              {s.format ? s.format(player[s.key]) : player[s.key]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
