// Dati MOCK aggiuntivi derivati in modo deterministico (precedenti, calendario squadra).
import { DAY_MS, MATCHES, TODAY, isoDate, STRENGTH } from './matches';
import { metricOf, rankOf, teamRow } from './standings';
import { leagueById } from './leagues';
import { refereeById } from './referees';

function seedOf(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const H2H = {};

export function headToHead(aId, bId, n = 5) {
  const key = [aId, bId].sort().join('|');
  if (!H2H[key]) {
    const r = rng(seedOf(`h2h-${key}`));
    const sa = STRENGTH[aId] || 0.5;
    const sb = STRENGTH[bId] || 0.5;
    const list = [];
    for (let i = 0; i < 6; i++) {
      const swap = r() < 0.5;
      const homeId = swap ? bId : aId;
      const awayId = swap ? aId : bId;
      const hs = Math.min(6, Math.floor(r() * (0.6 + (swap ? sb : sa) * 1.9)));
      const as = Math.min(6, Math.floor(r() * (0.5 + (swap ? sa : sb) * 1.7)));
      const daysAgo = (i + 1) * 24 + Math.floor(r() * 40);
      list.push({ id: `h2h-${key}-${i}`, homeId, awayId, score: [hs, as], date: isoDate(new Date(TODAY.getTime() - daysAgo * DAY_MS)) });
    }
    H2H[key] = list;
  }
  return H2H[key].slice(0, n);
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

export const recentMatches = (teamId, n = 5) =>
  MATCHES.filter((m) => m.status === 'finished' && (m.homeId === teamId || m.awayId === teamId))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, n);

export const upcomingMatches = (teamId, n = 5) =>
  MATCHES.filter((m) => m.status !== 'finished' && (m.homeId === teamId || m.awayId === teamId))
    .sort((a, b) => a.ts - b.ts)
    .slice(0, n);

export const allTeamMatches = (teamId) => MATCHES.filter((m) => m.homeId === teamId || m.awayId === teamId).sort((a, b) => a.ts - b.ts);

export const matchesByReferee = (refereeId) => MATCHES.filter((m) => m.refereeId === refereeId).sort((a, b) => b.ts - a.ts);

export function playerShots(playerId, n = 14) {
  const list = [];
  MATCHES.filter((m) => m.status !== 'scheduled')
    .sort((a, b) => b.ts - a.ts)
    .forEach((m) => {
      m.shots.forEach((s) => {
        if (s.playerId === playerId) list.push(s);
      });
    });
  return list.slice(0, n);
}

/* ── Serie recente per campo ── */
export function teamFinished(teamId) {
  return MATCHES.filter((m) => m.status === 'finished' && (m.homeId === teamId || m.awayId === teamId)).sort((a, b) => b.ts - a.ts);
}

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
  const lid = match.leagueId;
  const league = leagueById(lid);
  const name = league ? league.name : '';

  const perGame = (teamId, key) => {
    const row = teamRow(lid, teamId);
    const played = row ? row.played : 0;
    return played ? metricOf(teamId, key) / played : 0;
  };

  const rankNote = (teamId, key) => {
    const rank = rankOf(lid, key, teamId).rank;
    return rank ? `${rank}° in ${name}` : name;
  };

  const ref = refereeById(match.refereeId);
  const record = venueRecord(match.awayId, 'away', 5);
  const over = overRate(match.homeId, 2.5, 10);

  return [
    { side: 'home', value: perGame(match.homeId, 'tiriInPorta'), digits: 1, unit: '', label: 'tiri in porta a partita', note: rankNote(match.homeId, 'tiriInPorta') },
    { side: 'away', value: record.wins, digits: 0, unit: '', label: `${record.wins === 1 ? 'vittoria' : 'vittorie'} fuori casa su ${record.played}`, note: 'Fuori casa' },
    { side: 'home', value: over.pct, digits: 0, unit: '%', label: 'Over 2,5', note: `nelle ultime ${over.played} partite` },
    { side: 'away', value: perGame(match.awayId, 'xg'), digits: 1, unit: '', label: 'xG a partita', note: rankNote(match.awayId, 'xg') },
    { side: 'home', value: perGame(match.homeId, 'corner'), digits: 1, unit: '', label: 'corner a partita', note: rankNote(match.homeId, 'corner') },
    { side: 'ref', value: ref && ref.games ? ref.yellows / ref.games : 0, digits: 1, unit: '', label: 'cartellini a partita', note: ref ? `Arbitro · ${ref.name}` : 'Arbitro' },
  ];
}
