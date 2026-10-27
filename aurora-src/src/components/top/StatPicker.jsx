import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import StatIcon from '@/components/StatIcon';

// Tasto unico in vetro: apre l'elenco delle statistiche, ognuna con la sua icona.
export default function StatPicker({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const ref = useRef(null);
  const cur = options.find((o) => o.key === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => setShown(true));
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    return () => { cancelAnimationFrame(id); setShown(false); document.removeEventListener('pointerdown', off); };
  }, [open]);

  return (
    <div ref={ref} className="relative" data-no-swipe="true">
      <button type="button" onClick={() => setOpen((o) => !o)} className="glass press flex h-10 items-center gap-2.5 rounded-full pl-3.5 pr-3 text-[14.5px] font-bold" style={{ color: 'var(--ink)' }}>
        <StatIcon k={cur.key} size={20} />
        <span>{cur.label}</span>
        <ChevronDown size={16} strokeWidth={2} style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
      </button>
      {open ? (
        <div
          className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[230px] overflow-hidden rounded-[22px] py-1.5"
          style={{ opacity: shown ? 1 : 0, transform: shown ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(.97)', transformOrigin: 'top left', transition: 'opacity .2s ease, transform .22s cubic-bezier(.22,.8,.24,1)', background: 'var(--sky-2)', border: '1px solid var(--hair)', boxShadow: '0 18px 40px rgba(0,0,0,.5)' }}
        >
          {options.map((o) => {
            const on = o.key === value;
            return (
              <button key={o.key} type="button" onClick={() => { onChange(o.key); setOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] transition-opacity active:opacity-50" style={{ color: on ? 'var(--accent)' : 'var(--ink)', fontWeight: on ? 700 : 500 }}>
                <span className="flex w-6 flex-none justify-center" style={{ color: on ? 'var(--accent)' : 'var(--ink)' }}><StatIcon k={o.key} size={22} /></span>
                <span className="flex-1">{o.label}</span>
                {on ? <Check size={15} strokeWidth={2.2} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
