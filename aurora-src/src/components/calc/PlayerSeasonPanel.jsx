import PanelTitle from '@/components/PanelTitle';
import { SEASON_COMPETITIONS } from '@/lib/calc';
import { comma } from '@/lib/format';
import FieldRow from './FieldRow';
import NumInput from './NumInput';
import TintSweep from './TintSweep';

// Medie stagione per competizione (tiri + minuti) e tasso normalizzato a 90'.
export default function PlayerSeasonPanel({ season, onChange, rate90, label = 'Tiri', tint }) {
  return (
    <section>
      <PanelTitle>Medie stagione</PanelTitle>
      <div className="panel has-tint overflow-hidden">
        <TintSweep tint={tint} />
        <div className="flex items-center gap-2 px-5 py-2.5">
          <p className="label-sm">Competizione</p>
          <p className="label-sm ml-auto w-[72px] text-center">{label}</p>
          <p className="label-sm w-[72px] text-center">Minuti</p>
        </div>
        {SEASON_COMPETITIONS.map((c) => (
          <FieldRow key={c.key} label={c.label}>
            <NumInput
              value={season[c.key].tiri}
              onChange={(v) => onChange(c.key, { tiri: v })}
              width={72}
              ariaLabel={`${label} ${c.label}`}
            />
            <NumInput
              value={season[c.key].minuti}
              onChange={(v) => onChange(c.key, { minuti: v })}
              width={72}
              ariaLabel={`Minuti ${c.label}`}
            />
          </FieldRow>
        ))}
        <div className="flex items-baseline gap-3 px-5 py-3.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
          <p className="label-sm min-w-0 leading-tight">Tasso normalizzato a 90&apos;</p>
          <p className="tnum ml-auto text-[15px]" style={{ color: 'var(--ink)' }}>
            {rate90 === null || rate90 === undefined ? '—' : comma(rate90, 2)}
          </p>
        </div>
      </div>
    </section>
  );
}
