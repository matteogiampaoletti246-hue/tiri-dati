import { useEffect, useRef, useState } from 'react';
import MenuBackdrop from '@/components/MenuBackdrop';
import { Check, ChevronDown } from 'lucide-react';
import LeagueBadge from '@/components/LeagueBadge';

// Tendina delle competizioni: logo + nome, si apre sotto il tasto.
export default function CompSelect({ options, value, onChange, allLabel = null, inline = false }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const ref = useRef(null);
  const cur = options.find((o) => o.id === value) || null;

  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => setShown(true));
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    return () => { cancelAnimationFrame(id); setShown(false); document.removeEventListener('pointerdown', off); };
  }, [open]);

  const items = allLabel ? [{ id: 'all', name: allLabel }, ...options] : options;

  return (
    <div ref={ref} className={inline ? 'relative' : 'relative z-[25] px-4 pb-1 pt-3'} data-no-swipe="true" style={open ? { zIndex: 96 } : undefined}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glass press inline-flex items-center gap-2 rounded-[16px] py-2 pl-3 pr-2.5"
      >
        {cur ? <LeagueBadge league={cur} size={24} /> : null}
        <b className="whitespace-nowrap text-[14px]">{cur ? cur.name : allLabel}</b>
        <ChevronDown size={16} strokeWidth={2} style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
      </button>
      {open ? <MenuBackdrop onClose={() => setOpen(false)} /> : null}
      {open ? (
        <div
          className={`absolute ${inline ? 'left-0 top-[calc(100%+8px)]' : 'left-4 top-[calc(100%-2px)]'} z-50 min-w-[250px] rounded-[18px] p-1.5`}
          style={{
            background: 'var(--sky-2)',
            border: '1px solid var(--hair)',
            boxShadow: '0 18px 40px rgba(0,0,0,.45)',
            opacity: shown ? 1 : 0,
            transform: shown ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(.97)',
            transformOrigin: 'top left',
            transition: 'opacity .2s ease, transform .24s cubic-bezier(.22,.8,.24,1)',
          }}
        >
          {items.map((o) => {
            const on = o.id === value;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => { setOpen(false); if (!on) onChange(o.id); }}
                className="flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2.5 text-left transition-opacity active:opacity-60"
                style={{ background: on ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent' }}
              >
                {o.id === 'all' ? <span className="w-[26px]" /> : <LeagueBadge league={o} size={26} />}
                <span className="text-[14.5px]" style={{ color: on ? 'var(--accent)' : 'var(--ink)', fontWeight: on ? 800 : 500 }}>{o.name}</span>
                {on ? <Check size={16} strokeWidth={2.2} className="ml-auto" style={{ color: 'var(--accent)' }} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
