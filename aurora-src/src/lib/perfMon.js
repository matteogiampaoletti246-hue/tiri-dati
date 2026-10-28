// Monitor della fluidità (si attiva dal Menu → "Monitor fluidità"). Durante ogni gesto misura i fotogrammi e gli spostamenti
// improvvisi dei riquadri (layout shift) e mostra l'ultimo risultato in un riquadro in alto a sinistra: serve a capire cosa scatta.
const KEY = 'sl-perf';
let on = false;
let box = null;
let frames = [];
let shifts = [];
let raf = 0;
let last = 0;
let po = null;
let touching = false;

export const perfEnabled = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
export const setPerf = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) { /* ignore */ } v ? start() : stop(); };

const show = (txt) => {
  if (!box) {
    box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:6px;top:calc(env(safe-area-inset-top,0px) + 4px);z-index:99999;padding:5px 8px;border-radius:8px;background:rgba(0,0,0,.78);color:#8f8;font:600 10.5px/1.35 ui-monospace,monospace;pointer-events:none;white-space:pre';
    document.body.appendChild(box);
  }
  box.textContent = txt;
};
const loop = (t) => {
  if (touching || Date.now() < until) { if (last) frames.push(t - last); }
  last = t;
  raf = requestAnimationFrame(loop);
};
let until = 0;
const report = () => {
  const f = frames.filter((x) => x < 500);
  if (f.length < 4) { frames = []; shifts = []; return; }
  const sorted = [...f].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const slow = f.filter((x) => x > 24).length;
  const worst = Math.max(...f);
  const cls = shifts.reduce((n, s) => n + s.v, 0);
  const top = shifts.sort((a, b) => b.v - a.v)[0];
  show(`gesto: ${f.length} fotogrammi\np95 ${p95.toFixed(1)} ms · peggiore ${worst.toFixed(0)} ms\nlenti (>24 ms): ${slow}\nspostamenti: ${shifts.length} (${cls.toFixed(3)})${top ? `\n↳ ${top.n}` : ''}`);
  frames = [];
  shifts = [];
};
const onStart = () => { touching = true; frames = []; shifts = []; };
const onEnd = () => { touching = false; until = Date.now() + 900; setTimeout(report, 950); };

function start() {
  if (on) return;
  on = true;
  last = 0;
  raf = requestAnimationFrame(loop);
  document.addEventListener('touchstart', onStart, { passive: true });
  document.addEventListener('touchend', onEnd, { passive: true });
  document.addEventListener('touchcancel', onEnd, { passive: true });
  try {
    po = new PerformanceObserver((l) => {
      l.getEntries().forEach((e) => {
        if (e.hadRecentInput || e.value < 0.0005 || !(touching || Date.now() < until)) return;
        const s = e.sources && e.sources[0];
        const n = s && s.node ? `${s.node.nodeName.toLowerCase()}.${String(s.node.className || '').split(' ')[0]}`.slice(0, 40) : '?';
        shifts.push({ v: e.value, n });
      });
    });
    po.observe({ type: 'layout-shift', buffered: false });
  } catch (e) { po = null; }
  show('monitor fluidità attivo:\nfai uno swipe');
}
function stop() {
  on = false;
  cancelAnimationFrame(raf);
  document.removeEventListener('touchstart', onStart);
  document.removeEventListener('touchend', onEnd);
  document.removeEventListener('touchcancel', onEnd);
  if (po) po.disconnect();
  if (box) { box.remove(); box = null; }
}
export const initPerf = () => { if (perfEnabled()) start(); };
