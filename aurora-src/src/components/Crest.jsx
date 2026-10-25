import { useState } from 'react';

const luminance = (hex) => {
  const h = String(hex || '').replace('#', '');
  if (h.length < 6) return 0;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const readable = (colors = []) => {
  const list = (colors || []).filter(Boolean);
  if (!list.length) return 'var(--ink-2)';
  const base = [...list].sort((a, b) => luminance(b) - luminance(a))[0];
  return `color-mix(in srgb, ${base} 74%, var(--ink))`;
};

// Stemma senza cornice: solo il logo (o le iniziali) appoggiato sullo sfondo.
export default function Crest({ team, size = 34, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!team) return null;
  return (
    <span className={`crest ${className}`} style={{ width: size, height: size, color: readable(team.colors) }}>
      {team.crest && !failed ? (
        <img
          src={team.crest}
          alt={team.name}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="tnum" style={{ fontSize: Math.max(10, Math.round(size * 0.44)) }}>
          {team.initials}
        </span>
      )}
    </span>
  );
}
