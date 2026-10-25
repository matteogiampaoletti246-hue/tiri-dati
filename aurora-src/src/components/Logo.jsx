import { motion } from 'framer-motion';

// Marchio ScalperLab: una "S" a tratto unico con una pallina. Nero (giorno) o bianco (notte).
export default function Logo({ size = 32, draw = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      style={{ overflow: 'visible', color: 'var(--ink)' }}
    >
      <motion.path
        d="M66 30c-4-9-19-14-30-9-11 5-13 18-3 24 8 5 22 6 28 12 6 6 3 18-8 22-11 4-26-1-30-10"
        stroke="currentColor"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={draw ? { pathLength: 0 } : false}
        animate={draw ? { pathLength: 1 } : undefined}
        transition={draw ? { duration: 1.05, ease: 'easeInOut' } : undefined}
      />
      <motion.circle
        cx={23}
        cy={69}
        r={7}
        fill="currentColor"
        initial={draw ? { scale: 0, opacity: 0 } : false}
        animate={draw ? { scale: 1, opacity: 1 } : undefined}
        transition={draw ? { delay: 0.92, duration: 0.34, type: 'spring', stiffness: 300, damping: 14 } : undefined}
        style={{ transformOrigin: '23px 69px' }}
      />
    </svg>
  );
}
