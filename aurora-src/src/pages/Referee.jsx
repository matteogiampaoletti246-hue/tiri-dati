import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import RefereeHero from '@/components/referee/RefereeHero';
import RefereeStatsPanel from '@/components/referee/RefereeStatsPanel';
import RefereeMatchesPanel from '@/components/referee/RefereeMatchesPanel';
import { refereeById, refGames } from '@/data/referees';
import { leagueById } from '@/data/leagues';
import { matchesByReferee } from '@/data/extras';

export default function Referee() {
  const { id } = useParams();
  const referee = refereeById(id);
  const [two, setTwo] = useState(null);
  useEffect(() => {
    let on = true;
    setTwo(null);
    if (referee) refGames(referee.name).then((g) => on && setTwo(g && g.n > 0 ? g : null));
    return () => { on = false; };
  }, [id]);

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
      <RefereeHero referee={referee} league={league} matchCount={count} two={two} />

      <div className="mt-6 flex flex-col gap-7">
        <RefereeStatsPanel referee={referee} two={two} />
        <RefereeMatchesPanel referee={referee} />
      </div>
    </PageShell>
  );
}
