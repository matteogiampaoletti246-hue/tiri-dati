import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import SwipeTabs from '@/components/SwipeTabs';
import Skeleton from '@/components/Skeleton';
import EntityBanner from '@/components/EntityBanner';
import LeagueMatchesPanel from '@/components/league/LeagueMatchesPanel';
import LeagueStandingsPanel from '@/components/league/LeagueStandingsPanel';
import LeagueTeamsPanel from '@/components/league/LeagueTeamsPanel';
import LeaguePlayersPanel from '@/components/league/LeaguePlayersPanel';
import LeagueRefereesPanel from '@/components/league/LeagueRefereesPanel';
import useInitialLoad from '@/hooks/useInitialLoad';
import { leagueById, initialsOf } from '@/data/leagues';
import { teamsOf } from '@/data/teams';
import { matchesForLeague } from '@/data/matches';

const TABS = [
  { key: 'matches', label: 'Partite' },
  { key: 'standings', label: 'Classifica' },
  { key: 'teams', label: 'Stat. squadre' },
  { key: 'players', label: 'Giocatori' },
  { key: 'referees', label: 'Arbitri' },
];

export default function League() {
  const { id } = useParams();
  const [tab, setTab] = useState(0);
  const loading = useInitialLoad(280);
  const league = leagueById(id);

  useEffect(() => {
    setTab(0);
  }, [id]);

  if (!league) {
    return (
      <PageShell bar={false}>
        <TopBar title="Campionato" />
        <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Campionato non trovato
        </p>
      </PageShell>
    );
  }

  const leagueMatches = matchesForLeague(league.id);
  const teamCount = teamsOf(league.id).length;
  const liveCount = leagueMatches.filter((m) => m.status === 'live').length;
  const initials = initialsOf(league.name);

  const panels = [
    <LeagueMatchesPanel key="matches" leagueId={league.id} />,
    <LeagueStandingsPanel key="standings" leagueId={league.id} />,
    <LeagueTeamsPanel key="teams" leagueId={league.id} />,
    <LeaguePlayersPanel key="players" leagueId={league.id} />,
    <LeagueRefereesPanel key="referees" leagueId={league.id} />,
  ];

  return (
    <PageShell swipeBack={false}>
      <EntityBanner
        name={league.name}
        subtitle={`${league.country} · ${league.season}`}
        meta={
          <span className="tnum text-[11.5px]" style={{ color: 'rgba(255,255,255,.82)' }}>
            {leagueMatches.length} gare · {teamCount} squadre
          </span>
        }
        colors={league.colors}
        logoUrl={league.logo}
        initials={initials}
        liveCount={liveCount}
      />

      {loading ? (
        <div className="px-5 pt-8">
          <Skeleton className="h-[42px] w-full" />
          <div className="mt-6 space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[52px] w-full" />
            ))}
          </div>
        </div>
      ) : (
        <SwipeTabs tabs={TABS} panels={panels} index={tab} onChange={setTab} className="pt-0" />
      )}
    </PageShell>
  );
}
