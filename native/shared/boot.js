// Avvio dei dati condivisi col sito (stessa sequenza di data/index.js, senza live e senza feed della Home).
import './shim';
import { loadRaw, rawMissing } from '@/data/load';
import { buildLeagues } from '@/data/leagues';
import { buildTeams } from '@/data/teams';
import { buildCalcData } from '@/data/calcData';
import { buildReferees } from '@/data/referees';
import { buildMatches } from '@/data/matches';
import { buildPlayers } from '@/data/players';
import { resetStandingsCache } from '@/data/standings';

let p = null;
let partial = 0;
export const bootShared = () => {
  // dati a meta' (un file essenziale non arrivato): al prossimo uso, dopo almeno 20 s, si ricarica tutto e si ricostruisce (17/11/2026: affidabilita' sparite da ogni partita)
  if (p && partial && Date.now() - partial > 20000) p = null;
  if (!p) p = loadRaw().then(() => { buildLeagues(); buildTeams(); buildCalcData(); buildReferees(); buildMatches(); buildPlayers(); resetStandingsCache(); partial = rawMissing().length ? Date.now() : 0; return true; }).catch((e) => { p = null; throw e; });
  return p;
};
