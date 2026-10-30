import { modalOpen } from '@/lib/modal';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { dragDays } from '@/components/DayStrip';
import { BACK_ZONE } from '@/lib/carousel';

// Giorni affiancati: lo swipe laterale sposta una striscia gia' pronta (come nella Home).
// I giorni vicini si preparano a riposo, quando l'app e' ferma.
// durante lo swipe il riquadro e' alto quanto il giorno piu' lungo tra quelli affiancati: niente schede tagliate
export const growBox = (el) => {
  if (!el) return;
  let h = 0;
  for (const c of el.children) if (!c.hasAttribute('data-far')) h = Math.max(h, c.offsetHeight, c.scrollHeight);
  el.style.height = `${h}px`;
};
export default function DayPager({ index, count, onChange, render, backEdge = false }) {
  const box = useRef(null);
  const [ready, setReady] = useState(false);
  const live = useRef({});
  live.current = { index, count, onChange };

  useEffect(() => {
    // i giorni vicini si calcolano quando l'app e' ferma (o al primo movimento del dito): mai insieme al giorno che si sta mostrando
    if (window.requestIdleCallback) { const id = window.requestIdleCallback(() => setReady(true), { timeout: 700 }); return () => window.cancelIdleCallback(id); }
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, [index]);

  useEffect(() => {
    let st = null;
    let busy = false;
    const blocked = (t) => t.closest && t.closest('[data-no-swipe], input, select, textarea, [role="dialog"]');
    const onStart = (e) => {
      if (busy || e.touches.length !== 1 || modalOpen() || blocked(e.target)) { st = null; return; }
      const t = e.touches[0];
      st = { x: t.clientX, y: t.clientY, t: Date.now(), on: false, dx: 0, raf: 0, near: t.clientX <= BACK_ZONE };
    };
    const onMove = (e) => {
      if (!st) return;
      const t = e.touches[0];
      const dx = t.clientX - st.x;
      const dy = t.clientY - st.y;
      if (!st.on) {
        // verso destra dal bordo, o dal primo giorno: e' lo swipe indietro (useSwipeBack)
        if (backEdge && dx > 0 && (st.near || live.current.index === 0)) { st = null; return; }
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { st = null; return; }
        if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        st.on = true;
        setReady(true);
      }
      if (e.cancelable) e.preventDefault();
      st.dx = dx;
      if (!st.raf) {
        st.raf = requestAnimationFrame(() => {
          if (!st) return;
          st.raf = 0;
          const { index: i, count: n } = live.current;
          const ok = st.dx > 0 ? i > 0 : i < n - 1;
          const el = box.current;
          dragDays(ok ? -st.dx / Math.min(window.innerWidth, (el && el.offsetWidth) || 430) : 0);
          if (el) {
            growBox(el);
            el.style.transition = 'none';
            el.style.willChange = 'transform';
            el.style.transform = `translate3d(${ok ? st.dx : st.dx * 0.28}px,0,0)`;
          }
        });
      }
    };
    const onEnd = (e) => {
      const d = st;
      st = null;
      if (d && d.raf) cancelAnimationFrame(d.raf);
      if (!d || !d.on) return;
      const t = (e.changedTouches && e.changedTouches[0]) || { clientX: d.x };
      const dx = t.clientX - d.x;
      const v = Math.abs(dx) / Math.max(80, Date.now() - d.t);
      const { index: i, count: n, onChange: oc } = live.current;
      const next = dx > 0 ? i - 1 : i + 1;
      const el = box.current;
      if (!el) return;
      if ((Math.abs(dx) > 60 || v > 0.45) && next >= 0 && next < n) {
        busy = true;
        const w = Math.min(window.innerWidth, el.offsetWidth || 430);
        let ended = false;
        let tm = 0;
        const end = () => {
          if (ended) return;
          ended = true;
          clearTimeout(tm);
          el.style.transition = 'none';
          flushSync(() => oc(next));
          el.style.height = '';
          el.style.transform = '';
          el.style.willChange = '';
          busy = false;
        };
        dragDays(dx > 0 ? -1 : 1, true);
        requestAnimationFrame(() => {
          el.style.transition = 'transform .26s cubic-bezier(.22,.8,.24,1)';
          el.style.transform = `translate3d(${(dx > 0 ? 1 : -1) * w}px,0,0)`;
          tm = setTimeout(end, 290);
        });
      } else {
        el.style.transition = 'transform .25s cubic-bezier(.22,.8,.24,1)';
        el.style.transform = 'translate3d(0,0,0)';
        dragDays(0, true);
        setTimeout(() => { el.style.transition = ''; el.style.transform = ''; el.style.willChange = ''; el.style.height = ''; }, 280);
      }
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  const pane = (i, role) => (
    <div key={i} style={role ? { position: 'absolute', top: 0, width: '100%', left: `${role * 100}%`, display: 'flow-root' } : { display: 'flow-root' }}>
      {role === 0 || ready ? render(i, role === 0) : <div style={{ minHeight: '40vh' }} />}
    </div>
  );
  return (
    <div data-days-left={backEdge && index > 0 ? '1' : undefined} style={{ overflow: 'clip' }}>
      <div ref={box} style={{ minHeight: '55vh', position: 'relative' }}>
        {index > 0 ? pane(index - 1, -1) : null}
        {pane(index, 0)}
        {index < count - 1 ? pane(index + 1, 1) : null}
      </div>
    </div>
  );
}
