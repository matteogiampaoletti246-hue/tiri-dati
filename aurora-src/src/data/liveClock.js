// Cronometro live: minuto:secondi sempre visibili + minuti di recupero annunciati dall'arbitro ("46:57  +2").
// `m.liveClock` = { s: secondi di gioco all'istante `at`, mx: fine del tempo (45/90/105/120), ad: recupero annunciato, ht: intervallo, src }
// Arriva dal worker (/fx: FotMob `liveTime.long` e evento AddedTime; riserva LiveScore, poi ESPN in live.js) e scorre da solo ogni secondo.
const STALE = 120; // oltre 2 minuti senza aggiornamenti il cronometro si ferma invece di inventare

export const clockSeconds = (c, now = Date.now()) => {
  if (!c || c.ht || c.s == null) return null;
  return Math.floor(c.s + Math.min(Math.max(0, (now - c.at) / 1000), STALE));
};

const p2 = (n) => String(n).padStart(2, '0');
export const clockText = (secs) => `${Math.floor(secs / 60)}:${p2(secs % 60)}`;

// { text: "46:57", added: 2 | 0 } oppure null se non c'e' un cronometro (si resta sul minuto semplice)
export const clockView = (c, now = Date.now()) => {
  const s = clockSeconds(c, now);
  if (s == null) return null;
  return { text: clockText(s), added: c.ad > 0 ? c.ad : 0 };
};
