import { flushSync } from 'react-dom';

// Fotografia viva dell'elemento: copia fissa che resta dov'e' mentre sotto cambia la pagina.
function snapshot(el, z = 35, host = null) {
  const r = el.getBoundingClientRect();
  const hr = host ? host.getBoundingClientRect() : { left: 0, top: 0 };
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
  box.style.cssText = `position:${host ? 'absolute' : 'fixed'};left:${r.left - hr.left}px;top:${r.top - hr.top}px;width:${r.width}px;height:${r.height}px;z-index:${z};pointer-events:none;will-change:transform;contain:layout paint`;
  box.appendChild(clone);
  (host || document.body).appendChild(box);
  return { box, rect: r };
}

const EASE = 'cubic-bezier(.22,.8,.24,1)';

// Cambio contenuto a scorrimento: il vecchio esce da un lato mentre il nuovo entra dall'altro, senza schermo vuoto in mezzo.
// dx = spostamento attuale (px) del contenuto trascinato; dir = +1 il nuovo arriva da destra, -1 da sinistra.
let ACTIVE = null;
// termina subito l'animazione in corso (serve per poter scorrere di nuovo senza aspettare)
export function finishCarousel() {
  if (ACTIVE) { const f = ACTIVE; ACTIVE = null; f(); }
}

export function carousel(el, dx, dir, apply, done, ms = 240, host = null) {
  finishCarousel();
  if (!el) { apply(); if (done) done(); return; }
  const w = Math.min(window.innerWidth, (typeof el !== "undefined" && el.offsetWidth) || 430);
  el.style.transition = 'none';
  el.style.transform = '';
  el.style.opacity = '';
  const snap = snapshot(el, host ? 5 : 35, host);
  let tm = 0;
  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    clearTimeout(tm);
    if (ACTIVE === end) ACTIVE = null;
    snap.box.remove();
    el.style.transition = '';
    el.style.transform = '';
    el.style.willChange = '';
    if (done) done();
  };
  ACTIVE = end;
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
    tm = setTimeout(end, ms + 30);
  });
}

// Ritorno indietro: la pagina corrente (quella vera, senza copie) prosegue dal punto del dito fino a uscire a destra;
// solo a fine corsa si cambia pagina, cosi' non c'e' mai una pagina doppia o un salto.
export function pageBack(shell, dx, navigate) {
  if (!shell) { navigate(-1); return; }
  const w = Math.min(window.innerWidth, shell.offsetWidth || 430);
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    shell.style.visibility = 'hidden';
    navigate(-1);
  };
  shell.style.willChange = 'transform';
  shell.style.boxShadow = '-18px 0 40px -18px rgba(0,0,0,.5)';
  shell.style.transition = 'none';
  shell.style.transform = `translate3d(${dx}px,0,0)`;
  void shell.offsetWidth;
  const ms = Math.max(120, Math.round(230 * (1 - dx / (w + 24)) + 90));
  requestAnimationFrame(() => {
    shell.style.transition = `transform ${ms}ms ${EASE}, opacity ${ms}ms ease`;
    shell.style.transform = `translate3d(${w + 24}px,0,0)`;
    shell.style.opacity = '0.6';
    setTimeout(go, Math.round(ms * 0.62));
  });
}
