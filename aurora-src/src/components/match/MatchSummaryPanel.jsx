import PanelTitle from '@/components/PanelTitle';
import MomentumChart from '@/components/MomentumChart';
import MatchTimeline from '@/components/MatchTimeline';

export default function MatchSummaryPanel({ view, home, away }) {
  return (
    <div className="flex flex-col gap-7 pt-2">
      <section className="px-5">
        <div className="panel px-5 py-5">
          <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{view.minute}&apos;</span>}>
            Momento
          </PanelTitle>
          <MomentumChart values={view.momentum} home={home} away={away} />
        </div>
      </section>

      <section>
        <div className="px-5">
          <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{view.events.length}</span>}>
            Cronologia
          </PanelTitle>
        </div>
        <MatchTimeline events={view.events} home={home} away={away} />
      </section>
    </div>
  );
}
