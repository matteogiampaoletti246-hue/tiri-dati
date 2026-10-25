import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// Elenco a tutto schermo con ricerca: usato per giocatori, squadre e campionati.
export default function PickerSheet({ open, title, options = [], placeholder = 'Cerca', hint, emptyLabel = 'Nessun risultato', onSelect, onClose }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setQ('');
    const id = setTimeout(() => inputRef.current && inputRef.current.focus(), 80);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  const needle = norm(q);
  const list = (needle ? options.filter((o) => norm(o.label).includes(needle) || norm(o.sub).includes(needle)) : options).slice(0, 60);

  return (
    <div className="fade-in fixed inset-0 z-[60]" style={{ background: 'color-mix(in srgb, var(--sky-2) 94%, transparent)', backdropFilter: 'blur(24px)' }}>
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col">
        <div className="flex items-center gap-3 px-5 py-4">
          <Search size={18} strokeWidth={1.25} style={{ color: 'var(--ink-3)' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-[16px] font-light outline-none"
            style={{ color: 'var(--ink)' }}
          />
          <button type="button" className="icon-btn" aria-label="Chiudi" onClick={onClose}>
            <X size={20} strokeWidth={1.25} />
          </button>
        </div>

        {title ? <p className="label-sm px-5 pb-2">{title}</p> : null}
        {hint && !needle ? (
          <p className="px-5 pb-2 text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
            {hint}
          </p>
        ) : null}

        <div className="hide-sb flex-1 overflow-y-auto pb-24">
          {list.length ? (
            list.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onSelect(o);
                  onClose();
                }}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-opacity active:opacity-50"
              >
                {o.avatar || null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px]" style={{ color: 'var(--ink)' }}>
                    {o.label}
                  </span>
                  {o.sub ? (
                    <span className="block truncate text-[11px]" style={{ color: 'var(--ink-3)' }}>
                      {o.sub}
                    </span>
                  ) : null}
                </span>
              </button>
            ))
          ) : (
            <p className="px-5 py-6 text-[13px]" style={{ color: 'var(--ink-3)' }}>
              {emptyLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
