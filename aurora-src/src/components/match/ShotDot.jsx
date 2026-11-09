import { shown, inkOn, colorDist, matchColors } from '@/lib/tint';

// Mappe tiri (regola fissa, concept A): campo verde scuro con linee bianche, porte su verde ancora piu' scuro; i pallini hanno il
// colore della squadra (mai blu/rosso fissi). Stessa dimensione per tutti. Fuori = vuoto, in porta (palo/traversa inclusi) = pieno
// con anello bianco (scuro se il colore e' chiaro), gol = pallone con anello nel colore squadra.
export const SHOT_HOME = '#1d6fe0'; // solo se la squadra non ha colori
export const SHOT_PITCH = '#1c5a38';
export const SHOT_LINE = 'rgba(255,255,255,.55)';
export const SHOT_GOALBG = '#12351f';
export const SHOT_TRACE = 'rgba(255,255,255,.8)';
export const SHOT_GOALLINE = 'rgba(255,255,255,.45)';
const RING_DARK = '#0b2616';

// ── Colori dei pallini ──
const parse = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim()); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
// verde (o troppo vicino al verde del campo): su questo campo sparirebbe
const onGreen = (c) => { const p = parse(c); if (!p) return false; return (p[1] > p[0] + 10 && p[1] > p[2] + 10) || colorDist(c, SHOT_PITCH) < 100; };
// colore leggibile sul campo: se e' verde passa al secondo colore della squadra (o al bianco), se e' scuro si schiarisce
const safe = (colors) => {
  const list = (Array.isArray(colors) ? colors : [colors]).filter((c) => parse(c));
  if (!list.length) return SHOT_HOME;
  const pick = onGreen(list[0]) ? (list.slice(1).find((c) => !onGreen(c)) || '#ffffff') : list[0];
  return shown(pick, 70);
};
// colore dei pallini di una squadra sola (mappe del giocatore)
export const shotColor = (colors) => safe(colors);
// colori dei pallini di una partita: partono da quelli della partita (`matchColors`), poi stesse regole; se le due squadre si somigliano
// la trasferta passa a un altro suo colore
export function shotColors(home, away) {
  const [mh, ma] = matchColors(home, away);
  const h = safe([mh, ...((home && home.colors) || []).slice(1)]);
  let a = safe([ma, ...((away && away.colors) || []).slice(1)]);
  if (colorDist(h, a) < 130) {
    const alts = [...((away && away.colors) || []), '#ffffff', '#4DA8FF'].filter((c) => parse(c) && !onGreen(c)).map((c) => shown(c, 70));
    a = alts.sort((x, y) => colorDist(h, y) - colorDist(h, x))[0] || a;
  }
  return [h, a];
}
// colore usato per i testi (nomi, sigle): un colore chiaro (bianco) non si vedrebbe sul tema chiaro
export const shotText = (c) => (inkOn(c) === '#0F172A' ? 'var(--ink)' : c);

const PENT = [0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return [a, Math.cos(a), Math.sin(a)]; });

export const isBlocked = (s) => s && s.outcome === 'Murato';

// Tiro murato: traiettoria tratteggiata fino al punto in cui e' stato fermato, chiusa da un breve trattino perpendicolare (mai fino alla porta)
export function BlockTrace({ x1, y1, x2, y2, stroke = SHOT_TRACE, w = 0.45 }) {
  const dx = x2 - x1; const dy = y2 - y1; const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L; const ny = dx / L; const t = 1.5;
  return (
    <g pointerEvents="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={w} strokeDasharray="1.3 1.1" />
      <line x1={x2 - nx * t} y1={y2 - ny * t} x2={x2 + nx * t} y2={y2 + ny * t} stroke={stroke} strokeWidth={w * 2} strokeLinecap="round" />
    </g>
  );
}

// area di tocco ampia (~54 px) trasparente: i pallini sono piccoli, ma si toccano facilmente
export function ShotHit({ r = 4.6 }) {
  return <circle r={r} fill="transparent" />;
}

export function ShotDot({ c, goal, on, r }) {
  const ring = inkOn(c) === '#0F172A' ? RING_DARK : '#ffffff';
  const halo = <circle r={r + 0.5} fill="rgba(0,0,0,.30)" />;
  if (goal) {
    return (
      <>
        {halo}
        <circle r={r + 0.55} fill="none" stroke={String(c).toLowerCase() === '#ffffff' ? '#cfe9d8' : c} strokeWidth="0.7" />
        <circle r={r} fill="#fff" />
        <polygon points={PENT.map(([, x, y]) => `${(0.42 * r * x).toFixed(2)},${(0.42 * r * y).toFixed(2)}`).join(' ')} fill="#111" />
        {PENT.map(([, x, y], i) => <line key={i} x1={0.42 * r * x} y1={0.42 * r * y} x2={0.98 * r * x} y2={0.98 * r * y} stroke="#111" strokeWidth="0.28" />)}
      </>
    );
  }
  if (on) return <>{halo}<circle r={r} fill={c} stroke={ring} strokeWidth="0.5" /></>;
  return <>{halo}<circle r={r - 0.3} fill="rgba(0,0,0,.35)" stroke={c} strokeWidth="0.85" /></>;
}
