// Giocatori che non sono nell'elenco attuale (ritirati, stagioni passate, altri campionati):
// si costruisce lo stesso oggetto giocatore dai dati dell'archivio, cosi' la scheda e' identica per tutti.
import { loadPlayerStatsFor, statTotal, loadSeason, playerSeasons, playerFace, FM_ID } from './archive';
import { registerPlayer, playerById, playerByFm, natByFm } from './players';
import { ensureTeam, teamByFm } from './teams';
import { BASE } from './load';
import { realName } from './realNames';
import { loadCarriere, setCarriere } from './carriere';
import { loadRose, rosePlayer, rosaOf } from './rose';
import { lruGet, lruSet } from '@/lib/lru';

const LID_BY_FM = {};
Object.keys(FM_ID).forEach((k) => { LID_BY_FM[FM_ID[k]] = k; });

export const archiveId = (fm, sk, pid) => `fm~${fm}~${sk}~${pid}`;
export const parseArchiveId = (id) => {
  // stagione anche con suffisso: "2026-2027 - Apertura", "2026 - Clausura"
  let s = String(id || '');
  try { s = decodeURIComponent(s); } catch (e) { /* gia' in chiaro */ }
  const m = /^fm~(\d+)~([^~]+)~(\d+)$/.exec(s);
  if (m) return { fm: m[1], sk: m[2], pid: m[3] };
  // giocatore senza scheda FotMob, creato dai dati ESPN (rose_espn.py): "espn~<id ESPN>"
  const e = /^espn~(\d+)$/.exec(s);
  return e ? { fm: 'espn', sk: '', pid: e[1] } : null;
};
export const espnPhoto = (eid) => `https://a.espncdn.com/i/headshots/soccer/players/full/${eid}.png`;
export const espnPlayerId = (eid) => `espn~${eid}`;
// id riga rosa ESPN-only: -(2_000_000_000 + id ESPN)
export const espnIdOfRow = (rid) => (Number(rid) < -2e9 ? String(-2e9 - Number(rid)) : null);

const rowsOf = (st, pid) => {
  const L = (st && st.players) || {};
  const by = {};
  let me = null;
  Object.keys(L).forEach((k) => {
    if (k.startsWith('_')) return;
    const r = (L[k] || []).find((x) => String(x[0]) === String(pid));
    if (r) { me = me || r; by[k] = r; }
  });
  return me ? { me, by } : null;
};

// Scheda creata dai dati ESPN per chi FotMob non ha (stesso oggetto giocatore, solo i dati che ESPN da': nessun numero inventato)
async function makeEspnPlayer(eid) {
  const id = espnPlayerId(eid);
  const have = playerById(id);
  if (have) return have;
  const sh = await fetch(`${BASE}espn/${Number(eid) % 100}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  const v = sh[String(eid)];
  if (!v) return null;
  const team = teamByFm(String(v.t)) || null;
  const s = v.s || {};
  const num = (k) => Number(s[k]) || 0;
  const initials = String(v.n).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const p = {
    id, teamId: team ? team.id : null, teamName: team ? team.name : '', leagueId: team ? team.leagueId || null : null, name: v.n, nick: null, initials, number: v.j, position: v.p === 'UNK' ? null : v.p,
    photo: espnPhoto(eid), hasStats: false, archive: false, espn: true,
    rating: null, appearances: num('appearances'), minutes: 0, goals: num('totalGoals'), assists: num('goalAssists'),
    shots: num('totalShots'), shotsOnTarget: num('shotsOnTarget'), xg: null,
    exS: null, exL5: null, l5g: 0, l5min: 0, l5y: 0, l5r: 0, foulsCommitted: num('foulsCommitted'), foulsDrawn: num('foulsSuffered'), offsides: num('offsides'),
    yellows: num('yellowCards'), reds: num('redCards'), l: [0, 0, 0, 0], c: [0, 0, 0, 0], r: [], h: [],
    shots5: [], sot5: [], minutes5: [], recent: [], ratings5: [],
  };
  registerPlayer(p);
  setCarriere(id, { fm: '', car: [], c: v.c || null, h: v.h || null, n: v.j || null, b: v.b || null });
  return p;
}

// Squadra della rosa da cui si apre un giocatore (SquadraRosa): se il giocatore non ha ancora statistiche, la scheda si costruisce dalla sua riga di rosa.
const HINT = new Map();
export const rosaHint = (pid, teamFm) => { if (pid && teamFm) lruSet(HINT, String(pid), String(teamFm), 400); };
// riga del giocatore nelle rose (rosa/<id%100>.json) delle squadre indicate: [riga, id FotMob squadra] o null
async function rosaRowOf(pid, teamFms) {
  const found = await Promise.all([...new Set(teamFms.filter(Boolean).map(String))].map(async (t) => {
    const ro = await rosaOf({ fmId: t }).catch(() => null);
    const r = ro && (ro.p || []).find((x) => String(x[0]) === String(pid));
    return r ? [r, t] : null;
  }));
  return found.find(Boolean) || null;
}

export async function makeArchivePlayer(fm, sk, pid) {
  if (fm === 'espn') return makeEspnPlayer(pid);
  const id = archiveId(fm, sk, pid);
  const lite = playerById(id);
  if (lite && !lite.lite) return lite;
  await Promise.all([loadCarriere(), loadRose()]);
  const rp = rosePlayer(pid);
  let R = rp ? rp.r : null;
  const lid = LID_BY_FM[Number(fm)] || null;
  const [st, season] = await Promise.all([loadPlayerStatsFor(fm, sk, pid), loadSeason(fm, sk)]);
  // senza statistiche (appena arrivato): si usano i dati della rosa
  let hit = rowsOf(st, pid) || (R ? { me: [pid, R[1], null, null, 0, 0], by: {} } : null);
  // nessuna presenza (giovani, riserve, appena arrivati): scheda dalla riga della rosa completa (eta', altezza, ruolo, numero, nazionalita', squadra), mai vuota
  let rTeam = null;
  if (!hit) {
    const h = lruGet(HINT, String(pid));
    const rr = (h && (await rosaRowOf(pid, [h]))) || (season && season.teams ? await rosaRowOf(pid, Object.keys(season.teams)) : null);
    if (rr) { R = rr[0]; rTeam = rr[1]; hit = { me: [pid, R[1], rTeam, null, 0, 0], by: {} }; }
  }
  if (!hit) return null;
  const { me, by } = hit;
  const teamName = (season && season.teams && season.teams[me[2]]) || (rp ? rp.team : '') || (rTeam && (teamByFm(rTeam) || {}).name) || '';
  const team = teamName ? ensureTeam(teamName, lid) : null;
  const v = (k) => (by[k] ? by[k][3] : null);
  // totali veri anche dove la classifica ufficiale e' ogni 90' (tiri, tiri in porta, falli)
  const tot = (k) => (by[k] ? statTotal(st, k, by[k]) : 0);
  const shown = realName(pid, me[1]);
  const initials = String(shown).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const p = {
    id, teamId: team ? team.id : null, teamName, leagueId: lid, name: shown, nick: shown !== me[1] ? me[1] : null, initials, number: R ? R[3] : null, position: R ? R[2] : null,
    photo: playerFace(pid), hasStats: false, archive: true, sk,
    rating: v('rating') || (R && R[7]) || null, appearances: me[5] || 0, minutes: me[4] || 0, goals: v('goals') || (R && R[8]) || 0, assists: v('goal_assist') || (R && R[9]) || 0,
    shots: tot('total_scoring_att'), shotsOnTarget: tot('ontarget_scoring_att'), xg: v('expected_goals') || null,
    exS: null, exL5: null, l5g: 0, l5min: 0, l5y: 0, l5r: 0, foulsCommitted: tot('fouls'), foulsDrawn: 0, offsides: 0,
    yellows: v('yellow_card') || 0, reds: v('red_card') || 0, l: [0, 0, 0, 0], c: [0, 0, 0, 0], r: [], h: [],
    shots5: [], sot5: [], minutes5: [], recent: [], ratings5: [],
  };
  // giocatore dei campionati aggiunti: tiri e ultime partite per l'Affidabilita' restano (la scheda completa sostituisce solo il resto)
  if (lite && lite.lite) Object.assign(p, { l: lite.l, c: lite.c, r: lite.r, h: lite.h, hn: lite.hn, hp: lite.hp, shots5: lite.shots5, sot5: lite.sot5, minutes5: lite.minutes5, recent: lite.recent, ratings5: lite.ratings5, leagueId: lite.leagueId || p.leagueId, teamId: p.teamId || lite.teamId, teamName: p.teamName || lite.teamName });
  // collegamenti del profilo "leggero" (13/11/2026): la scheda ricostruita dall'archivio deve restare collegata alla nazionale (Nations League), all'id FotMob
  // e al campionato del club; prima li perdeva e Affidabilita' e Calcolatore restavano senza nazionale, ultime partite e club
  p.fmId = (lite && lite.fmId) || Number(pid);
  if (lite && lite.lite) {
    p.domFm = lite.domFm;
    if (lite.natView) { p.natView = lite.natView; lite.natView.club = p; }
  }
  // nazionale anche per le schede senza profilo "leggero" (17/11/2026): stesso id FotMob del profilo Nations League
  if (!p.natView) { const v = natByFm(p.fmId); if (v) { p.natView = v; if (!v.club) v.club = p; } }
  registerPlayer(p);
  // carriera ricostruita dalle stagioni in cui ha giocato questa competizione
  let car = [];
  try {
    const list = await playerSeasons(fm, pid);
    const all = [...new Set([...list, sk])].sort().reverse();
    car = (await Promise.all(all.map(async (s) => {
      const [ss, sn] = await Promise.all([loadPlayerStatsFor(fm, s, pid), loadSeason(fm, s)]);
      const h = rowsOf(ss, pid);
      if (!h) return null;
      const y = Number(String(s).slice(0, 4));
      const tn = (sn && sn.teams && sn.teams[h.me[2]]) || '';
      return [tn, `${y}-07`, `${y + 1}-06`, h.me[5] || 0, (h.by.goals || [])[3] || 0, (h.by.goal_assist || [])[3] || 0, 0, 0, h.me[2]];
    }))).filter(Boolean);
  } catch (e) { /* ignora */ }
  setCarriere(id, { fm: String(pid), car, ...(R ? { c: R[4], h: R[6], n: R[3] } : {}) });
  return p;
}
