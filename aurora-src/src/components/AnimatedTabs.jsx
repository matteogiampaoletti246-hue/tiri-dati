import { useEffect, useRef, useState } from 'react';

// Barra a pillole "Animated Tabs": voci della stessa larghezza, la pillola attiva scivola dietro il testo con un leggero
// rimbalzo (solo transform). Sotto, il contenuto della voce scelta: esce e rientra con opacita', scala, spostamento e sfocatura.
// - la scelta resta finche' la scheda e' aperta: gli aggiornamenti dei dati (live, refresh) ridisegnano senza ripartire;
// - all'apertura il contenuto c'e' gia' (nessuna animazione d'ingresso), anima solo il cambio di voce;
// - "riduci movimento": cambio immediato, senza animazioni (regole in index.css).
// blur: sfocatura del contenuto in px (piu' bassa sulle liste lunghe).
const OUT_MS = 180;

export default function AnimatedTabs({ options, value, onChange, children, blur = 10, label }) {
  const [shown, setShown] = useState(value);
  const [phase, setPhase] = useState('idle'); // idle | out | in
  const timer = useRef(0);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));

  useEffect(() => {
    if (value === shown) return undefined;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    clearTimeout(timer.current);
    if (reduce) { setShown(value); setPhase('idle'); return undefined; }
    setPhase('out');
    timer.current = setTimeout(() => { setShown(value); setPhase('in'); }, OUT_MS);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      <div className="atabs halo-trigger mx-4" role="tablist" aria-label={label} style={{ '--n': options.length, '--i': idx }}>
        <span className="atabs-pill" aria-hidden="true" />
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button key={String(o.value)} type="button" role="tab" aria-selected={on} className={`atabs-tab press${on ? ' on' : ''}`} onClick={() => onChange(o.value)}>
              {o.label}
            </button>
          );
        })}
      </div>
      <div
        key={String(shown)}
        role="tabpanel"
        className={`atabs-body${phase === 'out' ? ' out' : phase === 'in' ? ' in' : ''}`}
        style={{ '--ab': `${blur}px` }}
        onAnimationEnd={(e) => { if (e.target === e.currentTarget && phase === 'in') setPhase('idle'); }}
      >
        {children(shown)}
      </div>
    </div>
  );
}
