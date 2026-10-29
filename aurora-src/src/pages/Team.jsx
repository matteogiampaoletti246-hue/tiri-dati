import { useEffect, useState } from 'react';
import usePageTab from '@/hooks/usePageTab';
import { useEntityScope } from '@/components/past/PastBits';
import { Navigate, useParams } from 'react-router-dom';
import useAsync from '@/hooks/useAsync';
import { teamFromIndex } from '@/data/teamIndex';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import SwipeTabs from '@/components/SwipeTabs';
import Skeleton from '@/components/Skeleton';
import EntityBanner from '@/components/EntityBanner';
import FormDots from '@/components/FormDots';
import TeamMatchesPanel from '@/components/team/TeamMatchesPanel';
import StandingsTable from '@/components/StandingsTable';
import TeamRosterPanel from '@/components/team/TeamRosterPanel';
import TeamStandingsPanel from '@/components/team/TeamStandingsPanel';
import TeamPlayersPanel from '@/components/team/TeamPlayersPanel';
import TeamStatsPanel from '@/components/team/TeamStatsPanel';
import useInitialLoad from '@/hooks/useInitialLoad';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';
import { teamRow } from '@/data/standings';
import { teamForm } from '@/data/matches';
import { allTeamMatches } from '@/data/extras';
import { coachOf } from '@/data/players';
import { loadRose, roseOf } from '@/data/rose';

const TABS = [
  { key: 'matches', label: 'Partite' },
  { key: 'standings', label: 'Classifica' },
  { key: 'roster', label: 'Squadra' },
  { key: 'stats', label: 'Statistiche' },
  { key: 'players', label: 'Giocatori' },
];

export default function Team() {
  const { id } = useParams();
  useEntityScope(id);
  const [tab, setTab] = usePageTab('team', id);
  const [bComp, setBComp] = useState(null);
  useEffect(() => {
    const h = (e) => { if (e.detail && e.detail.teamId === id) setBComp(e.detail.comp); };
    window.addEventListener('sl-comp', h);
    return () => window.removeEventListener('sl-comp', h);
  }, [id]);
  const loading = useInitialLoad(280);
  // squadre di tutte le competizioni (/squadra/fm-<id FotMob>): la scheda si costruisce dall'indice tidx
  const fmRoute = /^fm-(\d+)$/.exec(String(id));
  const { data: idxTeam, loading: idxLoading } = useAsync(() => (fmRoute && !teamById(id) ? teamFromIndex(fmRoute[1]) : null), [id]);
  const team = teamById(id) || idxTeam;
  const [, bumpR] = useState(0);
  useEffect(() => { let on = true; loadRose().then(() => on && bumpR((n) => n + 1)); return () => { on = false; }; }, []);

  if (team && team.id !== id) return <Navigate replace to={`/squadra/${team.id}`} />;
  if (!team && fmRoute && idxLoading) {
    return <PageShell bar={false}><TopBar title="Squadra" /><div className="px-5 pt-8"><Skeleton className="h-[52px] w-full" /></div></PageShell>;
  }

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

  const shownLg = bComp && bComp !== 'all' ? leagueById(bComp) : league;
  const isHome = !bComp || bComp === 'all' || bComp === team.leagueId;
  const meta = <FormDots form={teamForm(team.id)} size={14} />;
  // allenatore solo se noto (mai "All. —")
  const coach = (roseOf(team) || {}).co || (coachOf(team.id) !== '—' ? coachOf(team.id) : null);
  const below = (isHome && row) || coach ? (
    <div className="flex min-w-0 items-center gap-2.5 text-[12.5px]">
      {isHome && row ? (
        <>
          <b className="tnum text-[16px]" style={{ color: 'var(--ink)' }}>{row.rank}°</b>
          <span className="tnum" style={{ color: 'var(--ink-2)' }}>{row.points} pt</span>
          {coach ? <span aria-hidden="true" className="h-4 w-px" style={{ background: 'var(--hair)' }} /> : null}
        </>
      ) : null}
      {coach ? <span className="min-w-0 truncate" style={{ color: 'var(--ink-2)' }}>All. {coach}</span> : null}
    </div>
  ) : null;

  const club = team.colors && team.colors[0];
  const wrap = (a, n) => <div key={n.key} className="club-scope" style={{ '--club': club, '--club-a': a }}>{n}</div>;
  const panels = [
    wrap('22%', <TeamMatchesPanel key="matches" teamId={team.id} />),
    wrap('24%', <TeamStandingsPanel key="standings" team={team} />),
    <TeamRosterPanel key="roster" teamId={team.id} />,
    wrap('22%', <TeamStatsPanel key="stats" team={team} />),
    wrap('22%', <TeamPlayersPanel key="players" team={team} />),
  ];


  return (
    <PageShell swipeBack={false}>
      <EntityBanner
        name={team.name}
        subtitle={shownLg ? shownLg.name : ''}
        meta={meta}
        below={below}
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
