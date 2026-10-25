import { ChevronRight } from 'lucide-react';
import FieldRow from './FieldRow';

// Riga di selezione: il valore corrente è testo, si tocca per aprire l'elenco.
export default function SelectRow({ label, value, sub, placeholder = 'Seleziona', hint, first = false, avatar = null, onClick }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <FieldRow label={label} hint={hint} first={first}>
      <button type="button" onClick={onClick} className="flex min-w-0 items-center gap-2 text-right transition-opacity active:opacity-50">
        {avatar}
        <span className="min-w-0">
          <span className="block truncate text-[14.5px]" style={{ color: empty ? 'var(--ink-3)' : 'var(--ink)' }}>
            {empty ? placeholder : value}
          </span>
          {sub && !empty ? (
            <span className="block truncate text-[11px]" style={{ color: 'var(--ink-3)' }}>
              {sub}
            </span>
          ) : null}
        </span>
        <ChevronRight size={16} strokeWidth={1.5} style={{ color: 'var(--ink-3)' }} />
      </button>
    </FieldRow>
  );
}
