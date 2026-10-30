import PlayerPhoto from '@/components/PlayerPhoto';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import Crest from '@/components/Crest';
import RollNumber from '@/components/RollNumber';
import { Image } from '@/components/ui/image';
import { teamById } from '@/data/teams';
import { matchesByDate } from '@/data/matches';
import { romeDay } from '@/data/util';
import FlagDot from '@/components/FlagDot';
import { carriereOf, countryIt } from '@/data/carriere';

const RK = ['#F5C84C', '#C5CEDB', '#D98F5C'];

const FMT = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', weekday: 'short', day: 'numeric', month: 'short' });
// orario vero dalla partita in calendario; se non c'è, solo giorno e data
const when = (match) => {
  const t = FMT.format(new Date(match.ts)).replace(/\./g, '');
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  const real = matchesByDate(romeDay(match.ts)).find((m) => m.homeId === match.homeId && m.awayId === match.awayId);
  const wd = cap.split(' ')[0];
  return real && real.kickoff ? `${wd} ${real.kickoff}` : cap;
};

export default function TopPlayerRow({ row, rank, threshold, delay = 0 }) {
  const { player, match } = row;
  const nav = useNavigate();
  const team = teamById(player.teamId);
  const opp = match ? teamById(match.homeId === player.teamId ? match.awayId : match.homeId) : null;
  const c1 = team ? team.colors[0] : '#2C3E66';
  const c2 = team ? team.colors[1] : '#0b1230';
  const car = carriereOf(player.id) || {};
  const nat = car.c ? countryIt(car.c) : '';
  const rk = RK[rank - 1] || 'var(--accent)';

  const openCalc = (e) => {
    e.preventDefault();
    e.stopPropagation();
    nav('/calcolatore', { state: { calc: { playerId: player.id, line: threshold, ts: match ? match.ts : null } } });
  };

  return (
    <Link
      to={`/giocatore/${player.id}`}
      className="press mx-4 mb-2.5 flex items-center gap-3 rounded-[24px] p-3"
      style={{ background: `linear-gradient(100deg, ${c1}55, rgba(255,255,255,.03) 70%)`, border: '1px solid var(--glass-border)' }}
    >
      <span className="relative flex-none">
        <span className="avatar h-[50px] w-[50px] text-[13px]">
          <PlayerPhoto src={player.photo} alt={player.name} />
        </span>
        <b className="absolute -left-1.5 -top-1.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 text-[12px]" style={{ background: rk, color: rank <= 3 ? '#06101f' : '#fff' }}>
          {rank}
        </b>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-extrabold" style={{ color: 'var(--ink)' }}>{player.name}</span>
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
          {car.c ? <FlagDot name={car.c} size={14} /> : null}
          <span className="min-w-0 truncate">{[nat, team ? team.name : null].filter(Boolean).join(' · ')}</span>
        </span>
        {match ? (
          <span className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-2)' }}>
            {opp ? <Crest team={opp} size={14} /> : null}
            <span className="truncate">{opp ? opp.name : match.oppName} · {when(match)}</span>
          </span>
        ) : null}
        <span className="mt-1.5 block h-[5px] rounded-full" style={{ background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
      </span>

      <span className="flex flex-none flex-col items-center gap-1.5">
        <RollNumber value={row.voto} delay={delay} className="text-[25px] font-extrabold leading-none" />
        <button type="button" onClick={openCalc} aria-label="Apri nel calcolatore" className="glass press flex h-[27px] w-[27px] items-center justify-center rounded-full" style={{ color: 'var(--accent)' }}>
          <Calculator size={14} strokeWidth={2} />
        </button>
      </span>
    </Link>
  );
}
