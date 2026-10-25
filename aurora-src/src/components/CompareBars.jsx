// Barre di confronto ancorate al centro (squadra / squadra).
export default function CompareBars({
  rows,
  homeColor = 'var(--accent)',
  awayColor = 'var(--warm-2)',
  format = (v) => v,
}) {
  return (
    <div className="flex flex-col gap-5">
      {rows.map((row) => {
        const max = Math.max(Math.abs(row.home || 0), Math.abs(row.away || 0)) || 1;
        const lw = (Math.abs(row.home || 0) / max) * 50;
        const rw = (Math.abs(row.away || 0) / max) * 50;
        const fmt = row.format || format;
        return (
          <div key={row.label}>
            <div className="flex items-baseline gap-2">
              <span className="tnum text-[14.5px] font-medium" style={{ color: 'var(--ink)' }}>
                {fmt(row.home)}
              </span>
              <span className="mx-auto truncate text-center text-[12px]" style={{ color: 'var(--ink-3)' }}>
                {row.label}
              </span>
              <span className="tnum text-[14.5px] font-medium" style={{ color: 'var(--ink)' }}>
                {fmt(row.away)}
              </span>
            </div>
            <div className="mt-2 flex h-[5px] w-full overflow-hidden rounded-full" style={{ background: 'var(--hair-2)' }}>
              <span
                className="h-full rounded-full transition-[width,margin] duration-700 ease-out"
                style={{ width: `${lw}%`, marginLeft: `${50 - lw}%`, background: homeColor }}
              />
              <span
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${rw}%`, background: awayColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
