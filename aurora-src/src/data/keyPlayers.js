// Numeri da tenere d'occhio: giocatori delle due squadre tra i primi 10 della competizione della partita in tiri, tiri in porta,
// falli commessi, falli subiti o fuorigioco (classifica ogni 90', solo chi ha almeno 180'). Stesse classifiche dell'app:
// top 5 campionati da stats.json, le altre competizioni dalle statistiche FotMob della competizione (loadLeaguePlayerStats,
// totali dalle partite con statsFromMatches solo se concordano con la classifica ufficiale). Nessun giocatore = nessuna scheda.
import { PLAYERS, playerByFm } from './players';
import { leagueById } from './leagues';
import { teamById, teamByFm } from './teams';
import { FM_ID, currentSeason, loadSeason, loadLeaguePlayerStats, statsFromMatches, playerFace, teamIdByName } from './archive';
import { lruGet, lruSet } from '../lib/lru';

const TOP5 = new Set(['premier-league', 'serie-a', 'la-liga', 'bundesliga', 'ligue-1']);
const MIN_MIN = 180;
const TOP_N = 10;
const MAX_CARDS = 6;
// off = voce ufficiale FotMob della stagione (p90: gia' media ogni 90'), ex = voce sommata dalle partite
const DEFS = [
  { id: 'shots', label: 'Tiri', unit: 'tiri', top5: 'shots', off: 'total_scoring_att', p90: true, ex: 'total_shots' },
  { id: 'sot', label: 'Tiri in porta', unit: 'tiri in porta', top5: 'shotsOnTarget', off: 'ontarget_scoring_att', p90: true, ex: 'ShotsOnTarget' },
  { id: 'fouls', label: 'Falli commessi', unit: 'falli', top5: 'foulsCommitted', off: 'fouls', p90: true, ex: 'fouls' },
  // falli subiti: solo dalla classifica della competizione (loadLeaguePlayerStats); se non c'e', la statistica non si mostra
  { id: 'fouled', label: 'Falli subiti', unit: 'falli subiti', top5: 'foulsDrawn', off: 'was_fouled', p90: false, ex: null },
  { id: 'offs', label: 'Fuorigioco', unit: 'fuorigioco', top5: 'offsides', off: null, p90: false, ex: 'Offsides' },
];

const fmOfLeague = (lid) => {
  const l = leagueById(lid);
  const m = /^fm-(\d+)$/.exec(String(lid));
  return FM_ID[lid] || (l && l.fm) || (m ? Number(m[1]) : null);
};
const fmOfTeam = (t) => {
  if (!t) return null;
  if (t.fmId) return String(t.fmId);
  const m = /teamlogo\/(\d+)\.png/.exec(String(t.crest || ''));
  return m ? m[1] : null;
};

// stesso controllo del pannello Giocatori (exactAgrees in ArchiveLeague.jsx): le partite valgono solo se danno la media ufficiale
const agrees = (ex, official) => {
  const by = new Map(ex.map((r) => [String(r[0]), r]));
  let n = 0;
  let g = 0;
  (official || []).forEach((r) => { const e = by.get(String(r[0])); if (!e || !(e[4] > 0)) return; n += 1; if (Math.abs((e[3] * 90) / e[4] - r[3]) <= 0.06) g += 1; });
  return n >= 8 && g / n >= 0.95;
};

// righe [id, nome, squadra FotMob, valore, minuti] -> {pid, name, tfm, p90, tot}
const fromRows = (rows, isP90) => rows
  .filter((r) => Number(r[4]) >= MIN_MIN && r[3] != null && Number.isFinite(Number(r[3])))
  .map((r) => ({ pid: r[0], name: r[1], tfm: String(r[2]), p90: isP90 ? Number(r[3]) : (Number(r[3]) * 90) / Number(r[4]), tot: isP90 ? null : Number(r[3]) }));

async function archiveBoards(fm) {
  const sk = await currentSeason(fm);
  if (!sk) return null;
  const [st, ex, season] = await Promise.all([loadLeaguePlayerStats(fm, sk).catch(() => null), statsFromMatches(fm, sk).catch(() => null), loadSeason(fm, sk).catch(() => null)]);
  if (!st || !st.players) return null;
  // squadre della stagione (id FotMob -> nome): per le squadre dell'app senza id FotMob (stemma PitchAPI, es. coppe europee)
  const out = { _teams: (season && season.teams) || {} };
  DEFS.forEach((d) => {
    if (st.fromMatches) {
      const k = d.ex || d.off;
      if (k && st.players[k]) out[d.id] = fromRows(st.players[k], false);
      return;
    }
    const off = d.off && st.players[d.off];
    const exl = d.ex && ex && ex.players && ex.players[d.ex];
    if (off && d.p90) out[d.id] = exl && agrees(exl, off) ? fromRows(exl, false) : fromRows(off, true);
    else if (off) out[d.id] = fromRows(off, false);
    else if (exl && !d.off) out[d.id] = fromRows(exl, false);
  });
  return out;
}

function top5Boards(lid) {
  const pool = PLAYERS.filter((p) => p.hasStats && p.leagueId === lid && p.minutes >= MIN_MIN);
  const out = {};
  DEFS.forEach((d) => {
    out[d.id] = pool.map((p) => ({ pid: p.id, name: p.name, tid: p.teamId, photo: p.photo, p90: (p[d.top5] * 90) / p.minutes, tot: p[d.top5] }));
  });
  return out;
}

const BOARDS = new Map();
const boardsFor = async (lid) => {
  const hit = lruGet(BOARDS, lid);
  if (hit) return hit;
  const fm = TOP5.has(lid) ? null : fmOfLeague(lid);
  const b = TOP5.has(lid) ? top5Boards(lid) : fm ? await archiveBoards(fm) : null;
  if (b) lruSet(BOARDS, lid, b, 8);
  return b;
};

const RES = new Map();
export async function matchKeyPlayers(match) {
  if (!match) return [];
  const ck = `${match.id}|${match.leagueId}`;
  const hit = lruGet(RES, ck);
  if (hit && hit.at > Date.now() - 600000) return hit.cards;
  const boards = await boardsFor(match.leagueId);
  if (!boards) return [];
  const lname = (leagueById(match.leagueId) || {}).name || '';
  const sides = { home: teamById(match.homeId), away: teamById(match.awayId) };
  const fmSide = {};
  ['home', 'away'].forEach((k) => {
    const f = fmOfTeam(sides[k]) || (boards._teams && sides[k] ? teamIdByName(boards._teams, sides[k].name) : null);
    if (f) fmSide[String(f)] = k;
  });
  const sideOf = (r) => {
    if (r.tid !== undefined) return r.tid === match.homeId ? 'home' : r.tid === match.awayId ? 'away' : null;
    if (fmSide[r.tfm]) return fmSide[r.tfm];
    const t = teamByFm(r.tfm);
    return t ? (t.id === match.homeId ? 'home' : t.id === match.awayId ? 'away' : null) : null;
  };
  const by = new Map();
  DEFS.forEach((d, di) => {
    const list = boards[d.id];
    if (!list || list.length < TOP_N) return;
    list.forEach((r) => {
      if (!(r.p90 > 0)) return;
      const side = sideOf(r);
      if (!side) return;
      const rank = 1 + list.filter((x) => x.p90 > r.p90 + 1e-9).length; // pari merito = stessa posizione
      if (rank > TOP_N) return;
      const key = String(r.pid);
      const e = by.get(key) || { side, pid: r.pid, name: r.name, photo: r.photo || null, stats: [] };
      e.stats.push({ id: d.id, label: d.label, unit: d.unit, rank, p90: r.p90, tot: r.tot, order: di });
      by.set(key, e);
    });
  });
  const cards = [...by.values()].map((e) => {
    e.stats.sort((a, b) => a.rank - b.rank || a.order - b.order);
    const [best, ...rest] = e.stats;
    const fmPhoto = e.photo || (/^\d+$/.test(String(e.pid)) ? (playerByFm(e.pid) || {}).photo || playerFace(e.pid) : null);
    return { kind: 'player', side: e.side, pid: e.pid, name: e.name, photo: fmPhoto, stat: best.label, unit: best.unit, rank: best.rank, p90: best.p90, tot: best.tot, comp: lname, also: rest.slice(0, 2).map((s) => ({ label: s.label, rank: s.rank })) };
  }).sort((a, b) => a.rank - b.rank);
  // casa e trasferta alternate, al massimo MAX_CARDS
  const H = cards.filter((c) => c.side === 'home');
  const A = cards.filter((c) => c.side === 'away');
  const out = [];
  while ((H.length || A.length) && out.length < MAX_CARDS) { if (H.length) out.push(H.shift()); if (A.length && out.length < MAX_CARDS) out.push(A.shift()); }
  lruSet(RES, ck, { at: Date.now(), cards: out }, 40);
  return out;
}
