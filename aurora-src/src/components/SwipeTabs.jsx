import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { carousel, pageBack, finishCarousel } from '@/lib/carousel';


export default function SwipeTabs({ tabs, index, onChange, panels, gap = 14, className = '', stickyTop = 'var(--ent-h, 0px)', fixedBar = false, edgeBack = true, hideBar = false }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const wrapRef = useRef(null);
  const barRef = useRef(null);
  const tabRefs = useRef([]);
  const headRef = useRef(null);
  const [headH, setHeadH] = useState(44);

  useEffect(() => {
    const el = headRef.current;
    if (!el || !fixedBar) return undefined;
    const set = () => setHeadH(el.offsetHeight);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixedBar]);

  const posBar = (from, to, t, animate) => {
    const a = tabRefs.current[from];
    const b = tabRefs.current[to] || a;
    const bar = barRef.current;
    if (!a || !bar) return;
    bar.style.transition = animate ? 'transform .34s cubic-bezier(.22,.8,.24,1), width .34s cubic-bezier(.22,.8,.24,1)' : 'none';
    const left = a.offsetLeft + (b.offsetLeft - a.offsetLeft) * t;
    const w = a.offsetWidth + (b.offsetWidth - a.offsetWidth) * t;
    bar.style.transform = `translate3d(${left}px,0,0)`;
    bar.style.width = `${w}px`;
  };

  // posizione di scorrimento della riga di schede per mostrare la scheda k
  const scrollTargetOf = (k) => {
    const el = tabRefs.current[k];
    const box = headRef.current;
    if (!box || !el) return 0;
    const max = Math.max(0, box.scrollWidth - box.clientWidth);
    // la scheda k e la successiva devono stare per intero nello schermo
    const nx = tabRefs.current[Math.min(tabRefs.current.length - 1, k + 1)] || el;
    const want = nx.offsetLeft + nx.offsetWidth + 20 - box.clientWidth;
    const lim = el.offsetLeft - 20;
    return Math.max(0, Math.min(max, Math.min(want, lim)));
  };
  // durante lo swipe la riga scorre seguendo il dito, cosi' si vede la scheda che sta arrivando
  const followBar = (from, to, t) => {
    const box = headRef.current;
    if (!box) return;
    const sa = scrollTargetOf(from);
    const sb = scrollTargetOf(to);
    // la riga anticipa il dito: arriva alla posizione finale prima di fine swipe
    const e = Math.min(1, t * 1.6);
    box.scrollLeft = sa + (sb - sa) * e;
  };

  const live = useRef({});
  live.current = { index, onChange, n: tabs.length, back: edgeBack && loc.key !== 'default', navigate };
  const prevIdx = useRef(index);
  const contentRef = useRef(null);
  const skipEntry = useRef(false);

  // la barra segue la scheda attiva; la nuova scheda entra con una breve animazione
  useLayoutEffect(() => {
    posBar(index, index, 0, prevIdx.current !== index);
    if (prevIdx.current !== index && !skipEntry.current) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const cur = tabRefs.current[index];
    if (cur && headRef.current) {
      headRef.current.scrollTo({ left: scrollTargetOf(index), behavior: 'smooth' });
    }
    const el = contentRef.current;
    const dir = index > prevIdx.current ? 1 : index < prevIdx.current ? -1 : 0;
    prevIdx.current = index;
    if (skipEntry.current) { skipEntry.current = false; return undefined; }
    if (!el || !dir) return undefined;
    el.style.transition = 'none';
    el.style.transform = `translate3d(${dir * 70}px,0,0)`;
    el.style.opacity = '0';
    let t1;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'transform .28s cubic-bezier(.22,.8,.24,1), opacity .28s ease';
      el.style.transform = 'translate3d(0,0,0)';
      el.style.opacity = '1';
      t1 = setTimeout(() => { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; }, 320);
    }));
    return () => { cancelAnimationFrame(r); clearTimeout(t1); };
  }, [index]);

  // swipe laterale con eventi touch nativi (affidabili su iPhone); si muove solo il contenuto della scheda attiva
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    let st = null;
    let busy = false;
    const onStart = (e) => {
      finishCarousel();
      if (busy || e.touches.length !== 1) { st = null; return; }
      const t = e.target;
      if (t.closest && t.closest('input, select, textarea, [data-no-swipe]')) { st = null; return; }
      st = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), on: false, w: wrap.clientWidth || 360 };
    };
    const onMove = (e) => {
      if (!st) return;
      const dx = e.touches[0].clientX - st.x;
      const dy = e.touches[0].clientY - st.y;
      if (!st.on) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { st = null; return; }
        if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        st.on = true;
      }
      if (e.cancelable) e.preventDefault();
      st.dx = dx;
      if (!st.raf) st.raf = requestAnimationFrame(frame);
    };
    const frame = () => {
      if (!st) return;
      st.raf = 0;
      const dx = st.dx;
      const { index: i, n, back } = live.current;
      const edgeL = i === 0 && dx > 0;
      const edge = edgeL || (i === n - 1 && dx < 0);
      const off = edgeL && back ? dx * 0.9 : edge ? dx * 0.25 : dx;
      if (edgeL && back) {
        // torna indietro: si muove tutta la pagina, i riquadri restano fermi al loro posto
        const sh = document.getElementById('sl-shell');
        if (sh) {
          sh.style.transition = 'none';
          sh.style.transform = `translate3d(${Math.max(0, dx)}px,0,0)`;
          sh.style.opacity = String(Math.max(0.7, 1 - dx / 900));
        }
        return;
      }
      const el = contentRef.current;
      if (el) {
        el.style.transition = 'none';
        el.style.willChange = 'transform';
        el.style.transform = `translate3d(${off}px,0,0)`;
      }
      const p = Math.max(0, Math.min(n - 1, i - off / st.w));
      const from = Math.floor(p);
      const to = Math.min(n - 1, from + 1);
      posBar(from, to, p - from, false);
      followBar(from, to, p - from);
    };
    const onEnd = (e) => {
      const d = st;
      st = null;
      if (d && d.raf) cancelAnimationFrame(d.raf);
      if (!d || !d.on) return;
      const x = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : d.x);
      const dx = x - d.x;
      const v = Math.abs(dx) / Math.max(80, Date.now() - d.t);
      const { index: i, n, onChange: oc } = live.current;
      const next = dx < 0 ? i + 1 : i - 1;
      const el = contentRef.current;
      if (i === 0 && dx > 0 && live.current.back && (dx > d.w * 0.3 || v > 0.55)) {
        busy = true;
        pageBack(document.getElementById('sl-shell'), Math.max(0, dx), live.current.navigate);
        setTimeout(() => { busy = false; }, 450);
        return;
      }
      if (i === 0 && dx > 0 && live.current.back) {
        const sh = document.getElementById('sl-shell');
        if (sh) {
          sh.style.transition = 'transform .25s cubic-bezier(.22,.8,.24,1), opacity .25s ease';
          sh.style.transform = 'translate3d(0,0,0)';
          sh.style.opacity = '1';
          setTimeout(() => { sh.style.transition = ''; sh.style.transform = ''; sh.style.opacity = ''; }, 280);
        }
        return;
      }
      if ((Math.abs(dx) > d.w * 0.2 || v > 0.45) && next >= 0 && next < n) {
        busy = true;
        const off = (i === 0 && dx > 0) || (i === n - 1 && dx < 0) ? dx * 0.25 : dx;
        carousel(el, off, dx < 0 ? 1 : -1, () => { skipEntry.current = true; oc(next); }, () => { busy = false; });
      } else {
        if (el) {
          el.style.transition = 'transform .25s cubic-bezier(.22,.8,.24,1), opacity .25s ease';
          el.style.transform = 'translate3d(0,0,0)';
          el.style.opacity = '1';
          setTimeout(() => { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; el.style.willChange = ''; }, 280);
        }
        posBar(i, i, 0, true);
      }
    };
    wrap.addEventListener('touchstart', onStart, { passive: true });
    wrap.addEventListener('touchmove', onMove, { passive: false });
    wrap.addEventListener('touchend', onEnd, { passive: true });
    wrap.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      wrap.removeEventListener('touchstart', onStart);
      wrap.removeEventListener('touchmove', onMove);
      wrap.removeEventListener('touchend', onEnd);
      wrap.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  const HEAD = (
<div ref={headRef} className={fixedBar ? 'hide-sb fixed inset-x-0 z-30 mx-auto w-full max-w-[var(--app-w)] overflow-x-auto px-5 pt-2.5' : 'hide-sb glass-head sticky z-20 overflow-x-auto px-5 pt-2.5'} style={{ top: stickyTop, background: fixedBar ? 'var(--sky-2)' : 'color-mix(in srgb, hsl(var(--background)) 94%, transparent)' }}>
        <div className="relative flex items-center gap-6" style={{ width: 'max-content' }}>
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              className={`tab-btn ${i === index ? 'is-on' : ''}`}
              onClick={() => onChange(i)}
            >
              {tab.label}
            </button>
          ))}
          <span aria-hidden="true" style={{ width: 24, height: 1, flex: '0 0 24px', marginLeft: -12 }} />
          <span
            ref={barRef}
            className="absolute bottom-0 left-0 h-[2.5px] rounded-full"
            style={{ background: 'var(--accent)', transform: 'translate3d(0,0,0)' }}
          />
        </div>
      </div>

  );

  return (
    <div className={className}>
      {fixedBar ? <div aria-hidden="true" style={{ height: headH }} /> : null}
      {hideBar ? null : fixedBar ? createPortal(HEAD, document.body) : HEAD}
      <div ref={wrapRef} data-tabs-back={edgeBack && loc.key !== 'default' ? '1' : undefined} className="relative" style={{ touchAction: 'pan-y', minHeight: '60vh' }}>
        <div ref={contentRef}>{panels[index]}</div>
      </div>
    </div>
  );
}
