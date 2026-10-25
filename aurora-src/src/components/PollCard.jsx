import Crest from './Crest';
import TeamLink from './TeamLink';
import { comma } from '@/lib/format';

export default function PollCard({ match, home, away }) {
  const p = match.poll;
  const segments = [
    { value: p.home, color: 'var(--accent)' },
    { value: p.draw, color: 'var(--neutral)' },
    { value: p.away, color: 'var(--live)' },
  ];

  return (
    <div className="panel px-5 py-5">
      <p className="label-sm">Pronostico</p>
      <p className="mt-2 text-[15px] font-light tracking-[-.02em]" style={{ color: 'var(--ink)' }}>
        Chi vincerà?
      </p>

      <div className="mt-4 flex h-[3px] w-full overflow-hidden rounded-full">
        {segments.map((s, i) => (
          <span key={i} style={{ width: `${s.value}%`, background: s.color }} className="h-full" />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <TeamLink team={home} className="flex items-center gap-2 transition-opacity active:opacity-60">
          <Crest team={home} size={26} />
          <span className="tnum text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
            {p.home}%
          </span>
        </TeamLink>
        <div className="text-center">
          <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
            Pareggio
          </p>
          <p className="tnum text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
            {p.draw}%
          </p>
        </div>
        <TeamLink team={away} className="flex items-center gap-2 transition-opacity active:opacity-60">
          <span className="tnum text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
            {p.away}%
          </span>
          <Crest team={away} size={26} />
        </TeamLink>
      </div>

      <p className="tnum mt-3 text-[11px]" style={{ color: 'var(--ink-3)' }}>
        {comma(p.votes, 0)} voti
      </p>
    </div>
  );
}
