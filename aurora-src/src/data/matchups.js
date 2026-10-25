// Migliori matchup — valori attesi per gara derivati dalle metriche di squadra.
import { metricOf, teamRow } from './standings';

export const MATCHUP_TYPES = [
  { key: 'corner', label: 'Angoli', unit: 'Angoli attesi', keys: ['corner'], weights: [1] },
  { key: 'cards', label: 'Cartellini', unit: 'Cartellini attesi', keys: ['gialli', 'rossi'], weights: [1, 2] },
  { key: 'shots', label: 'Tiri', unit: 'Tiri attesi', keys: ['tiri'], weights: [1] },
  { key: 'fouls', label: 'Falli', unit: 'Falli attesi', keys: ['falli'], weights: [1] },
  { key: 'offsides', label: 'Fuorigioco', unit: 'Fuorigioco attesi', keys: ['fuorigioco'], weights: [1] },
];

const typeOf = (key) => MATCHUP_TYPES.find((t) => t.key === key) || MATCHUP_TYPES[0];

const playedOf = (leagueId, teamId) => {
  const row = teamRow(leagueId, teamId);
  return row && row.played ? row.played : 5;
};

export function expected(leagueId, teamId, type) {
  const games = playedOf(leagueId, teamId);
  const total = type.keys.reduce((acc, k, i) => acc + metricOf(teamId, k) * type.weights[i], 0);
  return Math.round((total / games) * 10) / 10;
}

export function matchupRows(matches, typeKey) {
  const type = typeOf(typeKey);
  return matches
    .map((m) => {
      const home = expected(m.leagueId, m.homeId, type);
      const away = expected(m.leagueId, m.awayId, type);
      return {
        match: m,
        type,
        home,
        away,
        divario: Math.round(Math.abs(home - away) * 10) / 10,
        playedHome: playedOf(m.leagueId, m.homeId),
        playedAway: playedOf(m.leagueId, m.awayId),
      };
    })
    .sort((a, b) => b.divario - a.divario || b.home + b.away - (a.home + a.away));
}
