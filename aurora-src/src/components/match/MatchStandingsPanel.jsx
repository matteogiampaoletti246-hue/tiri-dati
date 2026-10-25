import StandingsTable from '@/components/StandingsTable';

export default function MatchStandingsPanel({ match }) {
  return (
    <div className="pt-3">
      <StandingsTable leagueId={match.leagueId} highlight={[match.homeId, match.awayId]} />
    </div>
  );
}
