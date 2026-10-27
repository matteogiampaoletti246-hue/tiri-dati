import { useEffect, useRef, useState } from 'react';
import usePageTab from '@/hooks/usePageTab';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import { openPlayer } from '@/data/playerSheet';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import MatchHero from '@/components/MatchHero';
import SwipeTabs from '@/components/SwipeTabs';
import Skeleton from '@/components/Skeleton';
import MatchOverviewPanel from '@/components/match/MatchOverviewPanel';
import MatchSummaryPanel from '@/components/match/MatchSummaryPanel';
import MatchStatsPanel from '@/components/match/MatchStatsPanel';
import MatchLineupsPanel from '@/components/match/MatchLineupsPanel';
import MatchReliabilityList from '@/components/match/MatchReliabilityList';
import MatchStandingsPanel from '@/components/match/MatchStandingsPanel';
import useInitialLoad from '@/hooks/useInitialLoad';
import useTicker from '@/hooks/useTicker';
import { matchById, viewMatch, ensureDetail } from '@/data/matches';
import { loadFm } from '@/data/fotmob';
import { playerLookup } from '@/data/players';
import { teamById } from '@/data/teams';
import { leagueById, leagueTint } from '@/data/leagues';

const PRE_TABS = [
  { key: 'overview', label: 'Panoramica' },
  { key: 'stats', label: 'Statistiche' },
  { key: 'lineups', label: 'Formazioni' },
  { key: 'rel', label: 'Affidabilità' },
  { key: 'standings', label: 'Classifica' },
];

const PLAYED_TABS = [
  { key: 'summary', label: 'Riepilogo' },
  { key: 'stats', label: 'Statistiche' },
  { key: 'lineups', label: 'Formazioni' },
  { key: 'standings', label: 'Classifica' },
];

export default function Match() {
  const { id } = useParams();
  const [tab, setTab] = usePageTab('match', id);
  const loading = useInitialLoad(280);
  useTicker(30000);
  const raw = matchById(id);
  const [, bump] = useState(0);
  const loc = useLocation();
  const wantPlayer = loc.state && loc.state.openPlayer;
  const opened = useRef('');

  useEffect(() => {
    let on = true;
    const run = (force) =>
      ensureDetail(id, playerLookup)
        .then(() => loadFm(matchById(id), playerLookup, force))
        .then(() => {
          if (!on) return;
          bump((n) => n + 1);
          if (wantPlayer && opened.current !== id && matchById(id) && matchById(id).lineup) {
            opened.current = id;
            setTimeout(() => openPlayer({ matchId: id, name: wantPlayer.name }), 250);
          }
        })
        .catch(() => {});
    run(false);
    // ogni 10 secondi: partita live o vicina; formazioni probabili piu' lontane ogni minuto
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      const m = matchById(id);
      if (!m) return;
      const to = m.ts - Date.now();
      if (m.status === 'live' || (m.status === 'scheduled' && to < 3 * 3600000)) run(true);
      else if (m.status === 'scheduled' && to < 96 * 3600000 && n % 6 === 0) run(true);
    }, 10000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, [id]);


  if (raw && raw.href) return <Navigate to={raw.href} replace />;
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
        <MatchLineupsPanel key="lineups" match={raw} view={view} home={home} away={away} pre />,
        <MatchReliabilityList key="rel" match={raw} home={home} away={away} />,
        <MatchStandingsPanel key="standings" match={raw} />,
      ]
    : [
        <MatchSummaryPanel key="summary" match={raw} view={view} home={home} away={away} />,
        <MatchStatsPanel key="stats" match={raw} view={view} home={home} away={away} />,
        <MatchLineupsPanel key="lineups" match={raw} view={view} home={home} away={away} />,
        <MatchStandingsPanel key="standings" match={raw} />,
      ];

  return (
    <PageShell swipeBack={false}>
      <div style={{ '--tint': leagueTint(raw.leagueId) }}>
      <MatchHero match={raw} view={view} league={league} home={home} away={away} />

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
        <SwipeTabs tabs={tabs} panels={panels} index={Math.min(tab, tabs.length - 1)} onChange={setTab} className="pt-2" stickyTop="0px" />
      )}
      </div>
    </PageShell>
  );
}
