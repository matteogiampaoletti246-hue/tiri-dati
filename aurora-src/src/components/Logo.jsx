import { useId } from 'react';
import { motion } from 'framer-motion';

// Marchio ScalperLab: il diamante a otto facce (concept A "Facet", 10/11/2026).
// I colori delle facce sono fissi (azzurri e blu); lo spazio tra le facce prende il colore dello sfondo del tema.
const P = { T0: [28, 10], T1: [50, 10], T2: [72, 10], G0: [6, 32], G1: [36, 32], G2: [64, 32], G3: [94, 32], C: [50, 86] };
const FACETS = [
  ['T0 G0 G1', '#7DD3FC'],
  ['T0 G1 T1', '#BAE6FD'],
  ['T1 G1 G2', '#F0F9FF'],
  ['T1 G2 T2', '#93C5FD'],
  ['T2 G2 G3', '#3B82F6'],
  ['G0 G1 C', '#38BDF8'],
  ['G1 G2 C', '#2563EB'],
  ['G2 G3 C', '#1E3A8A'],
].map(([k, c]) => [k.split(' ').map((n) => P[n].join(',')).join(' '), c]);
const OUTLINE = 'G0 T0 T2 G3 C'.split(' ').map((n) => P[n].join(',')).join(' ');

// `shine`: riflesso di luce che attraversa le facce (ritardo in secondi). `spark`: scintilla in alto a destra (ritardo in secondi).
// Solo la schermata di avvio li usa: nell'intestazione e nel menu il marchio resta fermo.
export default function Logo({ size = 32, shine, spark, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const gap = 'hsl(var(--background))';
  return (
    <svg width={size} height={size} viewBox="0 -2 100 100" className={className} aria-hidden="true" style={{ overflow: 'visible' }}>
      {shine != null ? (
        <defs>
          <clipPath id={`${uid}c`}>
            <polygon points={OUTLINE} />
          </clipPath>
          <linearGradient id={`${uid}g`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
      ) : null}
      {FACETS.map(([pts, fill]) => (
        <polygon key={pts} points={pts} fill={fill} stroke={gap} strokeWidth={1.8} strokeLinejoin="round" />
      ))}
      {shine != null ? (
        <g clipPath={`url(#${uid}c)`}>
          <motion.rect
            y={0}
            width={26}
            height={100}
            fill={`url(#${uid}g)`}
            style={{ skewX: -18 }}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: [-30, 130], opacity: [1, 1] }}
            transition={{ duration: 0.85, delay: shine, ease: [0.45, 0, 0.25, 1] }}
          />
        </g>
      ) : null}
      {spark != null ? (
        <motion.path
          d="M96 -2 L98.4 5.6 L106 8 L98.4 10.4 L96 18 L93.6 10.4 L86 8 L93.6 5.6Z"
          fill="#BAE6FD"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={{ scale: 0, rotate: -120, opacity: 0 }}
          animate={{ scale: [0, 1.35, 1], rotate: [-120, 15, 0], opacity: [0, 1, 1] }}
          transition={{ duration: 0.65, delay: spark, ease: [0.22, 1, 0.36, 1], times: [0, 0.65, 1] }}
        />
      ) : null}
    </svg>
  );
}
