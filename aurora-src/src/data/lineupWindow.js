// Controllo delle formazioni prima del fischio (regola fissa, vedi docs/regole/partite-formazioni.md, "diretta.it al primo posto", 15/11/2026).
// Oltre 1h26 dal fischio: un controllo ogni 2 ore (formazioni probabili, da 7 giorni prima); da 1h26 dal fischio: ogni 2-3 secondi finche' la formazione non e' ufficiale;
// ufficiale: nessun altro controllo; al fischio d'inizio un solo giro, poi il live funziona come prima (ogni 5 secondi).
const MIN = 60000;
const WINDOW = 86 * MIN; // 1h26, uguale per tutti i campionati e le coppe

export const lineupWindowMs = () => WINDOW;
// REGOLA FISSA (utente 21/11/2026): "Formazione ufficiale" solo da 1h15 prima del fischio; prima vale sempre come probabile, qualunque fonte la dica ufficiale
export const OFFICIAL_FROM = 75 * MIN;
export const officialAllowed = (m, now = Date.now()) => !m || m.status !== 'scheduled' || !m.ts || m.ts - now <= OFFICIAL_FROM;
export const lineupIsOfficial = (m) => /^(standard|official|confirm)/i.test((m && m.lineupType) || '') && officialAllowed(m);

// ogni quanti battiti da 5 secondi richiamare la partita (1 = ogni 5 s); 0 = non serve
export function lineupBeat(m, now = Date.now()) {
  if (!m) return 0;
  if (m.status === 'live') return 1;
  if (m.status !== 'scheduled') return 0;
  const to = m.ts - now;
  if (to > 7 * 86400000) return 0;
  if (to <= 0) return 1; // fischio d'inizio: un giro appena parte, poi il live prende il posto
  if (lineupIsOfficial(m)) return 0; // ufficiale: non serve piu' aggiornare
  // nessuna formazione arrivata (richiesta andata male o fonte lenta, 18/11/2026): si riprova ogni 30 secondi invece di aspettare 2 ore
  // anche con una sola squadra arrivata (21/11/2026: la scheda Formazioni spariva e si riprovava dopo 2 ore)
  if (!(m.lineup && m.lineup.home && m.lineup.away)) return 6;
  if (to <= WINDOW) return 1; // dentro 1h26 e non ancora ufficiale: ogni 5 secondi
  return 1440; // fuori finestra: una volta ogni 2 ore (1440 battiti da 5 s)
}
