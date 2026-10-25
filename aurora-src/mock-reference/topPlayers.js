// Migliori giocatori — dati MOCK derivati (nessun collegamento reale).
import { PLAYERS } from './players';
import { MATCHES } from './matches';

export const THRESHOLDS = [
  { key: '0.5', label: 'Over 0,5' },
  { key: '1.5', label: 'Over 1,5' },
  { key: '2.5', label: 'Over 2,5' },
];

function teamsPlaying(dateStr) {
  const map = {};
  MATCHES.filter((m) => m.date === dateStr).forEach((m) => {
    map[m.homeId] = m;
    map[m.awayId] = m;
  });
  return map;
}

export function bestPlayers(dateStr, threshold, n = 25) {
  const playing = teamsPlaying(dateStr);
  return PLAYERS.filter((p) => playing[p.teamId])
    .map((p) => ({
      player: p,
      match: playing[p.teamId],
      voto: p.voto[threshold],
      mediaAttesa: p.mediaAttesa,
      minutiMedi: p.minutiMedi,
      ultime5: p.ultime5,
      stagione90: p.stagione90,
    }))
    .sort((a, b) => b.voto - a.voto || b.ultime5 - a.ultime5)
    .slice(0, n);
}
