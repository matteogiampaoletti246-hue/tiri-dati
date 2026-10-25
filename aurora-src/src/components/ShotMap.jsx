import { comma } from '@/lib/format';

// Mezzo campo (porta a destra). Gol = pieno, in porta = bordo + centro, fuori/murato = vuoto.
const COLORS = { home: 'var(--accent)', away: 'var(--live)' };
const W = 105;
const H = 68;
const X0 = 52.5;

export default function ShotMap({ shots = [], home, away }) {
  const px = (x) => ((Math.max(X0, x) - X0) / (W - X0)) * 100;
  const py = (y) => (y / H) * 100;
  const line = 'var(--hair)';
  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded-[20px]" style={{ aspectRatio: '1.12 / 1', background: 'var(--glass-bg)', border: '1px solid var(--hair)' }}>
        <svg viewBox="0 0 100 89" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none" stroke={line} strokeWidth="0.5" vectorEffect="non-scaling-stroke">
          <rect x="0" y="0" width="100" height="89" opacity="0" />
          <path d="M0 0V89" />
          <rect x={px(88.5)} y={py(13.84) * 0.89} width={100 - px(88.5)} height={(py(54.16) - py(13.84)) * 0.89} />
          <rect x={px(99.5)} y={py(24.84) * 0.89} width={100 - px(99.5)} height={(py(43.16) - py(24.84)) * 0.89} />
          <path d={`M${px(88.5)} ${py(30.5) * 0.89}A16 16 0 0 0 ${px(88.5)} ${py(37.5) * 0.89}`} opacity="0.0" />
          <circle cx="0" cy="44.5" r="22" />
          <rect x="99" y={py(30.34) * 0.89} width="1" height={(py(37.66) - py(30.34)) * 0.89} stroke="var(--ink-3)" />
        </svg>
        {shots.map((s, i) => {
          const c = COLORS[s.side];
          const size = Math.max(9, Math.min(24, 8 + s.xg * 36));
          const goal = s.outcome === 'Gol';
          return (
            <span
              key={`${s.minute}-${i}`}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
              style={{ left: `${px(s.px ?? s.x * W)}%`, top: `${py(s.py ?? s.y * H)}%`, width: size, height: size, background: goal ? c : 'transparent', border: `1.6px solid ${c}`, opacity: goal ? 1 : 0.9, boxShadow: goal ? `0 0 10px ${c}` : 'none' }}
            >
              {!goal && s.onTarget ? <span className="h-[34%] w-[34%] rounded-full" style={{ background: c }} /> : null}
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
        <span className="flex items-center gap-1.5"><span className="h-[10px] w-[10px] rounded-full" style={{ background: 'var(--ink-2)' }} />Gol</span>
        <span className="flex items-center gap-1.5"><span className="flex h-[10px] w-[10px] items-center justify-center rounded-full" style={{ border: '1.5px solid var(--ink-2)' }}><span className="h-[3px] w-[3px] rounded-full" style={{ background: 'var(--ink-2)' }} /></span>In porta</span>
        <span className="flex items-center gap-1.5"><span className="h-[10px] w-[10px] rounded-full" style={{ border: '1.5px solid var(--ink-2)' }} />Fuori / murato</span>
        <span className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-[8px] w-[8px] rounded-full" style={{ background: COLORS.home }} />{home ? home.short || home.name : 'Casa'}</span>
          <span className="flex items-center gap-1"><span className="h-[8px] w-[8px] rounded-full" style={{ background: COLORS.away }} />{away ? away.short || away.name : 'Trasferta'}</span>
        </span>
      </div>

      <div>
        {shots.map((s, i) => (
          <div key={`${s.minute}-row-${i}`} className="grid items-center gap-3 py-2" style={{ borderTop: '1px solid var(--hair-2)', gridTemplateColumns: '38px 1fr 58px 34px' }}>
            <span className="tnum text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{s.minute}&apos;</span>
            <span className="truncate text-[13px] font-semibold" style={{ color: s.side === 'home' ? 'var(--accent)' : 'var(--live)' }}>{s.playerName}</span>
            <span className="text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{s.outcome === 'Fuori' && s.onTarget ? 'In porta' : s.outcome}</span>
            <span className="tnum text-right text-[12px]" style={{ color: 'var(--ink-3)' }}>{comma(s.xg, 2)}</span>
          </div>
        ))}
        {!shots.length ? <p className="py-6 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessun tiro</p> : null}
      </div>
    </div>
  );
}
