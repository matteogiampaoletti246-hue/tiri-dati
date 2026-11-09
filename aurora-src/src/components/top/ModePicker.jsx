import { useEffect, useRef, useState } from 'react';
import MenuBackdrop from '@/components/MenuBackdrop';
import { Check } from 'lucide-react';
import HaloChevron from '@/components/HaloChevron';
import { usePopFit, popScroll } from '@/lib/popFit';

// Tendina di destra (Over / Under / Divario, con Totale o 1T per cartellini e arbitri): stessa forma e animazione della tendina delle statistiche.
export default function ModePicker({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const ref = useRef(null);
  const room = usePopFit(ref, open);
  const cur = options.find((o) => o.key === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => setShown(true));
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    return () => { cancelAnimationFrame(id); setShown(false); document.removeEventListener('pointerdown', off); };
  }, [open]);

  return (
    <div ref={ref} className="relative" data-no-swipe="true" style={open ? { zIndex: 96 } : undefined}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="halo-trigger glass press flex h-10 items-center gap-2 rounded-full pl-3.5 pr-3 text-[14.5px] font-bold" style={{ color: 'var(--ink)' }}>
        <span>{cur.label}</span>
        <HaloChevron open={open} value={value} size={16} strokeWidth={2} />
      </button>
      {open ? <MenuBackdrop onClose={() => setOpen(false)} /> : null}
      {open ? (
        <div
          data-pop-scroll
          className={`halo-menu hide-sb absolute right-0 ${room.up ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'} z-50 min-w-[190px] rounded-[22px] py-1.5`}
          style={{ ...popScroll(room), opacity: shown ? 1 : 0, transform: shown ? 'translateY(0) scale(1)' : `translateY(${room.up ? 6 : -6}px) scale(.97)`, transformOrigin: room.up ? 'bottom right' : 'top right', transition: 'opacity .2s ease, transform .22s cubic-bezier(.22,.8,.24,1)', background: 'var(--sky-2)', border: '1px solid var(--hair)', boxShadow: '0 18px 40px rgba(0,0,0,.5)' }}
        >
          {options.map((o) => {
            const on = o.key === value;
            return (
              <button key={o.key} type="button" onClick={() => { onChange(o.key); setOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] transition-opacity active:opacity-50" style={{ color: on ? 'var(--accent)' : 'var(--ink)', fontWeight: on ? 700 : 500 }}>
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
