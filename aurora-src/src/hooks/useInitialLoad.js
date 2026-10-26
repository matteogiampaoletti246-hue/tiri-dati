import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const seen = new Set();

// Skeleton con shimmer solo alla prima apertura di una pagina: tornando indietro si vede subito il contenuto.
export default function useInitialLoad(ms = 320) {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(() => !seen.has(pathname));
  useEffect(() => {
    if (seen.has(pathname)) { setLoading(false); return undefined; }
    const id = setTimeout(() => { seen.add(pathname); setLoading(false); }, ms);
    return () => clearTimeout(id);
  }, [ms, pathname]);
  return loading;
}
