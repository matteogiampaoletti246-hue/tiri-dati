import { useEffect, useId, useRef } from 'react';
import { motion } from 'framer-motion';

// Filtri in vetro: l'indicatore scivola da una voce all'altra.
export default function TextFilter({ options, value, onChange, className = '' }) {
  const uid = useId();
  const box = useRef(null);
  // la voce attiva resta sempre interamente visibile
  useEffect(() => {
    const b = box.current;
    const el = b && b.querySelector('[data-on="1"]');
    if (!b || !el) return;
    const x = el.getBoundingClientRect().left - b.getBoundingClientRect().left + b.scrollLeft;
    const l = x - 8;
    const r = x + el.offsetWidth + 8;
    if (l < b.scrollLeft) b.scrollTo({ left: Math.max(0, l), behavior: 'smooth' });
    else if (r > b.scrollLeft + b.clientWidth) b.scrollTo({ left: r - b.clientWidth, behavior: 'smooth' });
  }, [value]);
  return (
    <div ref={box} className={`glass-flat hide-sb flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-full p-1 ${className}`}>
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const active = val === value;
        return (
          <button
            key={String(val)}
            data-on={active ? '1' : '0'}
            type="button"
            onClick={() => onChange(val)}
            className="press relative shrink-0 rounded-full px-[10.5px] py-[6px] text-[12.5px] font-bold"
          >
            {active ? (
              <motion.span
                layoutId={`flt-${uid}`}
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--pill-active)', boxShadow: 'var(--shadow-2)' }}
                transition={{ type: 'spring', stiffness: 430, damping: 34 }}
              />
            ) : null}
            <span className="relative whitespace-nowrap" style={{ color: active ? 'var(--ink)' : 'var(--ink-3)' }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
