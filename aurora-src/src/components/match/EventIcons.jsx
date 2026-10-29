// Gol: pallone a glifo, disco bianco con contorno e pentagono centrale pieni neri (leggibile su qualunque sfondo)
export function BallIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10.4" fill="#fff" stroke="#10131A" strokeWidth="1.6" />
      <path d="M12 7.1l4.1 3-1.6 4.8H9.5L7.9 10.1z" fill="#10131A" />
      <path d="M12 7.1V2M16.1 10.1l5-1.6M14.5 14.9l3 4.2M9.5 14.9l-3 4.2M7.9 10.1l-5-1.6" stroke="#10131A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
export function SubIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4v15M4 15l4 4 4-4" stroke="#E5484D" />
      <path d="M16 20V5M12 9l4-4 4 4" stroke="#2FBF71" />
    </svg>
  );
}
export function CardIcon({ red = false, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6.5" y="3.5" width="11" height="17" rx="2.2" fill={red ? '#E5484D' : '#F2C230'} />
    </svg>
  );
}
export const EventIcon = ({ e, size = 18 }) => (e.type === 'goal' ? <BallIcon size={size} /> : e.type === 'sub' ? <SubIcon size={size} /> : <CardIcon red={e.type === 'red'} size={size} />);

// Assist: scarpino dorato (glifo)
export function BootIcon({ size = 18 }) {
  // scarpino basso, inclinato con la punta in basso a destra (collo a conchiglia, tacchetti sul lato inferiore)
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs><linearGradient id="sl-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD966" /><stop offset="100%" stopColor="#F2B825" /></linearGradient></defs>
      <path d="M7 15Q8 9 15 9L22 9Q24 16 30 19Q34 12 37 10L41 11Q47 30 56 41Q61 47 58 53Q54 56 49 53L33 45Q16 38 9 31Q6 24 7 15Z" fill="url(#sl-gold)" />
      <path d="M33 24Q40 36 47 44Q40 42 34 37Q31 30 33 24Z" fill="#B9810A" fillOpacity=".75" />
      <path d="M12 33l-2 4.5M20 37.5l-2 4.5M28 41.5l-2 4.5M36 46l-2 4.5M44 50l-2 4.5" stroke="#B9810A" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}
