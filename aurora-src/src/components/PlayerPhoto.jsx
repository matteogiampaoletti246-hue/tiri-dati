import { useEffect, useState } from 'react';

// Foto mancante o che non si carica: busto scuro "non sbloccato" senza volto (capelli rasati), ritagliato senza sfondo: dietro si vede il colore del riquadro (colori squadra). Colori dai temi (--sil-*).
export function Silhouette({ className = 'h-full w-full' }) {
  return (
    <svg viewBox="0 6 100 114" className={className} aria-hidden="true" preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d="M0 121 L0 101 C12 95 30 89 37 85 L63 85 C70 89 88 95 100 101 L100 121 Z" fill="var(--sil-shirt)" />
      <path d="M0 121 L0 104 C10 99 20 95 28 92 L30 121 Z M100 121 L100 104 C90 99 80 95 72 92 L70 121 Z" fill="var(--sil-shirt2)" />
      <path d="M40 62 C40 74 39 81 35 86 C40 94 60 94 65 86 C61 81 60 74 60 62 Z" fill="var(--sil-face)" />
      <path d="M41.5 70 Q50 88 58.5 70 Q50 76 41.5 70 Z" fill="var(--sil-shadow)" />
      <path d="M31.5 42 C29 43 28.5 48 31 53 C32 55 33.5 56 34.5 55 L35 43 Z" fill="var(--sil-face)" />
      <path d="M68.5 42 C71 43 71.5 48 69 53 C68 55 66.5 56 65.5 55 L65 43 Z" fill="var(--sil-face)" />
      <path d="M34.5 31 C42 27 58 27 65.5 31 L66.5 44 C66.5 57 62 67 54.5 71 L45.5 71 C38 67 33.5 57 33.5 44 Z" fill="var(--sil-face)" />
      <path d="M33.5 44 C31 32 33 21 40 16 C46 12.5 54 12.5 60 16 C67 21 69 32 66.5 44 L66 37 C65 33 64 31 62 30 C54 28.5 46 28.5 38 30 C36 31 35 33 34 37 Z" fill="var(--sil-hair)" />
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
