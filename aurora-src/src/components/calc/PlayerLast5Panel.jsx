import PanelTitle from '@/components/PanelTitle';
import FieldRow from './FieldRow';
import NumInput from './NumInput';

// Tiri e minuti delle ultime 5 partite, separati da trattino.
export default function PlayerLast5Panel({ form, set, onDash }) {
  return (
    <section>
      <PanelTitle>Tiri e minuti ultime 5</PanelTitle>
      <div className="panel overflow-hidden">
        <FieldRow
          first
          label="Tiri"
          hint="Sequenza separata da trattino, dalla più recente"
        >
          <NumInput
            value={form.shots5}
            onChange={(v) => set('shots5', v)}
            onFocus={() => set('dashTarget', 'shots')}
            allowDash
            width={148}
            placeholder="3-4-6-2-1"
            ariaLabel="Tiri ultime 5"
          />
        </FieldRow>
        <FieldRow label="Minuti">
          <NumInput
            value={form.minutes5}
            onChange={(v) => set('minutes5', v)}
            onFocus={() => set('dashTarget', 'minutes')}
            allowDash
            width={148}
            placeholder="87-67-81-90-90"
            ariaLabel="Minuti ultime 5"
          />
        </FieldRow>
        <div className="flex items-center gap-3 px-5 py-3" style={{ borderTop: '1px solid var(--hair-2)' }}>
          <p className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
            Formato 3-4-6-2-1
          </p>
          <button
            type="button"
            onClick={onDash}
            className="filter-btn is-on ml-auto transition-opacity active:opacity-50"
            style={{ color: 'var(--accent)' }}
          >
            Inserisci trattino
          </button>
        </div>
      </div>
    </section>
  );
}
