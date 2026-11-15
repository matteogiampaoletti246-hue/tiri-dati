import { useEffect, useRef, useState } from 'react';

// Carica dati asincroni: {data, loading}. Si ricarica quando cambiano le dipendenze.
// Risultato gia' ottenuto (stessa funzione, stesse dipendenze): si mostra subito al primo disegno, senza "Carico..."
// e senza contenuto che arriva dopo spingendo giu' la pagina (tornando indietro, cambiando scheda, swipe).
// La memoria e' limitata (le voci usate meno di recente si buttano).
const MAX = 120;
const MEM = new Map();
// Identita' del punto di chiamata: su Hermes (app nativa) fn.toString() e' uguale per tutte le funzioni ("[bytecode]"), quindi due hook con le stesse
// dipendenze (es. carriera e pid dello stesso giocatore) si scambiavano i dati in memoria ("Cannot read property 'filter' of undefined"). La posizione nello stack e' unica per ogni chiamata.
const siteOf = () => {
  try { return String(new Error().stack || '').split('\n')[3] || ''; } catch (e) { return ''; }
};
const keyOf = (fn, deps, site) => {
  const parts = [];
  for (const d of deps || []) {
    if (d === null || d === undefined || typeof d !== 'object') parts.push(String(d));
    else if (d.id !== undefined) parts.push(`#${d.id}`);
    else return null; // dipendenza non riconoscibile: niente memoria
  }
  const src = fn.toString();
  return `${src.length}:${src.slice(0, 160)}@${site}|${parts.join('|')}`;
};
const remember = (k, v) => {
  if (!k) return;
  MEM.delete(k);
  MEM.set(k, v);
  if (MEM.size > MAX) MEM.delete(MEM.keys().next().value);
};

export default function useAsync(fn, deps) {
  const siteRef = useRef(null);
  if (siteRef.current === null) siteRef.current = siteOf();
  const k = keyOf(fn, deps, siteRef.current);
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
