import { comma } from '@/lib/format';

const OUT = {
  Gol: { color: 'var(--accent)', fill: true },
  Parato: { color: 'var(--warm-2)', fill: false },
  Murato: { color: 'var(--neutral)', fill: false },
  Fuori: { color: 'var(--ink-3)', fill: false },
};

export default function ShotMap({ shots = [], showList = true }) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative w-full overflow-hidden rounded-[20px]"
        style={{
          aspectRatio: '1.5 / 1',
          background: 'linear-gradient(160deg, rgba(150,200,255,.18), rgba(150,200,255,.06))',
          border: '1px solid var(--hair)',
        }}
      >
        <span className="absolute inset-y-[18%] right-0 w-[19%] rounded-l-[3px]" style={{ border: '1px solid var(--hair-2)', borderRight: 'none' }} />
        <span className="absolute inset-y-[35%] right-0 w-[8%] rounded-l-[3px]" style={{ border: '1px solid var(--hair-2)', borderRight: 'none' }} />
        <span className="absolute right-0 top-1/2 h-[22%] w-[2%] -translate-y-1/2 rounded-l-[2px]" style={{ background: 'var(--hair-2)' }} />
        <span className="absolute right-[12%] top-1/2 h-[3px] w-[3px] -translate-y-1/2 rounded-full" style={{ background: 'var(--hair-2)' }} />

        {shots.map((s, i) => {
          const o = OUT[s.outcome] || OUT.Fuori;
          const size = Math.max(8, Math.min(19, 7 + s.xg * 28));
          return (
            <span
              key={`${s.minute}-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${s.x * 100}%`,
                top: `${(s.y / 0.6) * 100}%`,
                width: size,
                height: size,
                background: o.fill ? o.color : 'transparent',
                border: `1.4px solid ${o.color}`,
                opacity: s.outcome === 'Gol' ? 1 : 0.85,
              }}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        {Object.keys(OUT).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
            <span
              className="h-[9px] w-[9px] rounded-full"
              style={{ background: OUT[k].fill ? OUT[k].color : 'transparent', border: `1.4px solid ${OUT[k].color}` }}
            />
            {k}
          </span>
        ))}
      </div>

      {showList ? (
      <div>
        {shots.map((s, i) => (
          <div
            key={`${s.minute}-row-${i}`}
            className="grid items-center gap-3 py-2"
            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hair-2)', gridTemplateColumns: '34px 1fr 62px 40px' }}
          >
            <span className="tnum text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
              {s.minute}&apos;
            </span>
            <span className="truncate text-[13px]" style={{ color: 'var(--ink)' }}>
              {s.playerName}
            </span>
            <span className="text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
              {s.outcome}
            </span>
            <span className="tnum text-right text-[12px]" style={{ color: 'var(--ink-3)' }}>
              {comma(s.xg, 2)}
            </span>
          </div>
        ))}
        {!shots.length ? (
          <p className="py-8 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
            Nessun tiro
          </p>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
