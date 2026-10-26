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
    <div className="flex w-full min-w-0 flex-col items-end gap-2.5">
      <div className="flex min-w-0 flex-nowrap justify-end gap-[2px]">
        {list.map((n, i) => (
          <span key={i} className="tnum inline-flex h-[24px] shrink-0 items-center rounded-full pl-1.5 pr-1 text-[12px] font-extrabold leading-none" style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 45%, transparent)' }}>
            {n}
            <button type="button" aria-label="Rimuovi" onClick={() => commit(list.filter((_, k) => k !== i))} className="relative flex h-3.5 w-3.5 items-center justify-center before:absolute before:-inset-2.5 before:content-['']" style={{ color: 'var(--ink-3)' }}>
              <X size={10} strokeWidth={2.6} />
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
