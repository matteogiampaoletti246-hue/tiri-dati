// Scelte (competizione, stagione) legate alla scheda aperta: restano finche' la scheda e' nella pila, aprendo da zero si riparte da "Attuale".
import { useState } from 'react';
const SEL = new Map();
export const resetSel = (entity) => { [...SEL.keys()].forEach((k) => { if (k.startsWith(`${entity}|`)) SEL.delete(k); }); };
export function useSel(entity, slot, initial) {
  const k = `${entity}|${slot}`;
  const [v, setV] = useState(() => {
    if (SEL.has(k)) return SEL.get(k);
    const x = typeof initial === 'function' ? initial() : initial;
    SEL.set(k, x);
    return x;
  });
  const set = (x) => { SEL.set(k, x); setV(x); };
  return [v, set];
}

// la pagina avvisa quando si e' vicini al fondo: le liste che caricano a gruppi (partite del giocatore) caricano il prossimo
const NEAR = new Set();
export const emitNearEnd = () => NEAR.forEach((f) => f());
export const onNearEnd = (f) => { NEAR.add(f); return () => NEAR.delete(f); };
