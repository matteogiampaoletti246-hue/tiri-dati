// Pallini della mappa tiri: stessa dimensione per tutti. Fuori = vuoto, in porta (palo/traversa inclusi) = pieno, gol = pallone (senza contorno).
export const SHOT_HOME = '#1d6fe0';
export const SHOT_AWAY = '#e0332b';
export const SHOT_PITCH = '#e9efe6';
export const SHOT_LINE = 'rgba(30,60,40,.42)';
export const SHOT_GOALBG = '#10203a';

const PENT = [0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return [a, Math.cos(a), Math.sin(a)]; });

export const isBlocked = (s) => s && s.outcome === 'Murato';

// Tiro murato: traiettoria tratteggiata fino al punto in cui e' stato fermato, chiusa da un breve trattino perpendicolare (mai fino alla porta)
export function BlockTrace({ x1, y1, x2, y2, stroke = '#0b1a10', w = 0.45 }) {
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
  if (goal) {
    return (
      <>
        <circle r={r} cx="0.15" cy="0.3" fill="rgba(0,0,0,.22)" />
        <circle r={r} fill="#fff" />
        <polygon points={PENT.map(([, x, y]) => `${(0.42 * r * x).toFixed(2)},${(0.42 * r * y).toFixed(2)}`).join(' ')} fill="#111" />
        {PENT.map(([, x, y], i) => <line key={i} x1={0.42 * r * x} y1={0.42 * r * y} x2={0.98 * r * x} y2={0.98 * r * y} stroke="#111" strokeWidth="0.28" />)}
      </>
    );
  }
  if (on) return <circle r={r} fill={c} stroke="#fff" strokeWidth="0.4" />;
  return <circle r={r - 0.3} fill="none" stroke={c} strokeWidth="0.75" />;
}
