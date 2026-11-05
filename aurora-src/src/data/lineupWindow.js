// Finestra di controllo delle formazioni prima del fischio (regola fissa, vedi docs/regole/partite-formazioni.md).
// Coppe europee e Premier League: le formazioni escono 75' prima, quindi si parte 76' prima; gli altri campionati 60' prima, si parte 61' prima.
// Dentro la finestra l'app controlla ogni 5 secondi finche' la formazione non e' ufficiale; prima della finestra basta una volta al minuto.
const EARLY = new Set(['premier-league', 'champions-league', 'europa-league', 'conference-league']);
const MIN = 60000;

export const lineupWindowMs = (m) => (EARLY.has(m && m.leagueId) ? 76 : 61) * MIN;
export const lineupIsOfficial = (m) => /^(standard|official|confirm)/i.test((m && m.lineupType) || '');

// ogni quanti battiti da 5 secondi richiamare la partita (1 = ogni 5 s); 0 = non serve
export function lineupBeat(m, now = Date.now()) {
  if (!m) return 0;
  if (m.status === 'live') return 1;
  if (m.status !== 'scheduled') return 0;
  const to = m.ts - now;
  if (to > 96 * 3600000) return 0;
  if (to <= lineupWindowMs(m)) return lineupIsOfficial(m) ? 6 : 1; // ufficiale gia' uscita: solo un controllo ogni 30 s per le correzioni dell'ultimo minuto
  return 12; // formazione probabile lontana dal fischio: una volta al minuto
}
