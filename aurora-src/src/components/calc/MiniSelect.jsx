import { useEffect, useRef, useState } from 'react';
import MenuBackdrop from '@/components/MenuBackdrop';
import { Check, ChevronDown } from 'lucide-react';
import { usePopFit, popScroll } from '@/lib/popFit';

// Tendina compatta: si apre sotto il campo senza cambiare pagina.
export default function MiniSelect({ value, options, onChange, placeholder = 'Seleziona', width = 132, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const ref = useRef(null);
  const room = usePopFit(ref, open);
  const cur = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => setShown(true));
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    return () => { cancelAnimationFrame(id); setShown(false); document.removeEventListener('pointerdown', off); };
  }, [open]);

  return (
    <div ref={ref} className="relative" data-no-swipe="true" style={{ width, ...(open ? { zIndex: 96 } : null) }}>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className="tnum flex h-10 w-full items-center justify-between gap-1 rounded-xl px-3 text-[15px] outline-none transition-opacity active:opacity-60"
        style={{ background: 'var(--panel-2)', border: '1px solid var(--hair)', color: cur ? 'var(--ink)' : 'var(--ink-3)' }}
      >
        <span className="truncate">{cur ? cur.label : placeholder}</span>
        <ChevronDown size={16} strokeWidth={1.5} style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
      </button>
      {open ? <MenuBackdrop onClose={() => setOpen(false)} /> : null}
      {open ? (
        <div
          data-pop-scroll
          className={`hide-sb absolute right-0 ${room.up ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'} z-40 rounded-2xl py-1`}
          style={{ minWidth: '100%', ...popScroll(room), opacity: shown ? 1 : 0, transform: shown ? 'translateY(0) scale(1)' : `translateY(${room.up ? 6 : -6}px) scale(.97)`, transformOrigin: room.up ? 'bottom right' : 'top right', transition: 'opacity .2s ease, transform .22s cubic-bezier(.22,.8,.24,1)', background: 'var(--sky-2)', border: '1px solid var(--hair)', boxShadow: '0 14px 34px rgba(0,0,0,.45)' }}
        >
          {options.map((o) => {
            const on = String(o.value) === String(value);
            return (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="tnum flex w-full items-center justify-between gap-3 whitespace-nowrap px-3.5 py-2.5 text-left text-[14.5px] transition-opacity active:opacity-50"
                style={{ color: on ? 'var(--accent)' : 'var(--ink)', fontWeight: on ? 700 : 400 }}
              >
                {o.label}
                {on ? <Check size={15} strokeWidth={2} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
