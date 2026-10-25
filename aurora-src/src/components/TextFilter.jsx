import { useId } from 'react';
import { motion } from 'framer-motion';

// Filtri in vetro: l'indicatore scivola da una voce all'altra.
export default function TextFilter({ options, value, onChange, className = '' }) {
  const uid = useId();
  return (
    <div className={`glass-flat hide-sb flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full p-1 ${className}`}>
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const active = val === value;
        return (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange(val)}
            className="press relative shrink-0 rounded-full px-3.5 py-[6px] text-[12.5px] font-bold"
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
