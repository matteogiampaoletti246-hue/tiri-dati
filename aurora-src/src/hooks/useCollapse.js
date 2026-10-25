import { useEffect, useRef, useState } from 'react';

// Avanzamento dello scroll (0 → 1) per l'intestazione che si comprime.
export default function useCollapse(range = 150) {
  const [p, setP] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    const update = () => {
      ticking.current = false;
      setP(Math.max(0, Math.min(1, window.scrollY / range)));
    };
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [range]);

  return p;
}
