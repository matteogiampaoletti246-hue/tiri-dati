import { useState } from 'react';

const read = (k) => { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } };

// Come usePageTab ma ricorda la scheda per nome: se una scheda senza dati non c'e' (o compare dopo), la scelta non salta su un'altra.
export default function usePageTabKey(kind, id) {
  const k = `sl-tabk-${kind}-${id}`;
  const [st, setSt] = useState({ k, v: read(k) });
  const v = st.k === k ? st.v : read(k);
  const set = (key) => {
    try { sessionStorage.setItem(k, key); } catch (e) { /* ignore */ }
    setSt({ k, v: key });
  };
  return [v, set];
}

export const tabIndexOf = (tabs, key) => Math.max(0, tabs.findIndex((t) => t.key === key));
