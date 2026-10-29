// Competizioni dell'archivio (fm-<id>) nella Home: le partite di un giorno arrivano da giorni/<data>.json
// (risultati.py, feed FotMob del giorno ogni 10 minuti) e si aggiungono solo per i giorni che si aprono (mai tutte insieme).
import { archIndex, dayFile, curSeasonSync } from './archive';
import { addFeedRows } from './matches';
import { leagueById } from './leagues';

const lgOf = (fm) => {
  const L = leagueById(`fm-${fm}`);
  return L && L.arch ? L.id : null; // top campionati e campionati aggiunti hanno gia' le loro fonti
};
export async function loadDayFeed(iso) {
  await archIndex();
  const f = await dayFile(iso);
  if (!f || !f.m) return 0;
  return addFeedRows(f.m, lgOf, (fm) => curSeasonSync(fm));
}
