import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import MatchKeyNumbers from '@/components/match/MatchKeyNumbers';
import InfoBand from '@/components/InfoBand';
import RecentSplit from '@/components/match/RecentSplit';
import FormCard from '@/components/match/FormCard';
import RefereeCard from '@/components/match/RefereeCard';
import { Image } from '@/components/ui/image';
import { playersByTeam } from '@/data/players';
import { playerReliability } from '@/data/topPlayers';
import { comma } from '@/lib/format';

const Card = ({ title, children, noPad }) => (
  <section className="glass mx-4 overflow-hidden rounded-[24px]">
    <h3 className="px-4 pb-1 pt-3.5 text-[12.5px] font-extrabold uppercase tracking-wider">{title}</h3>
    <div className={noPad ? '' : 'px-4 pb-4 pt-2'}>{children}</div>
  </section>
);

// Migliore per affidabilità tiri (linea comune 1,5); se non calcolabile, ripiego sul voto medio.
const bestOf = (teamId, date) => {
  const list = playersByTeam(teamId);
  const rel = list.map((p) => ({ p, r: playerReliability(p, date, 1.5) })).filter((x) => x.r).sort((x, y) => y.r.voto - x.r.voto)[0];
  if (rel) return { p: rel.p, val: rel.r.voto, kind: 'aff' };
  const r = list.filter((p) => p.rating).sort((x, y) => y.rating - x.rating)[0];
  return r ? { p: r, val: r.rating, kind: 'rating' } : null;
};

function Best({ match, home, away }) {
  const A = bestOf(match.homeId, match.date);
  const B = bestOf(match.awayId, match.date);
  if (!A && !B) return null;
  const a = A && { ...A.p, rating: A.val };
  const b = B && { ...B.p, rating: B.val };
  const aff = (A && A.kind === 'aff') || (B && B.kind === 'aff');
  const Side = ({ p, align }) =>
    p ? (
      <Link to={`/giocatore/${p.id}`} className={`press flex flex-1 flex-col items-center gap-1.5 ${align}`}>
        <span className="avatar h-[54px] w-[54px]">{p.photo ? <Image src={p.photo} alt={p.name} className="h-full w-full" fittingType="fill" /> : p.initials}</span>
        <span className="max-w-full truncate text-[13px] font-bold">{p.name.split(' ').slice(-1)[0]}</span>
        <span className="tnum text-[20px] font-extrabold">{comma(p.rating, aff ? 1 : 2)}</span>
      </Link>
    ) : <span className="flex-1" />;
  return (
    <div>
      <div className="flex items-start">
        <Side p={a} />
        <div className="flex w-[40px] flex-col items-center pt-3 text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}><Crest team={home} size={18} /><span className="my-1">vs</span><Crest team={away} size={18} /></div>
        <Side p={b} />
      </div>
      <p className="mt-2 text-center text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{aff ? 'Affidabilità tiri · Over 1,5' : 'Voto medio stagione'}</p>
      <div className="mt-3 flex h-[6px] gap-[3px]">
        <span className="h-full rounded-l-full" style={{ width: `${(((a && a.rating) || 0) / (((a && a.rating) || 0) + ((b && b.rating) || 0) || 1)) * 100}%`, background: 'var(--accent)', opacity: a && b && a.rating >= b.rating ? 1 : 0.4 }} />
        <span className="h-full flex-1 rounded-r-full" style={{ background: 'var(--live)', opacity: a && b && b.rating >= a.rating ? 1 : 0.4 }} />
      </div>
    </div>
  );
}

export default function MatchOverviewPanel({ match, home, away }) {
  return (
    <div className="flex flex-col gap-4 pb-6 pt-3">
      <FormCard match={match} home={home} away={away} />
      <section><h3 className="px-5 pb-2 text-[12.5px] font-extrabold uppercase tracking-wider">Numeri da tenere d&apos;occhio</h3><MatchKeyNumbers match={match} /></section>
      <Card title="Giocatori migliori"><Best match={match} home={home} away={away} /></Card>
      <RecentSplit match={match} home={home} away={away} />
      <InfoBand match={match} />
      <RefereeCard match={match} />
    </div>
  );
}
