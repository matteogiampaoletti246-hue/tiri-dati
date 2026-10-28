// Rose dei campionati minori (rose.json, scaricate da FotMob): stessi ruoli e stesse righe dei campionati maggiori.
import { BASE } from './load';

let DATA = null;
let PROM = null;
let IDX = null;
const nrm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export const loadRose = () => {
  if (!PROM) {
    PROM = fetch(`${BASE}rose.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((d) => { DATA = d || {}; return DATA; });
  }
  return PROM;
};
export const roseOf = (team) => {
  if (!DATA || !team) return null;
  if (DATA[team.name]) return DATA[team.name];
  const n = nrm(team.name);
  const hit = Object.entries(DATA).find(([k, v]) => nrm(k) === n && (!team.leagueId || v.lg === team.leagueId));
  return hit ? hit[1] : null;
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
