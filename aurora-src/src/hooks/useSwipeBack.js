import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Swipe-back dal bordo sinistro con animazione di slittamento.
export default function useSwipeBack(enabled = true) {
  const navigate = useNavigate();
  const start = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const shell = () => document.getElementById('sl-shell');

    const onDown = (e) => {
      if (e.clientX > 32) return;
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
      const el = shell();
      if (el) {
        el.style.transition = 'none';
        el.style.transform = `translate3d(${Math.max(0, dx)}px,0,0)`;
        el.style.opacity = String(Math.max(0.7, 1 - dx / 900));
      }
    };

    const onUp = (e) => {
      const s = start.current;
      start.current = null;
      if (!s || !dragging.current) return;
      dragging.current = false;
      const dx = e.clientX - s.x;
      const el = shell();
      if (dx > 92) {
        if (el) {
          el.style.transition = 'transform .3s cubic-bezier(.22,.8,.24,1), opacity .3s ease';
          el.style.transform = 'translate3d(100%,0,0)';
          el.style.opacity = '0';
        }
        // naviga a schermo nascosto: il vecchio schermo non ricompare
        setTimeout(() => {
          navigate(-1);
          setTimeout(() => {
            if (el && el.isConnected) {
              el.style.transition = 'none';
              el.style.transform = 'translate3d(0,0,0)';
              el.style.opacity = '1';
            }
          }, 500);
        }, 250);
      } else if (el) {
        el.style.transition = 'transform .3s cubic-bezier(.22,.8,.24,1), opacity .3s ease';
        el.style.transform = 'translate3d(0,0,0)';
        el.style.opacity = '1';
      }
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
