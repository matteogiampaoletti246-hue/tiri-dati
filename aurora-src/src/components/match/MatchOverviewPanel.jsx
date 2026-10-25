import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import ResultRow from '@/components/ResultRow';
import MatchKeyNumbers from '@/components/match/MatchKeyNumbers';
import InfoBand from '@/components/InfoBand';
import FormCard from '@/components/match/FormCard';
import RefereeCard from '@/components/match/RefereeCard';
import { Image } from '@/components/ui/image';
import { headToHead, h2hSummary, recentMatches } from '@/data/extras';
import { playersByTeam } from '@/data/players';
import { comma } from '@/lib/format';

const Card = ({ title, children, noPad }) => (
  <section className="glass mx-4 overflow-hidden rounded-[24px]">
    <h3 className="px-4 pb-1 pt-3.5 text-[12.5px] font-extrabold uppercase tracking-wider">{title}</h3>
    <div className={noPad ? '' : 'px-4 pb-4 pt-2'}>{children}</div>
  </section>
);

const bestOf = (teamId) => playersByTeam(teamId).filter((p) => p.rating).sort((a, b) => b.rating - a.rating)[0] || null;

function Best({ match, home, away }) {
  const a = bestOf(match.homeId);
  const b = bestOf(match.awayId);
  if (!a && !b) return null;
  const max = Math.max((a && a.rating) || 0, (b && b.rating) || 0) || 1;
  const Side = ({ p, align }) =>
    p ? (
      <Link to={`/giocatore/${p.id}`} className={`press flex flex-1 flex-col items-center gap-1.5 ${align}`}>
        <span className="avatar h-[54px] w-[54px]">{p.photo ? <Image src={p.photo} alt={p.name} className="h-full w-full" fittingType="fill" /> : p.initials}</span>
        <span className="max-w-full truncate text-[13px] font-bold">{p.name.split(' ').slice(-1)[0]}</span>
        <span className="tnum text-[20px] font-extrabold">{comma(p.rating, 2)}</span>
      </Link>
    ) : <span className="flex-1" />;
  return (
    <div>
      <div className="flex items-start">
        <Side p={a} />
        <div className="flex w-[40px] flex-col items-center pt-3 text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}><Crest team={home} size={18} /><span className="my-1">vs</span><Crest team={away} size={18} /></div>
        <Side p={b} />
      </div>
      <div className="mt-3 flex h-[6px] gap-[3px]">
        <span className="h-full rounded-l-full" style={{ width: `${(((a && a.rating) || 0) / (((a && a.rating) || 0) + ((b && b.rating) || 0) || 1)) * 100}%`, background: 'var(--accent)', opacity: a && b && a.rating >= b.rating ? 1 : 0.4 }} />
        <span className="h-full flex-1 rounded-r-full" style={{ background: 'var(--live)', opacity: a && b && b.rating >= a.rating ? 1 : 0.4 }} />
      </div>
    </div>
  );
}

export default function MatchOverviewPanel({ match, home, away }) {
  const h2h = headToHead(match.homeId, match.awayId, 5);
  const sum = h2hSummary(match.homeId, match.awayId);
  return (
    <div className="flex flex-col gap-4 pb-6 pt-3">
      <FormCard match={match} home={home} away={away} />
      <Card title="Numeri da tenere d'occhio" noPad><MatchKeyNumbers match={match} /></Card>
      <Card title="Giocatori migliori"><Best match={match} home={home} away={away} /></Card>
      <Card title="Precedenti" noPad>
        <div className="tnum flex items-center gap-4 px-4 py-2 text-[12px]" style={{ color: 'var(--ink-2)' }}>
          <span>{sum.a} {home ? home.short : ''}</span><span style={{ color: 'var(--ink-3)' }}>{sum.d} pareggi</span><span>{sum.b} {away ? away.short : ''}</span>
        </div>
        <div className="px-4 pb-2">
          {h2h.length ? h2h.map((m, i) => <ResultRow key={m.id} match={m} teamId={match.homeId} divider={i > 0} />) : <p className="py-4 text-center text-[12px]" style={{ color: 'var(--ink-3)' }}>Nessun precedente disponibile in questa stagione</p>}
        </div>
      </Card>
      <Card title="Ultime gare" noPad>
        <div className="px-4 pb-2">
          {recentMatches(match.homeId, 3).map((m, i) => <ResultRow key={m.id} match={m} teamId={match.homeId} divider={i > 0} />)}
          {recentMatches(match.awayId, 3).map((m, i) => <ResultRow key={m.id} match={m} teamId={match.awayId} divider />)}
        </div>
      </Card>
      <InfoBand match={match} />
      <RefereeCard match={match} />
    </div>
  );
}
