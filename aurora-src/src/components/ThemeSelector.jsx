import { getTheme, setTheme } from '@/lib/theme';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

// Theme Toggle concept C (21st, Efferd "Toggle Theme"): pillola a tre posizioni con il cursore in vetro che scivola
// (solo transform), sotto il nome del tema scelto.
const OPTIONS = [
  { value: 'light', label: 'Chiaro', Icon: Sun },
  { value: 'dark', label: 'Scuro', Icon: Moon },
  { value: 'auto', label: 'Auto (segue il telefono)', Icon: Monitor },
];
const W = 44;

export default function ThemeSelector() {
  const [theme, setLocal] = useState(getTheme());
  const i = Math.max(0, OPTIONS.findIndex((o) => o.value === theme));
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Tema" className="theme-tri relative flex rounded-full p-1">
        <span aria-hidden="true" className="theme-thumb absolute left-1 top-1 rounded-full" style={{ width: W, height: 36, transform: `translate3d(${i * W}px,0,0)` }} />
        {OPTIONS.map(({ value, label, Icon }, k) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={k === i}
            aria-label={label}
            className="relative z-[1] flex h-9 items-center justify-center"
            style={{ width: W, color: k === i ? 'var(--ink)' : 'var(--ink-3)', transition: 'color .3s ease' }}
            onClick={() => { setTheme(value); setLocal(value); }}
          >
            <Icon size={18} strokeWidth={2} />
          </button>
        ))}
      </div>
      <span className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>{OPTIONS[i].label}</span>
    </div>
  );
}
