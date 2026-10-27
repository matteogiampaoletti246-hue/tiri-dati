// Migliori matchup: le liste sono già calcolate da angoli.json (aggiornato dall'Action).
import { RAW } from './load';
import { teamByName } from './teams';

// key = categoria nell'app; list = lista dentro angoli.json; f = campi [casa, trasferta, divario]; g = partite usate
export const MATCHUP_TYPES = [
  { key: 'corner', label: 'Angoli', unit: 'Angoli attesi', title: 'Maggiore divario angoli', list: 'corner', f: ['corners_home', 'corners_away', 'gap'], g: 'games' },
  { key: 'cards', label: 'Cartellini', unit: 'Cartellini attesi', title: 'Media cartellini più bassa', centerLabel: 'Media', list: 'cartellini', kind: 'cards', g: 'games_k' },
  { key: 'cards1', label: 'Cartellini 1T', unit: 'Cartellini 1T attesi', title: 'Media cartellini 1T più bassa', centerLabel: 'Media', list: 'cartellini_1t', kind: 'cards1', g: 'games_k' },
  { key: 'shots', label: 'Tiri', unit: 'Tiri attesi', title: 'Maggiore divario tiri totali', list: 'tiri', f: ['tiri_home', 'tiri_away', 'tiri_gap'], g: 'tiri_games' },
  { key: 'sot', label: 'Tiri in porta', unit: 'Tiri in porta attesi', title: 'Maggiore divario tiri in porta', list: 'tiri_sot', f: ['sot_home', 'sot_away', 'sot_gap'], g: 'sot_games' },
  { key: 'fouls', label: 'Falli', unit: 'Falli attesi', title: 'Maggiore divario falli', list: 'falli', f: ['falli_home', 'falli_away', 'falli_gap'], g: 'falli_games' },
  { key: 'offsides', label: 'Fuorigioco', unit: 'Fuorigiochi attesi', title: 'Maggiore divario fuorigiochi', list: 'fuorigiochi', f: ['off_home', 'off_away', 'off_gap'], g: 'off_games' },
];

export const matchupDays = () => Object.keys((RAW.angoli && RAW.angoli.days) || {}).sort();

const typeOf = (key) => MATCHUP_TYPES.find((t) => t.key === key) || MATCHUP_TYPES[0];

export function matchupRows(dateStr, typeKey) {
  const type = typeOf(typeKey);
  const day = RAW.angoli && RAW.angoli.days && RAW.angoli.days[dateStr];
  const list = (day && day[type.list]) || [];
  return list.map((m) => {
    const home = teamByName(m.home);
    const away = teamByName(m.away);
    const games = m[type.g] || [];
    let first;
    let second;
    let divario;
    if (type.f) {
      first = m[type.f[0]];
      second = m[type.f[1]];
      divario = m[type.f[2]];
    } else if (type.kind === 'cards') {
      first = m.cards_home;
      second = m.cards_away;
      divario = m.cards;
    } else {
      first = m.cards_1t_home;
      second = m.cards_1t_away;
      divario = m.cards_1t;
    }
    return { id: m.id, type, homeId: home ? home.id : null, awayId: away ? away.id : null, homeName: m.home, awayName: m.away, league: m.league, date: m.date, home: first, away: second, divario, playedHome: games[0], playedAway: games[1], nonCovered: m.non_coperto || [] };
  });
}
