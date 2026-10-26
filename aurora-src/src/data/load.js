// Caricamento dei file dati veri. Tutti i file stanno nella cartella principale del sito
// (/tiri-dati/), mentre l'app Aurora vive in /tiri-dati/aurora/.
export const RAW = {};

export const BASE = new URL('../', document.baseURI).href;
export const WORKER = 'https://scalperlab-live.matteo-giampaoletti04.workers.dev';

const get = (name) =>
  fetch(`${BASE}${name}`, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

// nome campo in RAW  →  file
const FILES = {
  partite: 'partite.json',
  indice: 'aurora_indice.json',
  data: 'data.json',
  teams: 'teams.json',
  squadre: 'squadre.json',
  squadreEx: 'squadre_ex.json',
  stats: 'stats.json',
  statsEx: 'stats_ex.json',
  giocatori: 'giocatori.json',
  arbitri: 'arbitri.json',
  stadi: 'stadi.json',
  angoli: 'angoli.json',
  foto: 'foto.json',
  refcc: 'refcc.json',
  zone: 'zone.json',
  ali: 'ali.json',
};

export async function loadRaw() {
  await Promise.all(
    Object.entries(FILES).map(async ([key, file]) => {
      RAW[key] = await get(file);
    }),
  );
  return RAW;
}

// Dettaglio di una singola partita finita (eventi, statistiche, formazioni, tiri…).
const detailCache = {};
export function loadDetail(id) {
  if (!detailCache[id]) detailCache[id] = get(`match/${id}.json`);
  return detailCache[id];
}
