// Avvio dei dati condivisi per le pagine native (una sola volta, a richiesta): stessi file e stesse regole del sito.
import './shim';
import { loadRaw } from '@/data/load';
import { buildLeagues } from '@/data/leagues';
import { buildTeams } from '@/data/teams';
import { buildCalcData } from '@/data/calcData';

let p = null;
export const bootShared = () => {
  if (!p) p = loadRaw().then(() => { buildLeagues(); buildTeams(); buildCalcData(); return true; }).catch((e) => { p = null; throw e; });
  return p;
};
