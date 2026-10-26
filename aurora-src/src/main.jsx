import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';

// Niente zoom con due dita né doppio tocco: l'app resta ferma, si muove solo con lo scorrimento.
const stop = (e) => e.preventDefault();
['gesturestart', 'gesturechange', 'gestureend'].forEach((n) => document.addEventListener(n, stop, { passive: false }));
document.addEventListener('touchmove', (e) => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
// Se un pezzo di pagina va in errore non si resta con lo schermo bianco: si riprova da solo.
class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: 0 }; }
  static getDerivedStateFromError() { return { err: Date.now() }; }
  componentDidCatch(e) {
    try { (window.__slErr = window.__slErr || []).push(String((e && e.stack) || e).slice(0, 400)); } catch { /* ignora */ } setTimeout(() => this.setState({ err: 0 }), 400); }
  render() {
    if (this.state.err) return <div style={{ minHeight: '100vh' }} />;
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<Boundary><App /></Boundary>);

// Modalità diagnostica: aprire /aurora/?debug=1 e trascinare il dito per vedere cosa riceve il telefono.
if (/[?&]debug=1/.test(location.search)) {
  const box = document.createElement('pre');
  box.style.cssText = 'position:fixed;left:6px;right:6px;bottom:96px;z-index:99999;margin:0;padding:8px;border-radius:10px;background:rgba(0,0,0,.82);color:#9ff;font:11px/1.35 monospace;pointer-events:none;white-space:pre-wrap';
  document.body.appendChild(box);
  const c = { ts: 0, tm: 0, te: 0, tc: 0, pd: 0, pm: 0, pc: 0, canc: '-', dx: 0, dy: 0 };
  let x0 = 0;
  let y0 = 0;
  const draw = () => { box.textContent = `touchstart ${c.ts}  touchmove ${c.tm}  touchend ${c.te}  touchcancel ${c.tc}\npointerdown ${c.pd}  pointermove ${c.pm}  pointercancel ${c.pc}\nultimo move cancelabile: ${c.canc}  dx ${c.dx}  dy ${c.dy}\nversione: ${(document.querySelector('script[src*=index]') || {}).src || '?'}`; };
  const on = (n, f) => document.addEventListener(n, f, { capture: true, passive: true });
  on('touchstart', (e) => { c.ts++; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; draw(); });
  on('touchmove', (e) => { c.tm++; c.canc = String(e.cancelable); c.dx = Math.round(e.touches[0].clientX - x0); c.dy = Math.round(e.touches[0].clientY - y0); draw(); });
  on('touchend', () => { c.te++; draw(); });
  on('touchcancel', () => { c.tc++; draw(); });
  on('pointerdown', () => { c.pd++; draw(); });
  on('pointermove', () => { c.pm++; draw(); });
  on('pointercancel', () => { c.pc++; draw(); });
  draw();
}

// Ritorno nell'app: dopo meno di 5 minuti si riprende esattamente da dove si era, senza ricaricare nulla.
// Dopo 5 minuti o piu' l'app riparte da capo (nuova versione se disponibile) e rifa' l'animazione iniziale.
(() => {
  const AWAY = 5 * 60 * 1000;
  let hiddenAt = 0;
  // pagina ricaricata dal sistema mentre l'app era in background: l'intro riparte solo dopo 5 minuti
  try {
    const last = Number(sessionStorage.getItem('sl-hidden-at') || 0);
    if (last && Date.now() - last >= AWAY) {
      sessionStorage.removeItem('sl-launched');
      sessionStorage.removeItem('sl-scroll');
      if (location.hash) location.hash = '#/';
    }
    sessionStorage.removeItem('sl-hidden-at');
  } catch { /* ignora */ }
  const mine = ((document.querySelector('script[src*="index-"]') || {}).src || '').match(/index-[^./]+\.js/);
  // all'avvio: se sul server c'e' una versione piu' nuova la prende (una sola volta per versione)
  if (mine) {
    fetch(`${location.pathname}?v=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.text())
      .then((t) => {
        const m = t.match(/index-[^./"]+\.js/);
        if (m && m[0] !== mine[0]) {
          const k = `sl-reload-${m[0]}`;
          if (sessionStorage.getItem(k)) return;
          sessionStorage.setItem(k, '1');
          location.reload();
        }
      })
      .catch(() => {});
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      try { sessionStorage.setItem('sl-hidden-at', String(hiddenAt)); } catch { /* ignora */ }
      return;
    }
    if (hiddenAt && Date.now() - hiddenAt >= AWAY) {
      try {
        sessionStorage.removeItem('sl-launched');
        sessionStorage.removeItem('sl-scroll');
      } catch { /* ignora */ }
      location.replace(`${location.pathname}#/`);
      location.reload();
    }
    hiddenAt = 0;
    try { sessionStorage.removeItem('sl-hidden-at'); } catch { /* ignora */ }
  });
  // pagina ripristinata dalla cache del browser dopo una lunga assenza
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && hiddenAt && Date.now() - hiddenAt >= AWAY) location.reload();
  });
})();
