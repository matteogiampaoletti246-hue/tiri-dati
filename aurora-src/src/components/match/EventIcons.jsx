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
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="sl-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFE58A" /><stop offset="55%" stopColor="#F2B825" /><stop offset="100%" stopColor="#C98A0C" /></linearGradient>
      </defs>
      <path d="M3.2 4h6.2v7.2c0 1.4 1 2.3 2.5 2.8l6.4 2c1.7.5 2.9 1.6 2.9 3.4V20H3.2z" fill="url(#sl-gold)" stroke="#6B4A06" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M3.2 17.6h17.8" stroke="#6B4A06" strokeWidth="1.1" />
      <path d="M5.2 20.2v2M9.6 20.2v2M14 20.2v2M18.4 20.2v2" stroke="#3E2A03" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12.4 14.2l1.5-1.2M14.7 15l1.4-1.1" stroke="#6B4A06" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
