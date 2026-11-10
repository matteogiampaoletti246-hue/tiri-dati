// Fondale in movimento (fasci di luce di .aurora-bg): mentre si tocca lo schermo o la pagina scorre il movimento si ferma e,
// poco dopo l'ultimo tocco/scorrimento, riprende dal punto in cui era (animation-play-state, nessun salto).
// Serve alla fluidita': con il fondale fermo le superfici in vetro (backdrop-filter) non vanno risfocate a ogni fotogramma
// proprio mentre il telefono sta muovendo una pagina, una tendina o una finestra. I fasci si spostano di pochi pixel al secondo:
// la pausa non si vede.
const QUIET = 700; // ms di calma prima di ripartire (copre le animazioni avviate da un tocco: pagine, tendine, finestre)
let hold = false;
let touching = false;
let last = 0;
let armed = false;

const set = (v) => {
  if (hold === v) return;
  hold = v;
  // sulla radice: vale anche per il fondale della pagina che si sta aprendo (ogni pagina monta il suo .aurora-bg)
  document.documentElement.classList.toggle('beam-hold', v);
};
const check = () => {
  if (touching || performance.now() - last < QUIET) { setTimeout(check, 250); return; }
  armed = false;
  set(false);
};
const busy = () => {
  last = performance.now();
  if (!hold) set(true);
  if (!armed) { armed = true; setTimeout(check, QUIET); }
};

export function initAmbient() {
  if (typeof window === 'undefined' || window.__slAmbient) return;
  window.__slAmbient = true;
  const o = { passive: true, capture: true };
  document.addEventListener('touchstart', () => { touching = true; busy(); }, o);
  const end = (e) => { touching = !!(e.touches && e.touches.length); busy(); };
  document.addEventListener('touchend', end, o);
  document.addEventListener('touchcancel', end, o);
  window.addEventListener('scroll', busy, { passive: true });
  // ritorno dal background: mai un fondale rimasto fermo per un "touchend" perso
  document.addEventListener('visibilitychange', () => { touching = false; });
}
