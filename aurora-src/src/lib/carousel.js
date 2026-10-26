import { flushSync } from 'react-dom';

// Fotografia viva dell'elemento: copia fissa che resta dov'e' mentre sotto cambia la pagina.
function snapshot(el, z = 35) {
  const r = el.getBoundingClientRect();
  const clone = el.cloneNode(true);
  clone.removeAttribute('id');
  clone.style.transition = 'none';
  clone.style.transform = 'none';
  clone.style.opacity = '1';
  // gli elementi "sticky" non seguono piu' lo scorrimento nella copia: li fisso dove sono ora
  const a = el.querySelectorAll('*');
  const b = clone.querySelectorAll('*');
  const base = el.getBoundingClientRect();
  for (let i = 0; i < a.length; i++) {
    const cs = getComputedStyle(a[i]);
    if (cs.position === 'sticky' && b[i]) {
      const rr = a[i].getBoundingClientRect();
      b[i].style.position = 'absolute';
      b[i].style.top = `${rr.top - base.top}px`;
      b[i].style.left = `${rr.left - base.left}px`;
      b[i].style.width = `${rr.width}px`;
    }
  }
  const box = document.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:${z};pointer-events:none;will-change:transform;contain:layout paint`;
  box.appendChild(clone);
  document.body.appendChild(box);
  return { box, rect: r };
}

const EASE = 'cubic-bezier(.22,.8,.24,1)';

// Cambio contenuto a scorrimento: il vecchio esce da un lato mentre il nuovo entra dall'altro, senza schermo vuoto in mezzo.
// dx = spostamento attuale (px) del contenuto trascinato; dir = +1 il nuovo arriva da destra, -1 da sinistra.
export function carousel(el, dx, dir, apply, done, ms = 300) {
  if (!el) { apply(); if (done) done(); return; }
  const w = Math.min(window.innerWidth, 430);
  el.style.transition = 'none';
  el.style.transform = '';
  el.style.opacity = '';
  const snap = snapshot(el);
  snap.box.style.transform = `translate3d(${dx}px,0,0)`;
  flushSync(apply);
  el.style.transform = `translate3d(${dir * w + dx}px,0,0)`;
  void el.offsetWidth;
  requestAnimationFrame(() => {
    const t = `transform ${ms}ms ${EASE}`;
    snap.box.style.transition = t;
    el.style.transition = t;
    snap.box.style.transform = `translate3d(${-dir * w}px,0,0)`;
    el.style.transform = 'translate3d(0,0,0)';
    setTimeout(() => {
      snap.box.remove();
      el.style.transition = '';
      el.style.transform = '';
      el.style.willChange = '';
      if (done) done();
    }, ms + 30);
  });
}

// Ritorno indietro: la pagina corrente scivola via a destra e sotto c'e' gia' quella precedente.
export function pageBack(shell, dx, navigate) {
  if (!shell) { navigate(-1); return; }
  const w = Math.min(window.innerWidth, 430);
  shell.style.transition = 'none';
  shell.style.transform = '';
  shell.style.opacity = '';
  const snap = snapshot(shell, 35);
  snap.box.style.boxShadow = '-18px 0 40px -18px rgba(0,0,0,.5)';
  snap.box.style.transform = `translate3d(${dx}px,0,0)`;
  const start = location.hash;
  navigate(-1);
  const t0 = Date.now();
  const go = () => {
    if (location.hash === start && Date.now() - t0 < 500) { requestAnimationFrame(go); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      snap.box.style.transition = `transform .27s ${EASE}`;
      snap.box.style.transform = `translate3d(${w + 24}px,0,0)`;
      setTimeout(() => snap.box.remove(), 320);
    }));
  };
  go();
}
