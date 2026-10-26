import { comma } from '@/lib/format';
import { scoreColor } from '@/lib/calc';

// Indicatore semicircolare del punteggio di affidabilità (0-10), colorato per fascia di voto.
export default function Gauge({ score }) {
  const has = score !== null && score !== undefined;
  const pct = has ? Math.max(0, Math.min(1, score / 10)) : 0;
  const length = Math.PI * 74;
  const color = has ? scoreColor(score) : 'var(--ink-3)';

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
        <p className="title-xl tnum text-[36px]" style={{ color }}>
          {has ? comma(score, 2) : '—'}
        </p>
        <p className="label-sm mt-1">su 10</p>
      </div>
    </div>
  );
}
