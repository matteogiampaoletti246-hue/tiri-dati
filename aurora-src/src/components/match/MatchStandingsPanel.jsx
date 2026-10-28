import StandingsTable from '@/components/StandingsTable';
import { StandingsPanel } from '@/components/archive/parts';

export default function MatchStandingsPanel({ match }) {
  // campionati aggiunti e archivio: classifica della stagione, con le due squadre della partita evidenziate
  if (match.archive && match.season) {
    const { fm, sk, hid, aid } = match.archive;
    return <StandingsPanel season={match.season} fm={fm} sk={sk} highlight={[hid, aid]} />;
  }
  return (
    <div className="pt-3">
      <StandingsTable leagueId={match.leagueId} highlight={[match.homeId, match.awayId]} />
    </div>
  );
}
