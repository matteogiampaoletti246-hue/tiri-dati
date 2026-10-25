import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import MatchHero from '@/components/MatchHero';
import InfoBand from '@/components/InfoBand';
import SwipeTabs from '@/components/SwipeTabs';
import Skeleton from '@/components/Skeleton';
import MatchOverviewPanel from '@/components/match/MatchOverviewPanel';
import MatchSummaryPanel from '@/components/match/MatchSummaryPanel';
import MatchStatsPanel from '@/components/match/MatchStatsPanel';
import MatchLineupsPanel from '@/components/match/MatchLineupsPanel';
import MatchShotsPanel from '@/components/match/MatchShotsPanel';
import MatchStandingsPanel from '@/components/match/MatchStandingsPanel';
import useInitialLoad from '@/hooks/useInitialLoad';
import useTicker from '@/hooks/useTicker';
import { matchById, viewMatch, ensureDetail } from '@/data/matches';
import { playerLookup } from '@/data/players';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';

const PRE_TABS = [
  { key: 'overview', label: 'Panoramica' },
  { key: 'stats', label: 'Statistiche' },
  { key: 'lineups', label: 'Formazioni' },
  { key: 'standings', label: 'Classifica' },
];

const PLAYED_TABS = [
  { key: 'summary', label: 'Riepilogo' },
  { key: 'stats', label: 'Statistiche' },
  { key: 'lineups', label: 'Formazioni' },
  { key: 'shots', label: 'Mappa tiri' },
  { key: 'standings', label: 'Classifica' },
];

export default function Match() {
  const { id } = useParams();
  const [tab, setTab] = useState(0);
  const loading = useInitialLoad(280);
  useTicker(30000);
  const raw = matchById(id);
  const [, bump] = useState(0);

  useEffect(() => {
    let on = true;
    ensureDetail(id, playerLookup).then(() => on && bump((n) => n + 1)).catch(() => {});
    return () => {
      on = false;
    };
  }, [id]);

  useEffect(() => {
    setTab(0);
  }, [id]);

  if (!raw) {
    return (
      <PageShell bar={false}>
        <TopBar title="Partita" />
        <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Partita non trovata
        </p>
      </PageShell>
    );
  }

  const view = viewMatch(raw);
  const home = teamById(raw.homeId);
  const away = teamById(raw.awayId);
  const league = leagueById(raw.leagueId);
  const pre = raw.status === 'scheduled';

  const tabs = pre ? PRE_TABS : PLAYED_TABS;
  const panels = pre
    ? [
        <MatchOverviewPanel key="overview" match={raw} home={home} away={away} />,
        <MatchStatsPanel key="stats" match={raw} view={view} home={home} away={away} pre />,
        <MatchLineupsPanel key="lineups" view={view} home={home} away={away} />,
        <MatchStandingsPanel key="standings" match={raw} />,
      ]
    : [
        <MatchSummaryPanel key="summary" view={view} home={home} away={away} />,
        <MatchStatsPanel key="stats" match={raw} view={view} home={home} away={away} />,
        <MatchLineupsPanel key="lineups" view={view} home={home} away={away} />,
        <MatchShotsPanel key="shots" view={view} home={home} away={away} />,
        <MatchStandingsPanel key="standings" match={raw} />,
      ];

  return (
    <PageShell swipeBack={false}>
      <MatchHero match={raw} view={view} league={league} home={home} away={away} />
      {!pre ? <InfoBand match={raw} /> : null}

      {loading ? (
        <div className="px-5 pt-8">
          <Skeleton className="h-[42px] w-full" />
          <div className="mt-6 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[56px] w-full" />
            ))}
          </div>
        </div>
      ) : (
        <SwipeTabs tabs={tabs} panels={panels} index={tab} onChange={setTab} className="pt-6" />
      )}
    </PageShell>
  );
}
