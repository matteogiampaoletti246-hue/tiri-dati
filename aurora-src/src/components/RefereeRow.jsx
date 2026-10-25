import { Link } from 'react-router-dom';

export default function RefereeRow({ referee }) {
  if (!referee) return null;
  const per = (v) => (referee.games ? (v / referee.games).toFixed(1).replace('.', ',') : '—');

  return (
    <Link
      to={`/arbitro/${referee.id}`}
      className="grid items-center gap-3 px-5 py-3 transition-opacity active:opacity-60"
      style={{ borderTop: '1px solid var(--hair-2)', gridTemplateColumns: '1fr 32px 26px 34px' }}
    >
      <span className="min-w-0">
        <span className="block truncate text-[13.5px]" style={{ color: 'var(--ink)' }}>
          {referee.name}
        </span>
        <span className="block text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
          {referee.country} · {referee.games} gare
        </span>
      </span>
      <span className="tnum text-right text-[12px]" style={{ color: 'var(--ink-2)' }}>
        {per(referee.yellows)}
      </span>
      <span className="tnum text-right text-[12px]" style={{ color: 'var(--ink-2)' }}>
        {per(referee.reds)}
      </span>
      <span className="tnum text-right text-[12px]" style={{ color: 'var(--ink-2)' }}>
        {per(referee.penalties)}
      </span>
    </Link>
  );
}
