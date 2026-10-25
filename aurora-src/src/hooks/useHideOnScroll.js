import { useEffect, useRef, useState } from 'react';

// Nasconde la barra in basso quando si scorre verso il basso, la riporta scorrendo verso l'alto.
export default function useHideOnScroll(threshold = 10) {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    last.current = window.scrollY;
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - last.current) > threshold) {
          setHidden(y > last.current && y > 90);
          last.current = y;
        }
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return hidden;
}
