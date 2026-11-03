import { useSyncExternalStore } from 'react';

// La partita e' iniziata (o finita)? Unico controllo per scegliere tra la tendina dal basso (iniziata/finita)
// e il pannello da destra (non ancora iniziata). Senza stato si guarda l'orario d'inizio.
export function matchStarted(match) {
  if (!match) return false;
  if (match.status) return match.status !== 'scheduled';
  if (match.ts) return match.ts <= Date.now();
  return true;
}

// Stato condiviso del pannello giocatore da destra (partite non iniziate: formazioni, Migliori Giocatori, Affidabilita').
let state = null;
const subs = new Set();
const emit = () => subs.forEach((f) => f());
export const openPanel = (id) => { if (id) { state = { id: String(id), t: Date.now() }; emit(); } };
export const closePanel = () => { if (state) { state = null; emit(); } };
export const usePlayerPanel = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state);
