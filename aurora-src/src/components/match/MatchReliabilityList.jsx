import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextFilter from '@/components/TextFilter';
import Crest from '@/components/Crest';
import { Image } from '@/components/ui/image';
import { matchReliability } from '@/data/topPlayers';
import { teamById } from '@/data/teams';
import { comma } from '@/lib/format';
import RollNumber from '@/components/RollNumber';



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
        <div>
          {list.slice(0, 40).map((r, i) => {
            const t = teamById(r.player.teamId);
            const c1 = t ? t.colors[0] : '#2C3E66';
            return (
              <Link
                key={r.player.id}
                to={`/giocatore/${r.player.id}`}
                className="press mx-4 mb-2 flex items-center gap-2.5 rounded-[20px] px-2.5 py-2"
                style={{ background: `linear-gradient(100deg, ${c1}66, rgba(255,255,255,.03) 70%)`, border: '1px solid var(--glass-border)' }}
              >
                <span className="avatar h-[38px] w-[38px]">{r.player.photo ? <Image src={r.player.photo} alt={r.player.name} className="h-full w-full" fittingType="fill" /> : r.player.initials}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-extrabold">{r.player.name}</span>
                  <span className="flex items-center gap-1.5 text-[10.5px]" style={{ color: 'var(--ink-3)' }}><Crest team={t} size={13} />tiri attesi {comma(r.lam, 2)}</span>
                </span>
                <RollNumber value={r.voto} delay={Math.min(i, 8) * 50} className="text-[20px] font-extrabold" />
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
