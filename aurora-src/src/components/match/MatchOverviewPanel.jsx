import MatchKeyNumbers from '@/components/match/MatchKeyNumbers';
import InfoBand from '@/components/InfoBand';
import IdeaSection from '@/components/match/IdeaSection';
import FormCard from '@/components/match/FormCard';
import RefereeCard from '@/components/match/RefereeCard';
import BestPlayers from '@/components/match/BestPlayers';

const Card = ({ title, children, noPad }) => (
  <section className="glass tint-card mx-4 overflow-hidden rounded-[24px]">
    <h3 className="px-4 pb-1 pt-3.5 text-[12.5px] font-extrabold uppercase tracking-wider">{title}</h3>
    <div className={noPad ? '' : 'px-4 pb-4 pt-2'}>{children}</div>
  </section>
);

export default function MatchOverviewPanel({ match, home, away }) {
  return (
    <div className="flex flex-col gap-4 pb-6 pt-3">
      <FormCard match={match} home={home} away={away} />
      <section><h3 className="px-5 pb-2 text-[12.5px] font-extrabold uppercase tracking-wider">Numeri da tenere d&apos;occhio</h3><MatchKeyNumbers match={match} /></section>
      <Card title="Giocatori migliori"><BestPlayers match={match} home={home} away={away} concept="b" /></Card>
      <IdeaSection match={match} home={home} away={away} />
      <InfoBand match={match} />
      <RefereeCard match={match} />
    </div>
  );
}
