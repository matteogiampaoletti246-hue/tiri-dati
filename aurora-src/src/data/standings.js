// Classifiche (calcolate dalle partite finite) e statistiche di squadra (medie a partita
// da squadre.json + squadre_ex.json).
import { RAW } from './load';
import { MATCHES, teamForm } from './matches';
import { teamById, teamsOf, teamByName } from './teams';
import { r2 } from './util';

/* ───────────── classifica ───────────── */

const apply = (acc, gf, ga) => {
  acc.played += 1;
  acc.gf += gf;
  acc.ga += ga;
  if (gf > ga) {
    acc.won += 1;
    acc.points += 3;
  } else if (gf === ga) {
    acc.drawn += 1;
    acc.points += 1;
  } else acc.lost += 1;
};

function buildTable(leagueId, mode) {
  const rows = {};
  teamsOf(leagueId).forEach((t) => {
    rows[t.id] = { teamId: t.id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
  });
  MATCHES.filter((m) => m.leagueId === leagueId && m.status === 'finished' && m.score).forEach((m) => {
    const [sh, sa] = m.score;
    if (!rows[m.homeId]) rows[m.homeId] = { teamId: m.homeId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
    if (!rows[m.awayId]) rows[m.awayId] = { teamId: m.awayId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
    if (mode !== 'away') apply(rows[m.homeId], sh, sa);
    if (mode !== 'home') apply(rows[m.awayId], sa, sh);
  });

  const formPoints = (id) => teamForm(id).reduce((a, r) => a + (r === 'V' ? 3 : r === 'S' ? 1 : 0), 0);
  const list = Object.values(rows)
    .filter((r) => teamById(r.teamId))
    .map((row) => ({ ...row, dr: row.gf - row.ga, form: teamForm(row.teamId), formPoints: formPoints(row.teamId) }));

  list.sort((a, b) => {
    if (mode === 'forma' && b.formPoints !== a.formPoints) return b.formPoints - a.formPoints;
    if (b.points !== a.points) return b.points - a.points;
    if (b.dr !== a.dr) return b.dr - a.dr;
    return b.gf - a.gf;
  });
  list.forEach((row, i) => {
    row.rank = i + 1;
  });
  return list;
}

let CACHE = {};
export const standings = (leagueId, mode = 'total') => {
  const key = `${leagueId}:${mode}`;
  if (!CACHE[key]) CACHE[key] = buildTable(leagueId, mode);
  return CACHE[key];
};
export const teamRow = (leagueId, teamId) => standings(leagueId, 'total').find((r) => r.teamId === teamId) || null;

// Zone di classifica (Champions, Europa, retrocessione…) da zone.json: { posizione: [nome, colore] }
const ZONE_STYLE = [
  [/relegation playoff/i, 'Play Out', '#FF9AA2'],
  [/relegat/i, 'Retrocessione', '#E5332A'],
  [/conference/i, 'Conference League', '#1FB35A'],
  [/europa/i, 'Europa League', '#FF8A1F'],
  [/champions league/i, 'Champions League', '#2E7BFF'],
];
const ZONE_KEY = { 'champions-league': 'uefa.champions', 'europa-league': 'uefa.europa' };
const CUP_ZONE = [
  [/round of 16/i, 'Ottavi di finale', '#1FA45B'],
  [/seeded/i, 'Spareggi', '#2E7BFF'],
  [/eliminated/i, 'Eliminata', '#E5332A'],
];
export const zoneOf = (leagueId, rank) => {
  if (ZONE_KEY[leagueId]) {
    const cz = RAW.zone && RAW.zone[ZONE_KEY[leagueId]];
    const e = cz && cz[String(rank)];
    if (!e) return null;
    const lab = /unseeded/i.test(e[0]) ? 'Spareggi' : null;
    const h = CUP_ZONE.find(([re]) => re.test(e[0]));
    return h ? { label: lab || h[1], color: /unseeded/i.test(e[0]) ? '#2E7BFF' : h[2] } : null;
  }
  const z = RAW.zone && RAW.zone[leagueId];
  if (!z || !z[String(rank)]) return null;
  const [label, color] = z[String(rank)];
  const hit = ZONE_STYLE.find(([re]) => re.test(label));
  return hit ? { label: hit[1], color: hit[2] } : { label, color };
};

/* ───────────── statistiche di squadra ───────────── */

// [file, campo, lato]   file: 'ex' = squadre_ex.json, 'sq' = squadre.json   lato: 0 = fatti, 1 = subiti
const SRC = {
  gol: ['ex', 'goals', 0],
  xg: ['ex', 'expected_goals', 0],
  xgNoPen: ['ex', 'expected_goals_non_penalty', 0],
  xgot: ['ex', 'expected_goals_on_target', 0],
  xgOpen: ['ex', 'expected_goals_open_play', 0],
  xgSet: ['ex', 'expected_goals_set_play', 0],
  tiri: ['ex', 'total_shots', 0],
  tiriInPorta: ['ex', 'ShotsOnTarget', 0],
  tiriFuori: ['ex', 'ShotsOffTarget', 0],
  tiriFuoriArea: ['ex', 'shots_outside_box', 0],
  tiriArea: ['ex', 'shots_inside_box', 0],
  occasioni: ['ex', 'big_chance', 0],
  corner: ['ex', 'corners', 0],
  golSubiti: ['ex', 'goals', 1],
  xgSubiti: ['ex', 'expected_goals', 1],
  tiriConcessi: ['ex', 'total_shots', 1],
  tiriInPortaConcessi: ['ex', 'ShotsOnTarget', 1],
  occasioniConcesse: ['ex', 'big_chance', 1],
  cornerConcessi: ['ex', 'corners', 1],
  parate: ['ex', 'keeper_saves', 0],
  intercetti: ['ex', 'interceptions', 0],
  contrasti: ['ex', 'matchstats.headers.tackles', 0],
  respinte: ['ex', 'clearances', 0],
  falli: ['ex', 'fouls', 0],
  gialli: ['ex', 'yellow_cards', 0],
  rossi: ['ex', 'red_cards', 0],
  fallisubiti: ['ex', 'fouls', 1],
  possesso: ['ex', 'BallPossesion', 0],
  passaggi: ['ex', 'passes', 0],
  precisione: ['ex', 'accurate_passes%', 0],
  fuorigioco: ['ex', 'Offsides', 0],
  cross: ['ex', 'accurate_crosses', 0],
};

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
      { key: 'tiri', label: 'Tiri' },
      { key: 'tiriInPorta', label: 'Tiri in porta' },
      { key: 'tiriFuori', label: 'Tiri fuori' },
      { key: 'tiriFuoriArea', label: 'Tiri da fuori area' },
      { key: 'occasioni', label: 'Occasioni nitide' },
      { key: 'corner', label: 'Corner' },
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
      { key: 'occasioniConcesse', label: 'Occasioni nitide concesse' },
      { key: 'cornerConcessi', label: 'Corner concessi' },
      { key: 'parate', label: 'Parate' },
      { key: 'intercetti', label: 'Intercetti' },
      { key: 'contrasti', label: 'Contrasti' },
      { key: 'respinte', label: 'Respinte' },
    ],
  },
  {
    key: 'disciplina',
    title: 'Disciplina',
    metrics: [
      { key: 'falli', label: 'Falli commessi' },
      { key: 'fallisubiti', label: 'Falli subiti' },
      { key: 'gialli', label: 'Gialli' },
      { key: 'rossi', label: 'Rossi' },
    ],
  },
  {
    key: 'gioco',
    title: 'Gioco',
    metrics: [
      { key: 'possesso', label: 'Possesso' },
      { key: 'passaggi', label: 'Passaggi' },
      { key: 'precisione', label: 'Precisione passaggi' },
      { key: 'cross', label: 'Cross riusciti' },
      { key: 'fuorigioco', label: 'Fuorigioco' },
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

// valore a partita; part: 0 totale, 1 casa, 2 trasferta
const raw = (teamId, key, part = 0, comp = null) => {
  const t = teamById(teamId);
  const src = SRC[key];
  if (!t || !src || !RAW.squadreEx) return null;
  const [, field, side] = src;
  const lgData = RAW.squadreEx.lg && RAW.squadreEx.lg[comp || t.leagueId];
  const e = lgData && lgData[t.name] && lgData[t.name][field];
  const cell = e && e[side] && e[side][part];
  return cell ? cell[0] : null;
};

export const metricOf = (teamId, key, part = 0, comp = null) => {
  const v = raw(teamId, key, part, comp);
  return v === null || v === undefined ? 0 : r2(v);
};
export const hasMetrics = (teamId, comp = null) => raw(teamId, 'tiri', 0, comp) !== null;
// squadre con statistiche in una competizione (campionato o coppa)
export const teamsInComp = (comp) => {
  const lg = RAW.squadreEx && RAW.squadreEx.lg && RAW.squadreEx.lg[comp];
  if (!lg) return teamsOf(comp);
  return Object.keys(lg).map((n) => teamByName(n)).filter(Boolean);
};

const metricRowsCache = {};
export function metricRows(leagueId, metricKey) {
  const cacheKey = `${leagueId}:${metricKey}`;
  if (metricRowsCache[cacheKey]) return metricRowsCache[cacheKey];
  const rows = teamsOf(leagueId)
    .filter((t) => hasMetrics(t.id))
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

export function resetStandingsCache() {
  CACHE = {};
  Object.keys(metricRowsCache).forEach((k) => delete metricRowsCache[k]);
}
