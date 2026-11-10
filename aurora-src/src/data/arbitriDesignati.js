// Arbitro designato quando FotMob non lo da' ancora: prima la UEFA (arbitri_uefa.json, la fonte piu' veloce: Nations League, qualificazioni,
// amichevoli tra nazionali europee, Champions/Europa/Conference), poi API-Football per i campionati aggiunti (arbitri_extra.json).
// Chiave = id partita FotMob. I file cambiano ogni poche ore: si rileggono al piu' ogni 10 minuti (mai per sempre in memoria).
import { BASE } from './load';

const TTL = 10 * 60 * 1000;
const SRC = ['arbitri_uefa.json', 'arbitri_extra.json'];
const CACHE = new Map();

function load(file) {
  const c = CACHE.get(file);
  if (c && Date.now() - c.at < TTL) return c.p;
  const p = fetch(`${BASE}${file}`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  CACHE.set(file, { at: Date.now(), p });
  return p;
}

// nome dell'arbitro designato per la partita FotMob `fmId` (null = nessuna fonte lo ha ancora)
export async function designatedReferee(fmId) {
  if (!fmId) return null;
  const files = await Promise.all(SRC.map(load));
  for (const d of files) {
    const hit = d && d[String(fmId)];
    if (hit && hit.n) return hit.n;
  }
  return null;
}
