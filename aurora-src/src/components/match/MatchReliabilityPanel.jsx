import PanelTitle from '@/components/PanelTitle';
import CompareBars from '@/components/CompareBars';
import { metricOf } from '@/data/standings';
import { comma, num } from '@/lib/format';

const FACTORS = [
  { key: 'xg', label: 'xG' },
  { key: 'tiri', label: 'Tiri' },
  { key: 'tiriInPorta', label: 'Tiri in porta' },
  { key: 'occasioni', label: 'Occasioni nitide' },
  { key: 'possesso', label: 'Possesso' },
  { key: 'precisione', label: 'Precisione passaggi' },
];

export default function MatchReliabilityPanel({ match, home, away }) {
  const a = match.affidabilita;

  return (
    <div className="flex flex-col gap-7 pt-3">
      <section className="px-5">
        <div className="panel px-5 py-6 text-center">
          <p className="label-sm">Indice di affidabilità</p>
          <p className="title-xl tnum mt-2 text-[46px]" style={{ color: 'var(--accent)' }}>
            {comma(a.score)}
          </p>

          <div className="mt-5 flex items-start justify-center gap-10">
            <div>
              <p className="label-sm">Esito</p>
              <p className="tnum mt-1 text-[17px] font-medium" style={{ color: 'var(--ink)' }}>
                {a.pick}
              </p>
            </div>
            <div>
              <p className="label-sm">Stake</p>
              <p className="mt-2 flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className="h-[9px] w-[9px] rounded-full"
                    style={{ background: n <= a.stake ? 'var(--warm-2)' : 'var(--hair-2)' }}
                  />
                ))}
              </p>
            </div>
          </div>

          <div className="tnum mt-6 flex items-center justify-center gap-7 text-[13px]" style={{ color: 'var(--ink-2)' }}>
            <span>
              <span style={{ color: 'var(--ink-3)' }}>1 </span>
              {comma(match.odds.home, 2)}
            </span>
            <span>
              <span style={{ color: 'var(--ink-3)' }}>X </span>
              {comma(match.odds.draw, 2)}
            </span>
            <span>
              <span style={{ color: 'var(--ink-3)' }}>2 </span>
              {comma(match.odds.away, 2)}
            </span>
          </div>
        </div>
      </section>

      <section className="px-5">
        <PanelTitle
          right={
            <span className="text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
              {home ? home.short : ''} · {away ? away.short : ''}
            </span>
          }
        >
          Fattori
        </PanelTitle>
        <CompareBars
          rows={FACTORS.map((f) => ({
            label: f.label,
            home: metricOf(match.homeId, f.key),
            away: metricOf(match.awayId, f.key),
          }))}
          format={num}
        />
      </section>
    </div>
  );
}
