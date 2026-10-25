import { useState } from 'react';

// Scelta tra tre concept (A, B, C) per ogni sezione grafica: si ricorda sul telefono.
const KEY = 'sl-concept-';
export function useConcept(section) {
  const [v, setV] = useState(() => {
    try {
      return localStorage.getItem(KEY + section) || 'a';
    } catch {
      return 'a';
    }
  });
  const set = (x) => {
    setV(x);
    try {
      localStorage.setItem(KEY + section, x);
    } catch {
      /* ignora */
    }
  };
  return [v, set];
}

export function ConceptSwitch({ value, onChange, label }) {
  return (
    <div className="flex items-center gap-2">
      {label ? <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{label}</span> : null}
      <div className="glass-flat flex items-center gap-0.5 rounded-full p-0.5">
        {['a', 'b', 'c'].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className="press h-[22px] w-[26px] rounded-full text-[11px] font-extrabold uppercase"
            style={{ background: value === k ? 'var(--accent)' : 'transparent', color: value === k ? '#fff' : 'var(--ink-3)' }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
