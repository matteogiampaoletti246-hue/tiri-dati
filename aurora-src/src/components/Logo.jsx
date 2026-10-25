import { motion } from 'framer-motion';

const KEY = 'sl-logo';
export const getLogoVariant = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'b' || v === 'c' ? v : 'a';
  } catch {
    return 'a';
  }
};
export const setLogoVariant = (v) => {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* ignora */
  }
};

const S_PATH = 'M66 30c-4-9-19-14-30-9-11 5-13 18-3 24 8 5 22 6 28 12 6 6 3 18-8 22-11 4-26-1-30-10';
const ease = 'easeInOut';

// Tre marchi a tema calcio, nero (giorno) o bianco (notte) tramite currentColor.
//  a: pallone   b: scudetto con la S   c: tiro in porta
export default function Logo({ size = 32, draw = false, variant, className = '' }) {
  const v = variant || getLogoVariant();
  const line = (delay = 0, dur = 0.9) =>
    draw
      ? { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: dur, delay, ease } }
      : { initial: false };
  const pop = (delay) =>
    draw
      ? { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { delay, type: 'spring', stiffness: 260, damping: 15 } }
      : { initial: false };
  const stroke = { stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true" style={{ overflow: 'visible', color: 'var(--ink)' }}>
      {v === 'a' ? (
        <>
          <motion.circle cx={50} cy={50} r={40} strokeWidth={6} {...stroke} {...line(0, 0.85)} />
          <motion.path d="M50 36L63.3 45.7L58.2 61.3H41.8L36.7 45.7Z" strokeWidth={5} {...stroke} {...line(0.7, 0.5)} />
          <motion.path
            d="M50 36V10M63.3 45.7L88 37.6M58.2 61.3L73.5 82.4M41.8 61.3L26.5 82.4M36.7 45.7L12 37.6"
            strokeWidth={5}
            {...stroke}
            {...line(0.95, 0.5)}
          />
        </>
      ) : null}
      {v === 'b' ? (
        <>
          <motion.path d="M50 7L87 19V50C87 74 71 88 50 94C29 88 13 74 13 50V19Z" strokeWidth={6} {...stroke} {...line(0, 0.95)} />
          <g transform="translate(18 14) scale(.64)">
            <motion.path d={S_PATH} strokeWidth={10} {...stroke} {...line(0.7, 0.7)} />
          </g>
          <motion.circle cx={69} cy={72} r={5.5} fill="currentColor" {...pop(1.35)} style={{ transformOrigin: '69px 72px' }} />
        </>
      ) : null}
      {v === 'c' ? (
        <>
          <motion.path d="M10 86V34H90V86" strokeWidth={6} {...stroke} {...line(0, 0.7)} />
          <motion.path d="M10 52H90M10 70H90M30 34V86M50 34V86M70 34V86" strokeWidth={2} {...stroke} opacity={0.35} {...line(0.4, 0.6)} />
          <motion.path d="M8 92C16 18 66 6 70 56" strokeWidth={5} strokeDasharray="1 9" {...stroke} {...line(0.6, 0.9)} />
          <motion.circle cx={70} cy={58} r={9} fill="currentColor" {...pop(1.3)} style={{ transformOrigin: '70px 58px' }} />
        </>
      ) : null}
    </svg>
  );
}
