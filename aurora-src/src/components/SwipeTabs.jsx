import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { pageBack, pageDrag, pageReset, finishCarousel, canGoBack } from '@/lib/carousel';


// Scheda vicina gia' montata e ferma: non si ridisegna quando cambia la pagina (si aggiorna solo quando diventa quella attiva).
const Frozen = memo(({ children }) => children, (a, b) => a.freeze && b.freeze);

const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1800 }) : setTimeout(fn, 60));
const cancelIdle = (id) => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));

export default function SwipeTabs({ tabs, index, onChange, panels, gap = 14, className = '', stickyTop = 'var(--ent-h, 0px)', fixedBar = false, edgeBack = true, hideBar = false }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const wrapRef = useRef(null);
  const barRef = useRef(null);
  const tabRefs = useRef([]);
  const headRef = useRef(null);
  const [headH, setHeadH] = useState(44);
  const [peek, setPeek] = useState(null);
  const peekRef = useRef(null);
  const peekTop = useRef(0);
  // schede vicine gia' costruite (nascoste): al primo movimento del dito non c'e' nulla da montare, quindi niente scatti
  const [warm, setWarm] = useState([]);
  // bordo basso della testata fissa/appiccicosa: da li' in giu' si vede il contenuto
  const visibleTop = () => (headRef.current ? headRef.current.getBoundingClientRect().bottom : 0);
  const showPeek = (v) => {
    if (peekRef.current !== v) {
      if (v !== null && wrapRef.current) peekTop.current = Math.max(0, visibleTop() - wrapRef.current.getBoundingClientRect().top);
      peekRef.current = v;
      setPeek(v);
    }
  };

  useEffect(() => {
    const el = headRef.current;
    if (!el || !fixedBar) return undefined;
    const set = () => { setHeadH(el.offsetHeight); document.documentElement.style.setProperty('--tabs-h', `${el.offsetHeight}px`); };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => { ro.disconnect(); document.documentElement.style.setProperty('--tabs-h', '0px'); };
  }, [fixedBar]);

  // misure delle schede prese una volta sola all'inizio dello swipe: durante il movimento non si legge nulla dal layout (niente ricalcoli a ogni fotogramma)
  const geom = useRef(null);
  const posBar = (from, to, t, animate) => {
    const a = tabRefs.current[from];
    const b = tabRefs.current[to] || a;
    const bar = barRef.current;
    if (!a || !bar) return;
    bar.style.transition = animate ? 'transform .34s cubic-bezier(.22,.8,.24,1), width .34s cubic-bezier(.22,.8,.24,1)' : 'none';
    const g = !animate && geom.current;
    const aL = g ? g.l[from] : a.offsetLeft; const bL = g ? g.l[to] ?? g.l[from] : b.offsetLeft;
    const aW = g ? g.w[from] : a.offsetWidth; const bW = g ? g.w[to] ?? g.w[from] : b.offsetWidth;
    const left = aL + (bL - aL) * t;
    const w = aW + (bW - aW) * t;
    bar.style.transform = `translate3d(${left}px,0,0)`;
    bar.style.width = `${w}px`;
    // i titoli si accendono piano piano insieme alla barra (stesso peso per tutti: niente scatti di grassetto)
    const pos = from + t;
    tabRefs.current.forEach((el, k) => {
      if (!el) return;
      const m = Math.max(0, 1 - Math.abs(k - pos));
      el.style.transition = animate ? 'color .34s ease' : 'none';
      el.style.color = `color-mix(in srgb, var(--ink) ${Math.round(m * 100)}%, var(--ink-3))`;
    });
  };

  // posizione di scorrimento della riga di schede per mostrare la scheda k
  const scrollTargetOf = (k) => {
    const el = tabRefs.current[k];
    const box = headRef.current;
    if (!box || !el) return 0;
    const max = Math.max(0, box.scrollWidth - box.clientWidth);
    // la scheda k e la successiva devono stare per intero nello schermo
    const nx = tabRefs.current[Math.min(tabRefs.current.length - 1, k + 1)] || el;
    const want = nx.offsetLeft + nx.offsetWidth + 44 - box.clientWidth;
    const lim = el.offsetLeft - 20;
    if (k >= tabRefs.current.length - 1) return Math.max(0, Math.min(max, want));
    return Math.max(0, Math.min(max, Math.min(want, lim)));
  };
  // durante lo swipe la riga scorre seguendo il dito, cosi' si vede la scheda che sta arrivando
  const followBar = (from, to, t) => {
    const box = headRef.current;
    if (!box) return;
    const g = geom.current;
    const sa = g ? g.t[from] : scrollTargetOf(from);
    const sb = g ? g.t[to] : scrollTargetOf(to);
    // la riga anticipa il dito: arriva alla posizione finale prima di fine swipe
    const e = Math.min(1, t * 1.6);
    box.scrollLeft = sa + (sb - sa) * e;
  };

  useEffect(() => {
    setWarm((w) => w.filter((k) => Math.abs(k - index) === 1));
    const want = [index + 1, index - 1].filter((k) => k >= 0 && k < tabs.length && panels[k]);
    let tm = 0;
    let id = 0;
    let n = 0;
    const step = () => {
      if (n >= want.length) return;
      const k = want[n++];
      setWarm((w) => (w.includes(k) ? w : [...w, k]));
      tm = setTimeout(() => { id = idle(step); }, 160);
    };
    tm = setTimeout(() => { id = idle(step); }, 220);
    return () => { clearTimeout(tm); cancelIdle(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, tabs.length]);

  const live = useRef({});
  live.current = { index, onChange, n: tabs.length, back: edgeBack && canGoBack(), navigate };
  const prevIdx = useRef(index);
  const contentRef = useRef(null);
  const skipEntry = useRef(false);
  const finishRef = useRef(null);

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
    requestAnimationFrame(() => window.dispatchEvent(new Event('sl-tab-shown')));
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
      document.documentElement.dataset.tch = '1';
      finishCarousel();
      if (finishRef.current) finishRef.current();
      if (busy || e.touches.length !== 1) { st = null; return; }
      const t = e.target;
      if (t.closest && t.closest('input, select, textarea, [data-no-swipe]')) { st = null; return; }
      st = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), on: false, w: wrap.clientWidth || 360, edge: e.touches[0].clientX <= 36 };
    };
    const onMove = (e) => {
      if (!st) return;
      const dx = e.touches[0].clientX - st.x;
      const dy = e.touches[0].clientY - st.y;
      if (!st.on) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { st = null; return; }
        if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        st.on = true;
        geom.current = { l: tabRefs.current.map((x) => x && x.offsetLeft), w: tabRefs.current.map((x) => x && x.offsetWidth), t: tabRefs.current.map((_, k) => scrollTargetOf(k)) };
      }
      if (e.cancelable) e.preventDefault();
      st.dx = dx;
      if (!st.raf) st.raf = requestAnimationFrame(frame);
    };
    const frame = () => {
      if (!st) return;
      st.raf = 0;
      const dx = st.dx;
      const { index: i, n } = live.current;
      const back = live.current.back && st.edge;
      const edgeL = i === 0 && dx > 0;
      const edge = edgeL || (i === n - 1 && dx < 0);
      const off = edgeL && back ? dx * 0.9 : edge ? 0 : dx;
      if (edgeL && back) {
        // torna indietro: si muove tutta la pagina, i riquadri restano fermi al loro posto
        pageDrag(dx);
        return;
      }
      const want = off < 0 ? i + 1 : off > 0 ? i - 1 : null;
      showPeek(want !== null && want >= 0 && want < n ? want : null);
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
      delete document.documentElement.dataset.tch;
      const d = st;
      st = null;
      geom.current = null;
      if (d && d.raf) cancelAnimationFrame(d.raf);
      if (!d || !d.on) return;
      const x = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : d.x);
      const dx = x - d.x;
      const v = Math.abs(dx) / Math.max(80, Date.now() - d.t);
      const { index: i, n, onChange: oc } = live.current;
      const next = dx < 0 ? i + 1 : i - 1;
      const el = contentRef.current;
      if (i === 0 && dx > 0 && live.current.back && d.edge && (dx > d.w * 0.3 || v > 0.55)) {
        busy = true;
        pageBack(Math.max(0, dx), live.current.navigate);
        setTimeout(() => { busy = false; }, 450);
        return;
      }
      if (i === 0 && dx > 0 && live.current.back && d.edge) {
        pageReset(true);
        return;
      }
      if ((Math.abs(dx) > d.w * 0.2 || v > 0.45) && next >= 0 && next < n) {
        busy = true;
        // la scheda vicina e' gia' accanto: si muove solo la striscia, poi si scambia senza ricostruire nulla
        const dir = dx < 0 ? -1 : 1;
        const w = Math.min(window.innerWidth, el.offsetWidth || 430);
        flushSync(() => showPeek(next));
        posBar(i, next, 1, true);
        let ended = false;
        let tm = 0;
        const end = () => {
          if (ended) return;
          ended = true;
          clearTimeout(tm);
          finishRef.current = null;
          el.style.transition = 'none';
          // la nuova scheda parte dal suo inizio, esattamente dove la si vedeva durante lo swipe
          const target = Math.max(0, wrap.getBoundingClientRect().top + window.scrollY - visibleTop());
          flushSync(() => { skipEntry.current = true; peekRef.current = null; setPeek(null); oc(next); });
          el.style.transform = '';
          el.style.willChange = '';
          if (window.scrollY > target + 1) window.scrollTo(0, target);
          busy = false;
        };
        finishRef.current = end;
        el.style.willChange = 'transform';
        requestAnimationFrame(() => {
          if (ended) return;
          el.style.transition = 'transform .26s cubic-bezier(.22,.8,.24,1)';
          el.style.transform = `translate3d(${dir * w}px,0,0)`;
          tm = setTimeout(end, 290);
        });
      } else {
        if (el) {
          el.style.transition = 'transform .25s cubic-bezier(.22,.8,.24,1), opacity .25s ease';
          el.style.transform = 'translate3d(0,0,0)';
          el.style.opacity = '1';
          setTimeout(() => { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; el.style.willChange = ''; showPeek(null); }, 280);
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
<div ref={headRef} data-pf={fixedBar ? '1' : undefined} className={fixedBar ? 'hide-sb fixed inset-x-0 z-30 mx-auto w-full max-w-[var(--app-w)] overflow-x-auto px-5 pt-2.5' : 'hide-sb glass-head sticky z-20 overflow-x-auto px-5 pt-2.5'} style={{ overflowY: 'hidden', top: stickyTop, background: fixedBar ? 'var(--sky-2)' : 'color-mix(in srgb, hsl(var(--background)) 94%, transparent)' }}>
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
          <span aria-hidden="true" style={{ width: 28, height: 1, flex: '0 0 28px' }} />
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
      <div ref={wrapRef} data-tabs-back={edgeBack && canGoBack() ? '1' : undefined} className="relative" style={{ touchAction: 'pan-y', minHeight: '60vh', overflowX: 'clip' }}>
        <div ref={contentRef} style={{ position: 'relative' }}>
          {[index, ...warm.filter((k) => Math.abs(k - index) === 1 && panels[k]), ...(peek !== null && peek !== index && !warm.includes(peek) && panels[peek] ? [peek] : [])]
            .sort((a, b) => a - b)
            .map((k) => (
              <div
                key={k}
                style={k === index
                  ? { display: 'flow-root' }
                  : { position: 'absolute', top: peek === k ? peekTop.current : 0, width: '100%', left: k > index ? '100%' : '-100%', display: 'flow-root', height: '100vh', overflow: 'hidden', visibility: peek === k ? 'visible' : 'hidden', pointerEvents: 'none' }}
              >
                <Frozen freeze={k !== index && peek !== k}>{panels[k]}</Frozen>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
