// Righe del feed del giorno (giorni/<data>.json) viste dalla Home: [id, fm, utc, idCasa, idOspite, casa, ospite, punteggio, stato, ...].
// Servono quando una partita non e' ancora nel calendario archiviato della stagione (play-off o turno di coppa appena aggiunto,
// partita con id cambiato): la pagina partita si costruisce da qui e si apre comunque (regola "ogni partita in Home si apre").
import { lruSet } from '@/lib/lru';
import { dayFile } from './archive';

const ROWS = new Map();
export const rememberFeedRow = (r) => { if (r && r[0] != null && r[3] && r[4]) lruSet(ROWS, String(r[0]), r, 600); };
// riga gia' vista dalla Home (subito, senza caricare nulla): la pagina partita ne ricava la testata prima dei dati condivisi
export const peekFeedRow = (mid) => ROWS.get(String(mid)) || null;
const ROME = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' });
// riga ricordata, altrimenti cercata nei file dei giorni vicini a oggi (da ieri a +7: quelli che la Home puo' mostrare con partite non archiviate)
export async function feedRowFor(mid) {
  const k = String(mid);
  if (ROWS.has(k)) return ROWS.get(k);
  const days = [0, -1, 1, -2, 2, 3, 4, 5, 6, 7].map((d) => ROME.format(new Date(Date.now() + d * 86400000)));
  for (let i = 0; i < days.length; i += 3) {
    const files = await Promise.all(days.slice(i, i + 3).map((d) => dayFile(d).catch(() => null)));
    files.forEach((f) => ((f && f.m) || []).forEach(rememberFeedRow));
    if (ROWS.has(k)) return ROWS.get(k);
  }
  return null;
}
// riga del calendario (formato di arch/<fm>/<stagione>.json) ricavata dal feed
export const fixFromFeed = (r) => [String(r[0]), null, String(r[3]), String(r[4]), r[2], r[8] === 'f' ? r[7] : null, r[8] === 'f' ? 1 : 0, r[8] === 'f' || r[8] === 'l' ? 1 : 0, r[8] === 'c' ? 1 : 0, ...(r[9] ? [r[9]] : [])];
