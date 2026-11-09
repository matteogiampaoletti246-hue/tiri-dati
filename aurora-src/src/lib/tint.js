// Sfumature nei colori sociali: righe dei giocatori e testata della partita.
export const teamGrad = (team, a = 0x55) => {
  const c = team && team.colors ? team.colors[0] : '#2C3E66';
  return `linear-gradient(100deg, ${c}${a.toString(16).padStart(2, '0')}, rgba(255,255,255,.03) 70%)`;
};
export const teamColor = (team) => (team && team.colors ? team.colors[0] : '#2C3E66');
// Riquadro a pillola nel colore del campionato (tinta unica scelta per ogni competizione).
export const tintGrad = (c, a = 0x40) => `linear-gradient(100deg, ${c}${a.toString(16).padStart(2, '0')}, rgba(255,255,255,.03) 70%)`;

// ── Colori di una partita (regola fissa): ogni squadra col suo colore sociale principale; se i due principali si
// somigliano, la squadra in trasferta passa al suo secondario; se anche quello somiglia, al colore piu' lontano tra i suoi
// (o all'accento del tema). Cosi' le due squadre hanno sempre colori diversi in banner, statistiche, momentum, cronologia.
const rgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim()); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
// distanza percepita (redmean): ~0 uguali, >120 ben diversi
export const colorDist = (a, b) => {
  const p = rgb(a); const q = rgb(b); if (!p || !q) return 999;
  const r = (p[0] + q[0]) / 2; const dr = p[0] - q[0]; const dg = p[1] - q[1]; const db = p[2] - q[2];
  return Math.sqrt((2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db);
};
const SAME = 130;
const PAIR = new Map(); // cache piccola: stessa coppia, stessi colori a ogni disegno
export function matchColors(home, away) {
  const hc = (home && home.colors) || [teamColor(home)];
  const ac = (away && away.colors) || [teamColor(away)];
  const key = `${hc.join()}|${ac.join()}`;
  if (PAIR.has(key)) return PAIR.get(key);
  const h = hc[0];
  let a = ac[0];
  if (colorDist(h, a) < SAME) {
    const alt = ac.slice(1).find((c) => colorDist(h, c) >= SAME);
    a = alt || [...ac.slice(1), '#4DA8FF'].sort((x, y) => colorDist(h, y) - colorDist(h, x))[0] || a;
  }
  const out = [h, a];
  if (PAIR.size > 400) PAIR.delete(PAIR.keys().next().value);
  PAIR.set(key, out);
  return out;
}
// colore leggibile sopra il colore sociale (bianco/quasi nero)
export const inkOn = (c) => { const p = rgb(c); if (!p) return '#fff'; return (p[0] * 299 + p[1] * 587 + p[2] * 114) / 1000 > 150 ? '#0F172A' : '#fff'; };
// colore sociale scuro (nero, blu notte) schiarito verso il bianco quel tanto che basta per leggersi su fondo scuro
// (luminosita' minima ~125); restituisce sempre un esadecimale, valido anche in SVG e nell'app nativa
const hex = (p) => `#${p.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const lum = (p) => (p[0] * 299 + p[1] * 587 + p[2] * 114) / 1000;
export const shown = (c, min = 125) => {
  const p = rgb(c); if (!p) return c;
  if (lum(p) >= min) return c;
  let t = 0;
  for (; t < 0.9; t += 0.05) { const q = p.map((v) => v + (255 - v) * t); if (lum(q) >= min) break; }
  return hex(p.map((v) => v + (255 - v) * t));
};
