import { useEffect, useState } from 'react';

// Foto mancante o che non si carica: omino neutro (testa e spalle), nello stesso riquadro delle altre foto.
export function Silhouette({ className = 'h-full w-full' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice" style={{ display: 'block', background: 'color-mix(in srgb, var(--ink) 14%, var(--sky-2))' }}>
      <circle cx="20" cy="15.5" r="7" fill="color-mix(in srgb, var(--ink) 52%, transparent)" />
      <path d="M5.5 40c0-8.6 6.5-14 14.5-14s14.5 5.4 14.5 14z" fill="color-mix(in srgb, var(--ink) 52%, transparent)" />
    </svg>
  );
}

// Foto del giocatore (stessa foto ovunque: formazioni, rose, liste, schede). Mai l'icona di immagine rotta del telefono.
export default function PlayerPhoto({ src, alt = '', className = 'h-full w-full', cover = true }) {
  const [bad, setBad] = useState(false);
  useEffect(() => { setBad(false); }, [src]);
  if (!src || bad) return <Silhouette className={className} />;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ objectFit: cover ? 'cover' : 'contain', objectPosition: 'center top' }}
      onError={() => setBad(true)}
      onLoad={(e) => { if (e.currentTarget.naturalWidth <= 2) setBad(true); }}
    />
  );
}
