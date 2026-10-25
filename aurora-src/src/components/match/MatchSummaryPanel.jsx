import PanelTitle from '@/components/PanelTitle';
import MomentumChart from '@/components/MomentumChart';
import MatchTimeline from '@/components/MatchTimeline';

export default function MatchSummaryPanel({ view, home, away }) {
  if (!view.events.length && !(view.momentum && view.momentum.length)) {
    return (
      <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
        {view.live ? 'Partita in corso: cronologia e statistiche live in arrivo' : 'Dettagli non disponibili per questa partita'}
      </p>
    );
  }
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
