// Avvio dei dati condivisi col sito (stessa sequenza di data/index.js, senza live e senza feed della Home).
import './shim';
import { loadRaw } from '@/data/load';
import { buildLeagues } from '@/data/leagues';
import { buildTeams } from '@/data/teams';
import { buildCalcData } from '@/data/calcData';
import { buildReferees } from '@/data/referees';
import { buildMatches } from '@/data/matches';
import { buildPlayers } from '@/data/players';
import { resetStandingsCache } from '@/data/standings';

let p = null;
export const bootShared = () => {
  if (!p) p = loadRaw().then(() => { buildLeagues(); buildTeams(); buildCalcData(); buildReferees(); buildMatches(); buildPlayers(); resetStandingsCache(); return true; }).catch((e) => { p = null; throw e; });
  return p;
};
