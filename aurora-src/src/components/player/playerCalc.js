import { PLAYERS, per90 } from '@/data/players';

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
