import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import FieldRow from './FieldRow';

export const STAT_OPTIONS = [
  { value: 'tiri', label: 'Tiri', group: 'Tiri' },
  { value: 'porta', label: 'Tiri in Porta', group: 'Tiri' },
  { value: 'fc', label: 'Falli Commessi', group: 'Falli' },
  { value: 'fs', label: 'Falli Subiti', group: 'Falli' },
];

// Statistiche del calcolo (concept C): la tendina si apre sotto la riga con due gruppi di pillole, Tiri e Falli.
export default function CalcStatSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const cur = STAT_OPTIONS.find((o) => o.value === value) || STAT_OPTIONS[0];
  const pill = (o) => {
    const on = o.value === cur.value;
    return (
      <button
        key={o.value}
        type="button"
        onClick={() => { onChange(o.value); setOpen(false); }}
        className="press rounded-full px-4 py-2 text-[13px] font-bold"
        style={{ background: on ? 'var(--accent)' : 'transparent', color: on ? '#fff' : 'var(--ink)', border: `1.5px solid ${on ? 'var(--accent)' : 'var(--hair)'}` }}
      >
        {o.label}
      </button>
    );
  };
  return (
    <div data-no-swipe="true">
      <FieldRow label="Statistiche">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="press flex min-w-0 items-center gap-2 text-right text-[14.5px] font-bold" style={{ color: 'var(--ink)' }}>
          <span className="truncate">{cur.label}</span>
          <ChevronDown size={16} strokeWidth={1.75} style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </button>
      </FieldRow>
      {open ? (
        <div className="px-5 pb-4 pt-1" style={{ borderTop: '1px solid var(--hair-2)' }}>
          {['Tiri', 'Falli'].map((g, i) => (
            <div key={g} className={i ? 'mt-3' : 'mt-2'}>
              <p className="label-sm mb-2">{g}</p>
              <div className="flex flex-wrap gap-2">{STAT_OPTIONS.filter((o) => o.group === g).map(pill)}</div>
            </div>
          ))}
          <p className="mt-3 text-[11.5px] leading-snug" style={{ color: 'var(--ink-3)' }}>Sui falli si aggiunge il Duello avversario.</p>
        </div>
      ) : null}
    </div>
  );
}
