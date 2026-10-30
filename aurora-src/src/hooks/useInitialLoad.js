import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const seen = new Set();
// nell'app nativa le tre schede della barra in basso si aprono con la rotella dell'app e poi mostrano subito il contenuto: niente skeleton di 320 ms
const NATIVE_FAST = new Set(['/calcolatore', '/migliori-giocatori', '/migliori-matchup']);
const fast = (pathname) => typeof window !== 'undefined' && !!window.ReactNativeWebView && NATIVE_FAST.has(pathname);

// Skeleton con shimmer solo alla prima apertura di una pagina: tornando indietro si vede subito il contenuto.
export default function useInitialLoad(ms = 320) {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(() => !fast(pathname) && !seen.has(pathname));
  useEffect(() => {
    if (seen.has(pathname) || fast(pathname)) { setLoading(false); return undefined; }
    const id = setTimeout(() => { seen.add(pathname); setLoading(false); }, ms);
    return () => clearTimeout(id);
  }, [ms, pathname]);
  return loading;
}
