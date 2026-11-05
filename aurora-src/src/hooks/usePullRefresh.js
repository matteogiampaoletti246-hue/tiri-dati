import { useEffect } from 'react';

// Tira giu' per aggiornare (concept C): barra che si riempie sotto il banner mentre si tira, al rilascio la pagina si ferma e parte la rotella nel titolo.
// Si attiva solo con un gesto verticale a pagina in cima; i gesti laterali (schede, swipe indietro) restano intatti.
const MAX = 90;
const TRIG = 56;
const HOLD = 34;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const scroller = (el) => {
  for (let n = el.parentElement; n; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY;
    if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) return n;
  }
  return document.scrollingElement;
};

export default function usePullRefresh({ wrapRef, bodyRef, arcRef, onRefresh, onBusy }) {
  useEffect(() => {
    const w = wrapRef.current;
    const b = bodyRef.current;
    const arc = arcRef.current;
    if (!w || !b) return undefined;
    let x0 = 0;
    let y0 = 0;
    let pull = 0;
    let mode = false;
    let busy = false;
    let sc = null;
    const set = (y, t) => {
      b.style.transform = y ? `translate3d(0,${y}px,0)` : '';
      if (arc) arc.style.width = `${Math.round(t * 100)}%`;
    };
    const start = (e) => {
      if (busy || e.touches.length !== 1) return;
      sc = scroller(w);
      if (sc && sc.scrollTop > 0) { mode = false; return; }
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      pull = 0;
      mode = 'wait';
    };
    const move = (e) => {
      if (!mode || busy) return;
      const dy = e.touches[0].clientY - y0;
      const dx = e.touches[0].clientX - x0;
      if (mode === 'wait') {
        if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
        if (dy > 0 && Math.abs(dy) > Math.abs(dx) * 1.3 && (!sc || sc.scrollTop <= 0)) { mode = 'pull'; b.style.transition = 'none'; } else { mode = false; return; }
      }
      if (e.cancelable) e.preventDefault();
      pull = Math.min(MAX, dy * 0.5);
      set(pull, Math.min(1, pull / TRIG));
    };
    const end = async () => {
      if (mode !== 'pull') { mode = false; return; }
      mode = false;
      b.style.transition = 'transform .35s cubic-bezier(.2,.8,.2,1)';
      if (pull < TRIG) { set(0, 0); return; }
      busy = true;
      set(HOLD, 1);
      onBusy(true, false);
      const t0 = Date.now();
      try { await onRefresh(); } catch { /* si resta con i dati di prima */ }
      await wait(Math.max(0, 700 - (Date.now() - t0)));
      onBusy(false, true);
      set(0, 0);
      await wait(350);
      b.style.transition = '';
      busy = false;
    };
    w.addEventListener('touchstart', start, { passive: true });
    w.addEventListener('touchmove', move, { passive: false });
    w.addEventListener('touchend', end, { passive: true });
    w.addEventListener('touchcancel', end, { passive: true });
    return () => {
      w.removeEventListener('touchstart', start);
      w.removeEventListener('touchmove', move);
      w.removeEventListener('touchend', end);
      w.removeEventListener('touchcancel', end);
    };
  }, []);
}
