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

  useLayoutEffect(() => { keyRef.current = loc.key; }, [loc.key]);

  useEffect(() => {
    let t = null;
    const onScroll = () => {
      if (t) return;
      t = setTimeout(() => { t = null; map.current[keyRef.current] = Math.round(window.scrollY); write(map.current); }, 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return undefined;
    }
    const y = map.current[loc.key];
    if (!y) return undefined;
    let n = 0;
    let raf;
    const step = () => {
      const h = document.documentElement.scrollHeight;
      if (h >= y + window.innerHeight - 4 || n > 60) { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); return; }
      n += 1;
      raf = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, [loc.key, navigationType]);

  return null;
}
