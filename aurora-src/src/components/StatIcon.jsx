const Y = '#F5C84C';
const R = '#E5484D';

// Icone delle statistiche (Matchup). Linea = colore del testo, dettagli a colori fissi.
export default function StatIcon({ k, size = 22 }) {
  const p = { viewBox: '0 0 24 24', width: size, height: size, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (k === 'corner') {
    return (
      <svg {...p}>
        <path d="M7 3v18" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 4l12 4.2L7 12.4z" fill={R} />
        <ellipse cx="7" cy="21" rx="3.6" ry="1.1" fill="currentColor" fillOpacity=".35" />
      </svg>
    );
  }
  if (k === 'cards' || k === 'cards1') {
    return (
      <svg {...p}>
        <rect x="4" y="5" width="9" height="13" rx="1.6" transform="rotate(-8 8 11)" fill={Y} />
        <rect x="11" y="6" width="9" height="13" rx="1.6" transform="rotate(8 16 12)" fill={R} />
      </svg>
    );
  }
  if (k === 'shots') {
    const id = `sb${size}`;
    return (
      <svg {...p}>
        <mask id={id}>
          <rect width="24" height="24" fill="#fff" />
          <path d="M12 8.4l3.1 2.2-1.2 3.7h-3.8l-1.2-3.7z" fill="#000" />
          <path d="M12 8.4V3M15.1 10.6l5-1.7M13.9 14.3l3.2 4.2M10.1 14.3l-3.2 4.2M8.9 10.6l-5-1.7" stroke="#000" strokeWidth="1.1" />
        </mask>
        <circle cx="12" cy="12" r="9.2" fill="currentColor" mask={`url(#${id})`} />
      </svg>
    );
  }
  if (k === 'sot') {
    return (
      <svg {...p}>
        <g stroke="currentColor" strokeWidth="1.3">
          <path d="M1.5 18.5V6.5h21v12" />
          <path d="M1.5 10.5h21M6.5 6.5v12M11.5 6.5v12M16.5 6.5v12" strokeOpacity=".3" />
        </g>
        <circle cx="19" cy="9.4" r="2" fill={Y} />
      </svg>
    );
  }
  if (k === 'fouls') {
    return (
      <svg {...p}>
        <g stroke="currentColor" strokeWidth="1.3">
          <path d="M3.6 11h8.7a4.2 4.2 0 0 1 0 8.4H8.2A4.6 4.6 0 0 1 3.6 14.8V11Z" />
          <path d="M16.5 12.2h3.9v2.6h-3.9" />
          <circle cx="9.5" cy="15.2" r="1.6" />
          <path d="M6 7.8 4.8 5.6M9.5 7 9.2 4.4M13 7.8l1.2-2.2" />
        </g>
      </svg>
    );
  }
  // fuorigioco: bandierina in orizzontale
  const cells = [];
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 3; j += 1) {
    cells.push(<rect key={`${i}${j}`} x={9 + i * 3.25} y={6 + j * 3.67} width="3.25" height="3.67" fill={(i + j) % 2 === 0 ? Y : R} />);
  }
  return (
    <svg {...p}>
      <g transform="rotate(90 12 12)">
      <path d="M2.5 17H9" stroke="currentColor" strokeWidth="1.6" />
      <g>{cells}</g>
      <rect x="9" y="6" width="13" height="11" stroke="currentColor" strokeWidth="1" />
      </g>
    </svg>
  );
}
