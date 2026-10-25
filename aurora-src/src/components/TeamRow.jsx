import { Link } from 'react-router-dom';
import Crest from './Crest';
import FormDots from './FormDots';

export default function TeamRow({ team, rank, form, note }) {
  if (!team) return null;
  return (
    <Link
      to={`/squadra/${team.id}`}
      className="flex items-center gap-3 px-5 py-3 transition-opacity active:opacity-60"
      style={{ borderTop: '1px solid var(--hair-2)' }}
    >
      {rank ? (
        <span className="tnum w-[22px] text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
          {rank}
        </span>
      ) : null}
      <Crest team={team} size={26} />
      <span className="min-w-0">
        <span className="block truncate text-[13.5px]" style={{ color: 'var(--ink)' }}>
          {team.name}
        </span>
        {note ? (
          <span className="block text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
            {note}
          </span>
        ) : null}
      </span>
      {form ? (
        <span className="ml-auto">
          <FormDots form={form} size={14} />
        </span>
      ) : null}
    </Link>
  );
}
