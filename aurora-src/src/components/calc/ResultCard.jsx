import { comma, num } from '@/lib/format';
import { fmtLine, fmtPct } from '@/lib/calc';
import Gauge from './Gauge';

function Metric({ label, value, strong = false }) {
  return (
    <div className="flex items-baseline gap-3 px-5 py-2.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
      <span className="label-sm min-w-0 leading-tight">{label}</span>
      <span className={`tnum ml-auto text-right text-[14.5px] ${strong ? 'font-semibold' : ''}`} style={{ color: 'var(--ink)' }}>
        {value}
      </span>
    </div>
  );
}

// Scheda risultato: punteggio, voci del modello, stake suggerito e «Gioca!».
export default function ResultCard({ result, kind = 'player' }) {
  const { stake } = result;
  const stakeValue = stake.stake === null ? '—' : comma(stake.stake, 2);
  const stakeCaption =
    stake.note === 'Valore'
      ? 'Unità di stake suggerite'
      : stake.note === 'Non di valore'
        ? 'Giocata sconsigliata dal modello'
        : stake.note === 'Inserisci la quota'
          ? 'Inserisci la quota per calcolare lo stake'
          : 'Inserisci le statistiche per calcolare lo stake';

  return (
    <div className="panel overflow-hidden">
      <div className="px-5 pb-5 pt-6">
        <Gauge score={result.score} />
        <p className="mt-3 text-center text-[14px]" style={{ color: 'var(--ink-2)' }}>
          {result.reliability.label}
        </p>
      </div>

      <Metric label="Lambda" value={comma(result.lambda, 2)} />
      <Metric label="Linea" value={`${result.lineType === 'under' ? 'Under' : 'Over'} ${fmtLine(result.line)}`} />
      <Metric label="Probabilità modello" value={fmtPct(result.probModel)} />
      {kind === 'player' ? <Metric label="Hit rate" value={result.hitLabel || '—'} /> : null}
      <Metric label="Probabilità finale" value={fmtPct(result.probFinal)} strong />
      <Metric label="Probabilità implicita" value={fmtPct(result.impliedProb)} />
      <Metric
        label="Fascia quota"
        value={result.tier.value === null ? '—' : `${result.tier.label} · ${comma(result.tier.value, 1)}`}
      />
      <Metric
        label="Valore complessivo"
        value={result.combo.value === null ? '—' : `${num(result.combo.value)} · ${result.combo.label}`}
      />

      <div className="px-5 pt-4">
        <div className="rounded-[22px] p-[18px]" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 34%, transparent), color-mix(in srgb, var(--accent) 10%, transparent) 62%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 50%, transparent)', boxShadow: '0 0 28px color-mix(in srgb, var(--accent) 16%, transparent)' }}>
          <div className="flex items-center justify-between gap-3">
            <p className="label-sm">Stake suggerito</p>
            <p className="tnum text-[44px] font-extrabold leading-none" style={{ color: stake.stake === null ? 'var(--ink-3)' : 'var(--accent)' }}>{stakeValue}</p>
          </div>
          <div className="mt-3.5 h-2 overflow-hidden rounded-full" style={{ background: 'var(--hair)' }}>
            <div className="h-full rounded-full" style={{ width: `${stake.stake === null ? 0 : Math.max(0, Math.min(1, stake.stake / 2)) * 100}%`, background: 'linear-gradient(90deg, #2f8bff, var(--accent))' }} />
          </div>
          <div className="mt-1 flex justify-between text-[10.5px]" style={{ color: 'var(--ink-3)' }}><span>0</span><span>2 max</span></div>
        </div>
        <p className="mt-2 text-right text-[11px]" style={{ color: 'var(--ink-3)' }}>
          {stakeCaption}
        </p>
      </div>

      <div className="pb-4" />
    </div>
  );
}
