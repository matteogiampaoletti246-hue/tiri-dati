import { useState } from 'react';

const read = (k) => { try { return Number(sessionStorage.getItem(k)) || 0; } catch (e) { return 0; } };

// Scheda attiva ricordata per pagina: tornando indietro si ritrova la stessa scheda.
export default function usePageTab(kind, id) {
  const k = `sl-tab-${kind}-${id}`;
  const [st, setSt] = useState({ k, v: read(k) });
  const v = st.k === k ? st.v : read(k);
  const set = (i) => {
    try { sessionStorage.setItem(k, String(i)); } catch (e) { /* ignore */ }
    setSt({ k, v: i });
  };
  return [v, set];
}
