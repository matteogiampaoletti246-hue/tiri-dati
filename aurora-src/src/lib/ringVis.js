// Bordi animati (index.css, "Bordo animato su TUTTI i riquadri"): girano solo per i riquadri visibili.
// Un solo IntersectionObserver per tutta l'app; un MutationObserver (a gruppi, un frame) osserva i riquadri che nascono e smette per quelli che spariscono.
const SEL = '.panel,.panel-solid,.panel-flat,.glass,.glass-strong,.glass-flat,.glass-pill,.glass-btn,.empty-day,.stat-card,.tint-card,.halo-card,.halo-trigger,.halo-menu';

export function startRingVis() {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return;
  const root = document.documentElement;
  if (root.classList.contains('ring-io')) return;
  const io = new IntersectionObserver((list) => {
    for (const e of list) {
      if (e.isIntersecting) e.target.setAttribute('data-rv', '');
      else e.target.removeAttribute('data-rv');
    }
  }, { rootMargin: '120px 0px' });
  const add = (n) => {
    if (n.nodeType !== 1) return;
    if (n.matches(SEL)) io.observe(n);
    n.querySelectorAll(SEL).forEach((x) => io.observe(x));
  };
  const del = (n) => {
    if (n.nodeType !== 1) return;
    if (n.matches(SEL)) io.unobserve(n);
    n.querySelectorAll(SEL).forEach((x) => io.unobserve(x));
  };
  let adds = [];
  let dels = [];
  let raf = 0;
  const flush = () => {
    raf = 0;
    const a = adds; const d = dels;
    adds = []; dels = [];
    for (const n of d) if (!n.isConnected) del(n);
    for (const n of a) if (n.isConnected) add(n);
  };
  new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach((n) => adds.push(n));
      m.removedNodes.forEach((n) => dels.push(n));
    }
    if (!raf) raf = requestAnimationFrame(flush);
  }).observe(document.body, { childList: true, subtree: true });
  add(document.body);
  root.classList.add('ring-io');
}
