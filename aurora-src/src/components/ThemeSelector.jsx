import { getTheme, setTheme } from '@/lib/theme';
import { useState } from 'react';

const OPTIONS = [
  { value: 'light', label: 'Chiaro' },
  { value: 'dark', label: 'Scuro' },
  { value: 'auto', label: 'Auto' },
];

export default function ThemeSelector() {
  const [theme, setLocal] = useState(getTheme());
  return (
    <div className="flex items-center gap-6">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`filter-btn ${theme === opt.value ? 'is-on' : ''}`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            window.__fxOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            setTheme(opt.value);
            setLocal(opt.value);
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
