import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const KEY = 'sl-scroll';
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const write = (m) => { try { sessionStorage.setItem(KEY, JSON.stringify(m)); } catch (e) { /* ignore */ } };

// L'app nativa apre le pagine cambiando l'hash: la voce di cronologia non ha chiave (per react-router sono tutte 'default') e lo scroll di una pagina
// finiva sulla successiva. Si distinguono col percorso, e ogni volta che l'app torna alla pagina di partenza si dimentica tutto: riaperte ripartono da in cima.
const NATIVE_START = '/linee-guida';
const keyOf = (loc) => (loc.key === 'default' && window.ReactNativeWebView ? `h:${loc.pathname}${loc.search}` : loc.key);

// altezza salvata della pagina (chi costruisce le liste a pezzi deve sapere se tornando serve subito tutta l'altezza)
export const savedScroll = (loc) => read()[keyOf(loc)] || 0;

// Nuova pagina: in cima. Ritorno indietro (swipe/back): torna dove eri (scheda salvata a parte + scroll).
export default function ScrollToTop() {
  const loc = useLocation();
  const navigationType = useNavigationType();
  const keyRef = useRef(keyOf(loc));
  const map = useRef(read());
  const navAt = useRef(0);

  useLayoutEffect(() => {
    keyRef.current = keyOf(loc); navAt.current = Date.now();
    if (window.ReactNativeWebView && loc.pathname === NATIVE_START) { Object.keys(map.current).forEach((k) => { if (k.startsWith('h:')) delete map.current[k]; }); write(map.current); }
  }, [loc]);

  // un secondo tocco "fantasma" subito dopo il cambio pagina non deve premere cio' che nel frattempo e' comparso sotto il dito
  useEffect(() => {
    const block = (e) => {
      if (Date.now() - navAt.current < 280 && !(e.target.closest && e.target.closest('[data-fast-ok]'))) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener('click', block, true);
    return () => window.removeEventListener('click', block, true);
  }, []);

  // altezza esatta al momento di lasciare la pagina (lo scroll con inerzia continua dopo l'ultimo evento salvato)
  useEffect(() => {
    window.__slSaveScroll = () => { map.current[keyRef.current] = Math.round(window.scrollY); write(map.current); };
    return () => { window.__slSaveScroll = null; };
  }, []);

  useEffect(() => {
    let t = null;
    const onScroll = () => {
      if (t) return;
      t = setTimeout(() => { t = null; map.current[keyRef.current] = Math.round(window.scrollY); write(map.current); }, 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Tornando indietro la pagina riparte gia' all'altezza di prima, PRIMA del primo disegno (niente salto dall'alto).
  // Se la pagina non e' ancora alta abbastanza, la si tiene alta con un minimo temporaneo finche' il contenuto non la raggiunge.
  useLayoutEffect(() => {
    try { window.history.scrollRestoration = 'manual'; } catch (e) { /* ignore */ }
    if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return undefined;
    }
    const y = map.current[keyOf(loc)];
    // nessuna altezza salvata (o 0): si parte da in cima, mai dall'altezza della pagina appena lasciata (la Home ereditava lo scroll della squadra)
    if (!y) { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); return undefined; }
    const root = document.documentElement;
    const need = y + window.innerHeight;
    if (root.scrollHeight < need) root.style.minHeight = `${need}px`;
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    let n = 0;
    let raf;
    const step = () => {
      n += 1;
      if (Math.abs(window.scrollY - y) > 1 && n < 20) window.scrollTo({ top: y, left: 0, behavior: 'instant' });
      const body = document.body;
      const natural = Math.max(body.scrollHeight, body.offsetHeight);
      if (natural >= need - 4 || n > 90) { root.style.minHeight = ''; return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); root.style.minHeight = ''; };
  }, [loc, navigationType]);

  return null;
}
