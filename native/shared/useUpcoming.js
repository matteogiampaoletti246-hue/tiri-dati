// Partite prossime delle competizioni dell'archivio (Nations League, qualificazioni…): arrivano dai file giorni/<data>.json, uno per giorno.
// Si scaricano una volta sola (i prossimi 12 giorni) quando una scheda ne ha bisogno; poi la scheda si ridisegna.
import { useEffect, useState } from 'react';
import { TODAY_ISO } from '@/data/matches';
import { loadDayFeed } from '@/data/dayFeed';

let P = null;
const DAYS = 12;
const iso = (i) => { const d = new Date(`${TODAY_ISO}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); };
export const loadUpcoming = () => {
  if (!P) P = Promise.all(Array.from({ length: DAYS }, (_, i) => loadDayFeed(iso(i)).catch(() => 0))).then(() => true).catch(() => { P = null; return false; });
  return P;
};
export function useUpcoming(need) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!need) return undefined;
    let on = true;
    loadUpcoming().then(() => { if (on) set((n) => n + 1); });
    return () => { on = false; };
  }, [need]);
}
