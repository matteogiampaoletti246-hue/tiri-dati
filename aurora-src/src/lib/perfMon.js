// Pannello di diagnosi per le registrazioni schermo (Menu → Diagnostica). Sempre in vista mentre si usa l'app:
// orologio, FPS, scatti, spostamenti dei riquadri, richieste lente, caricamenti e un registro degli ultimi eventi con l'ora.
// Serve a mostrare esattamente dove e quando l'app scatta.
const KEY = 'sl-perf';
let on = false;
let box = null;
let raf = 0;
let timer = 0;
let po = [];
let last = 0;
const hitches = []; // {t, ms}
const shifts = []; // {t, v, n}
const logs = []; // {t, m}
const fps = [];
let longTasks = 0;
let worstLong = 0;
let slowReq = 0;
let touchAt = 0;

export const perfEnabled = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
export const setPerf = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) { /* ignore */ } v ? start() : stop(); };

const two = (n) => String(n).padStart(2, '0');
const clock = (d = new Date()) => `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}.${String(Math.floor(d.getMilliseconds() / 100))}`;
export const perfLog = (m) => {
  if (!on) return;
  logs.push({ t: clock(), m });
  if (logs.length > 40) logs.shift();
};
// durata di un'operazione (es. apertura partita): perfTime('partita pronta', t0)
export const perfTime = (m, t0) => perfLog(`${m} ${Math.round(performance.now() - t0)} ms`);

const route = () => (window.location.hash || '#/').slice(0, 34);
const draw = () => {
  if (!box) return;
  const now = performance.now();
  const recent = (a, ms) => a.filter((x) => now - x.p < ms);
  const h10 = recent(hitches, 10000);
  const s10 = recent(shifts, 10000);
  const f = fps.length ? Math.round(fps.length / ((fps[fps.length - 1] - fps[0]) / 1000 || 1)) : 0;
  const worst = h10.length ? Math.max(...h10.map((x) => x.ms)) : 0;
  const cls = s10.reduce((n, x) => n + x.v, 0);
  const mem = performance.memory ? ` · mem ${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB` : '';
  const lines = [
    `${clock()}  ${route()}`,
    `FPS ${f}  scatti(10s) ${h10.length}  peggiore ${Math.round(worst)}ms`,
    `spostamenti(10s) ${s10.length} (${cls.toFixed(3)})  DOM ${document.getElementsByTagName('*').length}${mem}`,
    `task lunghi ${longTasks} (max ${Math.round(worstLong)}ms)  richieste lente ${slowReq}`,
    '─────────────',
    ...logs.slice(-9).map((x) => `${x.t.slice(3)} ${x.m}`),
  ];
  box.textContent = lines.join('\n');
};
const loop = (t) => {
  if (last) {
    const d = t - last;
    if (d > 24 && d < 4000) { hitches.push({ p: t, ms: d }); if (hitches.length > 200) hitches.shift(); if (d > 40) perfLog(`scatto ${Math.round(d)} ms`); }
  }
  last = t;
  fps.push(t);
  while (fps.length && t - fps[0] > 1000) fps.shift();
  raf = requestAnimationFrame(loop);
};
const onHash = () => perfLog(`pagina ${route()}`);
const onTouch = () => { touchAt = performance.now(); };
const onTouchEnd = () => { const d = performance.now() - touchAt; if (d > 120) perfLog(`gesto ${Math.round(d)} ms`); };

function start() {
  if (on) return;
  on = true;
  last = 0;
  box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:4px;top:calc(env(safe-area-inset-top,0px) + 2px);z-index:99999;padding:4px 7px;border-radius:8px;background:rgba(0,0,0,.72);color:#9f9;font:600 9.5px/1.3 ui-monospace,monospace;pointer-events:none;white-space:pre;max-width:96vw;overflow:hidden';
  document.body.appendChild(box);
  raf = requestAnimationFrame(loop);
  timer = setInterval(draw, 250);
  window.addEventListener('hashchange', onHash);
  window.addEventListener('popstate', onHash);
  document.addEventListener('touchstart', onTouch, { passive: true });
  document.addEventListener('touchend', onTouchEnd, { passive: true });
  const obs = (type, cb) => { try { const o = new PerformanceObserver((l) => l.getEntries().forEach(cb)); o.observe({ type, buffered: false }); po.push(o); } catch (e) { /* non supportato */ } };
  obs('layout-shift', (e) => {
    if (e.hadRecentInput || e.value < 0.0005) return;
    const s = e.sources && e.sources[0];
    const n = s && s.node ? `${s.node.nodeName.toLowerCase()}.${String(s.node.className || '').split(' ')[0]}`.slice(0, 26) : '?';
    shifts.push({ p: performance.now(), v: e.value, n });
    if (shifts.length > 200) shifts.shift();
    if (e.value >= 0.01) perfLog(`SALTO ${e.value.toFixed(3)} ${n}`);
  });
  obs('longtask', (e) => { longTasks += 1; worstLong = Math.max(worstLong, e.duration); if (e.duration > 80) perfLog(`task lungo ${Math.round(e.duration)} ms`); });
  obs('resource', (e) => {
    if (e.duration < 700 || e.initiatorType === 'img') return;
    slowReq += 1;
    perfLog(`rete ${Math.round(e.duration)} ms ${e.name.split('?')[0].split('/').slice(-2).join('/').slice(-26)}`);
  });
  perfLog('diagnosi attiva');
}
function stop() {
  on = false;
  cancelAnimationFrame(raf);
  clearInterval(timer);
  window.removeEventListener('hashchange', onHash);
  window.removeEventListener('popstate', onHash);
  document.removeEventListener('touchstart', onTouch);
  document.removeEventListener('touchend', onTouchEnd);
  po.forEach((o) => o.disconnect());
  po = [];
  if (box) { box.remove(); box = null; }
}
export const initPerf = () => { if (perfEnabled()) start(); };
