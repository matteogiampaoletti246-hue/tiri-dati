import { useEffect, useState } from 'react';
import usePageTab from '@/hooks/usePageTab';
import { useParams } from 'react-router-dom';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import SwipeTabs from '@/components/SwipeTabs';
import Skeleton from '@/components/Skeleton';
import EntityBanner from '@/components/EntityBanner';
import FormDots from '@/components/FormDots';
import TeamMatchesPanel from '@/components/team/TeamMatchesPanel';
import StandingsTable from '@/components/StandingsTable';
import LeaguePlayersPanel from '@/components/league/LeaguePlayersPanel';
import TeamStatsPanel from '@/components/team/TeamStatsPanel';
import useInitialLoad from '@/hooks/useInitialLoad';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';
import { teamRow } from '@/data/standings';
import { teamForm } from '@/data/matches';
import { allTeamMatches } from '@/data/extras';
import { coachOf } from '@/data/players';

const TABS = [
  { key: 'matches', label: 'Partite' },
  { key: 'standings', label: 'Classifica' },
  { key: 'stats', label: 'Squadra' },
  { key: 'players', label: 'Giocatori' },
];

export default function Team() {
  const { id } = useParams();
  const [tab, setTab] = usePageTab('team', id);
  const loading = useInitialLoad(280);
  const team = teamById(id);


  if (!team) {
    return (
      <PageShell bar={false}>
        <TopBar title="Squadra" />
        <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Squadra non trovata
        </p>
      </PageShell>
    );
  }

  const league = leagueById(team.leagueId);
  const row = teamRow(team.leagueId, team.id);
  const liveCount = allTeamMatches(team.id).filter((m) => m.status === 'live').length;

  const meta = (
    <div className="flex min-w-0 items-center gap-3">
      <FormDots form={teamForm(team.id)} size={14} />
      {row ? (
        <span className="tnum text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
          {row.rank}° · {row.points} pt
        </span>
      ) : null}
      <span className="min-w-0 truncate text-[11px]" style={{ color: 'var(--ink-3)' }}>
        {coachOf(team.id)}
      </span>
    </div>
  );

  const panels = [
    <TeamMatchesPanel key="matches" teamId={team.id} />,
    <div key="standings" className="pt-4"><StandingsTable leagueId={team.leagueId} highlight={[team.id]} /></div>,
    <TeamStatsPanel key="stats" team={team} />,
    <LeaguePlayersPanel key="players" leagueId={team.leagueId} teamId={team.id} />,
  ];

  return (
    <PageShell swipeBack={false}>
      <EntityBanner
        name={team.name}
        subtitle={league ? league.name : ''}
        meta={meta}
        colors={team.colors}
        logoUrl={team.crest}
        initials={team.initials}
        liveCount={liveCount}
        tall
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
        <SwipeTabs fixedBar tabs={TABS} panels={panels} index={tab} onChange={setTab} className="pt-0" />
      )}
    </PageShell>
  );
}
