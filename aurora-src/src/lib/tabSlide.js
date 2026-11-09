import { grabPage, pageEls } from './carousel';

// Cambio scheda dal dock (regola fissa, concept scelto dall'utente il 9/11/2026): la pagina scorre di lato secondo l'ordine del dock
// (Home, Calcolatore, Giocatori, Matchup). Prima di cambiare rotta si fotografa la pagina attuale (grabPage); la pagina nuova,
// appena montata, entra dal lato della voce toccata mentre la fotografia esce dall'altro. La riga del titolo ([data-tabtitle])
// resta ferma: si sposta al contrario della pagina e cambia solo la scritta (RotateTitle).
export const TAB_ORDER = ['/', '/calcolatore', '/migliori-giocatori', '/migliori-matchup'];
const MS = 420;
const EASE = 'cubic-bezier(.22,1,.36,1)';
const reduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pathOf = (p) => String(p || '').replace(/^#/, '').split('?')[0] || '/';
const idxOf = (p) => TAB_ORDER.indexOf(pathOf(p));

let PEND = null; // { dir, boxes, t, title }
let PREV_TITLE = '';
let safety = 0;

const drop = (p) => { if (p && p.boxes) p.boxes.forEach((b) => b.remove()); };

export function prepTab(to) {
  try {
    const from = pathOf(window.location.hash);
    const fi = idxOf(from);
    const ti = idxOf(to);
    if (fi < 1 || ti < 1 || fi === ti || reduced()) return;
    const boxes = grabPage();
    if (!boxes || !boxes.length) return;
    // nella fotografia la riga del titolo non c'e': quella vera resta ferma sopra le due pagine
    boxes.forEach((b) => { b.style.zIndex = '1'; b.querySelectorAll('[data-tabtitle]').forEach((x) => { x.style.visibility = 'hidden'; }); document.body.appendChild(b); });
    drop(PEND);
    PEND = { dir: ti > fi ? 1 : -1, boxes, t: Date.now(), title: PREV_TITLE };
    clearTimeout(safety);
    // rete di sicurezza: se la pagina nuova non arriva, la fotografia non resta mai sopra
    safety = setTimeout(() => { if (PEND && Date.now() - PEND.t > 1400) { drop(PEND); PEND = null; } }, 1500);
  } catch (e) { /* senza fotografia si cambia pagina come prima */ }
}
if (typeof window !== 'undefined') window.__slTabPrep = prepTab; // l'app nativa lo chiama prima di cambiare scheda

// RotateTitle: da quale titolo parte la scritta. Stringa = titolo della scheda lasciata (cambio col dock); '' = lettere che entrano
// dal basso (pagina aperta da zero); null = nessuna animazione (ritorno indietro).
export const titleFrom = (pop) => {
  if (PEND && Date.now() - PEND.t < 1400) return PEND.title || '';
  return isFresh(pop) ? '' : null;
};

// Percorso precedente: nell'app nativa ogni cambio di rotta arriva da location.hash e il router lo vede come "POP" anche quando si apre
// una scheda dalla Home. Si anima (titolo e banner) se si arriva dalla Home/pagina di partenza o da un'altra scheda del dock;
// tornando indietro da una partita, un giocatore o una squadra niente animazione.
let CUR_PATH = typeof window !== 'undefined' ? pathOf(window.location.hash) : '';
let PREV_PATH = '';
if (typeof window !== 'undefined') {
  const moved = () => { const c = pathOf(window.location.hash); if (c !== CUR_PATH) { PREV_PATH = CUR_PATH; CUR_PATH = c; } };
  window.addEventListener('hashchange', moved);
  window.addEventListener('popstate', moved);
  // i collegamenti del sito cambiano rotta con pushState (nessun evento): si annota anche quello
  ['pushState', 'replaceState'].forEach((k) => {
    const orig = window.history[k];
    window.history[k] = function patched(...a) { const r = orig.apply(this, a); moved(); return r; };
  });
}
const BASES = new Set(['/', '/linee-guida', ...TAB_ORDER]);
export const isFresh = (pop) => !pop || (!!PEND && Date.now() - PEND.t < 1400) || BASES.has(PREV_PATH);
export const setPrevTitle = (t) => { PREV_TITLE = t || ''; };

export const pendingSlide = () => !!PEND && Date.now() - PEND.t < 1400;

// chiamata da PageShell appena la pagina e' montata: true se e' entrata scorrendo (niente dissolvenza shell-in)
export function slideIn() {
  const p = PEND;
  PEND = null;
  if (!p) return false;
  if (Date.now() - p.t > 1400) { drop(p); return false; }
  const els = pageEls();
  const shell = document.getElementById('sl-shell');
  if (!shell) { drop(p); return false; }
  const w = Math.min(window.innerWidth, shell.offsetWidth || window.innerWidth);
  const opt = { duration: MS, easing: EASE };
  const from = `translate3d(${p.dir * w}px,0,0)`;
  els.forEach((el) => { el.style.zIndex = el.style.zIndex || '2'; el.animate([{ transform: from }, { transform: 'translate3d(0,0,0)' }], opt); });
  if (!shell.style.position) shell.style.position = 'relative';
  shell.querySelectorAll('[data-tabtitle]').forEach((t) => t.animate([{ transform: `translate3d(${-p.dir * w}px,0,0)` }, { transform: 'translate3d(0,0,0)' }], opt));
  const outs = p.boxes.map((b) => b.animate([{ transform: 'translate3d(0,0,0)' }, { transform: `translate3d(${-p.dir * w}px,0,0)` }], { ...opt, fill: 'forwards' }));
  let done = false;
  const end = () => { if (done) return; done = true; drop(p); els.forEach((el) => { if (el.style.zIndex === '2') el.style.zIndex = ''; }); };
  Promise.all(outs.map((a) => a.finished)).then(end, end);
  setTimeout(end, MS + 200);
  return true;
}
