import { Link } from 'react-router-dom';
import { teamGrad } from '@/lib/tint';
import Crest from './Crest';
import FormDots from './FormDots';

export default function TeamRow({ team, rank, form, note }) {
  if (!team) return null;
  return (
    <Link
      to={`/squadra/${team.id}`}
      className="mx-2 mb-1.5 flex items-center gap-3 rounded-[18px] px-3 py-2.5 transition-opacity active:opacity-60"
      style={{ background: teamGrad(team, 0x55) }}
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
