import { Link } from 'react-router-dom';
import { refereeById, findRefereeByName } from '@/data/referees';
import { Image } from '@/components/ui/image';
import { WhistleIcon } from '@/components/LineIcons';

const f1 = (v) => (v == null ? '—' : (Math.round(v * 10) / 10).toString().replace('.', ','));

// Arbitro: nome, bandiera, ammonizioni e falli fischiati a partita in stagione.
export default function RefereeCard({ match }) {
  const r = (match.refereeId && refereeById(match.refereeId)) || findRefereeByName(match.refereeName);
  const name = r ? r.name : match.refereeName;
  if (!name) return null;
  const inner = (
    <>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="avatar h-[46px] w-[46px]">
          {r && r.photo ? <Image src={r.photo} alt={name} className="h-full w-full" fittingType="fill" /> : <WhistleIcon size={20} />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-extrabold">{name}</p>
          <p className="text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
            {r && r.flag ? <span className="mr-1 text-[14px]">{r.flag}</span> : null}
            Arbitro{r ? ` · ${r.country || ''}${r.games ? ` · ${r.games} gare` : ''}` : ''}
          </p>
        </div>
      </div>
      {r ? (
        <div className="grid grid-cols-2" style={{ borderTop: '1px solid var(--hair-2)' }}>
          <div className="px-4 py-3">
            <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Ammonizioni / partita</p>
            <p className="tnum mt-1 text-[24px] font-extrabold">{f1(r.yellowsAvg)}</p>
          </div>
          <div className="px-4 py-3" style={{ borderLeft: '1px solid var(--hair-2)' }}>
            <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Falli fischiati / partita</p>
            <p className="tnum mt-1 text-[24px] font-extrabold">{f1(r.foulsAvg)}</p>
          </div>
        </div>
      ) : null}
    </>
  );
  return r ? <Link to={`/arbitro/${r.id}`} className="glass press mx-4 block overflow-hidden rounded-[24px]">{inner}</Link> : <div className="glass mx-4 overflow-hidden rounded-[24px]">{inner}</div>;
}
