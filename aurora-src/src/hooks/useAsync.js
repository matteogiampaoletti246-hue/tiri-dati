import { useEffect, useState } from 'react';

// Carica dati asincroni: {data, loading}. Si ricarica quando cambiano le dipendenze.
export default function useAsync(fn, deps) {
  const [st, setSt] = useState({ data: undefined, loading: true });
  useEffect(() => {
    let on = true;
    setSt((s) => ({ data: s.data, loading: true }));
    Promise.resolve(fn()).then((d) => on && setSt({ data: d, loading: false })).catch(() => on && setSt({ data: null, loading: false }));
    return () => { on = false; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return st;
}
