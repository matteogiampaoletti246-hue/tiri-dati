// colore troppo scuro per vedersi sul riquadro nero (es. squadre nere): si usa l'argento (concept B)
export const lum = (c) => {
  const m = /^#([0-9a-f]{6})$/i.exec(String(c || ''));
  if (!m) return 1;
  const n = parseInt(m[1], 16);
  return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
export const seen = (c) => (lum(c) < 0.42 ? '#ffffff' : c);

// radar dei percentili (0-100) su 6 assi: griglia chiara, area piena, punti sui vertici
export default function Radar({ items, color = 'var(--accent)', size = 250 }) {
  const dark = lum(color) < 0.42;
  const fillC = dark ? 'rgba(150,165,190,.4)' : color;
  const lineC = dark ? "var(--ink)" : color;
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
        <polygon key={f} points={poly(f)} fill="none" stroke="var(--ink)" strokeOpacity=".22" strokeWidth="1" />
      ))}
      {items.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--ink)" strokeOpacity=".22" strokeWidth="1" />;
      })}
      <polygon points={data} fill={fillC} fillOpacity={dark ? 1 : 0.28} stroke={lineC} strokeWidth={dark ? 2.5 : 2} strokeLinejoin="round" />
      {items.map((it, i) => {
        const [x, y] = pt(i, 1.24);
        const [dx, dy] = pt(i, Math.max(0.04, (it.pct || 0) / 100));
        return (
          <g key={it.key}>
            <circle cx={dx} cy={dy} r="3.4" fill={lineC} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--ink-2)">
              {it.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
