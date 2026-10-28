import { useEffect, useLayoutEffect, useRef } from 'react';

// Filtri in vetro: l'indicatore scivola in modo fluido da una voce all'altra (transizione CSS, non si blocca anche se la lista sotto e' pesante).
export default function TextFilter({ options, value, onChange, className = '' }) {
  const box = useRef(null);
  const pill = useRef(null);
  const first = useRef(true);

  const place = (animate) => {
    const b = box.current;
    const el = b && b.querySelector('[data-on="1"]');
    const p = pill.current;
    if (!b || !el || !p) return;
    p.style.transition = animate ? 'transform .34s cubic-bezier(.22,.8,.24,1), width .34s cubic-bezier(.22,.8,.24,1)' : 'none';
    p.style.width = `${el.offsetWidth}px`;
    p.style.transform = `translate3d(${el.offsetLeft}px,0,0)`;
    p.style.opacity = '1';
  };
  useLayoutEffect(() => {
    place(!first.current);
    first.current = false;
  }, [value, options.length]);
  useEffect(() => {
    const b = box.current;
    if (!b || typeof ResizeObserver === 'undefined') return undefined;
    let skip = true;
    const ro = new ResizeObserver(() => { if (skip) { skip = false; if (!pill.current || pill.current.style.opacity !== '1' || !pill.current.offsetWidth) place(false); return; } place(false); });
    ro.observe(b);
    return () => ro.disconnect();
  }, []);

  // la voce attiva resta sempre interamente visibile
  useEffect(() => {
    const b = box.current;
    const el = b && b.querySelector('[data-on="1"]');
    if (!b || !el) return;
    const x = el.offsetLeft;
    const l = x - 8;
    const r = x + el.offsetWidth + 8;
    if (l < b.scrollLeft) b.scrollTo({ left: Math.max(0, l), behavior: 'smooth' });
    else if (r > b.scrollLeft + b.clientWidth) b.scrollTo({ left: r - b.clientWidth, behavior: 'smooth' });
  }, [value]);

  return (
    <div ref={box} className={`glass-flat hide-sb relative flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-full p-1 ${className}`} style={{ overflowY: 'hidden', overscrollBehavior: 'contain' }}>
      <span ref={pill} aria-hidden="true" className="absolute left-0 rounded-full" style={{ top: 4, bottom: 4, width: 0, opacity: 0, background: 'var(--pill-active)', boxShadow: 'var(--shadow-2)', willChange: 'transform' }} />
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const active = val === value;
        return (
          <button
            key={String(val)}
            data-on={active ? '1' : '0'}
            type="button"
            onClick={() => onChange(val)}
            className="press relative shrink-0 rounded-full px-[10.5px] py-[6px] text-[12.5px] font-bold"
          >
            <span className="relative whitespace-nowrap" style={{ color: active ? 'var(--ink)' : 'var(--ink-3)', transition: 'color .25s ease' }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
