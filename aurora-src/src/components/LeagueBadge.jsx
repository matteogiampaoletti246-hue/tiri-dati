import { useState } from 'react';
import useDark from '@/hooks/useDark';

const luminance = (hex) => {
  const h = String(hex || '').replace('#', '');
  if (h.length < 6) return 0;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Campionato: stesso trattamento degli stemmi, nessuna cornice.
export default function LeagueBadge({ league, size = 26, className = '' }) {
  const dark = useDark();
  const [failed, setFailed] = useState(false);
  if (!league) return null;

  const logo = dark && league.logoDark ? league.logoDark : league.logo;
  const colors = (league.colors || []).filter(Boolean);
  const base = colors.length ? [...colors].sort((a, b) => luminance(b) - luminance(a))[0] : 'var(--ink-2)';

  return (
    <span className={`crest ${className}`} style={{ width: size, height: size, color: `color-mix(in srgb, ${base} 74%, var(--ink))` }}>
      {logo && !failed ? (
        <img src={logo} alt={league.name} width={size} height={size} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-contain" />
      ) : (
        <span className="tnum" style={{ fontSize: Math.max(10, Math.round(size * 0.44)) }}>
          {league.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}
