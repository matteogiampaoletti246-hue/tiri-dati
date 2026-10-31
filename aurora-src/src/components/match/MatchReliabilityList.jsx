import PlayerPhoto from '@/components/PlayerPhoto';
import { teamGrad } from '@/lib/tint';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextFilter from '@/components/TextFilter';
import Crest from '@/components/Crest';
import { Image } from '@/components/ui/image';
import { matchReliability } from '@/data/topPlayers';
import { PLAYERS } from '@/data/players';

// la scheda Affidabilita' c'e' solo se almeno un giocatore ha voto >= 7,00 (su una delle tre soglie)
// (calcolata al massimo una volta ogni 2 minuti per partita: la pagina si ridisegna spesso e il calcolo e' pesante)
export const hasReliability = (match) => {
  const c = match._hasRel;
  // un "no" si ricalcola presto (i dati dei giocatori/calendario possono arrivare dopo il primo disegno); un "si" vale 2 minuti
  if (c && Date.now() - c.at < (c.v ? 120000 : 3000) && c.n === PLAYERS.length) return c.v;
  const v = [0.5, 1.5, 2.5].some((l) => matchReliability(match, l).length > 0);
  match._hasRel = { at: Date.now(), v, n: PLAYERS.length };
  return v;
};
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
                style={{ background: teamGrad(t, 0x66), border: '1px solid var(--glass-border)' }}
              >
                <span className="avatar h-[38px] w-[38px]"><PlayerPhoto src={r.player.photo} alt={r.player.name} /></span>
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
