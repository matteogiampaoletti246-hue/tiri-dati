// Giocatori: stats.json (stagione), stats_ex.json (voto, xG), giocatori.json (tiri per partita,
// campionato / coppe), aurora_indice.json (ultime partite con voto) e foto.json (foto).
import { RAW } from './load';
import { ensureTeam, teamByName, teamById } from './teams';
import { norm, slug, r1, r2 } from './util';

export const PLAYERS = [];
export const EX_COLS = [];
export const COACHES = {};

const BY_ID = {};
const BY_KEY = {};
const BY_TEAM = {};

const POS = { P: 'GK', D: 'DEF', C: 'MID', A: 'ATT' };

const initialsOf = (name) =>
  String(name)
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const playerById = (id) => BY_ID[id] || null;
export const playersByTeam = (teamId) => BY_TEAM[teamId] || [];
export const coachOf = (teamId) => COACHES[teamId] || '—';
export const per90 = (value, minutes) => (minutes > 0 ? (value * 90) / minutes : 0);

export const playerLookup = {
  byId: (id) => BY_ID[id] || null,
  byName: (name, team) => (team ? BY_KEY[`${norm(name)}|${team.id}`] || null : null),
};

const keyOf = (name, teamName) => `${norm(name)}|${slug(teamName)}`;

export function buildPlayers() {
  PLAYERS.length = 0;
  Object.keys(BY_ID).forEach((k) => delete BY_ID[k]);
  Object.keys(BY_KEY).forEach((k) => delete BY_KEY[k]);
  Object.keys(BY_TEAM).forEach((k) => delete BY_TEAM[k]);

  const ST = {};
  const STAT_ROWS = (RAW.stats && RAW.stats.players) || [];
  const cols = (RAW.stats && RAW.stats.cols) || [];
  const ix = {};
  cols.forEach((c, i) => {
    ix[c] = i;
  });
  STAT_ROWS.forEach((r) => {
    ST[r[ix.id]] = r;
  });

  // voto e xG stagionali (stats_ex)
  const EXH = (RAW.statsEx && RAW.statsEx.head) || [];
  const EXC = (RAW.statsEx && RAW.statsEx.cols) || [];
  EX_COLS.length = 0;
  EXC.forEach((c) => EX_COLS.push(c));
  const exIx = {};
  EXH.forEach((c, i) => {
    exIx[c] = i;
  });
  const xgIdx = EXC.indexOf('expected_goals');
  const EX = {};
  ((RAW.statsEx && RAW.statsEx.rows) || []).forEach((r) => {
    EX[`${norm(r[exIx.n])}|${slug(r[exIx.t])}`] = r;
  });

  const photoOf = (id) => (RAW.stats && RAW.stats.ph && RAW.stats.ph[id]) || (RAW.foto && RAW.foto[id] && RAW.foto[id].u) || null;
  const recent = (RAW.indice && RAW.indice.p) || {};

  const source = (RAW.giocatori && RAW.giocatori.players) || [];
  const seen = new Set();

  const make = (g, s) => {
    const name = g ? g.n : s[ix.n];
    const teamName = g ? g.t : s[ix.t];
    const team = teamByName(teamName) || ensureTeam(teamName, s ? s[ix.lg] : null);
    const ex = EX[`${norm(name)}|${slug(teamName)}`];
    const rec = recent[`${name}|${teamName}`] || [];
    const lg = g ? g.l : [0, 0, 0, 0];
    const cup = g ? g.c : [0, 0, 0, 0];
    const rows = g ? g.r || [] : [];

    const p = {
      id: g ? g.i : s[ix.id],
      teamId: team.id,
      teamName,
      leagueId: s ? s[ix.lg] : team.leagueId,
      name,
      initials: initialsOf(name),
      number: null,
      position: s ? POS[s[ix.pos]] || null : null,
      photo: photoOf(g ? g.i : s[ix.id]),
      hasStats: !!s,
      rating: ex && ex[exIx.rat] ? r2(ex[exIx.rat]) : null,
      appearances: s ? s[ix.g] : lg[0] + cup[0],
      minutes: s ? s[ix.min] : Math.round(lg[3] + cup[3]),
      goals: s ? s[ix.go] : 0,
      assists: s ? s[ix.as] : 0,
      shots: s ? s[ix.sh] : Math.round(lg[1] + cup[1]),
      shotsOnTarget: s ? s[ix.st] : lg[2] + cup[2],
      xg: ex && xgIdx >= 0 && ex[exIx.s] ? r2(ex[exIx.s][xgIdx] || 0) : null,
      exS: ex ? ex[exIx.s] : null,
      exL5: ex ? ex[exIx.l5] : null,
      l5g: ex ? ex[exIx.l5g] : 0,
      l5min: ex ? ex[exIx.l5min] : 0,
      l5y: ex ? ex[exIx.l5y] : 0,
      l5r: ex ? ex[exIx.l5r] : 0,
      foulsCommitted: s ? s[ix.fo] : 0,
      foulsDrawn: s ? s[ix.fs] : 0,
      offsides: s ? s[ix.of] : 0,
      yellows: s ? s[ix.y] : 0,
      reds: s ? s[ix.r] : 0,
      l: lg,
      c: cup,
      r: rows,
      h: g ? g.h || [] : [],
      shots5: rows.slice(0, 5).map((x) => x[0]),
      sot5: rows.slice(0, 5).map((x) => x[1]),
      minutes5: rows.slice(0, 5).map((x) => x[2]),
      recent: rec.map((x) => ({ date: x[0], rating: x[1], minutes: x[2], goals: x[3], assists: x[4], shots: x[5], sot: x[6], xg: x[7], opp: x[8], home: !!x[9], matchId: x[10] })),
    };
    p.ratings5 = p.recent.slice(0, 5).map((x) => x.rating).filter((v) => v !== null && v !== undefined);
    PLAYERS.push(p);
    BY_ID[p.id] = p;
    BY_KEY[`${norm(name)}|${team.id}`] = p;
    (BY_TEAM[team.id] = BY_TEAM[team.id] || []).push(p);
    seen.add(p.id);
  };

  source.forEach((g) => make(g, ST[g.i] || null));
  STAT_ROWS.forEach((s) => {
    if (!seen.has(s[ix.id])) make(null, s);
  });

  // Ali: centrocampisti/attaccanti che partono titolari larghi e avanzati (ali del 4-3-3, esterni alti del 4-2-3-1, ali del 3-4-3)
  const ALI = {};
  Object.entries(RAW.ali || {}).forEach(([k, v]) => {
    const [n, t] = k.split('|');
    ALI[`${norm(n)}|${slug(t)}`] = v;
  });
  PLAYERS.forEach((p) => {
    if (p.position !== 'MID' && p.position !== 'ATT') return;
    const v = ALI[`${norm(p.name)}|${slug(p.teamName)}`];
    if (v && v[1] >= 4 && v[0] / v[1] >= 0.6) {
      p.basePosition = p.position;
      p.position = 'WNG';
    }
  });

  // allenatori dalle formazioni prevedibili
  const lin = (RAW.partite && RAW.partite.lin) || {};
  ((RAW.partite && RAW.partite.matches) || []).forEach((m) => {
    const l = lin[m.id];
    if (!l) return;
    const h = teamByName(m.h);
    const a = teamByName(m.a);
    if (h && l.h && l.h.co) COACHES[h.id] = l.h.co;
    if (a && l.a && l.a.co) COACHES[a.id] = l.a.co;
  });
}

export const topPlayersBy = (leagueId, valueFn, n = 10) =>
  PLAYERS.filter((p) => p.leagueId === leagueId && p.hasStats)
    .map((p) => ({ player: p, value: valueFn(p) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);

export { r1 };
