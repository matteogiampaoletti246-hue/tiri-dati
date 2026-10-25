// Classifiche e metriche di squadra — dati MOCK derivati.
import { MATCHES, TEAM_FORM, STRENGTH } from './matches';
import { teamsOf } from './teams';

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

const r2 = (v) => Math.round(v * 100) / 100;

function apply(acc, gf, ga) {
  acc.played += 1;
  acc.gf += gf;
  acc.ga += ga;
  if (gf > ga) {
    acc.won += 1;
    acc.points += 3;
  } else if (gf === ga) {
    acc.drawn += 1;
    acc.points += 1;
  } else {
    acc.lost += 1;
  }
}

function buildTable(leagueId, mode) {
  const rows = {};
  teamsOf(leagueId).forEach((t) => {
    rows[t.id] = { teamId: t.id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
  });
  MATCHES.filter((m) => m.leagueId === leagueId && m.status === 'finished').forEach((m) => {
    const [sh, sa] = m.score;
    if (rows[m.homeId] && mode !== 'away') apply(rows[m.homeId], sh, sa);
    if (rows[m.awayId] && mode !== 'home') apply(rows[m.awayId], sa, sh);
  });

  const formPoints = (teamId) => (TEAM_FORM[teamId] || []).slice(-5).reduce((a, r) => a + (r === 'V' ? 3 : r === 'S' ? 1 : 0), 0);

  const list = Object.values(rows).map((row) => ({
    ...row,
    dr: row.gf - row.ga,
    form: (TEAM_FORM[row.teamId] || []).slice(-5),
    formPoints: formPoints(row.teamId),
  }));

  list.sort((a, b) => {
    if (mode === 'forma') {
      if (b.formPoints !== a.formPoints) return b.formPoints - a.formPoints;
    }
    if (b.points !== a.points) return b.points - a.points;
    if (b.dr !== a.dr) return b.dr - a.dr;
    return b.gf - a.gf;
  });

  list.forEach((row, i) => {
    row.rank = i + 1;
  });
  return list;
}

const CACHE = {};
export const standings = (leagueId, mode = 'total') => {
  const key = `${leagueId}:${mode}`;
  if (!CACHE[key]) CACHE[key] = buildTable(leagueId, mode);
  return CACHE[key];
};

export const teamRow = (leagueId, teamId) => standings(leagueId, 'total').find((r) => r.teamId === teamId) || null;

/* ── Metriche di squadra ── */
export const TEAM_METRICS = {};

teamsOf('serie-a')
  .concat(teamsOf('premier-league'), teamsOf('laliga'), teamsOf('bundesliga'), teamsOf('ligue-1'), teamsOf('champions-league'))
  .forEach((team) => {
    const r = rng(seedOf(`mv-${team.id}`));
    const s = STRENGTH[team.id] || 0.5;
    const xg = r2(6 + s * 9 + (r() - 0.5) * 2);
    const tiriFuori = Math.round(24 + s * 22 + r() * 6);
    TEAM_METRICS[team.id] = {
      gol: Math.round(4 + s * 9),
      xg,
      xgNoPen: r2(xg * 0.87),
      xgot: r2(xg * 1.03 + (r() - 0.5)),
      xgOpen: r2(xg * 0.61),
      xgSet: r2(xg * 0.39),
      tiriFuori,
      tiriFuoriArea: Math.round(18 + s * 20 + r() * 5),
      tiri: Math.round(tiriFuori * 1.45 + 14),
      tiriInPorta: Math.round((tiriFuori * 1.45 + 14) * 0.36),
      corner: Math.round(20 + s * 16 + r() * 6),
      golSubiti: Math.round(11 - s * 7 + r() * 3),
      xgSubiti: r2(9 - s * 4 + r() * 2),
      tiriConcessi: Math.round(72 - s * 24 + r() * 6),
      tiriInPortaConcessi: Math.round(25 - s * 9 + r() * 3),
      cornerConcessi: Math.round(27 - s * 9 + r() * 3),
      falli: Math.round(58 + r() * 32),
      gialli: Math.round(7 + r() * 10),
      rossi: Math.round(r() * 3),
      rigoriConcessi: Math.round(r() * 3),
      possesso: Math.round(42 + s * 16 + r() * 4),
      passaggi: Math.round(360 + s * 240 + r() * 40),
      precisione: Math.round(74 + s * 12),
      fuorigioco: Math.round(6 + r() * 10),
      occasioni: Math.round(4 + s * 8),
    };
  });

export const metricOf = (teamId, key) => (TEAM_METRICS[teamId] ? TEAM_METRICS[teamId][key] ?? 0 : 0);

export const CATEGORY_DEFS = [
  {
    key: 'attacco',
    title: 'Attacco',
    metrics: [
      { key: 'gol', label: 'Gol' },
      { key: 'xg', label: 'xG' },
      { key: 'xgNoPen', label: 'xG senza rigori' },
      { key: 'xgot', label: 'xGOT' },
      { key: 'xgOpen', label: 'xG da azione' },
      { key: 'xgSet', label: 'xG da palla inattiva' },
      { key: 'tiriFuori', label: 'Tiri fuori' },
      { key: 'tiriFuoriArea', label: 'Tiri da fuori area' },
    ],
  },
  {
    key: 'difesa',
    title: 'Difesa',
    metrics: [
      { key: 'golSubiti', label: 'Gol subiti' },
      { key: 'xgSubiti', label: 'xG subiti' },
      { key: 'tiriConcessi', label: 'Tiri concessi' },
      { key: 'tiriInPortaConcessi', label: 'Tiri in porta concessi' },
      { key: 'cornerConcessi', label: 'Corner concessi' },
    ],
  },
  {
    key: 'disciplina',
    title: 'Disciplina',
    metrics: [
      { key: 'falli', label: 'Falli commessi' },
      { key: 'gialli', label: 'Gialli' },
      { key: 'rossi', label: 'Rossi' },
      { key: 'rigoriConcessi', label: 'Rigori concessi' },
    ],
  },
  {
    key: 'gioco',
    title: 'Gioco',
    metrics: [
      { key: 'possesso', label: 'Possesso' },
      { key: 'passaggi', label: 'Passaggi' },
      { key: 'precisione', label: 'Precisione passaggi' },
      { key: 'fuorigioco', label: 'Fuorigioco' },
      { key: 'occasioni', label: 'Occasioni nitide' },
    ],
  },
];

export const TILE_METRICS = [
  { key: 'gol', label: 'Gol' },
  { key: 'xg', label: 'xG' },
  { key: 'tiri', label: 'Tiri' },
  { key: 'tiriInPorta', label: 'Tiri in porta' },
  { key: 'corner', label: 'Corner' },
  { key: 'possesso', label: 'Possesso' },
  { key: 'passaggi', label: 'Passaggi' },
  { key: 'falli', label: 'Falli commessi' },
  { key: 'gialli', label: 'Gialli' },
  { key: 'fuorigioco', label: 'Fuorigioco' },
  { key: 'occasioni', label: 'Occasioni nitide' },
  { key: 'golSubiti', label: 'Gol subiti' },
];

const metricRowsCache = {};
export function metricRows(leagueId, metricKey) {
  const cacheKey = `${leagueId}:${metricKey}`;
  if (metricRowsCache[cacheKey]) return metricRowsCache[cacheKey];
  const rows = teamsOf(leagueId)
    .map((t) => ({ teamId: t.id, value: metricOf(t.id, metricKey) }))
    .sort((a, b) => b.value - a.value)
    .map((row, i) => ({ ...row, rank: i + 1 }));
  metricRowsCache[cacheKey] = rows;
  return rows;
}

export function rankOf(leagueId, metricKey, teamId) {
  const rows = metricRows(leagueId, metricKey);
  const row = rows.find((x) => x.teamId === teamId);
  return { rank: row ? row.rank : null, total: rows.length };
}

export function rankLabel(leagueId, metricKey, teamId) {
  const { rank, total } = rankOf(leagueId, metricKey, teamId);
  if (!rank) return '—';
  return `${rank}a su ${total}`;
}
