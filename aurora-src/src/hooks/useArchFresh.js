import { useEffect, useState } from 'react';
import { archVersion } from '@/data/archive';

// Versione dei dati di una stagione d'archivio: cambia quando la stagione in corso riceve risultati nuovi
// (data/archive.js, evento 'sl-arch'). Il componente si ridisegna con gli stessi oggetti (niente ricaricamenti, niente salti).
export default function useArchFresh(fm, sk) {
  const key = `${fm}/${sk}`;
  const [v, setV] = useState(() => archVersion.get(key) || 0);
  useEffect(() => {
    const on = (e) => { if (e.detail && `${e.detail.fm}/${e.detail.sk}` === key) setV(archVersion.get(key) || 0); };
    window.addEventListener('sl-arch', on);
    setV(archVersion.get(key) || 0);
    return () => window.removeEventListener('sl-arch', on);
  }, [key]);
  return v;
}

// qualsiasi stagione aggiornata (liste che mettono insieme piu' competizioni, es. partite di una squadra)
let ANY = 0;
if (typeof window !== 'undefined') window.addEventListener('sl-arch', () => { ANY += 1; });
export function useArchAny() {
  const [v, setV] = useState(ANY);
  useEffect(() => {
    const on = () => setV(ANY);
    window.addEventListener('sl-arch', on);
    return () => window.removeEventListener('sl-arch', on);
  }, []);
  return v;
}
