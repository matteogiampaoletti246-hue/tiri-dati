import { useEffect, useState } from 'react';

// Carica dati asincroni: {data, loading}. Si ricarica quando cambiano le dipendenze.
// Risultato gia' ottenuto (stessa funzione, stesse dipendenze): si mostra subito al primo disegno, senza "Carico..."
// e senza contenuto che arriva dopo spingendo giu' la pagina (tornando indietro, cambiando scheda, swipe).
// La memoria e' limitata (le voci usate meno di recente si buttano).
const MAX = 300;
const MEM = new Map();
const keyOf = (fn, deps) => {
  const parts = [];
  for (const d of deps || []) {
    if (d === null || d === undefined || typeof d !== 'object') parts.push(String(d));
    else if (d.id !== undefined) parts.push(`#${d.id}`);
    else return null; // dipendenza non riconoscibile: niente memoria
  }
  return `${fn.toString().length}:${fn.toString().slice(0, 160)}|${parts.join('|')}`;
};
const remember = (k, v) => {
  if (!k) return;
  MEM.delete(k);
  MEM.set(k, v);
  if (MEM.size > MAX) MEM.delete(MEM.keys().next().value);
};

export default function useAsync(fn, deps) {
  const k = keyOf(fn, deps);
  const hit = k && MEM.has(k);
  const [st, setSt] = useState(() => (hit ? { k, data: MEM.get(k), loading: false } : { k, data: undefined, loading: true }));
  useEffect(() => {
    let on = true;
    if (!(k && MEM.has(k))) setSt((s) => ({ k, data: s.data, loading: true }));
    Promise.resolve(fn())
      .then((d) => { remember(k, d); if (on) setSt((s) => (s.k === k && s.data === d && !s.loading ? s : { k, data: d, loading: false })); })
      .catch(() => on && setSt({ k, data: null, loading: false }));
    return () => { on = false; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  // dipendenze cambiate e risultato gia' noto: si usa subito (niente fotogramma con i dati vecchi o vuoti)
  if (st.k !== k && hit) return { data: MEM.get(k), loading: false };
  return st;
}
