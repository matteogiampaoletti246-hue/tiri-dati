// Passaggio fluido tra tema notte e giorno: una tinta del tema scelto copre lo schermo, il tema cambia sotto, poi la tinta sparisce.
const COL = { dark: '#05070D', light: '#F7F9FC' };

export function runThemeFx(toDark, change) {
  const col = toDark ? COL.dark : COL.light;
  const ov = document.createElement('div');
  ov.setAttribute('aria-hidden', 'true');
  ov.style.cssText = `position:fixed;inset:0;z-index:99999;pointer-events:none;background:${col};will-change:opacity`;
  document.body.appendChild(ov);
  const ease = 'cubic-bezier(.4,0,.2,1)';
  let a1;
  let a2;
  const fin = () => ov.remove();
  {
    // dissolvenza: lo schermo vira verso il buio o il chiaro e poi si rivela il nuovo tema
    a1 = ov.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: ease, fill: 'forwards' });
    a1.onfinish = () => { change(); requestAnimationFrame(() => { a2 = ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' }); a2.onfinish = fin; }); };
  }
}
