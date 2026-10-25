import PanelTitle from '@/components/PanelTitle';
import PlayerRow from '@/components/PlayerRow';
import { playersByTeam } from '@/data/players';
import { comma } from '@/lib/format';

const GROUPS = [
  ['GK', 'Portieri'],
  ['DEF', 'Difensori'],
  ['MID', 'Centrocampisti'],
  ['ATT', 'Attaccanti'],
];

export default function TeamRosterPanel({ team }) {
  const squad = playersByTeam(team.id);

  return (
    <div className="flex flex-col gap-7 pt-3">
      {GROUPS.map(([pos, title]) => {
        const list = squad.filter((p) => p.position === pos).sort((a, b) => (b.rating || 0) - (a.rating || 0));
        if (!list.length) return null;
        return (
          <section key={pos}>
            <div className="px-5">
              <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{list.length}</span>}>
                {title}
              </PanelTitle>
            </div>
            {list.map((p, i) => (
              <PlayerRow key={p.id} player={p} value={comma(p.rating, 2)} valueLabel="Voto" divider={i > 0} link />
            ))}
          </section>
        );
      })}
    </div>
  );
}
