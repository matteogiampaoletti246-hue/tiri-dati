import { playerByFm, natByFm } from '@/data/players';
import { parseArchiveId } from '@/data/archivePlayer';

// Club e nazionale dello stesso giocatore: la scheda e' una sola. Se la scheda aperta e' una nazionale senza dati propri
// (partite recenti, percentili) usa quelli del club; `dataP` e' la scheda da cui leggere statistiche, partite e carriera.
export function playerCtx(player1) {
  const dp = player1.nat && player1.club && !(player1.recent || []).length ? player1.club : null;
  const player = dp ? { ...player1, percentileSrc: dp, rating: player1.rating || dp.rating } : player1;
  const dataP = dp || player1;
  const clubE = player1.nat ? (player1.club || player1) : player1;
  const natE = player1.nat ? player1 : (player1.natView || null);
  return { player, dataP, clubE, natE };
}

// Profilo "attuale" da cui leggere i dati dell'Affidabilita' (tiri, ultime 5, nazionale, prossime partite). Una scheda aperta dall'archivio
// (giocatore di una nazionale, di un campionato aggiunto, di una stagione passata) e' costruita solo dalle statistiche di quella competizione:
// non ha ultime partite, medie ne' collegamento con club e nazionale. Il profilo vero e' quello con lo stesso id FotMob (club, poi sola nazionale).
export function calcPlayerOf(p) {
  if (!p || !p.archive) return p;
  const a = parseArchiveId(p.id);
  const pid = a ? a.pid : p.fmId;
  const cur = pid ? playerByFm(pid) || natByFm(pid) : null;
  return cur || p;
}
