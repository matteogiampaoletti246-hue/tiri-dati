// Dati derivati: precedenti, calendario squadra, numeri chiave della partita.
import { loadDetail } from './load';
import { MATCHES, MATCH_BY_ID } from './matches';
import { metricOf, hasMetrics, CATEGORY_DEFS, teamsInComp } from './standings';
import { archiveMetrics, listMetrics } from './archiveMetrics';
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
// statistiche in cui "meno e' meglio" (la posizione si conta al contrario)
const NEG_KEYS = new Set(['golSubiti', 'xgSubiti', 'tiriConcessi', 'tiriInPortaConcessi', 'occasioniConcesse', 'cornerConcessi', 'fuorigioco', 'falli', 'gialli', 'rossi']);
const PCT_KEYS = new Set(['possesso', 'precisione']);
const KM_METRICS = CATEGORY_DEFS.flatMap((c) => c.metrics);

// Fonte delle medie a partita: top campionati = classifiche dell'app; campionati e coppe aggiunti = partite archiviate
// (archiveMetrics) o, senza partite, classifiche squadra della stagione (listMetrics). Stesso calcolo per tutti.
function kmSource(match) {
  if (match.archive) {
    const a1 = archiveMetrics(match);
    const am = a1 && a1.tids().length ? a1 : listMetrics(match);
    if (!am) return null;
    const lg = leagueById(match.leagueId) || (match.leagueObj || null);
    return { tids: am.tids(), value: am.value, home: String(match.archive.hid), away: String(match.archive.aid), name: () => (lg ? lg.name : '') };
  }
  const side = (id) => {
    const t = teamById(id);
    const lid = (t && t.leagueId) || match.leagueId;
    return { lid, tids: teamsInComp(lid).filter((x) => hasMetrics(x.id)).map((x) => x.id) };
  };
  return { perSide: { home: side(match.homeId), away: side(match.awayId) }, value: (id, k) => (hasMetrics(id) ? metricOf(id, k) : null), home: match.homeId, away: match.awayId, name: (lid) => (leagueById(lid) || {}).name || '' };
}

// Numeri da tenere d'occhio: solo le statistiche in cui una delle due squadre e' tra le prime o le ultime del suo campionato
// (in positivo e in negativo), con valore e posizione. Niente numeri uguali per tutte le partite: se non c'e' nulla di notevole, non c'e' nulla.
export function matchKeyNumbers(match) {
  if (match._km && match._km.at > Date.now() - 60000) return match._km.cards;
  const src = kmSource(match);
  const cards = [];
  if (src) {
    ['home', 'away'].forEach((side) => {
      const tid = src[side];
      const pool = src.perSide ? src.perSide[side].tids : src.tids;
      const lname = src.name(src.perSide ? src.perSide[side].lid : null);
      if (!tid || pool.length < 6 || !pool.map(String).includes(String(tid))) return;
      const edge = Math.max(2, Math.ceil(pool.length * 0.12));
      KM_METRICS.forEach((mt) => {
        const v = src.value(tid, mt.key);
        if (v === null || v === undefined || !Number.isFinite(v)) return;
        const vals = pool.map((x) => src.value(x, mt.key)).filter((x) => x !== null && x !== undefined && Number.isFinite(x));
        if (vals.length < 6) return;
        const neg = NEG_KEYS.has(mt.key);
        const better = vals.filter((x) => (neg ? x < v : x > v)).length;
        const rank = better + 1;
        const n = vals.length;
        if (rank > edge && rank <= n - edge) return;
        // valore condiviso da tante squadre (es. 0 espulsioni): non e' un primato
        if (vals.filter((x) => Math.abs(x - v) < 1e-9).length > edge) return;
        const top = rank <= edge;
        const pct = PCT_KEYS.has(mt.key);
        cards.push({
          side, value: v, digits: pct ? 0 : Math.abs(v) < 10 ? (/^xg/i.test(mt.key) ? 2 : 1) : 0, unit: pct ? '%' : '',
          label: `${mt.label}${pct ? '' : ' a partita'}`,
          note: `${top ? rank : `${rank}° su ${n}`}${top ? '°' : ''} in ${lname}${top ? (rank === 1 ? ' · la migliore' : '') : ' · tra le ultime'}`,
          score: (top ? rank - 1 : n - rank) + KM_METRICS.indexOf(mt) / 1000, // a parita' prima le statistiche principali
        });
      });
    });
  }
  // forma in casa / fuori e Over 2,5: solo se davvero fuori dal comune
  const rec = venueRecord(match.awayId, 'away', 5);
  if (rec.played >= 4 && (rec.wins >= rec.played - 1 || rec.wins === 0)) cards.push({ side: 'away', value: rec.wins, digits: 0, unit: '', label: `${rec.wins === 1 ? 'vittoria' : 'vittorie'} fuori casa su ${rec.played}`, note: 'Fuori casa', score: 0.5 });
  const over = overRate(match.homeId, 2.5, 10);
  if (over.played >= 6 && (over.pct >= 75 || over.pct <= 20)) cards.push({ side: 'home', value: over.pct, digits: 0, unit: '%', label: 'Over 2,5', note: `nelle ultime ${over.played} partite`, score: 0.5 });
  cards.sort((a, b) => a.score - b.score);
  // casa e trasferta alternate, cosi' si vedono i punti notevoli di entrambe
  const H = cards.filter((c) => c.side === 'home'); const A = cards.filter((c) => c.side === 'away');
  const mixed = [];
  while ((H.length || A.length) && mixed.length < 8) { if (H.length) mixed.push(H.shift()); if (A.length && mixed.length < 8) mixed.push(A.shift()); }
  const out = mixed;
  const ref = refereeById(match.refereeId) || findRefereeByName(match.refereeName);
  if (ref && ref.games) out.push({ side: 'ref', value: ref.yellowsAvg, digits: 1, unit: '', label: 'cartellini gialli a partita', note: `Arbitro · ${ref.name}` });
  match._km = { at: Date.now(), cards: out };
  return out;
}
