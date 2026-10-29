// Giocatori che non sono nell'elenco attuale (ritirati, stagioni passate, altri campionati):
// si costruisce lo stesso oggetto giocatore dai dati dell'archivio, cosi' la scheda e' identica per tutti.
import { loadPlayerStats, loadSeason, playerSeasons, playerFace, FM_ID } from './archive';
import { registerPlayer, playerById } from './players';
import { ensureTeam } from './teams';
import { loadCarriere, setCarriere } from './carriere';
import { loadRose, rosePlayer } from './rose';

const LID_BY_FM = {};
Object.keys(FM_ID).forEach((k) => { LID_BY_FM[FM_ID[k]] = k; });

export const archiveId = (fm, sk, pid) => `fm~${fm}~${sk}~${pid}`;
export const parseArchiveId = (id) => {
  // stagione anche con suffisso: "2026-2027 - Apertura", "2026 - Clausura"
  let s = String(id || '');
  try { s = decodeURIComponent(s); } catch (e) { /* gia' in chiaro */ }
  const m = /^fm~(\d+)~([^~]+)~(\d+)$/.exec(s);
  return m ? { fm: m[1], sk: m[2], pid: m[3] } : null;
};

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

export async function makeArchivePlayer(fm, sk, pid) {
  const id = archiveId(fm, sk, pid);
  if (playerById(id)) return playerById(id);
  await Promise.all([loadCarriere(), loadRose()]);
  const rp = rosePlayer(pid);
  const R = rp ? rp.r : null;
  const lid = LID_BY_FM[Number(fm)] || null;
  const [st, season] = await Promise.all([loadPlayerStats(fm, sk), loadSeason(fm, sk)]);
  // senza statistiche (appena arrivato): si usano i dati della rosa
  const hit = rowsOf(st, pid) || (R ? { me: [pid, R[1], null, null, 0, 0], by: {} } : null);
  if (!hit) return null;
  const { me, by } = hit;
  const teamName = (season && season.teams && season.teams[me[2]]) || (rp ? rp.team : '');
  const team = teamName ? ensureTeam(teamName, lid) : null;
  const v = (k) => (by[k] ? by[k][3] : null);
  const initials = String(me[1]).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const p = {
    id, teamId: team ? team.id : null, teamName, leagueId: lid, name: me[1], initials, number: R ? R[3] : null, position: R ? R[2] : null,
    photo: playerFace(pid), hasStats: false, archive: true, sk,
    rating: v('rating') || (R && R[7]) || null, appearances: me[5] || 0, minutes: me[4] || 0, goals: v('goals') || (R && R[8]) || 0, assists: v('goal_assist') || (R && R[9]) || 0,
    shots: v('total_scoring_att') || 0, shotsOnTarget: v('ontarget_scoring_att') || 0, xg: v('expected_goals') || null,
    exS: null, exL5: null, l5g: 0, l5min: 0, l5y: 0, l5r: 0, foulsCommitted: v('fouls') || 0, foulsDrawn: 0, offsides: 0,
    yellows: v('yellow_card') || 0, reds: v('red_card') || 0, l: [0, 0, 0, 0], c: [0, 0, 0, 0], r: [], h: [],
    shots5: [], sot5: [], minutes5: [], recent: [], ratings5: [],
  };
  registerPlayer(p);
  // carriera ricostruita dalle stagioni in cui ha giocato questa competizione
  let car = [];
  try {
    const list = await playerSeasons(fm, pid);
    const all = [...new Set([...list, sk])].sort().reverse();
    car = (await Promise.all(all.map(async (s) => {
      const [ss, sn] = await Promise.all([loadPlayerStats(fm, s), loadSeason(fm, s)]);
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
