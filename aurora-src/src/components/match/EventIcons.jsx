export function BallIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="var(--ink)" fillOpacity=".06" stroke="var(--ink)" strokeWidth="1.6" />
      <path d="M12 7.2l3.7 2.7-1.4 4.4H9.7L8.3 9.9z" fill="var(--ink)" />
      <path d="M12 7.2V2.4M15.7 9.9l4.4-1.4M14.3 14.3l2.7 3.7M9.7 14.3L7 18M8.3 9.9L3.9 8.5" stroke="var(--ink)" strokeWidth="1.3" strokeLinecap="round" />
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
