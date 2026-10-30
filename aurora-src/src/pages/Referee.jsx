import { useParams } from 'react-router-dom';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import Skeleton from '@/components/Skeleton';
import RefereeHero from '@/components/referee/RefereeHero';
import RefereeStatsPanel from '@/components/referee/RefereeStatsPanel';
import RefereeMatchesPanel from '@/components/referee/RefereeMatchesPanel';
import useInitialLoad from '@/hooks/useInitialLoad';
import { refereeById } from '@/data/referees';
import { leagueById } from '@/data/leagues';
import { matchesByReferee } from '@/data/extras';

export default function Referee() {
  const { id } = useParams();
  const loading = useInitialLoad(280);
  const referee = refereeById(id);

  if (!referee) {
    return (
      <PageShell bar={false}>
        <TopBar title="Arbitro" />
        <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Arbitro non trovato
        </p>
      </PageShell>
    );
  }

  const league = leagueById(referee.leagueId);
  const count = matchesByReferee(referee.id).length;

  return (
    <PageShell>
      <RefereeHero referee={referee} league={league} matchCount={count} />

      {loading ? (
        <div className="space-y-4 px-5 pt-6">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[92px] w-full" />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-7">
          <RefereeStatsPanel referee={referee} />
          <RefereeMatchesPanel refereeId={referee.id} />
        </div>
      )}
    </PageShell>
  );
}
