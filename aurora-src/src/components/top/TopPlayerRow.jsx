import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import TeamLink from '@/components/TeamLink';
import { teamById } from '@/data/teams';
import { comma } from '@/lib/format';

const POS = { GK: 'POR', DEF: 'DIF', MID: 'CEN', ATT: 'ATT' };

export default function TopPlayerRow({ row, rank, divider = true }) {
  const { player, match } = row;
  const team = teamById(player.teamId);
  const opp = match ? teamById(match.homeId === player.teamId ? match.awayId : match.homeId) : null;

  return (
    <Link
      to={`/giocatore/${player.id}`}
      className="block px-5 py-3 transition-opacity active:opacity-60"
      style={{ borderTop: divider ? '1px solid var(--hair-2)' : 'none' }}
    >
      <div className="flex items-center gap-3">
        <span className="tnum w-[18px] flex-none text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
          {rank}
        </span>
        <span className="w-[30px] flex-none text-[9.5px] uppercase tracking-[.1em]" style={{ color: 'var(--ink-3)' }}>
          {POS[player.position] || player.position}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px]" style={{ color: 'var(--ink)' }}>
          {player.name}
        </span>
        <span className="flex flex-none items-baseline gap-1.5">
          <span className="text-[9.5px] uppercase tracking-[.1em]" style={{ color: 'var(--ink-3)' }}>
            Voto
          </span>
          <span className="tnum text-[15.5px] font-medium" style={{ color: 'var(--ink)' }}>
            {comma(row.voto, 2)}
          </span>
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-2 pl-[48px]">
        <TeamLink team={team} className="flex min-w-0 items-center gap-2 transition-opacity active:opacity-60">
          <Crest team={team} size={16} />
          <span className="truncate text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
            {team ? team.name : '—'}
          </span>
        </TeamLink>
        {opp ? (
          <span className="flex-none text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
            – {opp.name}
          </span>
        ) : null}
        <span className="tnum ml-auto flex-none text-[11px]" style={{ color: 'var(--ink-3)' }}>
          Media attesa {comma(row.mediaAttesa, 2)} · 90&apos; medi {row.minutiMedi}
        </span>
      </div>

      <div className="tnum mt-1 pl-[48px] text-[11px]" style={{ color: 'var(--ink-3)' }}>
        Ultime 5: {comma(row.ultime5, 1)} — stagione {comma(row.stagione90, 1)} /90&apos;
      </div>
    </Link>
  );
}
