import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import usePageTab from '@/hooks/usePageTab';
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
import ArchiveLeague from '@/components/archive/ArchiveLeague';
import { useEntityScope, useSel } from '@/components/past/PastBits';
import SeasonSheet from '@/components/archive/SeasonSheet';
import useAsync from '@/hooks/useAsync';
import { FM_ID, archIndex, seasonLabel, sortSeasons } from '@/data/archive';
import useDark from '@/hooks/useDark';
import useInitialLoad from '@/hooks/useInitialLoad';
import { RAW } from '@/data/load';
import { leagueById, initialsOf, leagueTint } from '@/data/leagues';
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
  const [tab, setTab] = usePageTab('league', id);
  const loading = useInitialLoad(280);
  const dark = useDark();
  const league = leagueById(id);
  useEntityScope(`lg-${FM_ID[id] || id}`);
  const [season, setSeason] = useSel(`lg-${FM_ID[id] || id}`, 'season', () => { const l = leagueById(id); const x = l && l.extra && RAW.extra && RAW.extra.sk && RAW.extra.sk[String(l.fm)]; return x || 'live'; });
  const [aTab, setATab] = useSel(`lg-${FM_ID[id] || id}`, 'atab', 0);
  const [sheet, setSheet] = useState(false);
  const fm = FM_ID[id];
  const { data: aidx } = useAsync(() => (fm ? archIndex() : null), [fm]);


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
  const curKey = (league.season || '').replace('/', '-');
  const past = sortSeasons(((aidx && fm && aidx[String(fm)] && aidx[String(fm)].s) || []).filter((x) => x !== curKey));
  const inArchive = season !== 'live';
  const seasonBtn = fm && past.length ? (
    <button type="button" onClick={() => setSheet(true)} className="glass press flex items-center gap-1.5 rounded-full py-1 pl-3 pr-2 text-[11.5px] font-bold" style={{ color: 'var(--ink)' }}>
      <span className="tnum">{inArchive ? seasonLabel(season) : (league.season || 'Stagione')}</span>
      <ChevronDown size={13} strokeWidth={2.2} style={{ color: 'var(--ink-3)' }} />
    </button>
  ) : null;

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
        subtitle={`${league.country} · ${inArchive ? seasonLabel(season) : league.season}`}
        meta={
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 whitespace-nowrap">
            {inArchive ? null : (
              <span className="tnum text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
                {leagueMatches.length} gare · {teamCount} squadre
              </span>
            )}
            {seasonBtn}
          </span>
        }
        colors={league.colors}
        logoUrl={dark && league.logoDark ? league.logoDark : league.logo}
        logoFilter={dark && !league.logoDark && ['premier-league', 'champions-league', 'ligue-1'].includes(league.id) ? 'brightness(0) invert(1)' : undefined}
        initials={initials}
        liveCount={inArchive ? 0 : liveCount}
        tall
      />

      {inArchive ? (
        <ArchiveLeague key={season} fm={fm} sk={season} tab={aTab} setTab={setATab} tint={leagueTint(league.id)} />
      ) : loading ? (
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
      <SeasonSheet open={sheet} seasons={['live', ...past]} value={season} currentLabel={league.season || 'Stagione attuale'} onClose={() => setSheet(false)} onSelect={(v) => { setSeason(v); setATab(0); setSheet(false); window.scrollTo({ top: 0 }); }} />
    </PageShell>
  );
}
