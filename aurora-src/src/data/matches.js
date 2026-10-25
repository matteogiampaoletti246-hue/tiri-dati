// Partite, eventi, tiri e formazioni — dati MOCK deterministici relativi a oggi.
import { LEAGUES } from './leagues';
import { TEAMS, TEAMS_BY_LEAGUE } from './teams';
import { playersByTeam } from './players';
import { REFEREES } from './referees';

export const DAY_MS = 86400000;
const OFFSETS = [-5, -4, -3, -2, -1, 0, 1, 2, 3];

export const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

export const DATES = OFFSETS.map((o) => new Date(TODAY.getTime() + o * DAY_MS));
export const TODAY_INDEX = OFFSETS.indexOf(0);

export const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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

const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

function shuffle(arr, r) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poisson(r, lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= r();
  } while (p > L);
  return k - 1;
}

const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export const STRENGTH = {};
TEAMS.forEach((t) => {
  const r = rng(seedOf(`st-${t.id}`));
  STRENGTH[t.id] = 0.42 + r() * 0.5;
});
export const teamStrength = (id) => STRENGTH[id] || 0.5;

const FORMATIONS = [
  { label: '4-3-3', rows: [4, 3, 3], groups: ['DEF', 'MID', 'ATT'] },
  { label: '4-2-3-1', rows: [4, 2, 3, 1], groups: ['DEF', 'MID', 'MID', 'ATT'] },
  { label: '3-5-2', rows: [3, 5, 2], groups: ['DEF', 'MID', 'ATT'] },
  { label: '4-4-2', rows: [4, 4, 2], groups: ['DEF', 'MID', 'ATT'] },
  { label: '3-4-2-1', rows: [3, 4, 2, 1], groups: ['DEF', 'MID', 'MID', 'ATT'] },
];

const STADIUMS = ['Stadio Olimpico', 'San Siro', 'Allianz Stadium', 'Gewiss Stadium', 'Stadio Maradona', 'Emirates Stadium', 'Anfield', 'Etihad Stadium', 'Stamford Bridge', 'Tottenham Stadium', 'Santiago Bernabéu', 'Estadi Olímpic', 'Cívitas Metropolitano', 'San Mamés', 'Allianz Arena', 'Signal Iduna Park', 'Parc des Princes', 'Stade Vélodrome', 'Parc OL', 'Stade Louis II', 'BayArena', 'Red Bull Arena', 'Mapei Stadium', 'Stadio Bentegodi', 'Bluenergy Stadium', 'Stadio Tardini', 'Stadio Sinigaglia', 'U-Power Stadium', 'Stadio Penzo'];
const WEATHER = ['sun', 'cloud', 'rain', 'wind'];
const VAR_TEXTS = ['Gol confermato', 'Gol annullato', 'Rigore assegnato', 'Rigore annullato'];
const PICKS = ['1', 'X', '2', '1X', 'X2', '12', 'Over 2,5'];

const REF_BY_LEAGUE = {};
REFEREES.forEach((rf) => {
  if (!REF_BY_LEAGUE[rf.leagueId]) REF_BY_LEAGUE[rf.leagueId] = [];
  REF_BY_LEAGUE[rf.leagueId].push(rf);
});

function buildLineup(team, r, formation, conceded) {
  const squad = playersByTeam(team.id);
  const gk = squad.filter((p) => p.position === 'GK').sort((a, b) => b.rating - a.rating)[0] || squad[0];
  const picked = [gk];
  const takenIds = new Set([gk.id]);
  formation.rows.forEach((count, ri) => {
    const pos = formation.groups[ri];
    const pool = squad.filter((p) => p.position === pos && !takenIds.has(p.id)).sort((a, b) => b.rating - a.rating);
    pool.slice(0, count).forEach((p) => {
      takenIds.add(p.id);
      picked.push(p);
    });
  });
  const bench = squad.filter((p) => !takenIds.has(p.id)).slice(0, 9);
  const toEntry = (p) => ({
    playerId: p.id,
    name: p.name,
    initials: p.initials,
    number: p.number,
    photo: p.photo,
    position: p.position,
    rating: r1(Math.min(9.4, Math.max(5.6, p.rating + (r() - 0.45) * 0.9))),
    captain: false,
    card: null,
    subOut: null,
  });
  const xi = picked.map(toEntry);
  let best = 1;
  xi.forEach((e, i) => {
    if (i > 0 && e.rating > xi[best].rating) best = i;
  });
  if (xi[best]) xi[best].captain = true;
  if (conceded >= 3 && xi[0]) xi[0].rating = r1(Math.max(4.8, xi[0].rating - 0.6));
  return { formation, xi, bench: bench.map(toEntry) };
}

function buildShots(r, side, xi, count, goals, xgTotal) {
  const outfield = xi.filter((p) => p.position !== 'GK');
  const weighted = [];
  outfield.forEach((p) => {
    const w = p.position === 'ATT' ? 4 : p.position === 'MID' ? 3 : 1;
    for (let i = 0; i < w; i++) weighted.push(p);
  });
  const outcomes = [];
  for (let i = 0; i < goals; i++) outcomes.push('Gol');
  const rest = Math.max(0, count - goals);
  for (let i = 0; i < rest; i++) {
    const t = r();
    outcomes.push(t < 0.4 ? 'Parato' : t < 0.58 ? 'Murato' : 'Fuori');
  }
  const shots = outcomes.map((outcome) => {
    const shooter = weighted[Math.floor(r() * weighted.length)];
    return {
      side,
      outcome,
      playerName: shooter.name,
      playerId: shooter.playerId,
      minute: int(r, 1, 90),
      body: pick(r, ['Destro', 'Sinistro', 'Testa', 'Destro', 'Altro']),
      raw: 0.04 + r() * 0.34,
      cx: r(),
      cy: r(),
    };
  });
  const sum = shots.reduce((a, s) => a + s.raw, 0) || 1;
  const k = xgTotal / sum;
  shots.forEach((s) => {
    s.xg = r2(Math.max(0.01, s.raw * k));
    s.x = r2(0.1 + s.cx * 0.8);
    s.y = r2(0.05 + s.cy * 0.5);
    delete s.raw;
    delete s.cx;
    delete s.cy;
  });
  shots.sort((a, b) => a.minute - b.minute);
  return shots;
}

function buildMatch(leagueId, home, away, offset, dayIndex, pairIndex, r) {
  const date = DATES[OFFSETS.indexOf(offset)];
  const status = offset < 0 ? 'finished' : offset > 0 ? 'scheduled' : pairIndex === 0 ? 'live' : pairIndex <= 2 ? 'finished' : 'scheduled';

  let kickoff;
  let ts;
  let liveBaseMinute = null;
  let liveBaseTs = null;

  if (status === 'live') {
    const base = int(r, 26, 74);
    liveBaseMinute = base;
    liveBaseTs = Date.now();
    ts = liveBaseTs - base * 60000;
    kickoff = hhmm(new Date(ts));
  } else {
    const slot = status === 'finished' ? pick(r, ['12:30', '15:00', '16:00', '18:00']) : pick(r, ['18:00', '18:30', '20:45', '21:00']);
    kickoff = slot;
    const [h, m] = slot.split(':').map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    ts = d.getTime();
  }

  const sH = STRENGTH[home.id];
  const sA = STRENGTH[away.id];
  const scoreH = Math.min(6, poisson(r, 0.85 + sH * 1.5));
  const scoreA = Math.min(6, poisson(r, 0.6 + sA * 1.3));
  const finalScore = [scoreH, scoreA];

  const possH = Math.max(33, Math.min(67, Math.round(50 + (sH - sA) * 26 + (r() - 0.5) * 10)));
  const shotsH = Math.max(3, Math.round(7 + (sH - sA) * 8 + r() * 8));
  const shotsA = Math.max(2, Math.round(7 + (sA - sH) * 8 + r() * 8));
  const xgH = r2(shotsH * (0.07 + r() * 0.07));
  const xgA = r2(shotsA * (0.07 + r() * 0.07));
  const stats = {
    possesso: [possH, 100 - possH],
    xg: [xgH, xgA],
    tiri: [shotsH, shotsA],
    tiriInPorta: [Math.max(scoreH, Math.round(shotsH * 0.36)), Math.max(scoreA, Math.round(shotsA * 0.36))],
    occasioni: [Math.max(1, Math.round(shotsH * 0.22)), Math.max(1, Math.round(shotsA * 0.22))],
    corner: [int(r, 2, 9), int(r, 1, 8)],
    falli: [int(r, 8, 18), int(r, 8, 18)],
    cartellini: [int(r, 0, 4), int(r, 0, 4)],
    passaggi: [Math.round(320 + possH * 4 + r() * 60), Math.round(320 + (100 - possH) * 4 + r() * 60)],
    fuorigioco: [int(r, 0, 5), int(r, 0, 5)],
  };

  const formationH = FORMATIONS[Math.floor(r() * FORMATIONS.length)];
  const formationA = FORMATIONS[Math.floor(r() * FORMATIONS.length)];
  const lineupHome = buildLineup(home, r, formationH, scoreA);
  const lineupAway = buildLineup(away, r, formationA, scoreH);

  const shotsHome = buildShots(r, 'home', lineupHome.xi, shotsH, scoreH, xgH);
  const shotsAway = buildShots(r, 'away', lineupAway.xi, shotsA, scoreA, xgA);
  const shots = [...shotsHome, ...shotsAway].sort((a, b) => a.minute - b.minute);

  const events = [];
  const goalShots = shots.filter((s) => s.outcome === 'Gol').sort((a, b) => a.minute - b.minute);
  let gh = 0;
  let ga = 0;
  goalShots.forEach((s) => {
    if (s.side === 'home') gh++;
    else ga++;
    events.push({ minute: s.minute, type: 'goal', team: s.side, playerId: s.playerId, name: s.playerName, score: [gh, ga] });
  });

  ['home', 'away'].forEach((side) => {
    const lineup = side === 'home' ? lineupHome : lineupAway;
    const yellows = int(r, 0, 3);
    for (let i = 0; i < yellows; i++) {
      const e = lineup.xi[int(r, 1, lineup.xi.length - 1)];
      if (!e) continue;
      e.card = 'yellow';
      events.push({ minute: int(r, 12, 90), type: 'yellow', team: side, playerId: e.playerId, name: e.name });
    }
    if (r() < 0.14) {
      const e = lineup.xi[int(r, 1, lineup.xi.length - 1)];
      if (e) {
        e.card = 'red';
        events.push({ minute: int(r, 35, 88), type: 'red', team: side, playerId: e.playerId, name: e.name });
      }
    }
    const subs = int(r, 2, 4);
    for (let i = 0; i < subs; i++) {
      const outEntry = lineup.xi[int(r, 1, lineup.xi.length - 1)];
      const inEntry = lineup.bench[int(r, 0, Math.min(6, lineup.bench.length - 1))];
      if (!outEntry || !inEntry || outEntry.subOut) continue;
      const minute = int(r, 46, 88);
      outEntry.subOut = minute;
      inEntry.subIn = minute;
      events.push({ minute, type: 'sub', team: side, playerId: outEntry.playerId, name: outEntry.name, inName: inEntry.name, inId: inEntry.playerId });
    }
    if (r() < 0.5) {
      events.push({ minute: int(r, 20, 85), type: 'var', team: side, name: pick(r, VAR_TEXTS) });
    }
  });

  events.sort((a, b) => a.minute - b.minute || (a.type === 'goal' ? -1 : 1));

  const momentum = [];
  for (let i = 0; i < 18; i++) {
    momentum.push(Math.max(-100, Math.min(100, Math.round((sH - sA) * 70 + (r() - 0.5) * 150))));
  }

  const pollHome = Math.max(12, Math.round(40 + (sH - sA) * 30 + (r() - 0.5) * 18));
  const pollAway = Math.max(12, Math.round(40 + (sA - sH) * 30 + (r() - 0.5) * 18));
  const pollDraw = Math.max(10, 100 - pollHome - pollAway);
  const pollTotal = pollHome + pollDraw + pollAway;

  const refs = REF_BY_LEAGUE[leagueId] || REFEREES;

  return {
    id: `${leagueId}-${dayIndex}-${pairIndex}`,
    leagueId,
    homeId: home.id,
    awayId: away.id,
    date: isoDate(date),
    offset,
    kickoff,
    ts,
    status,
    liveBaseMinute,
    liveBaseTs,
    minute: status === 'live' ? liveBaseMinute : status === 'finished' ? 90 : null,
    score: status === 'scheduled' ? null : finalScore,
    stadium: pick(r, STADIUMS),
    weather: { icon: pick(r, WEATHER), temp: int(r, 8, 24), wind: int(r, 4, 26) },
    refereeId: pick(r, refs).id,
    stats,
    events,
    momentum,
    shots,
    lineup: { home: lineupHome, away: lineupAway },
    poll: {
      home: Math.round((pollHome / pollTotal) * 100),
      draw: Math.round((pollDraw / pollTotal) * 100),
      away: Math.round((pollAway / pollTotal) * 100),
      votes: int(r, 420, 9600),
    },
    affidabilita: { score: r1(5.9 + r() * 3.4), stake: int(r, 1, 5), pick: pick(r, PICKS) },
    odds: { home: r2(1.4 + r() * 2.4), draw: r2(2.9 + r() * 1.6), away: r2(1.5 + r() * 3) },
  };
}

export const MATCHES = [];

LEAGUES.forEach((league) => {
  const teams = TEAMS_BY_LEAGUE[league.id] || [];
  if (teams.length < 4) return;
  const r = rng(seedOf(`lg-${league.id}`));
  const order = shuffle(teams, r);
  const n = order.length;
  OFFSETS.forEach((offset, dayIndex) => {
    const arr = [...order];
    if (!league.staticPairs) {
      for (let k = 0; k < dayIndex; k++) arr.splice(1, 0, arr.pop());
    }
    for (let i = 0; i < n / 2; i++) {
      const home = arr[i];
      const away = arr[n - 1 - i];
      MATCHES.push(buildMatch(league.id, home, away, offset, dayIndex, i, r));
    }
  });
});

export const MATCH_BY_ID = {};
MATCHES.forEach((m) => {
  MATCH_BY_ID[m.id] = m;
});

export const matchById = (id) => MATCH_BY_ID[id] || null;

export const matchesByDate = (dateStr) => MATCHES.filter((m) => m.date === dateStr).sort((a, b) => a.ts - b.ts);

export const matchesForLeague = (leagueId) => MATCHES.filter((m) => m.leagueId === leagueId).sort((a, b) => a.ts - b.ts);

export const liveMatches = () => MATCHES.filter((m) => m.status === 'live');

export const currentMinute = (m) => {
  if (m.status !== 'live') return 90;
  return Math.min(90, m.liveBaseMinute + Math.floor((Date.now() - m.liveBaseTs) / 60000));
};

const scalePair = (pair, k) => pair.map((v) => Math.max(0, Math.round(v * k)));

export function viewMatch(m) {
  if (m.status !== 'live') {
    return { ...m, minute: m.status === 'finished' ? 90 : null, live: false };
  }
  const minute = currentMinute(m);
  const k = Math.min(1, minute / 90);
  const events = m.events.filter((e) => e.minute <= minute);
  const hg = events.filter((e) => e.type === 'goal' && e.team === 'home').length;
  const ag = events.filter((e) => e.type === 'goal' && e.team === 'away').length;
  const stats = {};
  Object.entries(m.stats).forEach(([key, pair]) => {
    stats[key] = key === 'possesso' ? pair : scalePair(pair, k);
  });
  return {
    ...m,
    live: true,
    minute,
    score: [hg, ag],
    events,
    stats,
    shots: m.shots.filter((s) => s.minute <= minute),
    momentum: m.momentum.slice(0, Math.max(3, Math.ceil(minute / 5))),
  };
}

// Forma (ultime 5) calcolata sui risultati
export const TEAM_FORM = {};
MATCHES.filter((m) => m.status === 'finished')
  .sort((a, b) => a.ts - b.ts)
  .forEach((m) => {
    const [sh, sa] = m.score;
    const push = (teamId, res) => {
      if (!TEAM_FORM[teamId]) TEAM_FORM[teamId] = [];
      TEAM_FORM[teamId].push(res);
    };
    push(m.homeId, sh > sa ? 'V' : sh === sa ? 'S' : 'P');
    push(m.awayId, sa > sh ? 'V' : sh === sa ? 'S' : 'P');
  });

export const teamForm = (teamId) => (TEAM_FORM[teamId] || []).slice(-5);
