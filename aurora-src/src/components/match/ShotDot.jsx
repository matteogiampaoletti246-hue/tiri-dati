// Pallini della mappa tiri: stessa dimensione per tutti. Fuori = vuoto, in porta (palo/traversa inclusi) = pieno, gol = pallone (senza contorno).
export const SHOT_HOME = '#1d6fe0';
export const SHOT_AWAY = '#e0332b';
export const SHOT_PITCH = '#e9efe6';
export const SHOT_LINE = 'rgba(30,60,40,.42)';
export const SHOT_GOALBG = '#10203a';

const PENT = [0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return [a, Math.cos(a), Math.sin(a)]; });

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
