// Avviso (Alerts concept A, 21st "Gradient Alert" di Kavi Katiyar): riquadro sfumato nel colore della gravita'
// (red = chi non gioca, yellow = dato da prendere con cautela, blue = informazione), icona a sinistra, entrata morbida.
const TONE = {
  red: { c: '#E5484D', bg: 'linear-gradient(110deg, rgba(229,72,77,.22), rgba(229,72,77,.04))', bd: 'rgba(229,72,77,.42)' },
  yellow: { c: '#F5C451', bg: 'linear-gradient(110deg, rgba(245,196,81,.20), rgba(245,196,81,.03))', bd: 'rgba(245,196,81,.40)' },
  blue: { c: 'var(--accent)', bg: 'linear-gradient(110deg, rgba(77,168,255,.20), rgba(77,168,255,.03))', bd: 'rgba(77,168,255,.40)' },
};

export default function Alert({ tone = 'blue', icon = null, title, children = null, className = '', delay = 0 }) {
  const t = TONE[tone] || TONE.blue;
  return (
    <div role="status" className={`alert-a flex items-start gap-3 rounded-2xl px-3.5 py-3 ${className}`} style={{ background: t.bg, border: `1px solid ${t.bd}`, animationDelay: `${delay}ms` }}>
      {icon ? <span className="mt-px flex shrink-0 items-center">{icon}</span> : null}
      <div className="min-w-0">
        <p className="text-[13.5px] font-bold" style={{ color: 'var(--ink)' }}>{title}</p>
        {children ? <div className="mt-0.5 text-[12px] leading-snug" style={{ color: 'var(--ink-2)' }}>{children}</div> : null}
      </div>
    </div>
  );
}
