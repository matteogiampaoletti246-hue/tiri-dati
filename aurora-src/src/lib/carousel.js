import { flushSync } from 'react-dom';
import { modalOpen } from './modal';

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
const pageEls = () => [document.getElementById('sl-shell'), ...document.querySelectorAll('[data-pf]')].filter((x) => x && !x.closest('[aria-hidden="true"]'));

const solid = () => (getComputedStyle(document.documentElement).getPropertyValue('--sky-2').trim() || '#070b14');
const SNAPS = new Map(); // idx cronologia -> fotografie (shell + parti fisse)
// Copia solo cio' che si vede (schermo +/- mezza schermata): le parti fuori restano scatole vuote della stessa altezza.
// Con tante partite in Home la copia intera pesava (scatto al tocco) e le immagini non ancora decodificate lasciavano frame bianchi.
const cloneVisible = (el, lo, hi) => {
  const c = el.cloneNode(false);
  if (c.nodeType !== 1) return c;
  if (c.tagName === 'IMG') { c.setAttribute('loading', 'eager'); c.setAttribute('decoding', 'sync'); return c; }
  // righe scorrevoli (giorni, pillole): la copia non ricorda lo scorrimento, i figli si spostano di quanto era scorsa (niente "Dom 25" al posto di "Oggi")
  const sx = el.scrollLeft || 0; const sy = el.scrollTop || 0;
  for (const ch of el.childNodes) {
    if (ch.nodeType !== 1) { c.appendChild(ch.cloneNode(false)); continue; }
    const r = ch.getBoundingClientRect();
    if (r.height > 0 && r.width > 0 && (r.bottom < lo || r.top > hi || r.right < -40 || r.left > window.innerWidth + 40)) {
      const sp = ch.cloneNode(false);
      sp.style.cssText += `;box-sizing:border-box;height:${r.height}px;width:${r.width}px;flex-shrink:0;visibility:hidden;overflow:hidden`;
      c.appendChild(sp);
    } else c.appendChild(cloneVisible(ch, lo, hi));
  }
  if (sx || sy) for (const k of c.children) k.style.translate = `${-sx}px ${-sy}px`;
  return c;
};
const grab = () => {
  const els = pageEls();
  if (!els.length) return null;
  const lo = -window.innerHeight * 0.5;
  const hi = window.innerHeight * 1.5;
  return els.map((el) => {
    const r = el.getBoundingClientRect();
    // parti fisse e "sticky": prima di copiare si annotano posizione e ingombro, cosi' la copia non perde lo spazio che occupavano
    // (prima venivano tolte e tutto il contenuto saliva di quanto erano alte: salto di ~110 px al ritorno)
    const marked = [...el.querySelectorAll('[data-pf],.sticky,[style*="sticky"]')];
    marked.forEach((x) => {
      const cs = getComputedStyle(x); const rr = x.getBoundingClientRect();
      x.setAttribute('data-slm', JSON.stringify({ pos: cs.position, t: rr.top - r.top, l: rr.left - r.left, w: rr.width, h: rr.height, mt: cs.marginTop, mb: cs.marginBottom, pf: x.hasAttribute('data-pf') }));
    });
    const clone = cloneVisible(el, lo, hi);
    marked.forEach((x) => x.removeAttribute('data-slm'));
    clone.removeAttribute('id');
    // la copia non e' piu' una "parte fissa": altrimenti pageDrag/pageBack la spostavano insieme alla pagina vera (banner e schede sparivano, sotto restava il nero)
    clone.removeAttribute('data-pf');
    clone.querySelectorAll('[data-pf]').forEach((x) => x.removeAttribute('data-pf'));
    clone.style.transition = 'none'; clone.style.transform = 'none'; clone.style.opacity = '1'; clone.style.boxShadow = 'none';
    if (!el.id) { clone.style.position = 'absolute'; clone.style.inset = 'auto'; clone.style.left = '0'; clone.style.top = '0'; clone.style.width = `${r.width}px`; clone.style.margin = '0'; }
    clone.querySelectorAll('[data-slm]').forEach((c) => {
      if (!c.isConnected) return;
      let m; try { m = JSON.parse(c.getAttribute('data-slm')); } catch (e) { m = null; }
      c.removeAttribute('data-slm');
      if (!m) return;
      const inFlow = m.pos === 'sticky' || m.pos === 'relative' || m.pos === 'static';
      if (m.pf) {
        // le parti fisse si fotografano a parte: qui resta solo lo spazio (se occupavano posto nel flusso)
        if (el.id) { if (inFlow) { c.replaceChildren(); c.style.cssText += `;visibility:hidden;height:${m.h}px`; } else c.remove(); }
        return;
      }
      if (m.pos === 'sticky') {
        const sp = document.createElement('div');
        sp.style.cssText = `height:${m.h}px;margin-top:${m.mt};margin-bottom:${m.mb};visibility:hidden`;
        c.parentNode.insertBefore(sp, c);
        c.style.position = 'absolute'; c.style.top = `${m.t}px`; c.style.left = `${m.l}px`; c.style.width = `${m.w}px`; c.style.margin = '0';
      }
    });
    const box = document.createElement('div');
    if (el.id) {
      // la pagina intera e' alta anche migliaia di pixel: la fotografia occupa solo lo schermo (clip) e il contenuto e' spostato dello scroll di ora.
      // Cosi' il livello da disegnare e' piccolo (su iPhone un livello enorme restava nero per qualche decimo di secondo).
      box.style.cssText = `position:fixed;left:${r.left}px;top:0;width:${r.width}px;height:${window.innerHeight}px;overflow:hidden;z-index:1;pointer-events:none;contain:layout paint`;
      const inner = document.createElement('div');
      inner.style.cssText = `position:absolute;left:0;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
      inner.appendChild(clone);
      box.appendChild(inner);
    } else {
      box.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:3;pointer-events:none;contain:layout paint`;
      box.appendChild(clone);
    }
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
    try { if (window.__slSaveScroll) window.__slSaveScroll(); } catch (e) { /* ignore */ }
    try {
      const idx = histIdx();
      const g = grab();
      // solo le ultime 5 fotografie (e nessuna della cronologia 'avanti', ormai irraggiungibile): la memoria resta piccola anche dopo 40+ pagine
      if (g) { SNAPS.set(idx, g); [...SNAPS.keys()].filter((k) => k < idx - 5 || k > idx).forEach((k) => SNAPS.delete(k)); }
    } catch (e) { /* senza fotografia: si torna indietro come prima */ }
    const r = ps(...a);
    warmLater();
    return r;
  };
  window.addEventListener('popstate', () => { warmOff(); warmLater(); });
  installEdgeGuard();
  warmLater();
}

// Su iPhone il bordo sinistro avvia anche lo "indietro" del sistema: la sua fotografia (spesso nera, o la Home in doppia copia)
// si sovrapponeva al nostro scorrimento. Un tocco che parte dal bordo resta all'app (preventDefault): lo swipe lo gestiscono
// SwipeTabs/useSwipeBack con pageDrag/pageBack. I tasti sul bordo (freccia indietro) ricevono comunque il tocco.
const EDGE = 26;
// zona da cui parte il nostro swipe indietro: un po' piu' larga del blocco di iOS, cosi' parte sempre vicino al bordo
// senza dover essere precisissimi (SwipeTabs e useSwipeBack usano la stessa misura)
// dentro l'app nativa (WebView) lo swipe indietro parte da una zona piu' larga e basta un gesto meno marcato
export const isNative = () => typeof window !== 'undefined' && !!window.ReactNativeWebView;
// prima pagina aperta dalla Home nativa: dietro c'e' la Home (livello nativo), quindi non si muove la pagina web ma tutta la WebView (messaggi drag:<px>)
const nativeRoot = () => isNative() && window.__slDepth === 0;
const toNative = (t) => { try { window.ReactNativeWebView.postMessage(t); } catch (e) { /* ignora */ } };
// lo swipe indietro non parte dentro cio' che scorre o si trascina di lato per conto suo (pillole, striscia dei giorni, tabellone, mappe, campi di testo)
export const inHScroll = (el) => {
  for (let n = el; n && n.nodeType === 1 && n !== document.body; n = n.parentElement) {
    if (n.matches('input, select, textarea, [data-no-swipe], [data-no-back], [role="slider"]')) return true;
    if (n.scrollWidth > n.clientWidth + 1) { const o = getComputedStyle(n).overflowX; if (o === 'auto' || o === 'scroll') return true; }
  }
  return false;
};
// fuori dalla zona del bordo si chiede un gesto chiaramente orizzontale (lo scorrimento verticale non si perde mai)
export const backFarOk = (dx, dy) => dx > 10 && dx > Math.abs(dy) * 1.2;
export const BACK_ZONE = isNative() ? 64 : 48;
export const backDone = (dx, w, v) => (isNative() ? dx > w * 0.33 || (v > 0.5 && dx > w * 0.15) : dx > w * 0.5 || (v > 0.9 && dx > w * 0.25));
// partendo dal bordo basta un movimento piu' orizzontale che verticale (angolo largo): lo swipe indietro non si perde
export const backAngleOk = (dx, dy) => dx > 8 && dx > Math.abs(dy) * 0.75;
function installEdgeGuard() {
  if (isNative()) return; // WKWebView non ha lo "indietro" di iOS dal bordo: il bordo resta libero per il nostro swipe
  let tap = null;
  document.addEventListener('touchstart', (e) => {
    tap = null;
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    if (t.clientX > EDGE) return;
    const el = e.target;
    if (el && el.closest && el.closest('input, textarea, select, [contenteditable]')) return;
    if (e.cancelable) e.preventDefault();
    const btn = el && el.closest && el.closest('button, a, [role="button"], [role="link"], label');
    if (btn) tap = { btn, x: t.clientX, y: t.clientY, t: Date.now() };
  }, { passive: false, capture: true });
  // il preventDefault toglie il "click": per un tocco breve e fermo su un tasto lo si ricrea
  document.addEventListener('touchend', (e) => {
    const d = tap; tap = null;
    if (!d || !e.changedTouches[0]) return;
    const t = e.changedTouches[0];
    if (Math.abs(t.clientX - d.x) < 10 && Math.abs(t.clientY - d.y) < 10 && Date.now() - d.t < 600 && d.btn.isConnected) d.btn.click();
  }, { passive: true, capture: true });
}
let BEHIND = null;
let WARM = null; // fotografia di destinazione gia' montata (quasi invisibile) cosi' le immagini sono decodificate prima dello swipe
const buildHost = (g) => {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;will-change:transform;background:' + solid();
  g.forEach((b) => host.appendChild(b.cloneNode(true)));
  const dim = document.createElement('div');
  dim.style.cssText = 'position:absolute;inset:0;background:#000;opacity:.35;z-index:50';
  host.appendChild(dim);
  return { host, dim };
};
const warmOff = () => { if (WARM) { WARM.host.remove(); WARM = null; } };
// Dopo ogni cambio pagina, a riposo, si prepara la fotografia della pagina precedente (dietro quella attuale, a opacita' minima).
let warmTimer = 0;
const warmLater = () => {
  clearTimeout(warmTimer);
  warmTimer = setTimeout(() => {
    try {
      if (BEHIND) { warmLater(); return; }
      const idx = histIdx() - 1;
      if (WARM && WARM.idx === idx) return;
      warmOff();
      const g = SNAPS.get(idx);
      if (!g) return;
      const w = buildHost(g);
      w.host.style.opacity = '0.01'; w.host.style.zIndex = '-1';
      document.body.appendChild(w.host);
      WARM = { ...w, idx };
    } catch (e) { /* ignore */ }
  }, 220);
};
const behindOn = () => {
  if (BEHIND) return BEHIND;
  const idx = histIdx() - 1;
  let w = null;
  if (WARM && WARM.idx === idx) { w = WARM; WARM = null; w.host.style.opacity = ''; w.host.style.zIndex = '1'; }
  else {
    warmOff();
    const g = SNAPS.get(idx);
    // senza fotografia (pagina aperta da un collegamento, memoria liberata): una superficie dello stesso colore dell'app, mai il nero
    w = buildHost(g || []);
    document.body.appendChild(w.host);
  }
  BEHIND = { host: w.host, dim: w.dim };
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
// La fotografia della pagina di destinazione resta finche' la pagina vera non e' disegnata (pagine pesanti come la Home impiegano piu' tempo):
// si toglie con una breve dissolvenza dopo alcuni fotogrammi stabili, al massimo dopo 3 s. Mai un vuoto nero tra le due.
function waitDestination(fromShell, fromIdx) {
  const t0 = performance.now();
  let stable = 0;
  const fade = () => {
    const b = BEHIND;
    if (!b) return;
    b.host.style.transition = 'opacity .16s ease';
    b.host.style.opacity = '0';
    setTimeout(behindOff, 180);
  };
  const f = () => {
    if (!BEHIND) return;
    const sh = document.getElementById('sl-shell');
    // la pagina che usciva e' gia' quella di destinazione (React non l'ha sostituita): rientra al suo posto, la fotografia si toglie
    if (histIdx() !== fromIdx && sh && sh === fromShell && isDestination(sh)) { pageReset(false); return; }
    const ok = histIdx() !== fromIdx && sh && sh !== fromShell && sh.isConnected && sh.getBoundingClientRect().height > window.innerHeight * 0.5;
    stable = ok ? stable + 1 : 0;
    if (stable >= 3 || performance.now() - t0 > 3000) { fade(); return; }
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}
const behindOff = () => {
  if (!BEHIND) return;
  BEHIND.host.remove(); BEHIND = null;
  const sh = document.getElementById('sl-shell');
  if (sh) { sh.style.zIndex = ''; sh.style.background = ''; }
};
export function pageDrag(dx) {
  if (modalOpen()) return; // finestra aperta (giocatore, fogli): la pagina sotto e la sua fotografia restano ferme
  if (nativeRoot()) { toNative(`drag:${Math.round(Math.max(0, dx))}`); return; }
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
  if (nativeRoot()) { toNative('drag:-1'); return; }
  const els = pageEls();
  behindMove(0, 430, animated ? 420 : 0);
  els.forEach((el, i) => {
    el.style.transition = animated ? 'transform .42s cubic-bezier(.22,.8,.24,1), opacity .42s ease' : 'none';
    el.style.transform = 'translate3d(0,0,0)';
    if (i === 0) el.style.opacity = '1';
  });
  setTimeout(() => { behindOff(); els.forEach((el) => { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; el.style.willChange = ''; el.style.boxShadow = ''; el.style.visibility = ''; }); }, animated ? 470 : 0);
}
// la pagina mostrata appartiene alla voce di cronologia attuale (data-lk = chiave di react-router, PageShell)
const isDestination = (sh) => { const st = window.history.state; return !!(sh && st && st.key && sh.dataset && sh.dataset.lk === st.key); };
export const histIdx = () => { const st = window.history.state; return st && typeof st.idx === 'number' ? st.idx : 0; };
// nell'app nativa la prima pagina aperta dalla Home torna alla Home (la WebView scorre via seguendo il dito)
export const canGoBack = () => nativeRoot() || histIdx() > 0;

// Indietro "sicuro": una sola volta per pagina (anche se arrivano piu' richieste: tasto, swipe, timer),
// mai oltre la prima schermata dell'app (in quel caso si va alla Home).
export const BACK = { t: 0 }; // ultimo "indietro" voluto dall'app (per riconoscere quello del sistema)
let LAST = { idx: -1, t: 0 };
export function goBack(navigate, fromIdx) {
  // nell'app nativa, dalla prima pagina aperta dalla Home si torna alla Home (lo fa l'app)
  if (isNative() && window.__slDepth === 0) { try { window.ReactNativeWebView.postMessage('home'); } catch (e) { /* ignora */ } return true; }
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
  if (nativeRoot()) { goBack(navigate); return; } // la Home nativa chiude la WebView partendo da dove l'ha lasciata il dito
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
    setTimeout(() => { if (hasBehind) QUIET = true; goBack(navigate, fromIdx); if (hasBehind) waitDestination(els[0], fromIdx); }, hasBehind ? ms + 20 : Math.round(ms * 0.62));
    // rete di sicurezza: se per qualunque motivo la pagina non cambia, si ripristina tutto (mai schermo nero).
    // Se la cronologia e' gia' tornata indietro la pagina nuova sta solo arrivando (la Home pesante puo' metterci piu' di un secondo):
    // la vecchia resta fuori a destra, altrimenti tornava per un attimo al centro sopra la Home (glitch del video 23).
    const safety = (k) => {
      const sh = document.getElementById('sl-shell');
      if (!sh || sh !== els[0] || !sh.isConnected) return;
      // pagina rimasta = proprio quella di destinazione (navigazioni rapidissime: la nuova non era ancora disegnata): rientra subito
      if (histIdx() === fromIdx || isDestination(sh) || k >= 12) { pageReset(false); return; }
      setTimeout(() => safety(k + 1), 300);
    };
    setTimeout(() => safety(0), ms + 900);
  });
}
