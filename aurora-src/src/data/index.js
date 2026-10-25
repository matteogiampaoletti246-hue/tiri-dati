// Avvio dei dati: scarica i file veri, poi costruisce squadre, partite, giocatori, ecc.
import { loadRaw, RAW } from './load';
import { buildLeagues } from './leagues';
import { buildTeams } from './teams';
import { buildMatches } from './matches';
import { buildPlayers } from './players';
import { buildReferees } from './referees';
import { buildCalcData } from './calcData';
import { resetStandingsCache } from './standings';

let booted = null;

export function bootData() {
  if (!booted) {
    booted = loadRaw().then(() => {
      buildLeagues();
      buildTeams();
      buildCalcData();
      buildReferees();
      buildMatches();
      buildPlayers();
      resetStandingsCache();
      return RAW;
    });
  }
  return booted;
}
