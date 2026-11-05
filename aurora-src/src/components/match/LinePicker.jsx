import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import MenuBackdrop from '@/components/MenuBackdrop';
import { usePopFit, popScroll } from '@/lib/popFit';

const label = (l) => `Over ${String(l).replace('.', ',')}`;

// Formazioni, tendina della linea (stessa pillola in vetro di TopStatPicker): Over 0,5 / 1,5 / 2,5 (e 3,5 per i tiri).
export default function LinePicker({ lines, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const ref = useRef(null);
  const room = usePopFit(ref, open);

  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => setShown(true));
    return () => { cancelAnimationFrame(id); setShown(false); };
  }, [open]);

  return (
    <div ref={ref} className="relative flex-none" data-no-swipe="true" style={open ? { zIndex: 96 } : undefined}>
      <button
        type="button"
        aria-label="Linea"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="glass-flat press flex h-[36px] w-[92px] items-center justify-between gap-[3px] whitespace-nowrap rounded-full pl-[10px] pr-[6px] text-[12px] font-extrabold"
        style={{ color: 'var(--ink)' }}
      >
        <span>{label(value)}</span>
        <ChevronDown size={11} strokeWidth={2.6} className="flex-none" style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
      </button>
      {open ? <MenuBackdrop onClose={() => setOpen(false)} /> : null}
      {open ? (
        <div
          data-pop-scroll
          role="listbox"
          className={`hide-sb absolute right-0 w-[150px] ${room.up ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'} z-50 rounded-[22px] p-1.5`}
          style={{
            ...popScroll(room),
            opacity: shown ? 1 : 0,
            transform: shown ? 'translateY(0) scale(1)' : `translateY(${room.up ? 6 : -6}px) scale(.97)`,
            transformOrigin: room.up ? 'bottom right' : 'top right',
            transition: 'opacity .2s ease, transform .22s cubic-bezier(.22,.8,.24,1)',
            background: 'var(--sky-2)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 18px 50px rgba(0,0,0,.45)',
          }}
        >
          {lines.map((l) => {
            const on = l === value;
            return (
              <button
                key={l}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => { setOpen(false); if (!on) onChange(l); }}
                className="flex h-[46px] w-full items-center gap-[11px] rounded-[16px] px-3 text-left text-[14px] transition-opacity active:opacity-60"
                style={{ background: on ? 'var(--pill-active)' : 'transparent', color: 'var(--ink)', fontWeight: on ? 800 : 650 }}
              >
                <span className="flex-1">{label(l)}</span>
                {on ? <Check size={17} strokeWidth={2.8} style={{ color: 'var(--accent)' }} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
