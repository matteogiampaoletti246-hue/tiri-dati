import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

// Indicatore delle tendine (21st "Halo Select", cult/ui): freccia che ruota aprendo; appena si sceglie una voce nuova
// compare una rotellina e poi una spunta verde, poi torna la freccia. Solo transform/opacity, nessun cambio di misura.
export default function HaloChevron({ open, value, size = 16, strokeWidth = 2, className = '' }) {
  const [st, setSt] = useState('chev');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    setSt('spin');
    const a = setTimeout(() => setSt('ok'), 380);
    const b = setTimeout(() => setSt('chev'), 1500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [value]);
  const box = { width: size, height: size };
  return (
    <span className={`relative inline-flex flex-none items-center justify-center ${className}`} style={box} aria-hidden="true">
      <ChevronDown size={size} strokeWidth={strokeWidth} className="absolute" style={{ color: 'var(--ink-3)', opacity: st === 'chev' ? 1 : 0, transform: `${open ? 'rotate(180deg)' : 'none'}`, transition: 'transform .25s, opacity .2s' }} />
      <span className="halo-spin absolute rounded-full" style={{ width: size - 3, height: size - 3, opacity: st === 'spin' ? 1 : 0, transition: 'opacity .15s', animationPlayState: st === 'spin' ? 'running' : 'paused' }} />
      <Check size={size} strokeWidth={2.6} className="absolute" style={{ color: 'var(--good, #2FBF71)', opacity: st === 'ok' ? 1 : 0, transform: st === 'ok' ? 'scale(1)' : 'scale(.5)', transition: 'opacity .2s, transform .3s cubic-bezier(.3,1.5,.5,1)' }} />
    </span>
  );
}
