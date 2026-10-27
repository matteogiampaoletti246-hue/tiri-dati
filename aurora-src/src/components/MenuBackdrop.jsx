import { useEffect, useRef } from 'react';

// Tendina aperta: un tocco fuori la chiude e non attiva nulla sotto (nemmeno barre fisse o intestazioni).
// Funziona con intercettazione a livello di finestra, quindi non dipende da z-index o stacking context.
// Il "contenitore" della tendina e' il genitore diretto di questo elemento.
export default function MenuBackdrop({ onClose }) {
  const mark = useRef(null);
  const cb = useRef(onClose);
  cb.current = onClose;
  useEffect(() => {
    const root = mark.current && mark.current.parentElement;
    const inside = (e) => root && e.target && root.contains(e.target);
    const stop = (e) => { if (inside(e)) return; if (e.type === 'touchmove' && e.cancelable) e.preventDefault(); e.stopPropagation(); };
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
