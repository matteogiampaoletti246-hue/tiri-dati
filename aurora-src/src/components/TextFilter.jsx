import { useEffect, useLayoutEffect, useRef } from 'react';

// Filtri in vetro: l'indicatore scivola in modo fluido da una voce all'altra (transizione CSS, non si blocca anche se la lista sotto e' pesante).
// Stessa barra e stessa pillola di AnimatedTabs: di base larga quanto la riga; fit = larga quanto le voci (dentro una riga con altro).
export default function TextFilter({ options, value, onChange, className = '', fit = false, liquid = false }) {
  const box = useRef(null);
  const pill = useRef(null);
  const first = useRef(true);
  const prev = useRef(null);

  const place = (animate) => {
    const b = box.current;
    const el = b && b.querySelector('[data-on="1"]');
    const p = pill.current;
    if (!b || !el || !p) return;
    const m = { x: el.offsetLeft, w: el.offsetWidth };
    const f = prev.current;
    // liquid (concept A "Scivolo liquido"): la pillola si allunga verso il tasto nuovo e poi si ritira, senza rimbalzo
    if (animate && liquid && f && p.animate && (f.x !== m.x || f.w !== m.w)) {
      p.getAnimations().forEach((a) => a.cancel());
      const left = Math.min(f.x, m.x);
      const right = Math.max(f.x + f.w, m.x + m.w);
      p.style.transition = 'none';
      p.style.width = `${m.w}px`;
      p.style.transform = `translate3d(${m.x}px,0,0)`;
      p.style.opacity = '1';
      p.animate([
        { transform: `translate3d(${f.x}px,0,0)`, width: `${f.w}px` },
        { transform: `translate3d(${left}px,0,0)`, width: `${right - left}px`, offset: 0.45 },
        { transform: `translate3d(${m.x}px,0,0)`, width: `${m.w}px` },
      ], { duration: 640, easing: 'cubic-bezier(.4,0,.2,1)' });
      prev.current = m;
      return;
    }
    p.getAnimations && p.getAnimations().forEach((a) => a.cancel());
    p.style.transition = animate ? 'transform .6s cubic-bezier(.34,1.42,.64,1), width .6s cubic-bezier(.34,1.42,.64,1)' : 'none'; // stesso rimbalzo della pillola liquid glass (AnimatedTabs)
    p.style.width = `${m.w}px`;
    p.style.transform = `translate3d(${m.x}px,0,0)`;
    p.style.opacity = '1';
    prev.current = m;
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
    <div className={`halo-trigger min-w-0 max-w-full rounded-full ${fit ? 'w-fit' : 'w-full'} ${className}`}>
    <div ref={box} className={`tfilter hide-sb relative w-full overflow-x-auto${fit ? ' fit' : ''}`} style={{ overflowY: 'hidden', overscrollBehavior: 'contain' }}>
      <span ref={pill} aria-hidden="true" className="lg-thumb absolute left-0 rounded-full" style={{ top: 4, bottom: 4, width: 0, opacity: 0, willChange: 'transform' }} />
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
            className="tfilter-tab press"
          >
            <span className="relative whitespace-nowrap" style={{ color: active ? 'var(--atabs-pill-ink)' : 'var(--ink-2)', transition: 'color .3s ease' }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
    </div>
  );
}
