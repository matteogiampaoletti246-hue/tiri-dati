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
import { parseArchiveId, buildArchiveMatch, completeExtraMatch, applyArchiveFallback } from '@/data/archiveMatch';
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

// partite dei campionati aggiunti non ancora giocate: solo cio' che esiste davvero per loro
const PRE_TABS_X = [
  { key: 'overview', label: 'Panoramica' },
  { key: 'lineups', label: 'Formazioni' },
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
  const [, bump] = useState(0);
  const arch = parseArchiveId(id);
  // partite dei campionati aggiunti e dell'archivio: il calendario della stagione si carica prima di mostrare la pagina
  const raw0 = matchById(id);
  const needPrep = !!arch ? !(raw0 && raw0.archReady) : !!(raw0 && raw0.archive && !raw0.archReady);
  const [prepId, setPrepId] = useState(null);
  const prepared = !needPrep || prepId === id;
  useEffect(() => {
    if (!needPrep) return undefined;
    let on = true;
    const job = arch ? buildArchiveMatch(arch.fm, arch.sk, arch.mid) : completeExtraMatch(matchById(id));
    Promise.resolve(job).catch(() => null).then(() => { if (on) { setPrepId(id); bump((n) => n + 1); } });
    return () => { on = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const raw = matchById(id);
  const loc = useLocation();
  const wantPlayer = loc.state && loc.state.openPlayer;
  const opened = useRef('');

  useEffect(() => {
    let on = true;
    const run = (force) =>
      ensureDetail(id, playerLookup)
        .then(() => loadFm(matchById(id), playerLookup, force))
        .then(() => { const mm = matchById(id); if (mm && mm.archive && !mm.detail) applyArchiveFallback(mm); })
        .then(() => {
          if (!on) return;
          bump((n) => n + 1);
          if (wantPlayer && opened.current !== id && matchById(id) && matchById(id).lineup) {
            opened.current = id;
            setTimeout(() => openPlayer({ matchId: id, name: wantPlayer.name }), 250);
          }
        })
        .catch(() => {});
    if (needPrep && !prepared) return undefined;
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
  }, [id, prepared]);


  if (raw && raw.href) return <Navigate to={raw.href} replace />;
  if (!raw && !prepared) {
    return (
      <PageShell bar={false}>
        <TopBar title="Partita" />
        <div className="px-5 pt-8"><Skeleton className="h-[150px] w-full rounded-[28px]" /><Skeleton className="mt-4 h-[42px] w-full" /></div>
      </PageShell>
    );
  }
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
  const league = leagueById(raw.leagueId) || raw.leagueObj || null;
  const pre = raw.status === 'scheduled';

  const tabs = pre ? (raw.archive ? PRE_TABS_X : PRE_TABS) : PLAYED_TABS;
  const panels = pre && raw.archive
    ? [
        <MatchOverviewPanel key="overview" match={raw} home={home} away={away} />,
        <MatchLineupsPanel key="lineups" match={raw} view={view} home={home} away={away} pre />,
        <MatchStandingsPanel key="standings" match={raw} />,
      ]
    : pre
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
      <div style={{ '--tint': (raw.leagueObj && raw.leagueObj.tint) || leagueTint(raw.leagueId) }}>
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
