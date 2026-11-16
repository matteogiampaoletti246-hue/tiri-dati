import { playerByFm, natByFm } from '@/data/players';
import { parseArchiveId } from '@/data/archivePlayer';
import { teamById, teamByFm, ensureTeam } from '@/data/teams';

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

// Squadra di club da mostrare (banner, Profilo, pannello). Chi ha solo il profilo della nazionale (club senza presenze o fuori dai campionati
// dell'app, es. Paalberg: Estonia + Saint-Etienne) mostrava "Estonia | Estonia": il club viene da calc_extra.py (`ct`/`cf` -> clubName/clubFm).
export function clubTeamOf(player1, clubE, fallback) {
  if (player1 && player1.nat && !player1.club && (player1.clubFm || player1.clubName)) {
    const t = (player1.clubFm && teamByFm(player1.clubFm)) || (player1.clubName ? ensureTeam(player1.clubName, null, player1.clubFm ? `https://images.fotmob.com/image_resources/logo/teamlogo/${player1.clubFm}.png` : null, player1.clubFm || null) : null);
    if (t) return t;
  }
  return teamById(clubE.teamId) || fallback || null;
}
