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

// Pagina intera: il contenuto (#sl-shell) e le parti fisse (banner e barra schede, marcate data-pf) si muovono insieme.
// Regola fissa: negli swipe per tornare indietro la pagina di destinazione si vede sotto e, mentre quella attuale esce a destra,
// scorre al centro e ne prende il posto (fotografia della pagina presa prima di lasciarla: installBackSnaps).
const pageEls = () => [document.getElementById('sl-shell'), ...document.querySelectorAll('[data-pf]')].filter(Boolean);

const solid = () => (getComputedStyle(document.documentElement).getPropertyValue('--sky-2').trim() || '#070b14');
const SNAPS = new Map(); // idx cronologia -> fotografie (shell + parti fisse)
// Copia solo cio' che si vede (schermo +/- mezza schermata): le parti fuori restano scatole vuote della stessa altezza.
// Con tante partite in Home la copia intera pesava (scatto al tocco) e le immagini non ancora decodificate lasciavano frame bianchi.
const cloneVisible = (el, lo, hi) => {
  const c = el.cloneNode(false);
  if (c.nodeType !== 1) return c;
  if (c.tagName === 'IMG') { c.setAttribute('loading', 'eager'); c.setAttribute('decoding', 'sync'); return c; }
  for (const ch of el.childNodes) {
    if (ch.nodeType !== 1) { c.appendChild(ch.cloneNode(false)); continue; }
    const r = ch.getBoundingClientRect();
    if (r.height > 0 && r.width > 0 && (r.bottom < lo || r.top > hi || r.right < -40 || r.left > window.innerWidth + 40)) {
      const sp = ch.cloneNode(false);
      sp.style.cssText += `;box-sizing:border-box;height:${r.height}px;visibility:hidden;overflow:hidden`;
      c.appendChild(sp);
    } else c.appendChild(cloneVisible(ch, lo, hi));
  }
  return c;
};
const grab = () => {
  const els = pageEls();
  if (!els.length) return null;
  const lo = -window.innerHeight * 0.5;
  const hi = window.innerHeight * 1.5;
  return els.map((el) => {
    const r = el.getBoundingClientRect();
    const clone = cloneVisible(el, lo, hi);
    clone.removeAttribute('id');
    clone.style.transition = 'none'; clone.style.transform = 'none'; clone.style.opacity = '1'; clone.style.boxShadow = 'none';
    if (el.id) clone.querySelectorAll('[data-pf]').forEach((x) => x.remove()); // le parti fisse si fotografano a parte
    else { clone.style.position = 'absolute'; clone.style.inset = 'auto'; clone.style.left = '0'; clone.style.top = '0'; clone.style.width = `${r.width}px`; clone.style.margin = '0'; }
    // gli elementi "sticky" non seguono piu' lo scorrimento nella copia: li fisso dove sono ora
    const a = el.querySelectorAll('.sticky,[style*="sticky"]');
    a.forEach((x) => {
      const path = []; let n = x;
      while (n && n !== el) { const p = n.parentElement; path.unshift(Array.prototype.indexOf.call(p.children, n)); n = p; }
      let c = clone; for (const i of path) c = c && c.children[i];
      if (c) { const rr = x.getBoundingClientRect(); c.style.position = 'absolute'; c.style.top = `${rr.top - r.top}px`; c.style.left = `${rr.left - r.left}px`; c.style.width = `${rr.width}px`; }
    });
    const box = document.createElement('div');
    box.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:${el.id ? 1 : 3};pointer-events:none;contain:layout paint`;
    box.appendChild(clone);
    return box;
  });
};
let QUIET = false;
export const consumeQuiet = () => { const q = QUIET; QUIET = false; return q; };
export function installBackSnaps() {
  if (window.__slSnaps) return;
  window.__slSnaps = true;
  window.__slCarousel = { pageDrag, pageBack: (dx) => pageBack(dx, (n) => { if (typeof n === 'number') window.history.go(n); }), pageReset }; // anche per le prove automatiche
  const ps = window.history.pushState.bind(window.history);
  window.history.pushState = function pushState(...a) {
    try {
      const idx = histIdx();
      const g = grab();
      if (g) { SNAPS.set(idx, g); [...SNAPS.keys()].filter((k) => k < idx - 8).forEach((k) => SNAPS.delete(k)); }
    } catch (e) { /* senza fotografia: si torna indietro come prima */ }
    return ps(...a);
  };
}
let BEHIND = null;
const behindOn = () => {
  if (BEHIND) return BEHIND;
  const g = SNAPS.get(histIdx() - 1);
  if (!g) return null;
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;will-change:transform;background:' + solid();
  g.forEach((b) => host.appendChild(b.cloneNode(true)));
  const dim = document.createElement('div');
  dim.style.cssText = 'position:absolute;inset:0;background:#000;opacity:.35;z-index:50';
  host.appendChild(dim);
  document.body.appendChild(host);
  BEHIND = { host, dim };
  const sh = document.getElementById('sl-shell');
  if (sh) { sh.style.zIndex = '2'; sh.style.background = solid(); }
  return BEHIND;
};
const behindMove = (dx, w, ms = 0) => {
  const b = BEHIND; if (!b) return;
  const p = Math.max(0, Math.min(1, dx / w));
  b.host.style.transition = ms ? `transform ${ms}ms ${EASE}` : 'none';
  b.host.style.transform = `translate3d(${(-26 * (1 - p)).toFixed(2)}%,0,0)`;
  b.dim.style.transition = ms ? `opacity ${ms}ms ease` : 'none';
  b.dim.style.opacity = String(0.35 * (1 - p));
};
const behindOff = () => {
  if (!BEHIND) return;
  BEHIND.host.remove(); BEHIND = null;
  const sh = document.getElementById('sl-shell');
  if (sh) { sh.style.zIndex = ''; sh.style.background = ''; }
};
export function pageDrag(dx) {
  const w = Math.min(window.innerWidth, 430);
  behindOn();
  behindMove(Math.max(0, dx), w);
  pageEls().forEach((el, i) => {
    el.style.transition = 'none';
    el.style.transform = `translate3d(${Math.max(0, dx)}px,0,0)`;
    if (i === 0) el.style.boxShadow = '-18px 0 40px -18px rgba(0,0,0,.5)';
  });
}
export function pageReset(animated = true) {
  const els = pageEls();
  behindMove(0, 430, animated ? 280 : 0);
  els.forEach((el, i) => {
    el.style.transition = animated ? 'transform .28s cubic-bezier(.22,.8,.24,1), opacity .28s ease' : 'none';
    el.style.transform = 'translate3d(0,0,0)';
    if (i === 0) el.style.opacity = '1';
  });
  setTimeout(() => { behindOff(); els.forEach((el) => { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; el.style.willChange = ''; el.style.boxShadow = ''; el.style.visibility = ''; }); }, animated ? 320 : 0);
}
export const histIdx = () => { const st = window.history.state; return st && typeof st.idx === 'number' ? st.idx : 0; };
export const canGoBack = () => histIdx() > 0;

// Indietro "sicuro": una sola volta per pagina (anche se arrivano piu' richieste: tasto, swipe, timer),
// mai oltre la prima schermata dell'app (in quel caso si va alla Home).
export const BACK = { t: 0 }; // ultimo "indietro" voluto dall'app (per riconoscere quello del sistema)
let LAST = { idx: -1, t: 0 };
export function goBack(navigate, fromIdx) {
  const idx = histIdx();
  if (fromIdx !== undefined && fromIdx !== idx) return false; // nel frattempo la pagina e' gia' cambiata
  if (idx <= 0) { navigate('/', { replace: true }); return true; }
  const now = Date.now();
  if (LAST.idx === idx && now - LAST.t < 1200) return false;
  LAST = { idx, t: now };
  BACK.t = now;
  navigate(-1);
  return true;
}

// Ritorno indietro: la pagina vera (con banner e schede) prosegue dal punto del dito fino a uscire a destra;
// solo verso la fine si cambia pagina, cosi' non c'e' mai una pagina doppia o un salto. Se non c'e' dove tornare, rientra.
export function pageBack(dx, navigate) {
  const els = pageEls();
  if (!els.length || !canGoBack()) { pageReset(true); return; }
  const fromIdx = histIdx();
  const w = Math.min(window.innerWidth, els[0].offsetWidth || 430);
  const ms = Math.max(160, Math.round(260 * (1 - dx / (w + 24)) + 110));
  const hasBehind = !!behindOn();
  els.forEach((el) => { el.style.willChange = 'transform'; el.style.transition = 'none'; el.style.transform = `translate3d(${dx}px,0,0)`; });
  if (hasBehind) behindMove(dx, w);
  els[0].style.boxShadow = '-18px 0 40px -18px rgba(0,0,0,.5)';
  void els[0].offsetWidth;
  requestAnimationFrame(() => {
    els.forEach((el) => {
      el.style.transition = `transform ${ms}ms ${EASE}`;
      el.style.transform = `translate3d(${w + 24}px,0,0)`;
    });
    if (hasBehind) behindMove(w, w, ms);
    // la pagina vera di destinazione prende il posto quando e' arrivata la fotografia al centro
    setTimeout(() => { if (hasBehind) QUIET = true; goBack(navigate, fromIdx); }, hasBehind ? ms + 20 : Math.round(ms * 0.62));
    setTimeout(behindOff, ms + 260);
    // rete di sicurezza: se per qualunque motivo la pagina non cambia, si ripristina tutto (mai schermo nero)
    setTimeout(() => { const sh = document.getElementById('sl-shell'); if (sh && sh === els[0] && sh.isConnected) pageReset(false); }, ms + 900);
  });
}
