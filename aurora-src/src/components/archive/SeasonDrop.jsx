import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import MenuBackdrop from '@/components/MenuBackdrop';
import { popRoom, popScroll } from '@/lib/popFit';
import { seasonLabel } from '@/data/archive';

// Tendina delle stagioni (concept A): il tasto nel banner si apre SOTTO se stesso, la lista si srotola verso il basso
// e scorre; resta sopra la barra in basso (`popRoom`), se sotto non c'e' spazio si apre verso l'alto.
// Disegnata in un portale a posizione fissa: il banner (overflow nascosto) non la taglia.
export default function SeasonDrop({ seasons, value, currentLabel, onSelect }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [pos, setPos] = useState(null);
  const btn = useRef(null);
  const label = (s) => (s === 'live' ? currentLabel : seasonLabel(s));

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const w = Math.max(196, Math.round(r.width));
    const room = popRoom(btn.current, w);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    setPos({ left, w, up: room.up, max: Math.min(room.max, 7 * 44 + 8), top: r.bottom + 6, bottom: window.innerHeight - r.top + 6 });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => { cancelAnimationFrame(id); setShown(false); };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <>
      <button ref={btn} type="button" data-no-swipe="true" onClick={() => setOpen((o) => !o)} className="glass press flex min-w-[150px] items-center justify-between gap-2 rounded-[14px] py-1.5 pl-3.5 pr-3 text-[13px] font-bold" style={{ color: 'var(--ink)' }}>
        <span className="tnum">{label(value)}</span>
        <ChevronDown size={15} strokeWidth={2.2} style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }} />
      </button>
      {open && pos ? createPortal(
        <div data-no-back="1" data-no-swipe="true" className="fixed z-[96]" style={{ left: pos.left, width: pos.w, ...(pos.up ? { bottom: pos.bottom } : { top: pos.top }) }}>
          <MenuBackdrop onClose={close} />
          <div
            data-pop-scroll
            className="hide-sb rounded-[16px] p-1.5"
            style={{
              ...popScroll({ max: pos.max }),
              background: 'var(--sky-2)',
              border: '1px solid var(--hair)',
              boxShadow: '0 18px 40px rgba(0,0,0,.45)',
              clipPath: shown ? 'inset(0 0 0 0 round 16px)' : (pos.up ? 'inset(100% 0 0 0 round 16px)' : 'inset(0 0 100% 0 round 16px)'),
              opacity: shown ? 1 : 0.4,
              transition: 'clip-path .34s cubic-bezier(.22,.8,.24,1), opacity .2s ease',
            }}
          >
            {seasons.map((s, i) => {
              const on = s === value;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => { close(); if (!on) onSelect(s); }}
                  className="flex w-full items-center gap-2 rounded-[11px] px-3 text-left active:opacity-60"
                  style={{ height: 44, background: on ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent', opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(-4px)', transition: `opacity .25s ease ${Math.min(i, 8) * 22}ms, transform .25s ease ${Math.min(i, 8) * 22}ms` }}
                >
                  <span className="tnum flex-1 text-[14.5px]" style={{ color: on ? 'var(--accent)' : 'var(--ink)', fontWeight: on ? 800 : 600 }}>{label(s)}</span>
                  {s === 'live' ? <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>in corso</span> : null}
                  {on ? <Check size={16} strokeWidth={2.2} style={{ color: 'var(--accent)' }} /> : null}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
