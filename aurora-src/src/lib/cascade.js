import { useLayoutEffect, useState } from 'react';
import { useNavigationType } from 'react-router-dom';
import { isFresh } from './tabSlide';

// Entrata dei banner (concept A scelto dall'utente il 9/11/2026): i banner sullo schermo scendono dall'alto uno dopo l'altro
// con una piccola dissolvenza. Solo quelli visibili (al massimo 8); "backwards": finita l'entrata il banner torna normale (resta .press).
export const CASCADE = { y: -22, ms: 420, stag: 60, ease: 'cubic-bezier(.22,1,.36,1)' };
const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const BASE = typeof window !== 'undefined' && window.ReactNativeWebView ? 120 : 0;

export function cascadeIn(root, sel, max = 8) {
  if (!root || reduced()) return true;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // in orizzontale si guarda la posizione dentro la pagina (non sullo schermo): la pagina puo' essere ancora fuori, mentre entra scorrendo dal dock
  const x0 = root.getBoundingClientRect().left;
  const els = [...root.querySelectorAll(sel)].filter((el) => {
    const r = el.getBoundingClientRect();
    const x = r.left - x0;
    return r.height > 0 && r.top < vh && r.bottom > 0 && x > -vw * 0.5 && x < vw * 0.5;
  }).slice(0, max);
  if (!els.length) return false;
  els.forEach((el, i) => el.animate(
    [{ transform: `translate3d(0,${CASCADE.y}px,0)`, opacity: 0 }, { transform: 'translate3d(0,0,0)', opacity: 1 }],
    { duration: CASCADE.ms, delay: BASE + 60 + i * CASCADE.stag, easing: CASCADE.ease, fill: 'backwards' },
  ));
  return true;
}

// All'apertura della pagina (non tornando indietro): aspetta che i banner ci siano (dati in arrivo) e li fa entrare una volta sola.
export function useCascade(ref, sel, on) {
  // useLayoutEffect + MutationObserver: i banner partono nascosti gia' al primo disegno (mai un lampo del banner fermo prima dell'entrata)
  useLayoutEffect(() => {
    if (!on || !ref.current) return undefined;
    if (cascadeIn(ref.current, sel)) return undefined;
    let mo = null;
    let tm = 0;
    const end = () => { if (mo) { mo.disconnect(); mo = null; } clearTimeout(tm); };
    mo = new MutationObserver(() => { if (cascadeIn(ref.current, sel)) end(); });
    mo.observe(ref.current, { childList: true, subtree: true });
    tm = setTimeout(end, 3000);
    return end;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// true se la pagina e' stata aperta (dalla Home, da un'altra scheda, da un collegamento), false se si e' tornati indietro
export function useFreshOpen() {
  const pop = useNavigationType() === 'POP';
  const [f] = useState(() => isFresh(pop));
  return f;
}
