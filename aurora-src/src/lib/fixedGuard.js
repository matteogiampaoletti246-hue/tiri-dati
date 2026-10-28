// Su iPhone, quando la pagina diventa piu' lunga mentre si scorre (righe che si aggiungono, "Mostra tutti", scorrimento veloce),
// Safari a volte sfasa il livello degli elementi fissi: la barra in basso resta a meta' schermo.
// Qui si controlla quando lo scorrimento si ferma e, se serve, si riallinea con un micro-scroll invisibile di 1 px.
export function installFixedGuard() {
  if (typeof window === 'undefined' || window.__slGuard) return undefined;
  window.__slGuard = true;
  const vv = window.visualViewport;
  const root = document.documentElement;
  let touching = false;
  let timer = 0;
  let lastScroll = 0;
  let lastH = root.scrollHeight;

  const typing = () => {
    const a = document.activeElement;
    return !!a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  };
  const desynced = () => {
    if (!vv || typing()) return false;
    return Math.abs(vv.offsetTop) > 1.5 || window.innerHeight - vv.height > 2;
  };
  const nudge = () => {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    const d = y + 1 <= max ? 1 : -1;
    window.scrollTo(0, y + d);
    requestAnimationFrame(() => window.scrollTo(0, y));
  };
  const settle = () => {
    timer = 0;
    if (touching || document.hidden) return;
    const h = root.scrollHeight;
    const grew = Math.abs(h - lastH) > 30;
    const recent = Date.now() - lastScroll < 2500;
    lastH = h;
    if (desynced() || (grew && recent)) nudge();
  };
  const arm = (ms = 160) => {
    clearTimeout(timer);
    timer = setTimeout(settle, ms);
  };

  window.addEventListener('scroll', () => { lastScroll = Date.now(); arm(); }, { passive: true });
  window.addEventListener('touchstart', () => { touching = true; }, { passive: true });
  const end = () => { touching = false; arm(220); };
  window.addEventListener('touchend', end, { passive: true });
  window.addEventListener('touchcancel', end, { passive: true });
  if (vv) { vv.addEventListener('resize', () => arm(200)); vv.addEventListener('scroll', () => arm(200)); }
  if ('ResizeObserver' in window) new ResizeObserver(() => arm(260)).observe(document.body);
  window.addEventListener('pageshow', () => arm(300));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) arm(300); });
  return undefined;
}
