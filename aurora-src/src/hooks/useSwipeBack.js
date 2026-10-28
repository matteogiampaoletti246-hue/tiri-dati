import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { pageBack, pageDrag, pageReset, canGoBack } from '@/lib/carousel';

// Swipe-back dal bordo sinistro con animazione di slittamento.
export default function useSwipeBack(enabled = true) {
  const navigate = useNavigate();
  const start = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const shell = () => document.getElementById('sl-shell');

    const onDown = (e) => {
      if (e.clientX > 32 || (e.target && e.target.closest && e.target.closest('[data-no-back]')) || document.querySelector('[data-tabs-back]') || !canGoBack()) return;
      start.current = { x: e.clientX, y: e.clientY };
    };

    const onMove = (e) => {
      const s = start.current;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (!dragging.current) {
        if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
          start.current = null;
          return;
        }
        if (dx < 10) return;
        dragging.current = true;
      }
      pageDrag(dx);
    };

    const onUp = (e) => {
      const s = start.current;
      start.current = null;
      if (!s || !dragging.current) return;
      dragging.current = false;
      const dx = e.clientX - s.x;
      // oltre la meta' dello schermo si torna indietro; prima, la pagina rientra lentamente al suo posto
      if (dx > Math.min(window.innerWidth, 430) * 0.5) pageBack(dx, navigate);
      else pageReset(true);
    };

    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [enabled, navigate]);
}
