import { comma } from '@/lib/format';

const TONES = {
  high: 'var(--good)',
  good: 'var(--accent)',
  mid: 'var(--warm-2)',
  low: 'var(--live)',
  none: 'var(--ink-3)',
};

// Indicatore semicircolare del punteggio di affidabilità (0-10).
export default function Gauge({ score, tone = 'none' }) {
  const pct = score === null || score === undefined ? 0 : Math.max(0, Math.min(1, score / 10));
  const length = Math.PI * 74;
  const color = TONES[tone] || TONES.none;

  return (
    <div className="relative mx-auto w-[180px]">
      <svg viewBox="0 0 176 100" className="w-full" aria-hidden="true">
        <path d="M14 92 A74 74 0 0 1 162 92" fill="none" stroke="var(--hair-2)" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M14 92 A74 74 0 0 1 162 92"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .45s cubic-bezier(.22,.8,.24,1), stroke .3s ease' }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="title-xl tnum text-[40px]" style={{ color: 'var(--ink)' }}>
          {score === null || score === undefined ? '—' : comma(score, 1)}
        </p>
        <p className="label-sm mt-1">su 10</p>
      </div>
    </div>
  );
}
