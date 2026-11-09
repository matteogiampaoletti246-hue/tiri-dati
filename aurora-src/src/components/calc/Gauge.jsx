import { useEffect, useRef, useState } from 'react';
import { comma } from '@/lib/format';
import { scoreColorSmooth } from '@/lib/calc';

// Progress concept A (21st "Progress Ring", The Gridcn): 48 tacche attorno all'anello che girano piano (ogni quarta piu' chiara)
// e alone del colore del voto sull'arco. Le tacche sono disegnate una volta sola (fuori dal componente).
const TICKS = Array.from({ length: 48 }, (_, i) => {
  const a = (i / 48) * Math.PI * 2;
  const major = i % 4 === 0;
  const r1 = 59.5; const r2 = major ? 56.2 : 57.4;
  return { x1: 60 + r1 * Math.cos(a), y1: 60 + r1 * Math.sin(a), x2: 60 + r2 * Math.cos(a), y2: 60 + r2 * Math.sin(a), major };
});

const reduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Pannello risultato (concept A): anello del voto (0-10) con tre barre a destra e il verdetto sotto.
// La prima volta che entra nello schermo (scorrendo) la ruota si carica da 0 al voto: voto e colore cambiano insieme lungo la scala
// (rosso, arancio, giallo, verde...); dopo, ogni cambio di voto scorre piu' veloce dal valore mostrato al nuovo.
export default function Gauge({ score, bars = [], verdict = null }) {
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

  const R = 50;
  const pct = Math.max(0, Math.min(1, shown / 10));
  const color = has ? scoreColorSmooth(shown) : 'var(--ink-3)';
  const prog = target > 0 ? Math.min(1, shown / target) : 0; // avanzamento della carica, 0 -> 1: le barre salgono insieme all'anello

  return (
    <div ref={box}>
      <div className="flex items-center gap-5">
        <div className="relative h-[132px] w-[132px] shrink-0">
          <svg viewBox="0 0 120 120" className="gauge-ticks absolute inset-0 h-full w-full" aria-hidden="true">
            {TICKS.map((t, i) => <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--ink)" strokeOpacity={t.major ? 0.32 : 0.13} strokeWidth="1.1" strokeLinecap="round" />)}
          </svg>
          <svg viewBox="0 0 120 120" className="relative h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r={R - 4} fill="none" stroke="var(--hair-2)" strokeWidth="9" />
            <circle cx="60" cy="60" r={R - 4} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={2 * Math.PI * (R - 4)} strokeDashoffset={2 * Math.PI * (R - 4) * (1 - pct)} style={has && pct > 0 ? { filter: `drop-shadow(0 0 5px ${color})` } : undefined} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="title-xl tnum text-[34px] leading-none" style={{ color }}>{has ? comma(inView ? shown : 0, 2) : '—'}</p>
              <p className="label-sm mt-1">su 10</p>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {bars.map((b) => (
            <div key={b.label}>
              <p className="label-sm">{b.label}</p>
              <div className="mt-1 h-[6px] overflow-hidden rounded-full" style={{ background: 'var(--hair)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, b.value)) * prog * 100}%`, background: scoreColorSmooth(b.value * 10 * prog) }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {verdict ? (
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 pt-3" style={{ borderTop: '1px solid var(--hair-2)' }}>
          <span className="text-[14px]" style={{ color: 'var(--ink-2)' }}>{verdict.left}</span>
          {verdict.right ? <b className="tnum text-[14px]" style={{ color }}>{verdict.right}</b> : null}
        </div>
      ) : null}
    </div>
  );
}
