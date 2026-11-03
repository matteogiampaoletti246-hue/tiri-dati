import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModalLock } from '@/lib/modal';

// Tendina dal basso (drawer): segue il dito, si chiude trascinando giu' (anche con un colpo veloce), si ferma sugli snap point
// (frazioni dell'altezza dello schermo vero), sfondo scurito, focus dentro la finestra, pagina sotto bloccata.
// Si apre al montaggio; close() la fa uscire e poi chiama onClose. Lo swipe laterale lo passa a onSwipeX.
const EASE = 'cubic-bezier(0.23,1,0.32,1)';
const OPEN_MS = 500;
const CLOSE_MS = 250;
const reduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

// Schermo vero (regola "Finestra giocatore su iPhone"): Safari a volte accorcia il riquadro degli elementi fissi con la pagina live che cresce
function useScreenBox() {
  const read = () => {
    const vv = window.visualViewport;
    const ih = Math.round(window.innerHeight || 0);
    if (!vv) return { h: ih, t: 0 };
    // senza tastiera lo schermo e' almeno alto quanto il riquadro della pagina (tastiera chiusa in background non accorcia la finestra)
    return { h: Math.max(Math.round(vv.height), ih), t: Math.round(vv.offsetTop) };
  };
  const [box, setBox] = useState(read);
  useEffect(() => {
    const vv = window.visualViewport;
    const upd = () => {
      const a = document.activeElement;
      if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      const n = read();
      setBox((o) => (o.h === n.h && o.t === n.t ? o : n));
    };
    if (vv) { vv.addEventListener('resize', upd); vv.addEventListener('scroll', upd); }
    window.addEventListener('resize', upd);
    window.addEventListener('sl-resume', upd);
    document.addEventListener('visibilitychange', upd);
    const iv = setInterval(upd, 700);
    return () => {
      if (vv) { vv.removeEventListener('resize', upd); vv.removeEventListener('scroll', upd); }
      window.removeEventListener('resize', upd);
      window.removeEventListener('sl-resume', upd);
      document.removeEventListener('visibilitychange', upd);
      clearInterval(iv);
    };
  }, []);
  return box;
}

const Drawer = forwardRef(function Drawer({
  onClose, snapPoints = [0.92], label, className = '', style, footer, scrollRef, onSwipeX, isBusy, children,
}, ref) {
  const box = useScreenBox();
  const snaps = [...snapPoints].sort((a, b) => a - b);
  const top = snaps[snaps.length - 1];
  const H = Math.round(box.h * top);
  const offOf = (s) => Math.round((top - s) * box.h);
  const lowOff = offOf(snaps[0]);

  const rootRef = useRef(null);
  const popRef = useRef(null);
  const bdRef = useRef(null);
  const footRef = useRef(null);
  const st = useRef({ snap: top, off: H, closing: false, drag: null, opened: false });
  const cfg = useRef({});
  cfg.current = { H, lowOff, snaps, offOf, onClose, onSwipeX, isBusy, scrollRef };

  useModalLock(true);

  // posiziona tendina, sfondo e barra in basso; ms = 0 senza animazione
  const place = (off, ms, ease = EASE) => {
    const { H: h, lowOff: lo } = cfg.current;
    const el = popRef.current;
    if (!el) return;
    const t = ms && !reduced() ? `transform ${ms}ms ${ease}` : 'none';
    st.current.off = off;
    el.style.transition = t;
    el.style.transform = `translate3d(0,${off}px,0)`;
    const bd = bdRef.current;
    if (bd) {
      const fade = off <= lo ? 1 : Math.max(0, 1 - (off - lo) / Math.max(1, h - lo));
      bd.style.transition = ms && !reduced() ? `opacity ${Math.min(ms, 300)}ms ${ease}` : 'none';
      bd.style.opacity = String(fade);
    }
    // la barra in basso resta sul fondo visibile dello schermo anche con la tendina a meta'
    const ft = footRef.current;
    if (ft) {
      ft.style.transition = t;
      ft.style.transform = `translate3d(0,${-Math.max(0, Math.min(off, lo))}px,0)`;
    }
    const sc = cfg.current.scrollRef && cfg.current.scrollRef.current;
    if (sc) sc.style.overflowY = st.current.snap === top || off < 0 ? 'auto' : 'hidden';
  };

  const settle = (snap) => {
    st.current.snap = snap;
    place(cfg.current.offOf(snap), OPEN_MS);
  };

  const close = () => {
    const s = st.current;
    if (s.closing) return;
    s.closing = true;
    if (reduced()) { cfg.current.onClose(); return; }
    place(Math.round(cfg.current.H * 1.05), CLOSE_MS);
    setTimeout(() => cfg.current.onClose(), CLOSE_MS);
  };

  useImperativeHandle(ref, () => ({ close, get el() { return popRef.current; } }), []);

  // apertura: dal fondo allo snap piu' alto
  useLayoutEffect(() => {
    place(Math.round(H * 1.05), 0);
    const el = popRef.current;
    if (el) void el.offsetHeight;
    const r = requestAnimationFrame(() => { st.current.opened = true; settle(top); });
    return () => cancelAnimationFrame(r);
  }, []);

  // schermo cambiato (barra Safari, ritorno dal background): stessa posizione rispetto allo snap, senza scatti
  useLayoutEffect(() => {
    const s = st.current;
    if (!s.opened || s.closing || s.drag) return;
    place(offOf(s.snap), 0);
  }, [box.h, box.t]);

  // pagina sotto bloccata, niente zoom con due dita, focus dentro la finestra e ritorno al tasto che l'ha aperta
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const back = document.activeElement;
    const pop = popRef.current;
    if (pop) pop.focus({ preventScroll: true });
    const noZoom = (e) => { if (e.cancelable) e.preventDefault(); };
    const key = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab' || !pop) return;
      const f = [...pop.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null);
      if (!f.length) { e.preventDefault(); pop.focus({ preventScroll: true }); return; }
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === pop)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    // tornando da un'altra app un trascinamento rimasto a meta' torna allo snap; uno vivo (dito appena mosso) non si tocca,
    // e un'animazione gia' diretta allo snap giusto non si taglia ('sl-resume' arriva piu' volte nel primo secondo)
    const resume = (force) => {
      const s = st.current;
      if (s.closing) return;
      if (s.drag && !force && performance.now() - s.drag.last < 1000) return;
      const target = cfg.current.offOf(s.snap);
      if (!s.drag && Math.abs(s.off - target) < 1) return;
      s.drag = null;
      place(target, 0);
    };
    document.addEventListener('gesturestart', noZoom, { passive: false });
    document.addEventListener('keydown', key);
    const onResume = () => resume(false);
    window.addEventListener('sl-resume', onResume);
    const vis = () => resume(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', vis);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('gesturestart', noZoom);
      document.removeEventListener('keydown', key);
      window.removeEventListener('sl-resume', onResume);
      document.removeEventListener('visibilitychange', vis);
      if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true });
    };
  }, []);

  // gesti con eventi touch nativi: giu' per chiudere / cambiare snap, laterale passato a onSwipeX
  useEffect(() => {
    const root = popRef.current;
    if (!root) return undefined;
    const onStart = (e) => {
      const c = cfg.current;
      const s = st.current;
      if (c.onSwipeX && c.onSwipeX.start) c.onSwipeX.start();
      if (s.closing || (c.isBusy && c.isBusy()) || e.touches.length !== 1) { s.drag = null; return; }
      const tgt = e.target;
      const sc = c.scrollRef && c.scrollRef.current;
      const inScroller = !!(sc && sc.contains(tgt));
      const p = e.touches[0];
      s.drag = {
        x: p.clientX, y: p.clientY, t: performance.now(), off0: s.off, axis: null,
        noH: !!(tgt.closest && tgt.closest('[data-no-swipe]')),
        atTop: !inScroller || sc.scrollTop <= 0,
        full: s.snap === snaps[snaps.length - 1],
        hist: [[p.clientY, performance.now()]], last: performance.now(),
      };
    };
    const onMove = (e) => {
      const d = st.current.drag;
      if (!d) return;
      const p = e.touches[0];
      d.last = performance.now();
      const dx = p.clientX - d.x;
      const dy = p.clientY - d.y;
      if (!d.axis) {
        if (Math.abs(dx) < 9 && Math.abs(dy) < 9) return;
        if (Math.abs(dx) > Math.abs(dy) * 1.2) d.axis = d.noH || !cfg.current.onSwipeX ? 'none' : 'x';
        else if (!d.full || (dy > 0 && d.atTop)) d.axis = 'y';
        else d.axis = 'none';
        // il gesto parte da qui: niente salto dei 9 px di soglia
        d.x = p.clientX; d.y = p.clientY; d.t = performance.now();
      }
      if (d.axis === 'none') return;
      if (e.cancelable) e.preventDefault();
      const mx = p.clientX - d.x;
      const my = p.clientY - d.y;
      if (d.axis === 'x') { cfg.current.onSwipeX.move(mx); return; }
      d.hist.push([p.clientY, performance.now()]);
      if (d.hist.length > 5) d.hist.shift();
      let off = d.off0 + my;
      if (off < 0) off = -Math.sqrt(-off) * 3; // sopra lo snap piu' alto: resistenza
      place(off, 0);
    };
    const onEnd = (e) => {
      const s = st.current;
      const d = s.drag;
      s.drag = null;
      if (!d || !d.axis || d.axis === 'none') return;
      const c = cfg.current;
      const p = (e.changedTouches && e.changedTouches[0]) || { clientX: d.x, clientY: d.y };
      if (d.axis === 'x') { c.onSwipeX.end(p.clientX - d.x, e.type === 'touchcancel', performance.now() - d.t); return; }
      if (e.type === 'touchcancel') { settle(s.snap); return; }
      // velocita' al rilascio (px/ms, positiva verso il basso) dagli ultimi movimenti
      const h0 = d.hist;
      const tEnd = h0[h0.length - 1][1];
      const h = h0.filter(([, t], i) => i >= h0.length - 2 || tEnd - t <= 120);
      const [y0, t0] = h[0];
      const [y1, t1] = h[h.length - 1];
      const v = t1 - t0 > 0 ? (y1 - y0) / (t1 - t0) : 0;
      const stops = [...c.snaps.map((sn) => ({ sn, off: c.offOf(sn) })), { sn: null, off: c.H }].sort((a, b) => a.off - b.off);
      let target;
      if (Math.abs(v) > 0.5) {
        // colpo veloce: almeno uno snap nella direzione del gesto, di piu' se il colpo e' forte
        const proj = s.off + v * 260;
        const dir = v > 0 ? 1 : -1;
        const from = stops.findIndex((x) => x.sn === s.snap);
        const cands = stops.filter((_, i) => (dir > 0 ? i > from : i < from));
        target = cands.length ? cands.reduce((a, b) => (Math.abs(b.off - proj) < Math.abs(a.off - proj) ? b : a), cands[dir > 0 ? 0 : cands.length - 1]) : stops[from];
      } else {
        target = stops.reduce((a, b) => (Math.abs(b.off - s.off) < Math.abs(a.off - s.off) ? b : a));
      }
      if (target.sn == null) close(); else settle(target.sn);
    };
    root.addEventListener('touchstart', onStart, { passive: true });
    root.addEventListener('touchmove', onMove, { passive: false });
    root.addEventListener('touchend', onEnd, { passive: true });
    root.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      root.removeEventListener('touchstart', onStart);
      root.removeEventListener('touchmove', onMove);
      root.removeEventListener('touchend', onEnd);
      root.removeEventListener('touchcancel', onEnd);
    };
  }, [snaps.join(',')]);

  return createPortal(
    <div ref={rootRef} data-no-back="1" role="dialog" aria-modal="true" aria-label={label} className="fixed inset-x-0 z-[80]" style={{ top: box.t, height: box.h, touchAction: 'none' }}>
      <div ref={bdRef} aria-hidden="true" className="absolute inset-0" style={{ background: 'var(--drawer-backdrop)', opacity: 0 }} onClick={close} onTouchMove={(e) => { if (e.cancelable) e.preventDefault(); }} />
      <div
        ref={popRef}
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[var(--sheet-w)] flex-col overflow-hidden rounded-t-[28px] outline-none ${className}`}
        style={{ height: H, background: 'var(--sky-2)', border: '1px solid var(--glass-border)', borderBottom: 'none', boxShadow: 'var(--drawer-shadow)', touchAction: 'pan-y', willChange: 'transform', ...style }}
      >
        <div className="shrink-0 pb-1 pt-2.5">
          <span className="mx-auto block h-[5px] w-10 rounded-full" style={{ background: 'var(--drawer-handle)' }} />
        </div>
        {children}
        {footer ? <div ref={footRef} className="absolute inset-x-0 bottom-0">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
});

export default Drawer;
