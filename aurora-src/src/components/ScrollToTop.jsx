import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const KEY = 'sl-scroll';
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const write = (m) => { try { sessionStorage.setItem(KEY, JSON.stringify(m)); } catch (e) { /* ignore */ } };

// Nuova pagina: in cima. Ritorno indietro (swipe/back): torna dove eri (scheda salvata a parte + scroll).
export default function ScrollToTop() {
  const loc = useLocation();
  const navigationType = useNavigationType();
  const keyRef = useRef(loc.key);
  const map = useRef(read());
  const navAt = useRef(0);

  useLayoutEffect(() => { keyRef.current = loc.key; navAt.current = Date.now(); }, [loc.key]);

  // un secondo tocco "fantasma" subito dopo il cambio pagina non deve premere cio' che nel frattempo e' comparso sotto il dito
  useEffect(() => {
    const block = (e) => {
      if (Date.now() - navAt.current < 280 && !(e.target.closest && e.target.closest('[data-fast-ok]'))) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener('click', block, true);
    return () => window.removeEventListener('click', block, true);
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
    const y = map.current[loc.key];
    if (!y) return undefined;
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
  }, [loc.key, navigationType]);

  return null;
}
