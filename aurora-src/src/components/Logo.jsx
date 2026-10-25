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
      <defs>
        <linearGradient id="sl-logo" x1="15" y1="33" x2="35" y2="13" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-soft)" />
        </linearGradient>
      </defs>

      <circle cx="24" cy="24" r="21" stroke="var(--accent)" strokeOpacity=".2" strokeWidth="1.1" />

      <path
        className="mark-s"
        d="M30.4 14.6C28.3 11.5 17.5 11.2 16.8 16.5C16.1 21.7 21.3 22.3 24.2 23.5C27.7 24.9 31.7 25.7 30.3 30.8C28.9 35.7 18.1 35.7 16.2 32.2"
        stroke="url(#sl-logo)"
        strokeWidth="3.1"
        strokeLinecap="round"
      />

      <path
        className="mark-arc mark-fade"
        d="M30.4 15.2C33.4 15.1 35.6 13.6 36.8 11.9"
        stroke="var(--accent)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="1 3.2"
      />

      <circle className="mark-ball mark-fade" cx="37.8" cy="11.2" r="2.5" fill="var(--accent)" />
    </svg>
  );
}
