// Icone a tratto sottile disegnate su misura (stesso linguaggio di lucide: viewBox 24, tratto currentColor).
const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function StadiumIcon({ size = 16, strokeWidth = 1.2, className = '', style }) {
  return (
    <svg {...BASE} width={size} height={size} strokeWidth={strokeWidth} className={className} style={style}>
      <ellipse cx="12" cy="13.8" rx="9.3" ry="6.4" />
      <ellipse cx="12" cy="13.8" rx="4.5" ry="2.6" />
      <path d="M4.4 9.6C6 7.5 18 7.5 19.6 9.6" />
    </svg>
  );
}

export function WhistleIcon({ size = 16, strokeWidth = 1.2, className = '', style }) {
  return (
    <svg {...BASE} width={size} height={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M3.6 9.6h8.7a4.2 4.2 0 0 1 0 8.4H8.2a4.6 4.6 0 0 1-4.6-4.6V9.6Z" />
      <path d="M16.5 10.8h3.9v2.6h-3.9" />
      <circle cx="9.5" cy="13.8" r="1.6" />
    </svg>
  );
}
