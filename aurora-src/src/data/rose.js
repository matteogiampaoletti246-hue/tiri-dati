// Rose dei campionati minori (rose.json, scaricate da FotMob): stessi ruoli e stesse righe dei campionati maggiori.
import { BASE } from './load';
import { sameSquad } from './teamMatch';

let DATA = null;
let PROM = null;
let IDX = null;
const nrm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export const loadRose = () => {
  if (!PROM) {
    PROM = fetch(`${BASE}rose.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((d) => { DATA = d || {}; BYID = null; BYNORM = null; IDX = null; return DATA; });
  }
  return PROM;
};
export const roseLoaded = () => DATA !== null;
let BYID = null;
let BYNORM = null;
// La rosa di una squadra si trova per id FotMob (sicuro), poi per nome uguale, poi per nome normalizzato e, solo se unico, per nome contenuto.
export const roseOf = (team) => {
  if (!DATA || !team) return null;
  if (DATA[team.name]) return DATA[team.name];
  if (!BYID) {
    BYID = {}; BYNORM = {};
    Object.entries(DATA).forEach(([k, v]) => { if (v && v.id) BYID[String(v.id)] = v; const n = nrm(k); (BYNORM[n] = BYNORM[n] || []).push(v); });
  }
  if (team.fmId && BYID[String(team.fmId)]) return BYID[String(team.fmId)];
  const n = nrm(team.name);
  const same = BYNORM[n];
  if (same) { const hit = same.find((v) => !team.leagueId || v.lg === team.leagueId) || (same.length === 1 ? same[0] : null); if (hit) return hit; }
  // "Eintracht Frankfurt" = "Frankfurt": nome contenuto, solo se una sola squadra combacia
  if (n.length >= 5) {
    const cand = Object.entries(DATA).filter(([k, v]) => { const m = nrm(k); return m.length >= 5 && (m.includes(n) || n.includes(m)) && sameSquad(k, team.name) && (!team.leagueId || v.lg === team.leagueId); });
    if (cand.length === 1) return cand[0][1];
  }
  return null;
};
// giocatore di una rosa dall'id FotMob
export const rosePlayer = (fid) => {
  if (!DATA) return null;
  if (!IDX) {
    IDX = {};
    Object.entries(DATA).forEach(([team, v]) => (v.p || []).forEach((r) => { IDX[String(r[0])] = { r, team, lg: v.lg }; }));
  }
  return IDX[String(fid)] || null;
};

// Rosa ricavata dalla stagione in corso quando la squadra non e' in rose.json (squadre delle competizioni dell'archivio, squadre B,
// rose vuote): chi ha giocato la stagione per quella squadra, da tutte le fonti dell'archivio insieme (molte competizioni minori hanno
// solo alcune di queste): minuti e formazioni delle partite, classifiche ufficiali della stagione (pannello Giocatori), gol e cartellini.
// Righe come quelle di rose.json: [id FotMob, nome, ruolo 'UNK', numero, paese, eta', altezza, voto, -, -, -, minuti]. null = nessuna fonte.
export const seasonRoster = async (team) => {
  const { FM_ID, currentSeason, loadSeason, loadSeasonStats, loadSeasonMatches, statsFromMatches, teamIdByName } = await import('./archive');
  const fm = team && FM_ID[team.leagueId];
  if (!fm) return null;
  const sk = await currentSeason(fm);
  if (!sk) return null;
  const safe = (p) => p.catch(() => null);
  const [season, st, off, det] = await Promise.all([safe(loadSeason(fm, sk)), safe(statsFromMatches(fm, sk)), safe(loadSeasonStats(fm, sk)), safe(loadSeasonMatches(fm, sk))]);
  const tid = String((season && teamIdByName(season.teams, team.name)) || team.fmId || '');
  if (!tid) return null;
  const out = new Map();
  const add = (id, name, min = 0) => {
    if (!id || !name) return;
    const k = String(id);
    const r = out.get(k);
    if (r) { r[11] = Math.max(r[11], min); return; }
    out.set(k, [Number(id), name, 'UNK', null, null, null, null, null, 0, 0, 0, min]);
  };
  ((st && st.players && st.players.mins_played) || []).forEach((r) => { if (String(r[2]) === tid) add(r[0], r[1], r[3] || 0); });
  Object.entries((off && off.players) || {}).forEach(([k, l]) => { if (!k.startsWith('_') && Array.isArray(l)) l.forEach((r) => { if (String(r[2]) === tid) add(r[0], r[1]); }); });
  const sides = {};
  ((season && season.fix) || []).forEach((f) => { sides[String(f[0])] = [String(f[2]), String(f[3])]; });
  Object.entries((det && det.m) || {}).forEach(([mid, m]) => {
    if (!m) return;
    [m.h, m.a].forEach((side) => {
      if (side && String(side.id) === tid) Object.values(side).forEach((l) => { if (Array.isArray(l)) l.forEach((r) => { if (Array.isArray(r)) add(r[0], r[1]); }); });
    });
    const sd = sides[mid];
    if (sd) (m.e || []).forEach((e) => { if (e && Array.isArray(e.p) && (e.isHome ? sd[0] : sd[1]) === tid) add(e.p[0], e.p[1]); });
  });
  return out.size ? { fm, sk, p: [...out.values()] } : null;
};
