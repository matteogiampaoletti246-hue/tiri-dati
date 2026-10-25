// radar dei percentili (0-100) su 6 assi
export default function Radar({ items, color = 'var(--accent)', size = 250 }) {
  const n = items.length;
  const c = size / 2;
  const R = size * 0.34;
  const pt = (i, f) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * R * f, c + Math.sin(a) * R * f];
  };
  const poly = (f) => items.map((_, i) => pt(i, f).join(',')).join(' ');
  const data = items.map((it, i) => pt(i, Math.max(0.04, (it.pct || 0) / 100)).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: 'block', maxWidth: size, margin: '0 auto' }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={poly(f)} fill="none" stroke="var(--hair-2)" strokeWidth="1" />
      ))}
      {items.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--hair-2)" strokeWidth="1" />;
      })}
      <polygon points={data} fill={color} fillOpacity=".28" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {items.map((it, i) => {
        const [x, y] = pt(i, 1.24);
        const [dx, dy] = pt(i, Math.max(0.04, (it.pct || 0) / 100));
        return (
          <g key={it.key}>
            <circle cx={dx} cy={dy} r="3.2" fill={color} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fill="var(--ink-2)">
              {it.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
