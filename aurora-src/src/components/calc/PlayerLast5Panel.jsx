import PanelTitle from '@/components/PanelTitle';
import FieldRow from './FieldRow';
import ChipInput from './ChipInput';
import TintSweep, { ringStyle } from './TintSweep';

// Tiri e minuti delle ultime 5 partite (dalla più recente), una pillola per partita.
export default function PlayerLast5Panel({ form, set, label = 'Tiri', tint }) {
  return (
    <section>
      <PanelTitle>{label} e minuti ultime 5</PanelTitle>
      <div className="panel has-tint overflow-hidden" style={ringStyle(tint)}>
        <TintSweep tint={tint} />
        <FieldRow first label={label}>
          <ChipInput value={form.shots5} onChange={(v) => set('shots5', v)} ariaLabel={`${label} ultime 5`} />
        </FieldRow>
        <FieldRow label="Minuti">
          <ChipInput value={form.minutes5} onChange={(v) => set('minutes5', v)} ariaLabel="Minuti ultime 5" />
        </FieldRow>
      </div>
    </section>
  );
}
