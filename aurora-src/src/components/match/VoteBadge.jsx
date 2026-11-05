import { useEffect, useLayoutEffect, useRef } from 'react';
import { scoreColorSmooth } from '@/lib/calc';
import { comma } from '@/lib/format';

// Voto di affidabilità in Formazioni (concept C scelto dall'utente): quando il voto cambia (statistica o linea) il numero scorre
// dal valore vecchio al nuovo e il colore lo segue lungo la scala del Calcolatore (azzurro da 9,00 con un bagliore che sale piano).
// L'onda parte dal centro del campo verso l'esterno; il voto sale o scende secondo la variazione e lascia un alone nel nuovo colore.
const ease = (t) => 1 - Math.pow(1 - t, 3);
const reduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const glow = (v) => {
  const g = Math.max(0, Math.min(1, (v - 8.8) / 0.4));
  return g > 0 ? `0 0 ${(g * 11).toFixed(1)}px rgba(56,189,248,${(g * 0.85).toFixed(2)})` : 'none';
};
const DUR = 760;
const SPREAD = 330; // ritardo massimo (ms) per ogni unita' di distanza dal centro del campo

export default function VoteBadge({ v, inline = false }) {
  const pill = useRef(null);
  const txt = useRef(null);
  const halo = useRef(null);
  const shown = useRef(typeof v === 'number' ? v : null);
  const raf = useRef(0);
  const first = useRef(true);

  const paint = (val, fx) => {
    const n = pill.current;
    if (!n) return;
    txt.current.textContent = comma(val, 1);
    n.style.background = scoreColorSmooth(val);
    n.style.boxShadow = glow(val);
    n.style.transform = fx || '';
  };

  useLayoutEffect(() => {
    const n = pill.current;
    if (!n) return;
    if (shown.current == null) { n.style.display = 'none'; return; }
    n.style.display = '';
    n.style.opacity = '1';
    paint(shown.current, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    const n = pill.current;
    if (!n) return undefined;
    cancelAnimationFrame(raf.current);
    const to = typeof v === 'number' ? v : null;
    const old = shown.current;

    if (to == null) {
      if (old == null) return undefined;
      shown.current = null;
      if (reduced()) { n.style.display = 'none'; return undefined; }
      const t0 = performance.now();
      const out = (now) => {
        const p = Math.min(1, (now - t0) / 220);
        n.style.opacity = String(1 - p);
        n.style.transform = `scale(${1 - 0.35 * p})`;
        if (p < 1) raf.current = requestAnimationFrame(out);
        else n.style.display = 'none';
      };
      raf.current = requestAnimationFrame(out);
      return () => cancelAnimationFrame(raf.current);
    }

    const appear = old == null;
    const from = appear ? 0 : old;
    if (!appear && from === to) return undefined;
    shown.current = to;
    n.style.display = '';
    if (reduced()) { n.style.opacity = '1'; paint(to, ''); return undefined; }

    // ritardo: distanza dal centro del campo (un solo calcolo per cambio, mai durante l'animazione)
    let delay = 0;
    const pitch = n.closest('[data-pitch]');
    if (pitch) {
      const pr = pitch.getBoundingClientRect();
      const r = n.getBoundingClientRect();
      const dx = (r.left + r.width / 2 - (pr.left + pr.width / 2)) / (pr.width / 2 || 1);
      const dy = (r.top + r.height / 2 - (pr.top + pr.height / 2)) / (pr.height / 2 || 1);
      delay = Math.min(1.4, Math.hypot(dx, dy)) * SPREAD;
    }
    const dir = to >= from ? 1 : -1;
    const start = performance.now() + delay;
    let fired = false;
    if (appear) { n.style.opacity = '0'; paint(0, ''); }

    const tick = (now) => {
      const t = (now - start) / DUR;
      if (t < 0) { raf.current = requestAnimationFrame(tick); return; }
      const p = Math.min(1, t);
      const val = from + (to - from) * ease(p);
      const s = Math.sin(Math.PI * p);
      if (appear) n.style.opacity = String(Math.min(1, p * 3));
      if (!fired && halo.current) {
        fired = true;
        const h = halo.current;
        const col = scoreColorSmooth(to);
        h.style.transition = 'none';
        h.style.opacity = '0.85';
        h.style.boxShadow = `0 0 0 0 ${col}`;
        h.style.transform = 'scale(1)';
        void h.offsetWidth;
        h.style.transition = `opacity ${DUR * 0.95}ms ease-out, box-shadow ${DUR * 0.95}ms ease-out, transform ${DUR * 0.95}ms ease-out`;
        h.style.opacity = '0';
        h.style.boxShadow = `0 0 0 9px ${col}`;
        h.style.transform = 'scale(1.25)';
      }
      paint(val, `translateY(${(-dir * 5 * s).toFixed(2)}px) scale(${(1 + 0.08 * s).toFixed(3)})`);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else paint(to, '');
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  const pillEl = (
    <span
      ref={pill}
      className="tnum relative inline-block rounded-full px-[6px] py-[1px] text-center font-extrabold leading-[13px] text-white"
      style={{ fontSize: inline ? 11 : 10.5, border: inline ? 'none' : '1.5px solid rgba(0,0,0,.4)', textShadow: '0 1px 1px rgba(0,0,0,.35)', willChange: 'transform', minWidth: inline ? 0 : 34 }}
    >
      <span ref={halo} aria-hidden="true" className="pointer-events-none absolute rounded-full" style={{ inset: -1, opacity: 0 }} />
      <span ref={txt} />
    </span>
  );
  if (inline) return pillEl;
  return <span className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -7 }}>{pillEl}</span>;
}
