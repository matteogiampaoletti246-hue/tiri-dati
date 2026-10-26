import { PLAYERS, per90, EX_COLS } from '@/data/players';

export const POS_IT = { GK: 'Portiere', DEF: 'Difensore', MID: 'Centrocampista', ATT: 'Attaccante' };

// metriche per 90' usate per percentili e radar
export const METRICS = [
  { key: 'goals', label: 'Gol', short: 'Gol' },
  { key: 'assists', label: 'Assist', short: 'Assist' },
  { key: 'shots', label: 'Tiri', short: 'Tiri' },
  { key: 'shotsOnTarget', label: 'Tiri in porta', short: 'In porta' },
  { key: 'xg', label: 'xG', short: 'xG' },
  { key: 'foulsDrawn', label: 'Falli subiti', short: 'Subiti' },
  { key: 'foulsCommitted', label: 'Falli fatti', short: 'Fatti' },
];

let CACHE = null;
let CACHE_N = -1;
function pool() {
  if (CACHE && CACHE_N === PLAYERS.length) return CACHE;
  CACHE_N = PLAYERS.length;
  CACHE = {};
  PLAYERS.forEach((p) => {
    if (!p.position || p.minutes < 270) return;
    (CACHE[p.position] = CACHE[p.position] || []).push(p);
  });
  return CACHE;
}

export function percentile(player, key) {
  const list = pool()[player.position] || [];
  if (!list.length || player.minutes < 1) return null;
  const v = per90(player[key] || 0, player.minutes);
  let below = 0;
  list.forEach((p) => {
    if (per90(p[key] || 0, p.minutes) <= v) below += 1;
  });
  return Math.round((below / list.length) * 100);
}

export const percentiles = (player) => METRICS.map((m) => ({ ...m, value: per90(player[m.key] || 0, player.minutes), total: player[m.key] || 0, pct: percentile(player, m.key) }));

export const ratingColor = (r) => {
  if (r === null || r === undefined) return 'var(--ink-3)';
  if (r >= 7.5) return '#1fa971';
  if (r >= 6.8) return '#5cb85c';
  if (r >= 6.2) return '#e0a528';
  return '#e0603a';
};

export const dateIt = (d) => {
  try {
    const x = new Date(d);
    return x.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }).replace('.', '');
  } catch {
    return String(d || '');
  }
};

// ---------- classifica per ruolo ----------
export function rankOf(player, key) {
  const list = pool()[player.position] || [];
  if (!list.length || player.minutes < 270) return null;
  const v = per90(player[key] || 0, player.minutes);
  let better = 0;
  list.forEach((p) => {
    if (p.id !== player.id && per90(p[key] || 0, p.minutes) > v + 1e-9) better += 1;
  });
  return { rank: better + 1, of: list.length };
}

// ---------- statistiche dettagliate da stats_ex ----------

// [colonna, etichetta, tipo]  tipo: p90 = ogni 90', pct = riusciti/tentati, tot = totale
export const GROUPS = [
  { title: 'Principali', rows: [
    ['accurate_passes', "Passaggi riusciti ogni 90'", 'p90'], ['accurate_passes', 'Precisione passaggi', 'pct'],
    ['defensive_actions', "Azioni difensive ogni 90'", 'p90'], ['chances_created', "Occasioni create ogni 90'", 'p90'],
    ['big_chance_created_team_title', "Grandi occasioni create ogni 90'", 'p90'], ['xg_and_xa', "xG + xA ogni 90'", 'p90'],
    ['expected_assists', "xA ogni 90'", 'p90'], ['expected_goals', "xG ogni 90'", 'p90'], ['expected_goals_on_target_variant', "xGOT ogni 90'", 'p90'],
    ['ShotsOffTarget', "Tiri fuori ogni 90'", 'p90'], ['shot_accuracy', 'Precisione tiri', 'pct'], ['penalties_won', "Rigori procurati ogni 90'", 'p90'],
  ] },
  { title: 'Attacco', rows: [
    ['touches', "Tocchi ogni 90'", 'p90'], ['dispossessed', "Palloni persi ogni 90'", 'p90', 1], ['touches_opp_box', "Tocchi in area avversaria ogni 90'", 'p90'],
    ['passes_into_final_third', "Passaggi nell'ultimo terzo ogni 90'", 'p90'], ['expected_goals_non_penalty', "xG senza rigori ogni 90'", 'p90'],
    ['dribbles_succeeded', "Dribbling riusciti ogni 90'", 'p90'], ['dribbles_succeeded', 'Dribbling riusciti (precisione)', 'pct'],
    ['accurate_crosses', "Cross riusciti ogni 90'", 'p90'], ['long_balls_accurate', "Lanci lunghi riusciti ogni 90'", 'p90'],
    ['line_breaking_passes', "Passaggi che rompono la linea ogni 90'", 'p90'], ['big_chance_missed_title', "Grandi occasioni sbagliate ogni 90'", 'p90', 1],
    ['corners', "Corner ogni 90'", 'p90'], ['shots_woodwork', "Pali e traverse ogni 90'", 'p90'],
  ] },
  { title: 'Difesa', rows: [
    ['clearances', "Respinte ogni 90'", 'p90'], ['recoveries', "Recuperi ogni 90'", 'p90'], ['interceptions', "Intercetti ogni 90'", 'p90'],
    ['matchstats.headers.tackles', "Contrasti ogni 90'", 'p90'], ['shot_blocks', "Tiri bloccati ogni 90'", 'p90'],
    ['dribbled_past', "Dribblato ogni 90'", 'p90', 1], ['headed_clearance', "Respinte di testa ogni 90'", 'p90'],
  ] },
  { title: 'Duelli', rows: [
    ['aerials_won', "Duelli aerei vinti ogni 90'", 'p90'], ['aerials_won', 'Duelli aerei vinti (precisione)', 'pct'],
    ['ground_duels_won', "Duelli a terra vinti ogni 90'", 'p90'], ['ground_duels_won', 'Duelli a terra vinti (precisione)', 'pct'],
    ['duel_lost', "Duelli persi ogni 90'", 'p90', 1], ['duel_won', "Duelli vinti ogni 90'", 'p90'],
  ] },
  { title: 'Fisico', rows: [
    ['physical_metrics_distance_covered', "Distanza ogni 90' (km)", 'p90'], ['physical_metrics_running', "Corsa ogni 90' (km)", 'p90'],
    ['physical_metrics_sprinting', "Sprint ogni 90' (km)", 'p90'], ['physical_metrics_number_of_sprints', "Numero sprint ogni 90'", 'p90'],
  ] },
  { title: 'Portiere', gk: true, rows: [
    ['saves', "Parate ogni 90'", 'p90'], ['saves_inside_box', "Parate in area ogni 90'", 'p90'], ['goals_conceded', "Gol subiti ogni 90'", 'p90', 1],
    ['goals_prevented', "Gol evitati ogni 90'", 'p90'], ['expected_goals_on_target_faced', "xGOT subito ogni 90'", 'p90'],
    ['keeper_diving_save', "Parate in tuffo ogni 90'", 'p90'], ['keeper_high_claim', "Uscite alte ogni 90'", 'p90'],
    ['punches', "Respinte di pugno ogni 90'", 'p90'], ['keeper_sweeper', "Uscite basse ogni 90'", 'p90'],
  ] },
];

const colIx = (k) => EX_COLS.indexOf(k);
const val = (arr, k, suffix = '') => {
  const i = colIx(k + suffix);
  if (i < 0 || !arr) return null;
  return arr[i] ?? null;
};

// valore per 90' o percentuale di un giocatore
export function statValue(player, row, last5 = false) {
  const [k, , type] = row;
  const arr = last5 ? player.exL5 : player.exS;
  const min = last5 ? player.l5min : player.minutes;
  if (!arr) return null;
  if (type === 'pct') {
    const a = val(arr, k);
    const t = val(arr, k, '|t');
    if (a === null || !t) return null;
    return (a / t) * 100;
  }
  const a = val(arr, k);
  if (a === null || !min) return null;
  return (a * 90) / min;
}

let AVG = {};
export function roleAverage(player, row) {
  const key = `${player.position}|${row[0]}|${row[2]}`;
  if (AVG[key] !== undefined) return AVG[key];
  const list = pool()[player.position] || [];
  const vs = list.map((p) => statValue(p, row)).filter((v) => v !== null && Number.isFinite(v)).sort((a, b) => a - b);
  AVG[key] = vs.length ? { avg: vs.reduce((a, b) => a + b, 0) / vs.length, p95: vs[Math.floor(vs.length * 0.95)] || vs[vs.length - 1] } : null;
  return AVG[key];
}
