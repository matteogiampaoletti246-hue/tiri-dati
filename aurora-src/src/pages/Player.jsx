import { playerFace } from '@/data/archive';
import { useBioPid } from '@/data/playerIndex';
import InjuryIcon from '@/components/InjuryIcon';
import { injuryOf } from '@/data/injuries';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import SwipeTabs from '@/components/SwipeTabs';
import Skeleton from '@/components/Skeleton';
import EntityBanner from '@/components/EntityBanner';
import useInitialLoad from '@/hooks/useInitialLoad';
import { playerById } from '@/data/players';
import { parseArchiveId, makeArchivePlayer } from '@/data/archivePlayer';
import { useEntityScope } from '@/components/past/PastBits';
import useAsync from '@/hooks/useAsync';
import { teamById } from '@/data/teams';
import { loadPlayerShots } from '@/data/extras';
import { loadCarriere } from '@/data/carriere';
import { POS_IT } from '@/components/player/playerCalc';
import { ProfiloPanel, PartitePanel, StatistichePanel, CarrieraPanel } from '@/components/player/PlayerTabs';

const TABS = [
  { key: 'profilo', label: 'Profilo' },
  { key: 'partite', label: 'Partite' },
  { key: 'stat', label: 'Statistiche' },
  { key: 'carriera', label: 'Carriera' },
];

// Scheda unica: i giocatori fuori dall'elenco attuale (ritirati, stagioni passate) vengono costruiti dall'archivio e usano le stesse schede
export default function Player() {
  const { id } = useParams();
  const arc = parseArchiveId(id);
  const { data, loading } = useAsync(() => (arc && !playerById(id) ? makeArchivePlayer(arc.fm, arc.sk, arc.pid) : Promise.resolve(null)), [id]);
  if (arc && !playerById(id)) {
    return (
      <PageShell bar={false}>
        <TopBar title="Giocatore" />
        {loading || data ? (
          <div className="px-5 pt-8"><Skeleton className="h-[80px] w-full" /></div>
        ) : (
          <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Giocatore non trovato</p>
        )}
      </PageShell>
    );
  }
  return <PlayerView key={id} id={id} />;
}

function PlayerView({ id }) {
  useEntityScope(id);
  const loading = useInitialLoad(280);
  const player = playerById(id);
  // stessa foto delle formazioni: quella del giocatore, altrimenti dall'id FotMob risolto (resolvePid)
  const pid = useBioPid(player);
  const photo = (player && player.photo) || (pid ? playerFace(pid) : null);
  const [tab, setTab] = useState(() => {
    try {
      return Number(sessionStorage.getItem('sl-ptab-' + id)) || 0;
    } catch {
      return 0;
    }
  });
  const [, bump] = useState(0);
  useEffect(() => {
    let on = true;
    loadPlayerShots(id).then(() => on && bump((n) => n + 1));
    loadCarriere().then(() => on && bump((n) => n + 1));
    return () => {
      on = false;
    };
  }, [id]);
  const change = (i) => {
    setTab(i);
    try {
      sessionStorage.setItem('sl-ptab-' + id, String(i));
    } catch {
      /* ignora */
    }
  };

  if (!player) {
    return (
      <PageShell bar={false}>
        <TopBar title="Giocatore" />
        <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Giocatore non trovato
        </p>
      </PageShell>
    );
  }

  const team = teamById(player.teamId);
  const club = team && team.colors ? team.colors[0] : '#2C3E66';
  const wrap = (a, n) => <div key={n.key} className="club-scope" style={{ '--club': club, '--club-a': a }}>{n}</div>;
  const panels = [
    wrap('28%', <ProfiloPanel key="p" player={player} team={team} concept="c" />),
    wrap('20%', <PartitePanel key="m" player={player} concept="b" />),
    wrap('16%', <StatistichePanel key="s" player={player} team={team} />),
    <CarrieraPanel key="c" player={player} team={team} concept="b" />,
  ];

  return (
    <PageShell swipeBack={false}>
      <EntityBanner
        tall
        name={player.name}
        nameExtra={injuryOf(player.id) ? <InjuryIcon size={20} /> : null}
        subtitle={[team ? team.name : player.teamName, POS_IT[player.position]].filter(Boolean).join(' · ')}
        colors={team ? team.colors : undefined}
        logoUrl={photo}
        person
        initials={player.initials}
      />
      {loading ? (
        <div className="px-5 pt-8 space-y-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[80px] w-full" />)}
        </div>
      ) : (
        <SwipeTabs fixedBar tabs={TABS} panels={panels} index={tab} onChange={change} className="pt-0" />
      )}
    </PageShell>
  );
}
