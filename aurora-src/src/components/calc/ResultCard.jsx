import { comma, num } from '@/lib/format';
import { fmtLine, fmtPct } from '@/lib/calc';
import Gauge from './Gauge';

const NOTE_TONES = { good: 'var(--good)', bad: 'var(--live)', neutral: 'var(--ink-3)' };

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
        <p className="mt-2 text-center text-[11.5px] leading-snug" style={{ color: NOTE_TONES[result.note.tone] }}>
          {result.note.text}
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
        <div className="panel-flat flex items-baseline gap-3 px-4 py-3.5">
          <p className="label-sm">Stake suggerito</p>
          <p className="tnum ml-auto text-[22px] font-light" style={{ color: stake.stake === null ? 'var(--ink-3)' : 'var(--ink)' }}>
            {stakeValue}
          </p>
        </div>
        <p className="mt-2 text-right text-[11px]" style={{ color: 'var(--ink-3)' }}>
          {stakeCaption}
        </p>
      </div>

      <div className="pb-4" />
    </div>
  );
}
