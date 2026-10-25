import { useEffect, useState } from 'react';

// Tema attivo (per i loghi che hanno una variante scura).
export default function useDark() {
  const [dark, setDark] = useState(
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains('dark')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return dark;
}
