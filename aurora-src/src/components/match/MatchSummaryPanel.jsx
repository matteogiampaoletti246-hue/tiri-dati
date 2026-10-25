import PanelTitle from '@/components/PanelTitle';
import InfoBand from '@/components/InfoBand';
import Riassunto from './Riassunto';
import Momentum from './Momentum';
import RefereeCard from './RefereeCard';
import FormCard from './FormCard';
import { ConceptSwitch, useConcept } from '@/lib/concept';

const Card = ({ title, concept, children, noPad }) => (
  <section className="glass mx-4 overflow-hidden rounded-[24px]">
    <div className="flex items-center px-4 pb-1 pt-3.5">
      <h3 className="text-[12.5px] font-extrabold uppercase tracking-wider">{title}</h3>
      {concept ? <div className="ml-auto">{concept}</div> : null}
    </div>
    <div className={noPad ? '' : 'px-4 pb-4 pt-2'}>{children}</div>
  </section>
);

export default function MatchSummaryPanel({ match, view, home, away }) {
  const cr = 'a';
  const [cm, setCm] = useConcept('momentum2');
  const events = view.events || [];
  const empty = !events.length && !(view.momentum && view.momentum.length);

  return (
    <div className="flex flex-col gap-4 pb-6 pt-3">
      {empty ? (
        <p className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          {view.live ? 'Partita in corso: cronologia e statistiche live in arrivo' : 'Dettagli non disponibili per questa partita'}
        </p>
      ) : (
        <>
          <Card title="Riassunto" noPad>
            {events.length ? <Riassunto events={events} finished={match.status === 'finished'} concept={cr} /> : <p className="py-6 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessun evento</p>}
          </Card>
          <Card title="Momentum" concept={<ConceptSwitch value={cm} onChange={setCm} />}>
            <Momentum values={view.momentum} events={events} home={home} away={away} concept={cm} />
          </Card>
        </>
      )}
      <InfoBand match={match} />
      <RefereeCard match={match} />
      <FormCard match={match} home={home} away={away} />
    </div>
  );
}
