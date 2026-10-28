// Rose dei campionati minori (rose.json, scaricate da FotMob): stessi ruoli e stesse righe dei campionati maggiori.
import { BASE } from './load';

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
    const cand = Object.entries(DATA).filter(([k, v]) => { const m = nrm(k); return m.length >= 5 && (m.includes(n) || n.includes(m)) && (!team.leagueId || v.lg === team.leagueId); });
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
