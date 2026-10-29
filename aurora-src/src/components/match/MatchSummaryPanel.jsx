import PanelTitle from '@/components/PanelTitle';
import InfoBand from '@/components/InfoBand';
import Riassunto from './Riassunto';
import Momentum from './Momentum';
import RefereeCard from './RefereeCard';
import FormCard from './FormCard';

const Card = ({ title, concept, children, noPad }) => (
  <section className="glass tint-card mx-4 overflow-hidden rounded-[24px]">
    <div className="flex items-center px-4 pb-1 pt-3.5">
      <h3 className="text-[12.5px] font-extrabold uppercase tracking-wider">{title}</h3>
      {concept ? <div className="ml-auto">{concept}</div> : null}
    </div>
    <div className={noPad ? '' : 'px-4 pb-4 pt-2'}>{children}</div>
  </section>
);

export default function MatchSummaryPanel({ match, view, home, away }) {
  const cr = 'a';
  const cm = 'c';
  const events = view.events || [];
  const hasMomentum = !!(view.momentum && view.momentum.length);

  // ogni riquadro compare solo se ha dati: senza momentum il Riepilogo parte dal Riassunto
  return (
    <div className="flex flex-col gap-4 pb-6 pt-3">
      {hasMomentum ? (
        <Card title="Momentum">
          <Momentum values={view.momentum} events={events} home={home} away={away} concept={cm} />
        </Card>
      ) : null}
      {events.length ? (
        <Card title="Riassunto" noPad>
          <Riassunto match={match} events={events} finished={match.status === 'finished'} concept={cr} />
        </Card>
      ) : null}
      <InfoBand match={match} />
      <RefereeCard match={match} />
      <FormCard match={match} home={home} away={away} />
    </div>
  );
}
