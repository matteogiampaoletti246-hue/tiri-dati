import { motion } from 'framer-motion';

// Marchio ScalperLab: la lente d'ingrandimento ("Lab") con dentro il campo da calcio.
// Lente e palla seguono il tema (nero di giorno, bianco di notte); il campo e il manico sono azzurri.
const OUT = [0.22, 1, 0.36, 1];

export default function Logo({ size = 32, draw = false, className = '' }) {
  const line = (delay, dur) =>
    draw
      ? { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: dur, delay, ease: OUT } }
      : { initial: false };
  const stroke = { strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const acc = 'var(--accent)';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true" style={{ overflow: 'visible', color: 'var(--ink)' }}>
      <defs>
        <clipPath id="sl-lens-clip">
          <circle cx={42} cy={42} r={26} />
        </clipPath>
      </defs>
      <motion.circle cx={42} cy={42} r={30} strokeWidth={8} stroke="currentColor" {...stroke} {...line(0, 0.8)} />
      <motion.path d="M42 14V70" strokeWidth={3.5} stroke={acc} {...stroke} {...line(0.6, 0.5)} />
      <motion.circle cx={42} cy={42} r={10} strokeWidth={3.5} stroke={acc} {...stroke} {...line(0.7, 0.6)} />
      <motion.path d="M13 31H20V53H13M71 31H64V53H71" strokeWidth={3} stroke={acc} opacity={0.7} {...stroke} {...line(0.8, 0.6)} />
      <motion.path
        d="M65 65L88 88"
        strokeWidth={11}
        stroke={acc}
        {...stroke}
        {...(draw
          ? { initial: { opacity: 0, x: -16, y: -16 }, animate: { opacity: 1, x: 0, y: 0 }, transition: { duration: 0.6, delay: 0.9, ease: OUT } }
          : { initial: false })}
      />
      <motion.circle
        cx={42}
        cy={42}
        r={4}
        fill="currentColor"
        {...(draw ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 1.3, duration: 0.2 } } : { initial: false })}
      />
      {draw ? (
        <g clipPath="url(#sl-lens-clip)">
          <motion.rect
            x={10}
            width={64}
            height={3}
            rx={1.5}
            fill={acc}
            style={{ filter: 'drop-shadow(0 0 3px var(--accent))' }}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: [14, 70, 14, 70], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.2, delay: 0.9, ease: 'easeInOut' }}
          />
        </g>
      ) : null}
    </svg>
  );
}
