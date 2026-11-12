// Quando un elemento entra nello schermo scorrendo la pagina (Calcolatore): la pagina chiama `scrollPing` mentre scorre e
// chi e' interessato (grafico Hit rate) misura la propria posizione. `vis` = almeno `frac` dell'elemento e' tra la testata e il dock.
import { useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';

const subs = new Set();
export const scrollPing = () => { subs.forEach((f) => f()); };

export function useInView(ref, frac = 0.5) {
  const { height: H } = useWindowDimensions();
  const [vis, setVis] = useState(false);
  const last = useRef(0);
  const check = () => {
    if (!ref.current || !ref.current.measureInWindow) return;
    ref.current.measureInWindow((x, y, w, h) => {
      if (!h) return;
      const top = Math.max(y, 110);
      const bot = Math.min(y + h, H - 100);
      setVis(bot - top >= h * frac);
    });
  };
  useEffect(() => {
    const f = () => { const n = Date.now(); if (n - last.current > 70) { last.current = n; check(); } };
    subs.add(f);
    return () => { subs.delete(f); };
  }, [H]); // eslint-disable-line react-hooks/exhaustive-deps
  return { vis, check };
}
