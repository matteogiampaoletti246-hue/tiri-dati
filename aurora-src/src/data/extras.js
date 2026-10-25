// Dati derivati: precedenti, calendario squadra, numeri chiave della partita.
import { loadDetail } from './load';
import { MATCHES, MATCH_BY_ID } from './matches';
import { metricOf, rankOf, hasMetrics } from './standings';
import { leagueById } from './leagues';
import { findRefereeByName, refereeById } from './referees';
import { teamById } from './teams';
import { playerById } from './players';

const finished = (m) => m.status === 'finished' && m.score;
const involves = (teamId) => (m) => m.homeId === teamId || m.awayId === teamId;

export function headToHead(aId, bId, n = 5) {
  return MATCHES.filter((m) => finished(m) && ((m.homeId === aId && m.awayId === bId) || (m.homeId === bId && m.awayId === aId)))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, n);
}

export function h2hSummary(aId, bId) {
  const list = headToHead(aId, bId, 5);
  let a = 0;
  let b = 0;
  let d = 0;
  list.forEach((m) => {
    if (m.score[0] === m.score[1]) d++;
    else if ((m.score[0] > m.score[1] ? m.homeId : m.awayId) === aId) a++;
    else b++;
  });
  return { a, b, d, total: list.length };
}

export const recentMatches = (teamId, n = 5) => MATCHES.filter((m) => finished(m) && involves(teamId)(m)).sort((a, b) => b.ts - a.ts).slice(0, n);

export const upcomingMatches = (teamId, n = 5) => MATCHES.filter((m) => m.status !== 'finished' && involves(teamId)(m)).sort((a, b) => a.ts - b.ts).slice(0, n);

export const allTeamMatches = (teamId) => MATCHES.filter(involves(teamId)).sort((a, b) => a.ts - b.ts);

export function matchesByReferee(refereeId) {
  const r = refereeById(refereeId);
  if (!r) return [];
  const out = [];
  const seen = new Set();
  r.matches.forEach((rm) => {
    const m = rm.id && MATCH_BY_ID[rm.id];
    if (m && !seen.has(m.id)) {
      seen.add(m.id);
      out.push(m);
    }
  });
  MATCHES.forEach((m) => {
    if (m.refereeId === refereeId && !seen.has(m.id)) {
      seen.add(m.id);
      out.push(m);
    }
  });
  return out.sort((a, b) => b.ts - a.ts);
}

// Tiri di un giocatore nelle sue ultime partite (scarica i dettagli delle partite recenti).
const shotsCache = {};
export function playerShots(playerId) {
  return shotsCache[playerId] || [];
}
export async function loadPlayerShots(playerId, n = 14) {
  const p = playerById(playerId);
  if (!p) return [];
  if (shotsCache[playerId]) return shotsCache[playerId];
  const ids = p.recent.slice(0, 5).map((r) => r.matchId).filter(Boolean);
  const out = [];
  await Promise.all(
    ids.map(async (id) => {
      const d = await loadDetail(id);
      if (!d) return;
      (d.tr || []).forEach((t) => {
        if (t[2] !== p.name) return;
        out.push({
          side: 'home',
          outcome: { Goal: 'Gol', AttemptSaved: 'Parato', Miss: 'Fuori', Post: 'Fuori' }[t[11]] || 'Fuori',
          playerName: t[2],
          minute: t[0],
          body: { RightFoot: 'Destro', LeftFoot: 'Sinistro', Header: 'Testa', OtherBodyParts: 'Altro' }[t[10]] || 'Altro',
          xg: t[5] || 0,
          x: Math.max(0, Math.min(1, t[3] / 105)),
          y: Math.max(0, Math.min(0.6, (t[4] / 68) * 0.6)),
          date: d.d,
        });
      });
    }),
  );
  out.sort((a, b) => (a.date < b.date ? 1 : -1));
  shotsCache[playerId] = out.slice(0, n);
  return shotsCache[playerId];
}

/* ── Serie recente per campo ── */
export const teamFinished = (teamId) => MATCHES.filter((m) => finished(m) && involves(teamId)(m)).sort((a, b) => b.ts - a.ts);

export function venueRecord(teamId, venue, n = 5) {
  const list = teamFinished(teamId)
    .filter((m) => (venue === 'home' ? m.homeId === teamId : m.awayId === teamId))
    .slice(0, n);
  let wins = 0;
  let draws = 0;
  let losses = 0;
  list.forEach((m) => {
    const isHome = m.homeId === teamId;
    const gf = isHome ? m.score[0] : m.score[1];
    const ga = isHome ? m.score[1] : m.score[0];
    if (gf > ga) wins += 1;
    else if (gf === ga) draws += 1;
    else losses += 1;
  });
  return { played: list.length, wins, draws, losses };
}

export function overRate(teamId, line = 2.5, n = 10) {
  const list = teamFinished(teamId).slice(0, n);
  const over = list.filter((m) => m.score[0] + m.score[1] > line).length;
  return { over, played: list.length, pct: list.length ? Math.round((over / list.length) * 100) : 0 };
}

/* ── Numeri chiave della partita (card stile storie) ── */
export function matchKeyNumbers(match) {
  const lid = teamById(match.homeId)?.leagueId || match.leagueId;
  const league = leagueById(lid) || leagueById(match.leagueId);
  const name = league ? league.name : '';
  const rankNote = (teamId, key) => {
    const t = teamById(teamId);
    const rank = rankOf(t ? t.leagueId : lid, key, teamId).rank;
    return rank ? `${rank}° in ${leagueById(t ? t.leagueId : lid)?.name || name}` : name;
  };
  const cards = [];
  if (hasMetrics(match.homeId)) {
    cards.push({ side: 'home', value: metricOf(match.homeId, 'tiriInPorta'), digits: 1, unit: '', label: 'tiri in porta a partita', note: rankNote(match.homeId, 'tiriInPorta') });
  }
  const record = venueRecord(match.awayId, 'away', 5);
  if (record.played) {
    cards.push({ side: 'away', value: record.wins, digits: 0, unit: '', label: `${record.wins === 1 ? 'vittoria' : 'vittorie'} fuori casa su ${record.played}`, note: 'Fuori casa' });
  }
  const over = overRate(match.homeId, 2.5, 10);
  if (over.played) {
    cards.push({ side: 'home', value: over.pct, digits: 0, unit: '%', label: 'Over 2,5', note: `nelle ultime ${over.played} partite` });
  }
  if (hasMetrics(match.awayId)) {
    cards.push({ side: 'away', value: metricOf(match.awayId, 'xg'), digits: 1, unit: '', label: 'xG a partita', note: rankNote(match.awayId, 'xg') });
  }
  if (hasMetrics(match.homeId)) {
    cards.push({ side: 'home', value: metricOf(match.homeId, 'corner'), digits: 1, unit: '', label: 'corner a partita', note: rankNote(match.homeId, 'corner') });
  }
  const ref = refereeById(match.refereeId) || findRefereeByName(match.refereeName);
  if (ref && ref.games) {
    cards.push({ side: 'ref', value: ref.yellowsAvg, digits: 1, unit: '', label: 'cartellini gialli a partita', note: `Arbitro · ${ref.name}` });
  }
  return cards;
}
