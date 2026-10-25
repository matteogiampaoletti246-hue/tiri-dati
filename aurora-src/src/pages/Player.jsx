import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import PanelTitle from '@/components/PanelTitle';
import ShotMap from '@/components/ShotMap';
import Skeleton from '@/components/Skeleton';
import PlayerHero from '@/components/player/PlayerHero';
import PlayerSeasonGrid from '@/components/player/PlayerSeasonGrid';
import PlayerRecentPanel from '@/components/player/PlayerRecentPanel';
import PlayerPer90Panel from '@/components/player/PlayerPer90Panel';
import useInitialLoad from '@/hooks/useInitialLoad';
import { playerById } from '@/data/players';
import { teamById } from '@/data/teams';
import { playerShots, loadPlayerShots } from '@/data/extras';

export default function Player() {
  const { id } = useParams();
  const loading = useInitialLoad(280);
  const player = playerById(id);
  const [, bump] = useState(0);
  useEffect(() => {
    let on = true;
    loadPlayerShots(id).then(() => on && bump((n) => n + 1));
    return () => {
      on = false;
    };
  }, [id]);

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
  const shots = playerShots(player.id, 14);

  return (
    <PageShell swipeBack={false}>
      <PlayerHero player={player} team={team} />

      {loading ? (
        <div className="space-y-4 px-5 pt-6">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[92px] w-full" />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-7">
          <PlayerSeasonGrid player={player} />

          <PlayerRecentPanel teamId={player.teamId} />

          <section className="px-5">
            <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{shots.length}</span>}>
              Mappa tiri
            </PanelTitle>
            <ShotMap shots={shots} showList={false} />
          </section>

          <PlayerPer90Panel player={player} />
        </div>
      )}
    </PageShell>
  );
}
