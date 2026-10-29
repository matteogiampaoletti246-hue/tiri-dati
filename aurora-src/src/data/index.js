// Avvio dei dati: scarica i file veri, poi costruisce squadre, partite, giocatori, ecc.
import { loadRaw, RAW } from './load';
import { buildLeagues } from './leagues';
import { buildTeams } from './teams';
import { buildMatches } from './matches';
import { buildPlayers } from './players';
import { buildReferees } from './referees';
import { buildCalcData } from './calcData';
import { resetStandingsCache } from './standings';
import { startLive } from './live';
import { refreshStatus } from './fotmob';
import { archIndex } from './archive';
import { loadDayFeed } from './dayFeed';
import { TODAY_ISO } from './matches';

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
      startLive();
      // indice dell'archivio a riposo: le competizioni scaricate (anche quelle solo d'archivio) sono subito in ricerca e nelle tendine
      setTimeout(() => { archIndex().catch(() => null); }, 1200);
      // prima di mostrare la Home: stato e risultati delle partite "live" o appena finite dalla fonte (max 2,5 s)
      // e le partite di oggi delle competizioni dell'archivio (giorni/<data>.json): la Home nasce completa, niente finestre che arrivano dopo
      return Promise.race([loadDayFeed(TODAY_ISO).catch(() => 0).then(() => refreshStatus()).catch(() => 0), new Promise((r) => setTimeout(r, 2500))]).then(() => RAW);
    });
  }
  return booted;
}
