// Marchio ScalperLab: tratto disegnato, nessun cerchio intorno.
export default function Logo({ size = 28, className = '', animated = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="ScalperLab"
      className={`${animated ? 'mark-draw' : ''} ${className}`}
    >
      <path
        className="mark-s"
        d="M30.4 14.8C28.2 11.6 17.3 11.4 16.7 16.7C16.1 21.9 21.3 22.5 24.2 23.7C27.8 25.1 31.8 25.9 30.4 31C29 35.9 18.2 35.9 16.2 32.4"
        stroke="var(--accent)"
        strokeWidth="3.3"
        strokeLinecap="round"
      />
      <path
        className="mark-arc mark-fade"
        d="M31.2 15.4C34.2 15.4 36.5 13.9 37.6 11.9"
        stroke="var(--accent)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="1 3"
      />
      <circle className="mark-ball mark-fade" cx="38.8" cy="10.8" r="2.6" fill="var(--accent)" />
    </svg>
  );
}
