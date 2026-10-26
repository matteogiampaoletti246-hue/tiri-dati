// Icona infortunato (croce bianca su cerchio rosso).
export default function InjuryIcon({ size = 16, title = 'Infortunato', className = '' }) {
  return (
    <span role="img" aria-label={title} title={title} className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`} style={{ width: size, height: size, background: '#E5484D', verticalAlign: 'middle' }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><path d="M6 1.5v9M1.5 6h9" /></svg>
    </span>
  );
}
