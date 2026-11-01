import { useEffect, useRef, useState } from 'react';
import { comma } from '@/lib/format';
import { scoreColorSmooth } from '@/lib/calc';

const reduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Indicatore semicircolare del punteggio di affidabilità (0-10).
// La prima volta che entra nello schermo (scorrendo) la ruota si carica da 0 al voto: voto e colore cambiano insieme lungo la scala
// (rosso, arancio, giallo, verde...); dopo, ogni cambio di voto scorre piu' veloce dal valore mostrato al nuovo.
export default function Gauge({ score }) {
  const has = score !== null && score !== undefined && !Number.isNaN(score);
  const target = has ? Math.max(0, Math.min(10, score)) : 0;
  const box = useRef(null);
  const seen = useRef(false);
  const shownRef = useRef(0);
  const raf = useRef(0);
  const [inView, setInView] = useState(false);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return undefined; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setInView(true); io.disconnect(); } }, { threshold: 0.7 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return undefined;
    cancelAnimationFrame(raf.current);
    const from = shownRef.current;
    if (reduced() || from === target) { shownRef.current = target; setShown(target); seen.current = true; return undefined; }
    const dur = seen.current ? 450 : 1700;
    seen.current = true;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const v = from + (target - from) * e;
      shownRef.current = v;
      setShown(v);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [inView, target]);

  const length = Math.PI * 74;
  const pct = Math.max(0, Math.min(1, shown / 10));
  const color = has ? scoreColorSmooth(shown) : 'var(--ink-3)';

  return (
    <div ref={box} className="relative mx-auto w-[180px]">
      <svg viewBox="0 0 176 100" className="w-full" aria-hidden="true">
        <path d="M14 92 A74 74 0 0 1 162 92" fill="none" stroke="var(--hair-2)" strokeWidth="8" strokeLinecap="round" />
        <path d="M14 92 A74 74 0 0 1 162 92" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={length} strokeDashoffset={length * (1 - pct)} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="title-xl tnum text-[36px]" style={{ color }}>
          {has ? comma(inView ? shown : 0, 2) : '—'}
        </p>
        <p className="label-sm mt-1">su 10</p>
      </div>
    </div>
  );
}
