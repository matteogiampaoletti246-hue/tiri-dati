import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { teamByName } from '@/data/teams';
import { NAV } from '@/components/past/PastBits';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import SwipeTabs from '@/components/SwipeTabs';
import Skeleton from '@/components/Skeleton';
import EntityBanner from '@/components/EntityBanner';
import StatLists from '@/components/stats/StatLists';
import { PlayerFace } from '@/components/FmImg';
import useAsync from '@/hooks/useAsync';
import { FM_ID, loadSeason, loadSeasonStats, seasonLabel, teamLogo, SEASON_STAT_IT, prettyKey } from '@/data/archive';
import { leagueById, leagueTint } from '@/data/leagues';
import { tintGrad } from '@/lib/tint';
import { ArchRow, StandingsPanel, fmtDate, dayKey, useTeamColors } from '@/components/archive/parts';

const TABS = [
  { key: 'matches', label: 'Partite' },
  { key: 'standings', label: 'Classifica' },
  { key: 'players', label: 'Giocatori' },
];
const Empty = ({ children }) => <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>{children}</p>;

export function TeamMatches({ season, tid, fm, sk, tint }) {
  const list = season.fix.filter((m) => String(m[2]) === tid || String(m[3]) === tid).sort((a, b) => String(a[4]).localeCompare(String(b[4])));
  if (!list.length) return <Empty>Nessuna partita</Empty>;
  const days = [];
  list.forEach((m) => { const k = dayKey(m[4]); const l = days[days.length - 1]; if (l && l.k === k) l.m.push(m); else days.push({ k, m: [m] }); });
  return (
    <div className="pb-4 pt-2">
      <section className="glass mx-4 mt-3 overflow-hidden rounded-[24px] pb-1" style={{ background: tintGrad(tint, 0x45) }}>
        {days.map((d, i) => (
          <div key={d.k}>
            <div className="px-4 pb-0.5 pt-2.5 text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)', borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>{fmtDate(d.m[0][4])}</div>
            {d.m.map((m) => <ArchRow key={m[0]} m={m} names={season.teams} fm={fm} sk={sk} />)}
          </div>
        ))}
      </section>
    </div>
  );
}

export function TeamPlayers({ stats, tid, season, fm, sk }) {
  const lists = (stats && stats.players) || {};
  const sections = Object.keys(lists).filter((k) => !k.startsWith('_')).map((k) => ({
    id: k,
    group: 'Statistiche',
    title: SEASON_STAT_IT[k] || prettyKey(k),
    rows: lists[k].filter((r) => String(r[2]) === tid).map((r, i) => ({
      id: `${r[0]}-${i}`, to: `/storico/${fm}/${sk}/giocatore/${r[0]}`, left: <PlayerFace id={r[0]} name={r[1]} size={30} />, name: r[1],
      value: /rating|per_90|expected/.test(k) ? Number(r[3]).toFixed(2).replace('.', ',') : Number.isInteger(r[3]) ? String(r[3]) : Number(r[3]).toFixed(1).replace('.', ','),
    })),
  })).filter((s) => s.rows.length);
  if (!sections.length) return <Empty>Statistiche dei giocatori non disponibili</Empty>;
  return <StatLists sections={sections} />;
}

export default function ArchiveTeam() {
  const { fm, sk, tid } = useParams();
  const [tab, setTab] = useState(0);
  const col = useTeamColors();
  const { data: season, loading } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const { data: stats } = useAsync(() => loadSeasonStats(fm, sk), [fm, sk]);
  const name = season && season.teams && season.teams[tid];
  if (loading) return <PageShell bar={false}><TopBar title="Squadra" /><div className="px-5 pt-8"><Skeleton className="h-[52px] w-full" /></div></PageShell>;
  if (!season || !name) return <PageShell bar={false}><TopBar title="Squadra" /><Empty>Squadra non trovata</Empty></PageShell>;
  // squadra presente nell'app: si apre la scheda unica della squadra, con la stagione scelta
  const appTeam = teamByName(name);
  if (appTeam && appTeam.leagueId && FM_ID[appTeam.leagueId] && String(FM_ID[appTeam.leagueId]) === String(fm)) {
    NAV.fm = fm; NAV.sk = sk; NAV.tab = 1;
    try { sessionStorage.setItem(`sl-tab-team-${appTeam.id}`, '1'); } catch (e) { /* ignore */ }
    return <Navigate replace to={`/squadra/${appTeam.id}`} />;
  }
  const lid = Object.keys(FM_ID).find((k) => String(FM_ID[k]) === String(fm));
  const league = lid ? leagueById(lid) : null;
  const tint = lid ? leagueTint(lid) : '#38A2FF';
  const row = ((season.table && season.table.all) || []).find((r) => String(r.id) === tid);
  const colors = col(tid, name).colors;
  const panels = [
    <TeamMatches key="m" season={season} tid={tid} fm={fm} sk={sk} tint={tint} />,
    <StandingsPanel key="s" season={season} fm={fm} sk={sk} highlight={tid} />,
    <TeamPlayers key="p" stats={stats} tid={tid} season={season} fm={fm} sk={sk} />,
  ];
  return (
    <PageShell swipeBack={false}>
      <EntityBanner
        name={name}
        subtitle={`${league ? league.name : ''}${league ? ' · ' : ''}${seasonLabel(sk)}`}
        meta={row ? <span className="tnum text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{row.idx}° · {row.pts} pt · {row.played} gare</span> : null}
        colors={colors}
        logoUrl={teamLogo(tid)}
        initials={name.slice(0, 3).toUpperCase()}
        tall
      />
      <SwipeTabs fixedBar tabs={TABS} panels={panels} index={tab} onChange={setTab} className="pt-0" />
    </PageShell>
  );
}
