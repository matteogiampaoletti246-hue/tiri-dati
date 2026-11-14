// Caricamento dei file dati veri. Tutti i file stanno nella cartella principale del sito
// (/tiri-dati/), mentre l'app Aurora vive in /tiri-dati/aurora/.
export const RAW = {};

export const BASE = new URL('../', document.baseURI).href;
export const WORKER = 'https://scalperlab-live.matteo-giampaoletti04.workers.dev';

const get1 = (name) =>
  fetch(`${BASE}${name}`, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
// Una richiesta ferma (connessione appena riaperta, primo avvio) non deve bloccare per decine di secondi tutti i dati condivisi:
// se un file non arriva entro 5 s ne parte una seconda in parallelo e vale la prima che risponde con dati (senza dati resta null come prima).
const get = (name) => new Promise((res) => {
  let left = 1;
  let done = false;
  const fin = (v) => {
    if (done) return;
    left -= 1;
    if (v != null || left <= 0) { done = true; clearTimeout(tm); res(v); }
  };
  const tm = setTimeout(() => { if (done) return; left += 1; get1(name).then(fin); }, 5000);
  get1(name).then(fin);
});

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
  calcTutte: 'calc_tutte.json',
  arbitri: 'arbitri.json',
  stadi: 'stadi.json',
  angoli: 'angoli.json',
  matchNaz: 'matchup_nazionali.json',
  foto: 'foto.json',
  fotoFm: 'foto_fm.json',
  refcc: 'refcc.json',
  zone: 'zone.json',
  ali: 'ali.json',
  ruoli: 'ruoli.json',
  infortuni: 'infortuni.json',
  infortuniPartite: 'infortuni_partite.json',
  nomi: 'nomi.json',
  colors: 'arch/colors.json',
  colors2: 'arch/colors2.json',
};

// Campionati aggiunti con Affidabilita' (calc_extra.py, dall'archivio FotMob): medie di TUTTE le squadre al posto di quelle
// parziali di data.json, statistiche complete dei giocatori che giocatori.json ha solo in parte (upd, per id), giocatori e
// partite che mancano. Stessa forma dei dati dei top campionati: il resto dell'app non cambia.
// calc_tutte.json (calc_extra.py --tutte) ha la stessa forma e porta TUTTE le altre competizioni di club con statistiche tiri: li' i calendari
// si sommano a quelli gia' presenti (un club gioca campionato, coppa nazionale e coppa continentale), non li sostituiscono.
const sumFix = (a, b) => {
  const seen = new Set();
  return [...(a || []), ...(b || [])]
    .filter((f) => { const k = `${f[0]}|${f[1]}|${f[3]}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0))
    .slice(0, 10);
};
function mergeCalcFile(X, add) {
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
  // calc_tutte.json: giocatori "leggeri" (solo tiri, minuti, hit rate): players.js li costruisce senza voti, ultime partite e xG
  if (add) (X.players || []).forEach((p) => { p.tt = 1; });
  G.players = (G.players || []).concat(X.players || [], X.nat || []);
  if (X.al) G.al = { ...(G.al || {}), ...X.al };
  G.fix = G.fix || {};
  Object.entries(X.fix || {}).forEach(([t, lst]) => { G.fix[t] = add ? sumFix(G.fix[t], lst) : lst; });
}
const mergeCalcExtra = () => { mergeCalcFile(RAW.calcExtra, false); mergeCalcFile(RAW.calcTutte, true); };

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
