import { useEffect, useState } from 'react';

// Stato di caricamento iniziale: mostra gli skeleton con shimmer al primo render.
export default function useInitialLoad(ms = 320) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(id);
  }, [ms]);
  return loading;
}
