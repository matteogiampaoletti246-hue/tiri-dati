import RefereeRow from '@/components/RefereeRow';
import { refereesOf } from '@/data/referees';

const HEAD = ['Arbitro', 'Gialli', 'Rossi', 'Rigori'];

export default function LeagueRefereesPanel({ leagueId }) {
  const list = refereesOf(leagueId);
  if (!list.length) return null;

  return (
    <div className="pt-3">
      <div
        className="grid items-center gap-3 px-5 pb-1 text-[9.5px] uppercase tracking-[.1em]"
        style={{ gridTemplateColumns: '1fr 32px 26px 34px', color: 'var(--ink-3)' }}
      >
        <span>{HEAD[0]}</span>
        <span className="text-right">{HEAD[1]}</span>
        <span className="text-right">{HEAD[2]}</span>
        <span className="text-right">{HEAD[3]}</span>
      </div>
      {list.map((r) => (
        <RefereeRow key={r.id} referee={r} />
      ))}
    </div>
  );
}
