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
