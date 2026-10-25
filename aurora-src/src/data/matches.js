// Partite: elenco da aurora_indice.json (finite) + partite.json (oggi e prossimi giorni) +
// calendario squadra da teams.json. Il dettaglio (eventi, statistiche, tiri, formazioni)
// si scarica solo quando si apre la partita.
import { RAW, loadDetail } from './load';
import { ensureTeam, teamById, teamByName } from './teams';
import { romeDay, romeTime, slug } from './util';

export const DAY_MS = 86400000;
const OFFSETS = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];

const midday = (iso) => new Date(`${iso}T12:00:00Z`);
export const isoDate = (d) => romeDay(d.getTime());

export const TODAY_ISO = romeDay(Date.now());
export const TODAY = midday(TODAY_ISO);
export const DATES = OFFSETS.map((o) => new Date(TODAY.getTime() + o * DAY_MS));
export const TODAY_INDEX = OFFSETS.indexOf(0);

export const MATCHES = [];
export const MATCH_BY_ID = {};
export const TEAM_FORM = {};

const LIVE_WINDOW = 135 * 60000;

const finalize = (m) => {
  const home = teamById(m.homeId);
  m.kickoff = romeTime(m.ts);
  if (m.status !== 'finished' && m.status !== 'live') {
    // stato in base all'orologio: la partita in corso è "live" finché non arriva il risultato
    const now = Date.now();
    if (m.ts <= now && now - m.ts < LIVE_WINDOW) m.status = 'live';
    else if (m.ts <= now) m.status = 'finished';
  }
  if (!m.stadium && home && RAW.stadi && RAW.stadi[home.name]) m.stadium = RAW.stadi[home.name].s;
  return m;
};

const baseMatch = (o) => ({
  id: null,
  leagueId: null,
  homeId: null,
  awayId: null,
  date: null,
  offset: 0,
  kickoff: '',
  ts: 0,
  status: 'scheduled',
  minute: null,
  score: null,
  stadium: null,
  weather: null,
  refereeId: null,
  stats: null,
  statGroups: null,
  events: [],
  momentum: [],
  shots: [],
  lineup: null,
  detail: false,
  ...o,
});

export function buildMatches() {
  MATCHES.length = 0;
  Object.keys(MATCH_BY_ID).forEach((k) => delete MATCH_BY_ID[k]);
  const seen = new Set();
  const key = (d, h, a) => `${d}|${h}|${a}`;

  // 1) partite finite (indice)
  ((RAW.indice && RAW.indice.m) || []).forEach((r) => {
    const [id, lg, d, h, a, sh, sa, ref, stad, round] = r;
    const home = ensureTeam(h, lg);
    const away = ensureTeam(a, lg);
    const m = baseMatch({
      id,
      leagueId: lg,
      homeId: home.id,
      awayId: away.id,
      date: d,
      ts: midday(d).getTime(),
      timeKnown: false,
      status: 'finished',
      minute: 90,
      score: [sh, sa],
      stadium: stad || null,
      refereeId: ref ? slug(ref) : null,
      refereeName: ref || null,
      round: round || null,
    });
    MATCHES.push(m);
    MATCH_BY_ID[id] = m;
    seen.add(key(d, h, a));
  });

  // 2) partite di oggi e dei prossimi giorni
  ((RAW.partite && RAW.partite.matches) || []).forEach((p) => {
    if (MATCH_BY_ID[p.id]) return;
    const home = ensureTeam(p.h, p.lg, p.hl);
    const away = ensureTeam(p.a, p.lg, p.al);
    const ts = new Date(p.t).getTime();
    const d = romeDay(ts);
    const m = baseMatch({ id: p.id, leagueId: p.lg, homeId: home.id, awayId: away.id, date: d, ts, timeKnown: true, status: 'scheduled' });
    const lin = RAW.partite.lin && RAW.partite.lin[p.id];
    if (lin) m.lineupRaw = lin;
    MATCHES.push(m);
    MATCH_BY_ID[p.id] = m;
    seen.add(key(d, p.h, p.a));
    seen.add(key(p.d, p.h, p.a));
  });

  // 3) calendario delle squadre (risultati non ancora nell'indice e partite future)
  const RES = (RAW.teams && RAW.teams.res) || {};
  Object.entries(RES).forEach(([lg, teams]) => {
    Object.entries(teams).forEach(([name, rows]) => {
      rows.forEach((r) => {
        const [d, opp, isHome, gf, ga] = r;
        if (!isHome) return;
        if (seen.has(key(d, name, opp))) return;
        const home = ensureTeam(name, lg);
        const away = ensureTeam(opp, lg);
        const played = gf !== null && gf !== undefined;
        const m = baseMatch({
          id: `f-${d}-${home.id}-${away.id}`,
          leagueId: lg,
          homeId: home.id,
          awayId: away.id,
          date: d,
          ts: midday(d).getTime() + 3600000,
          timeKnown: false,
          status: played ? 'finished' : 'scheduled',
          minute: played ? 90 : null,
          score: played ? [gf, ga] : null,
          placeholder: true,
        });
        MATCHES.push(m);
        MATCH_BY_ID[m.id] = m;
        seen.add(key(d, name, opp));
      });
    });
  });

  MATCHES.forEach(finalize);
  MATCHES.sort((a, b) => a.ts - b.ts);
  MATCHES.forEach((m) => {
    m.offset = Math.round((midday(m.date).getTime() - TODAY.getTime()) / DAY_MS);
  });

  // forma: ultime partite finite di ogni squadra, dalla più vecchia alla più recente
  Object.keys(TEAM_FORM).forEach((k) => delete TEAM_FORM[k]);
  MATCHES.filter((m) => m.status === 'finished' && m.score).forEach((m) => {
    const [sh, sa] = m.score;
    const push = (id, res) => (TEAM_FORM[id] = TEAM_FORM[id] || []).push(res);
    push(m.homeId, sh > sa ? 'V' : sh === sa ? 'S' : 'P');
    push(m.awayId, sa > sh ? 'V' : sh === sa ? 'S' : 'P');
  });
}

export const matchById = (id) => MATCH_BY_ID[id] || null;
export const matchesByDate = (dateStr) => MATCHES.filter((m) => m.date === dateStr).sort((a, b) => a.ts - b.ts);
export const matchesForLeague = (leagueId) => MATCHES.filter((m) => m.leagueId === leagueId).sort((a, b) => a.ts - b.ts);
export const liveMatches = () => MATCHES.filter((m) => m.status === 'live');
export const teamForm = (teamId) => (TEAM_FORM[teamId] || []).slice(-5);

export const currentMinute = (m) => {
  if (m.status !== 'live') return 90;
  const elapsed = Math.floor((Date.now() - m.ts) / 60000);
  // intervallo di 15' dopo il 45'
  const min = elapsed <= 45 ? elapsed : elapsed <= 60 ? 45 : elapsed - 15;
  return Math.max(1, Math.min(90, min));
};

export function viewMatch(m) {
  if (m.status !== 'live') return { ...m, minute: m.status === 'finished' ? 90 : null, live: false };
  return { ...m, live: true, minute: m.liveMinute || currentMinute(m), score: m.liveScore || m.score || [0, 0] };
}

/* ───────────── dettaglio partita ───────────── */

const num = (v) => {
  if (v === null || v === undefined) return 0;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const STAT_MAP = {
  possesso: ['BallPossesion'],
  xg: ['expected_goals'],
  tiri: ['total_shots'],
  tiriInPorta: ['ShotsOnTarget'],
  occasioni: ['big_chance'],
  corner: ['corners'],
  falli: ['fouls'],
  cartellini: ['yellow_cards'],
  passaggi: ['passes', 'accurate_passes'],
  fuorigioco: ['Offsides'],
};

const POS_BY_ROW = (rowIdx, rowsCount) => (rowIdx === 0 ? 'DEF' : rowIdx === rowsCount - 1 ? 'ATT' : 'MID');

const initials = (name) =>
  String(name)
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

// Righe del campo: i giocatori con la stessa "profondità" (x) formano una fila.
export function buildLineup(side, raw, detail, team, playerLookup) {
  if (!raw) return null;
  const starters = raw.st || raw.s || [];
  const bench = raw.su || raw.b || [];
  const isOld = !!raw.st; // dettaglio partita: [nome, n°, ?, x, y, flag]; formazione prevista: [nome, n°, x, y, flag, id]
  const norm = (e) => (isOld ? { name: e[0], number: e[1], x: e[3], y: e[4], pid: null } : { name: e[0], number: e[1], x: e[2], y: e[3], pid: e[5] || null });

  const list = starters.map(norm);
  const depths = [...new Set(list.map((p) => p.x))].sort((a, b) => a - b);
  const rowsDepth = depths.slice(1); // la prima profondità è il portiere
  const rows = rowsDepth.map((x) => list.filter((p) => p.x === x).sort((a, b) => b.y - a.y));
  const gk = list.filter((p) => p.x === depths[0]);
  const ordered = [...gk, ...rows.flat()];

  const ratingOf = {};
  if (detail && detail.pl) {
    detail.pl.forEach((r) => {
      if (r[1] === side) ratingOf[r[0]] = r[2];
    });
  }
  const evs = (detail && detail.ev) || [];
  const cardOf = {};
  const subOut = {};
  const subIn = {};
  evs.forEach((e) => {
    if (e[4] !== side) return;
    if (e[0] === 'yellowcard') cardOf[e[5]] = cardOf[e[5]] || 'yellow';
    if (e[0] === 'redcard') cardOf[e[5]] = 'red';
    if (e[0] === 'substitution') {
      subOut[e[5]] = e[1];
      if (e[10]) subIn[e[10]] = e[1];
    }
  });

  const toEntry = (p, position) => {
    const found = p.pid ? playerLookup.byId(p.pid) : playerLookup.byName(p.name, team);
    const rating = ratingOf[p.name];
    return {
      playerId: (found && found.id) || p.pid || slug(`${team.id}-${p.name}`),
      linkable: !!found,
      name: p.name,
      initials: initials(p.name),
      number: p.number,
      photo: (found && found.photo) || null,
      position,
      rating: rating === null || rating === undefined ? null : rating,
      captain: false,
      card: cardOf[p.name] || null,
      subOut: subOut[p.name] || null,
      subIn: subIn[p.name] || null,
    };
  };

  const xi = [
    ...gk.map((p) => toEntry(p, 'GK')),
    ...rows.flatMap((row, i) => row.map((p) => toEntry(p, POS_BY_ROW(i, rows.length)))),
  ];
  const benchEntries = bench.map((e) => {
    const p = isOld ? { name: e[0], number: e[1], pid: null } : { name: e[0], number: e[1], pid: e[5] || null };
    return toEntry({ ...p, x: 0, y: 0 }, 'SUB');
  });

  return {
    formation: { label: raw.f || '', rows: rows.map((r) => r.length), groups: rows.map((_, i) => POS_BY_ROW(i, rows.length)) },
    xi: ordered.length ? xi : [],
    bench: benchEntries,
    coach: raw.co || null,
    confirmed: raw.c !== false,
  };
}

const bucketMomentum = (mo) => {
  if (!mo || !mo.length) return [];
  const out = [];
  for (let start = 0; start < 90; start += 5) {
    const vals = mo.filter((p) => p.minute >= start && p.minute < start + 5).map((p) => p.value);
    if (!vals.length) continue;
    out.push(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length));
  }
  return out;
};

const OUTCOME = { Goal: 'Gol', AttemptSaved: 'Parato', Miss: 'Fuori', Post: 'Fuori' };
const BODY = { RightFoot: 'Destro', LeftFoot: 'Sinistro', Header: 'Testa', OtherBodyParts: 'Altro' };

export function applyDetail(m, detail, playerLookup) {
  if (!detail) return m;
  const home = teamById(m.homeId);
  const away = teamById(m.awayId);

  // risultato e luogo
  if (detail.sh !== null && detail.sh !== undefined) m.score = [detail.sh, detail.sa];
  if (detail.stad) m.stadium = detail.stad;
  if (detail.ref) {
    m.refereeName = detail.ref;
    m.refereeId = slug(detail.ref);
  }
  m.round = detail.round || m.round || null;

  // eventi (con punteggio progressivo; i gol duplicati dal feed vengono scartati)
  const events = [];
  let gh = 0;
  let ga = 0;
  let last = null;
  (detail.ev || []).forEach((e) => {
    const [type, minute, , , side, name, ph, pa, , , inName] = e;
    const team = side === 'h' ? 'home' : 'away';
    if (type === 'goal') {
      const sig = `${side}|${name}|${ph}|${pa}`;
      if (last === sig) return;
      last = sig;
      if (team === 'home') gh += 1;
      else ga += 1;
      events.push({ minute, type: 'goal', team, name, score: [gh, ga] });
    } else if (type === 'yellowcard') events.push({ minute, type: 'yellow', team, name });
    else if (type === 'redcard') events.push({ minute, type: 'red', team, name });
    else if (type === 'substitution') events.push({ minute, type: 'sub', team, name, inName });
  });
  m.events = events;

  // statistiche
  const flat = {};
  const groups = [];
  const st = detail.st && detail.st.all;
  if (st) {
    st.forEach((g) => {
      const rows = [];
      g.i.forEach((it) => {
        flat[it[3]] = [it[1], it[2]];
        rows.push({ key: it[3], label: it[0], home: num(it[1]), away: num(it[2]), homeText: it[1], awayText: it[2] });
      });
      groups.push({ title: g.t || null, rows });
    });
  }
  const stats = {};
  Object.entries(STAT_MAP).forEach(([k, keys]) => {
    const src = keys.find((x) => flat[x]);
    if (!src) return;
    stats[k] = [num(flat[src][0]), num(flat[src][1])];
  });
  if (flat.red_cards && stats.cartellini) stats.cartellini = [stats.cartellini[0] + num(flat.red_cards[0]), stats.cartellini[1] + num(flat.red_cards[1])];
  m.stats = stats;
  m.statGroups = groups;

  m.momentum = bucketMomentum(detail.mo);

  m.shots = (detail.tr || []).map((t) => ({
    side: t[1] === 'h' ? 'home' : 'away',
    outcome: OUTCOME[t[11]] || 'Fuori',
    playerName: t[2],
    minute: t[0],
    body: BODY[t[10]] || 'Altro',
    situation: t[12],
    xg: t[5] || 0,
    x: Math.max(0, Math.min(1, t[3] / 105)),
    y: Math.max(0, Math.min(0.6, (t[4] / 68) * 0.6)),
  }));

  if (detail.lu) {
    m.lineup = {
      home: buildLineup('h', detail.lu.h, detail, home, playerLookup),
      away: buildLineup('a', detail.lu.a, detail, away, playerLookup),
    };
  }
  m.detail = true;
  return m;
}

export function applyPlannedLineup(m, playerLookup) {
  if (!m.lineupRaw || m.lineup) return;
  const home = teamById(m.homeId);
  const away = teamById(m.awayId);
  const h = buildLineup('h', m.lineupRaw.h, null, home, playerLookup);
  const a = buildLineup('a', m.lineupRaw.a, null, away, playerLookup);
  if ((h && h.xi.length) || (a && a.xi.length)) m.lineup = { home: h, away: a };
}

export async function ensureDetail(id, playerLookup) {
  const m = MATCH_BY_ID[id];
  if (!m) return null;
  if (m.status === 'scheduled' || m.status === 'live') {
    applyPlannedLineup(m, playerLookup);
    return m;
  }
  if (m.detail || m.placeholder) return m;
  const d = await loadDetail(id);
  if (d) applyDetail(m, d, playerLookup);
  return m;
}
