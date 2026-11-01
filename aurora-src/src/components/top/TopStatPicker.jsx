import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import MenuBackdrop from '@/components/MenuBackdrop';
import StatIcon from '@/components/StatIcon';
import { usePopFit, popScroll } from '@/lib/popFit';

// Migliori Giocatori, tendina della statistica (concept A): pillola in vetro alta come i tasti delle linee,
// icona + nome breve + freccia; lista allineata a destra, voce scelta evidenziata con la spunta.
export default function TopStatPicker({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const ref = useRef(null);
  const room = usePopFit(ref, open);
  const cur = options.find((o) => o.key === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => setShown(true));
    return () => { cancelAnimationFrame(id); setShown(false); };
  }, [open]);

  return (
    <div ref={ref} className="relative flex-none" data-no-swipe="true" style={open ? { zIndex: 96 } : undefined}>
      <button
        type="button"
        aria-label="Statistica"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="glass-flat press flex h-[40px] items-center gap-[5px] whitespace-nowrap rounded-full pl-[10px] pr-[9px] text-[12.5px] font-extrabold"
        style={{ color: 'var(--ink)' }}
      >
        <span className="flex" style={{ color: 'var(--accent)' }}><StatIcon k={cur.icon} size={17} /></span>
        <span>{cur.short}</span>
        <ChevronDown size={13} strokeWidth={2.6} style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
      </button>
      {open ? <MenuBackdrop onClose={() => setOpen(false)} /> : null}
      {open ? (
        <div
          data-pop-scroll
          role="listbox"
          className={`hide-sb absolute right-0 ${room.up ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'} z-50 w-[222px] rounded-[22px] p-1.5`}
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
          {options.map((o) => {
            const on = o.key === cur.key;
            return (
              <button
                key={o.key}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => { setOpen(false); if (!on) onChange(o.key); }}
                className="flex h-[46px] w-full items-center gap-[11px] rounded-[16px] px-3 text-left text-[14px] transition-opacity active:opacity-60"
                style={{ background: on ? 'var(--pill-active)' : 'transparent', color: 'var(--ink)', fontWeight: on ? 800 : 650 }}
              >
                <span className="flex flex-none" style={{ color: on ? 'var(--accent)' : 'var(--ink-3)' }}><StatIcon k={o.icon} size={20} /></span>
                <span className="flex-1">{o.label}</span>
                {on ? <Check size={17} strokeWidth={2.8} style={{ color: 'var(--accent)' }} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
