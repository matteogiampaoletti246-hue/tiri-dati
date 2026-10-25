import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextFilter from '@/components/TextFilter';
import Crest from '@/components/Crest';
import { Image } from '@/components/ui/image';
import { matchReliability } from '@/data/topPlayers';
import { teamById } from '@/data/teams';
import { comma } from '@/lib/format';

const tone = (v) => (v >= 7.75 ? '#1FA45B' : v >= 6.5 ? '#5DBB3F' : v >= 5 ? '#E0B400' : '#E8892B');

// Affidabilità dei giocatori nelle partite non ancora iniziate (tiri totali, soglia over).
export default function MatchReliabilityList({ match, home, away }) {
  const [line, setLine] = useState(0.5);
  const [side, setSide] = useState('all');
  const list = matchReliability(match, line).filter((r) => side === 'all' || r.side === side);

  return (
    <div className="flex flex-col gap-3 pb-6 pt-3">
      <div className="flex flex-col gap-2 px-4">
        <TextFilter options={[{ value: 0.5, label: 'Over 0,5' }, { value: 1.5, label: 'Over 1,5' }, { value: 2.5, label: 'Over 2,5' }]} value={line} onChange={setLine} />
        <TextFilter options={[{ value: 'all', label: 'Tutti' }, { value: 'home', label: home ? home.short || home.name : 'Casa' }, { value: 'away', label: away ? away.short || away.name : 'Trasferta' }]} value={side} onChange={setSide} />
      </div>
      {!list.length ? <p className="px-5 py-12 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Affidabilità non ancora calcolabile per questa partita</p> : null}
      {list.length ? (
        <section className="glass mx-4 overflow-hidden rounded-[24px]">
          {list.slice(0, 40).map((r, i) => (
            <Link key={r.player.id} to={`/giocatore/${r.player.id}`} className="press flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
              <span className="tnum w-[18px] text-[11px]" style={{ color: 'var(--ink-3)' }}>{i + 1}</span>
              <span className="avatar h-[36px] w-[36px]">{r.player.photo ? <Image src={r.player.photo} alt={r.player.name} className="h-full w-full" fittingType="fill" /> : r.player.initials}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold">{r.player.name}</span>
                <span className="flex items-center gap-1.5 text-[10.5px]" style={{ color: 'var(--ink-3)' }}><Crest team={teamById(r.player.teamId)} size={13} />tiri attesi {comma(r.lam, 2)}</span>
              </span>
              <span className="tnum rounded-full px-2.5 py-1 text-[13px] font-extrabold text-white" style={{ background: tone(r.voto) }}>{comma(r.voto, 1)}</span>
            </Link>
          ))}
        </section>
      ) : null}
    </div>
  );
}
