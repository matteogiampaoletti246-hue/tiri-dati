import TeamRow from '@/components/TeamRow';
import { teamsOf } from '@/data/teams';
import { standings } from '@/data/standings';

export default function LeagueTeamsPanel({ leagueId }) {
  const rows = standings(leagueId, 'total');
  const byId = {};
  rows.forEach((r) => {
    byId[r.teamId] = r;
  });

  return (
    <div className="pt-1">
      {teamsOf(leagueId).map((team) => {
        const row = byId[team.id];
        return (
          <TeamRow
            key={team.id}
            team={team}
            rank={row ? row.rank : null}
            form={row ? row.form : []}
            note={row ? `${row.points} pt · ${row.played} gare` : null}
          />
        );
      })}
    </div>
  );
}
