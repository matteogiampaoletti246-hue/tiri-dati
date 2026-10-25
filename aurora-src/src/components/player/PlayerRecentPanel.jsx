import PanelTitle from '@/components/PanelTitle';
import ResultRow from '@/components/ResultRow';
import { recentMatches } from '@/data/extras';

export default function PlayerRecentPanel({ teamId }) {
  const list = recentMatches(teamId, 5);

  return (
    <section className="px-5">
      <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{list.length}</span>}>
        Ultime partite
      </PanelTitle>
      <div className="panel-solid px-4 py-1">
        {list.map((m, i) => (
          <ResultRow key={m.id} match={m} teamId={teamId} divider={i > 0} />
        ))}
        {!list.length ? (
          <p className="py-6 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
            Nessuna partita
          </p>
        ) : null}
      </div>
    </section>
  );
}
