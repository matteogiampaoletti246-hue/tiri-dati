import { modalOpen } from '@/lib/modal';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { pageBack, pageDrag, pageReset, canGoBack, BACK_ZONE, backAngleOk, backFarOk, backDone, inHScroll } from '@/lib/carousel';

// Swipe-back con animazione di slittamento. Pagina senza schede/giorni a sinistra: da tutto lo schermo; con schede o giorni (SwipeTabs, DayPager):
// solo dal bordo sinistro (BACK_ZONE) o dal banner in alto (data-back-banner). Il contenuto delle schede lo gestisce SwipeTabs.
// Su iPhone eventi touch (i pointer venivano annullati da iOS appena il dito scendeva un poco: lo swipe a volte non partiva);
// col mouse (computer) eventi pointer.
export default function useSwipeBack(enabled = true) {
  const navigate = useNavigate();
  const start = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const can = (x, t) => {
      if (modalOpen() || !canGoBack() || !t || !t.closest || t.closest('[data-no-back], [data-tabs-back]')) return false;
      if (x <= BACK_ZONE) return true;
      if (document.querySelector('[data-tabs-back], [data-days-left]')) return !!t.closest('[data-back-banner]') && !inHScroll(t);
      return !inHScroll(t);
    };
    const begin = (x, y, target) => { start.current = can(x, target) ? { x, y, t: Date.now(), near: x <= BACK_ZONE } : null; dragging.current = false; };
    // true = lo swipe e' nostro (la pagina segue il dito)
    const move = (x, y) => {
      const s = start.current;
      if (!s) return false;
      const dx = x - s.x;
      const dy = y - s.y;
      if (!dragging.current) {
        if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { start.current = null; return false; }
        if (!(s.near ? backAngleOk(dx, dy) : backFarOk(dx, dy))) return false;
        dragging.current = true;
      }
      pageDrag(Math.max(0, dx));
      return true;
    };
    const end = (x) => {
      const s = start.current;
      start.current = null;
      if (!s || !dragging.current) return;
      dragging.current = false;
      const dx = x - s.x;
      const v = dx / Math.max(80, Date.now() - s.t);
      // oltre la meta' dello schermo (o un colpo veloce oltre un quarto) si torna indietro; prima, la pagina rientra lentamente
      const w = Math.min(window.innerWidth, 430);
      if (backDone(dx, w, v)) pageBack(dx, navigate);
      else pageReset(true);
    };

    const tStart = (e) => { if (e.touches.length !== 1) { start.current = null; return; } const t = e.touches[0]; begin(t.clientX, t.clientY, e.target); };
    const tMove = (e) => { const t = e.touches[0]; if (t && move(t.clientX, t.clientY) && e.cancelable) e.preventDefault(); };
    const tEnd = (e) => { const t = e.changedTouches && e.changedTouches[0]; end(t ? t.clientX : start.current ? start.current.x : 0); };
    const pDown = (e) => { if (e.pointerType === 'mouse') begin(e.clientX, e.clientY, e.target); };
    const pMove = (e) => { if (e.pointerType === 'mouse') move(e.clientX, e.clientY); };
    const pUp = (e) => { if (e.pointerType === 'mouse') end(e.clientX); };

    window.addEventListener('touchstart', tStart, { passive: true });
    window.addEventListener('touchmove', tMove, { passive: false });
    window.addEventListener('touchend', tEnd, { passive: true });
    window.addEventListener('touchcancel', tEnd, { passive: true });
    window.addEventListener('pointerdown', pDown, { passive: true });
    window.addEventListener('pointermove', pMove, { passive: true });
    window.addEventListener('pointerup', pUp, { passive: true });
    return () => {
      window.removeEventListener('touchstart', tStart);
      window.removeEventListener('touchmove', tMove);
      window.removeEventListener('touchend', tEnd);
      window.removeEventListener('touchcancel', tEnd);
      window.removeEventListener('pointerdown', pDown);
      window.removeEventListener('pointermove', pMove);
      window.removeEventListener('pointerup', pUp);
    };
  }, [enabled, navigate]);
}
