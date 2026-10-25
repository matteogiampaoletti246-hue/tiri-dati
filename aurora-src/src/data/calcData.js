// Dati MOCK per il Calcolatore di Affidabilità: medie tiri per squadra e per campionato.
// Separati dalla UI: qui si innesteranno i dati reali.
import { comma } from '@/lib/format';
import { TEAMS } from './teams';
import { LEAGUES, leagueById } from './leagues';

const hash = (seed) => {
  let h = 7;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) % 100003;
  return h;
};

const rnd = (seed) => (hash(seed) % 1000) / 1000;
const dec = (v) => Math.round(v * 10) / 10;

const splitOf = (seed, totali, inPorta) => {
  const last5 = 0.85 + rnd(`${seed}-l5`) * 0.3;
  return {
    casa: { totali: dec(totali * 1.12), inPorta: dec(inPorta * 1.12) },
    trasferta: { totali: dec(totali * 0.88), inPorta: dec(inPorta * 0.88) },
    last5: { totali: dec(totali * last5), inPorta: dec(inPorta * last5) },
  };
};

export const TEAM_SHOTS = {};

TEAMS.forEach((team) => {
  const forTot = dec(9.5 + rnd(`${team.id}-for`) * 8);
  const forIn = dec(forTot * (0.34 + rnd(`${team.id}-forr`) * 0.12));
  const agTot = dec(9 + rnd(`${team.id}-ag`) * 8);
  const agIn = dec(agTot * (0.34 + rnd(`${team.id}-agr`) * 0.12));

  TEAM_SHOTS[team.id] = {
    leagueId: team.leagueId,
    strength: Math.round((0.85 + rnd(`${team.id}-st`) * 0.3) * 100) / 100,
    for: { totali: forTot, inPorta: forIn, ...splitOf(`${team.id}-f`, forTot, forIn) },
    against: { totali: agTot, inPorta: agIn, ...splitOf(`${team.id}-a`, agTot, agIn) },
    rankFor: 0,
    rankAgainst: 0,
  };
});

export const LEAGUE_AVG = {};

LEAGUES.forEach((league) => {
  const list = TEAMS.filter((t) => t.leagueId === league.id).map((t) => ({ id: t.id, s: TEAM_SHOTS[t.id] }));
  if (!list.length) return;
  const mean = (pick) => dec(list.reduce((acc, item) => acc + pick(item.s), 0) / list.length);
  LEAGUE_AVG[league.id] = {
    for: { totali: mean((s) => s.for.totali), inPorta: mean((s) => s.for.inPorta) },
    against: { totali: mean((s) => s.against.totali), inPorta: mean((s) => s.against.inPorta) },
    size: list.length,
  };
  [...list]
    .sort((a, b) => b.s.for.totali - a.s.for.totali)
    .forEach((item, i) => {
      TEAM_SHOTS[item.id].rankFor = i + 1;
    });
  [...list]
    .sort((a, b) => b.s.against.totali - a.s.against.totali)
    .forEach((item, i) => {
      TEAM_SHOTS[item.id].rankAgainst = i + 1;
    });
});

export const teamShots = (teamId) => (teamId ? TEAM_SHOTS[teamId] || null : null);

export const leagueAverage = (leagueId, mode, family) => {
  const avg = LEAGUE_AVG[leagueId];
  if (!avg || !avg[mode]) return null;
  return avg[mode][family] ?? null;
};

export const leagueName = (leagueId) => leagueById(leagueId)?.name ?? '';

export const rankNote = (stats, mode) => {
  if (!stats) return '';
  const rank = mode === 'against' ? stats.rankAgainst : stats.rankFor;
  const size = LEAGUE_AVG[stats.leagueId]?.size ?? 0;
  const metric = mode === 'against' ? 'tiri concessi' : 'tiri fatti';
  return `${rank}° su ${size} in ${leagueName(stats.leagueId)} per ${metric} a partita`;
};

export const prefillShots = (stats, mode) =>
  stats ? { totali: comma(stats[mode].totali, 1), inPorta: comma(stats[mode].inPorta, 1) } : { totali: '', inPorta: '' };

export const splitBoxes = (stats, mode, family) => {
  if (!stats) return [];
  const s = stats[mode];
  return [
    { label: 'Casa', value: comma(s.casa[family], 1) },
    { label: 'Trasferta', value: comma(s.trasferta[family], 1) },
    { label: 'Ultime 5', value: comma(s.last5[family], 1) },
  ];
};

// Minuti delle ultime 5 partite (mock) usati come precompilazione.
export const playerLast5Minutes = (player) => {
  if (!player) return [];
  const base = player.minutiMedi || 75;
  return [0, 1, 2, 3, 4].map((i) => Math.max(45, Math.min(90, Math.round(base + (rnd(`${player.id}-m${i}`) - 0.5) * 22))));
};
