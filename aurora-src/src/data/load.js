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
  fotoFm: 'foto_fm.json',
  refcc: 'refcc.json',
  zone: 'zone.json',
  ali: 'ali.json',
  ruoli: 'ruoli.json',
  infortuni: 'infortuni.json',
  nomi: 'nomi.json',
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
  // l, r, h e partite per l'Hit Rate (hn, hp) di profili.py: si copia tutto quello che c'e'
  (X.upd || []).forEach((u) => { const p = byId.get(u.i); if (p) Object.assign(p, u); });
  // nazionali (Nations League): profili a parte con le sole statistiche della nazionale; players.js li lega al giocatore di club
  G.players = (G.players || []).concat(X.players || [], X.nat || []);
  if (X.al) G.al = { ...(G.al || {}), ...X.al };
  G.fix = G.fix || {};
  Object.entries(X.fix || {}).forEach(([t, lst]) => { G.fix[t] = lst; });
}

// Infortunati con LiveScore (dati di terzi: solo su KV, mai nel repository). Al massimo 2,5 s: senza risposta vale infortuni.json.
const kvInjuries = () => Promise.race([
  fetch(`${WORKER}/r?k=idx:inj`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  new Promise((res) => setTimeout(() => res(null), 2500)),
]);

export async function loadRaw() {
  await Promise.all([
    ...Object.entries(FILES).map(async ([key, file]) => {
      RAW[key] = await get(file);
    }),
    kvInjuries().then((j) => { RAW.infortuniKv = j && j.p ? j : null; }),
  ]);
  mergeCalcExtra();
  return RAW;
}

// Dettaglio di una singola partita finita (eventi, statistiche, formazioni, tiri…).
const detailCache = {};
export function loadDetail(id) {
  if (!detailCache[id]) detailCache[id] = get(`match/${id}.json`);
  return detailCache[id];
}
