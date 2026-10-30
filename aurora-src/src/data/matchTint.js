import { leagueTint, leagueById, PALETTE, LEAGUE_TINT } from './leagues';
import { countryCode } from './countries';
import FLAG_TINT from './flagTints.json';

// Colore delle schede di una partita = colore della finestra che la racchiude in Home (regola fissa):
// top campionati e coppe europee col colore scelto per loro; tutte le altre competizioni col colore dominante della bandiera del paese
// (`flagTints.json`, generato dalle bandiere di flag-icons per ogni paese dell'indice delle competizioni).
export function matchTint(leagueId, leagueObj) {
  const own = (PALETTE[leagueId] && PALETTE[leagueId].tint) || LEAGUE_TINT[leagueId];
  if (own) return own;
  const L = leagueObj || leagueById(leagueId);
  const cc = countryCode(L);
  if (cc && FLAG_TINT[cc]) return FLAG_TINT[cc];
  return (L && L.tint) || leagueTint(leagueId);
}
