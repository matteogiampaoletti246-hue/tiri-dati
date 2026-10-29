import { useModalLock } from '@/lib/modal';
import { useEffect, useRef } from 'react';

// Tendina aperta: un tocco fuori la chiude e non attiva nulla sotto (nemmeno barre fisse o intestazioni).
// Funziona con intercettazione a livello di finestra, quindi non dipende da z-index o stacking context.
// Il "contenitore" della tendina e' il genitore diretto di questo elemento.
export default function MenuBackdrop({ onClose }) {
  const mark = useRef(null);
  const cb = useRef(onClose);
  cb.current = onClose;
  useModalLock(true);
  useEffect(() => {
    const root = mark.current && mark.current.parentElement;
    const inside = (e) => root && e.target && root.contains(e.target);
    // dentro la tendina scorre solo la lista ([data-pop-scroll]) e solo finche' puo': mai la pagina dietro
    let y0 = 0;
    const listMove = (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      if (e.type === 'touchstart') { y0 = t.clientY; return; }
      const dy = t.clientY - y0;
      y0 = t.clientY;
      const sc = e.target.closest && e.target.closest('[data-pop-scroll]');
      const can = sc && sc.scrollHeight > sc.clientHeight + 1 && (dy > 0 ? sc.scrollTop > 0 : sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1);
      if (!can && e.cancelable) e.preventDefault();
    };
    const stop = (e) => {
      if (inside(e)) { if (e.type === 'touchstart' || e.type === 'touchmove') listMove(e); return; }
      if (e.type === 'touchmove' && e.cancelable) e.preventDefault();
      e.stopPropagation();
    };
    const click = (e) => { if (inside(e)) return; if (e.cancelable) e.preventDefault(); e.stopPropagation(); cb.current(); };
    const opts = { capture: true, passive: false };
    const evs = ['pointerdown', 'pointerup', 'touchstart', 'touchmove', 'touchend', 'mousedown', 'mouseup'];
    evs.forEach((n) => window.addEventListener(n, stop, opts));
    window.addEventListener('click', click, opts);
    return () => {
      evs.forEach((n) => window.removeEventListener(n, stop, opts));
      window.removeEventListener('click', click, opts);
    };
  }, []);
  return <span ref={mark} hidden />;
}
