// Passaggio fluido tra tema notte e giorno: una tinta del tema scelto copre lo schermo, il tema cambia sotto, poi la tinta sparisce.
export const FX = { mode: 'a' };
const COL = { dark: '#05070D', light: '#F7F9FC' };

export function runThemeFx(toDark, change, origin) {
  const col = toDark ? COL.dark : COL.light;
  const ov = document.createElement('div');
  ov.setAttribute('aria-hidden', 'true');
  const W = window.innerWidth;
  const H = window.innerHeight;
  const ox = origin ? origin.x : W - 40;
  const oy = origin ? origin.y : 60;
  const R = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)) + 20;
  ov.style.cssText = `position:fixed;inset:0;z-index:99999;pointer-events:none;background:${col};will-change:opacity,clip-path`;
  document.body.appendChild(ov);
  const ease = 'cubic-bezier(.4,0,.2,1)';
  let a1;
  let a2;
  const fin = () => ov.remove();
  if (FX.mode === 'b') {
    // cerchio che si allarga dal punto toccato
    a1 = ov.animate([{ clipPath: `circle(0px at ${ox}px ${oy}px)` }, { clipPath: `circle(${R}px at ${ox}px ${oy}px)` }], { duration: 480, easing: ease, fill: 'forwards' });
    a1.onfinish = () => { change(); requestAnimationFrame(() => { a2 = ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' }); a2.onfinish = fin; }); };
  } else if (FX.mode === 'c') {
    // tenda che scende dall'alto, poi si dissolve verso il basso
    a1 = ov.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 380, easing: ease, fill: 'forwards' });
    a1.onfinish = () => { change(); requestAnimationFrame(() => { a2 = ov.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(100% 0 0 0)' }], { duration: 380, easing: ease, fill: 'forwards' }); a2.onfinish = fin; }); };
  } else {
    // dissolvenza: lo schermo vira verso il buio o il chiaro e poi si rivela il nuovo tema
    a1 = ov.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: ease, fill: 'forwards' });
    a1.onfinish = () => { change(); requestAnimationFrame(() => { a2 = ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' }); a2.onfinish = fin; }); };
  }
}
