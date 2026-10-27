// Sfumature nei colori sociali: righe dei giocatori e testata della partita.
export const teamGrad = (team, a = 0x55) => {
  const c = team && team.colors ? team.colors[0] : '#2C3E66';
  return `linear-gradient(100deg, ${c}${a.toString(16).padStart(2, '0')}, rgba(255,255,255,.03) 70%)`;
};
export const teamColor = (team) => (team && team.colors ? team.colors[0] : '#2C3E66');
// Riquadro a pillola nel colore del campionato (tinta unica scelta per ogni competizione).
export const tintGrad = (c, a = 0x40) => `linear-gradient(100deg, ${c}${a.toString(16).padStart(2, '0')}, rgba(255,255,255,.03) 70%)`;
