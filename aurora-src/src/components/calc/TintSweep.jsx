import { useRef } from 'react';

// Onda di colore dietro un pannello (concept B): parte da sinistra e lo tinge gradualmente.
// `k` cambia (giocatore o squadra scelti) = l'onda riparte; alla prima apparizione della scheda il pannello e' gia' colorato (nessuna animazione).
export default function TintSweep({ tint, strength = 34 }) {
  const first = useRef(tint && tint.k);
  if (!tint || !tint.k || !tint.color) return null;
  const still = first.current === tint.k;
  return (
    <span
      key={tint.k}
      aria-hidden="true"
      className={`tint-sweep${still ? ' still' : ''}`}
      style={{ '--tc': tint.color, '--ts': `${strength}%`, '--td': `${tint.delay || 0}ms` }}
    />
  );
}
