import { useState } from 'react';
import { X } from 'lucide-react';

const toList = (v) => String(v || '').split('-').filter((x) => x !== '');

// Numeri delle ultime partite: ogni partita è una pillola, si aggiunge con "Aggiungi" (nessun trattino da digitare).
export default function ChipInput({ value, onChange, onFocus, max = 5, ariaLabel }) {
  const list = toList(value);
  const [cur, setCur] = useState('');
  const full = list.length >= max;
  const commit = (arr) => onChange(arr.join('-'));
  const add = () => {
    const v = cur.replace(/[^0-9]/g, '');
    if (!v || full) return;
    commit([...list, String(Number(v))]);
    setCur('');
  };
  return (
    <div className="flex w-full flex-col items-end gap-2.5">
      <div className="flex flex-wrap justify-end gap-1.5">
        {list.map((n, i) => (
          <span key={i} className="tnum inline-flex items-center gap-1 rounded-[12px] px-2.5 py-1.5 text-[15px] font-extrabold" style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 45%, transparent)' }}>
            {n}
            <button type="button" aria-label="Rimuovi" onClick={() => commit(list.filter((_, k) => k !== i))} style={{ color: 'var(--ink-3)' }}>
              <X size={13} strokeWidth={2.4} />
            </button>
          </span>
        ))}
        {!list.length ? <span className="py-2 text-[13px]" style={{ color: 'var(--ink-3)' }}>—</span> : null}
      </div>
      {!full ? (
        <div className="flex items-center gap-2">
          <input
            value={cur}
            onChange={(e) => setCur(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
            onFocus={onFocus}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            inputMode="numeric"
            placeholder="0"
            aria-label={ariaLabel}
            className="tnum h-10 w-[72px] rounded-xl px-2 text-center text-[16px] outline-none"
            style={{ background: 'var(--panel-2)', border: '1.5px dashed color-mix(in srgb, var(--accent) 60%, transparent)', color: 'var(--ink)' }}
          />
          <button type="button" onClick={add} className="filter-btn is-on h-10 px-4 text-[14px] font-bold transition-opacity active:opacity-50" style={{ color: 'var(--accent)' }}>
            Aggiungi
          </button>
        </div>
      ) : null}
    </div>
  );
}
