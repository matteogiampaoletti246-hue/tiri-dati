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
  extra: 'partite_extra.json',
  indice: 'aurora_indice.json',
  data: 'data.json',
  teams: 'teams.json',
  squadre: 'squadre.json',
  squadreEx: 'squadre_ex.json',
  stats: 'stats.json',
  statsEx: 'stats_ex.json',
  giocatori: 'giocatori.json',
  calcExtra: 'calc_extra.json',
  arbitri: 'arbitri.json',
  stadi: 'stadi.json',
  angoli: 'angoli.json',
  foto: 'foto.json',
  refcc: 'refcc.json',
  zone: 'zone.json',
  ali: 'ali.json',
  ruoli: 'ruoli.json',
  infortuni: 'infortuni.json',
  colors: 'arch/colors.json',
};

// Campionati aggiunti con Affidabilita' (calc_extra.py, dall'archivio FotMob): medie di TUTTE le squadre al posto di quelle
// parziali di data.json, statistiche complete dei giocatori che giocatori.json ha solo in parte (upd, per id), giocatori e
// partite che mancano. Stessa forma dei dati dei top campionati: il resto dell'app non cambia.
function mergeCalcExtra() {
  const X = RAW.calcExtra;
  if (!X) return;
  if (!RAW.data) RAW.data = { leagues: {} };
  if (!RAW.data.leagues) RAW.data.leagues = {};
  Object.entries(X.leagues || {}).forEach(([k, L]) => { RAW.data.leagues[k] = { ...(RAW.data.leagues[k] || {}), ...L }; });
  if (!RAW.giocatori) RAW.giocatori = { players: [], fix: {} };
  const G = RAW.giocatori;
  const byId = new Map();
  (G.players || []).forEach((p) => byId.set(p.i, p));
  (X.upd || []).forEach((u) => { const p = byId.get(u.i); if (p) { p.l = u.l; p.r = u.r; p.h = u.h; } });
  G.players = (G.players || []).concat(X.players || []);
  G.fix = G.fix || {};
  Object.entries(X.fix || {}).forEach(([t, lst]) => { if (!G.fix[t]) G.fix[t] = lst; });
}

export async function loadRaw() {
  await Promise.all(
    Object.entries(FILES).map(async ([key, file]) => {
      RAW[key] = await get(file);
    }),
  );
  mergeCalcExtra();
  return RAW;
}

// Dettaglio di una singola partita finita (eventi, statistiche, formazioni, tiri…).
const detailCache = {};
export function loadDetail(id) {
  if (!detailCache[id]) detailCache[id] = get(`match/${id}.json`);
  return detailCache[id];
}
