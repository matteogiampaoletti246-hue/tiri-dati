import Crest from './Crest';
import TeamLink from './TeamLink';
import { teamById } from '@/data/teams';
import { longDate } from '@/lib/format';

const RES = { V: 'badge-v', S: 'badge-s', P: 'badge-p' };

export default function ResultRow({ match, teamId, divider = true }) {
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const isHome = !teamId || match.homeId === teamId;
  const opp = isHome ? away : home;
  const done = Array.isArray(match.score);
  const gf = done ? (isHome ? match.score[0] : match.score[1]) : null;
  const ga = done ? (isHome ? match.score[1] : match.score[0]) : null;
  const res = done ? (gf > ga ? 'V' : gf === ga ? 'S' : 'P') : null;
  const [y, mo, da] = String(match.date).split('-').map(Number);
  const label = longDate(new Date(y, mo - 1, da));

  return (
    <div className="flex items-center gap-2.5 py-2.5" style={{ borderTop: divider ? '1px solid var(--hair-2)' : 'none' }}>
      <span className="w-[68px] flex-none text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
        {label}
      </span>
      {teamId ? (
        <span className="w-[54px] flex-none text-[9.5px] uppercase tracking-[.08em]" style={{ color: 'var(--ink-3)' }}>
          {isHome ? 'Casa' : 'Fuori'}
        </span>
      ) : null}
      <TeamLink team={opp} className="flex min-w-0 flex-1 items-center gap-2.5 transition-opacity active:opacity-60">
        <Crest team={opp} size={20} />
        <span className="min-w-0 truncate text-[13px]" style={{ color: 'var(--ink)' }}>
          {opp ? opp.name : '—'}
        </span>
      </TeamLink>
      {done ? (
        <>
          <span className="tnum text-[13.5px] font-medium" style={{ color: 'var(--ink)' }}>
            {gf}–{ga}
          </span>
          <span className={`badge ${RES[res]}`}>{res}</span>
        </>
      ) : (
        <span className="tnum text-[12px]" style={{ color: 'var(--ink-2)' }}>
          {match.timeKnown === false ? '—' : match.kickoff}
        </span>
      )}
    </div>
  );
}
