import { useEffect, useLayoutEffect, useRef } from 'react';
import { scoreColorSmooth } from '@/lib/calc';
import { comma } from '@/lib/format';

const ease = (t) => 1 - Math.pow(1 - t, 3);

// Numero che scorre fluido da un valore all'altro (cifre e colore insieme), senza scatti.
export default function RollNumber({ value, delay = 0, duration = 950, className = '', style }) {
  const el = useRef(null);
  const shown = useRef(value);
  const raf = useRef(0);

  useLayoutEffect(() => {
    const node = el.current;
    if (node) { node.textContent = comma(value, 1); node.style.color = scoreColorSmooth(value); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const node = el.current;
    if (!node) return undefined;
    const paint = (v) => {
      node.textContent = comma(v, 1);
      node.style.color = scoreColorSmooth(v);
    };
    const from = shown.current;
    const to = value;
    cancelAnimationFrame(raf.current);
    if (from === to || typeof to !== 'number') { paint(to); shown.current = to; return undefined; }
    const t0 = performance.now() + delay;
    const tick = (now) => {
      const t = (now - t0) / duration;
      if (t < 0) { raf.current = requestAnimationFrame(tick); return; }
      const p = Math.min(1, t);
      const v = from + (to - from) * ease(p);
      shown.current = v;
      paint(v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={el} className={`tnum ${className}`} style={style} />
  );
}
