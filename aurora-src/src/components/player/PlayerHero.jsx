import PlayerPhoto from '@/components/PlayerPhoto';
import { Link, useNavigate } from 'react-router-dom';
import { goBack } from '@/lib/carousel';
import { ChevronLeft } from 'lucide-react';
import Crest from '@/components/Crest';
import { Image } from '@/components/ui/image';
import useCollapse from '@/hooks/useCollapse';
import { comma } from '@/lib/format';

const POS = { GK: 'Portiere', DEF: 'Difensore', MID: 'Centrocampista', WNG: 'Ala', ATT: 'Attaccante' };

export default function PlayerHero({ player, team }) {
  const navigate = useNavigate();
  const p = useCollapse(140);
  const colors = team ? team.colors : ['#1E4BD8', '#7FB6E8'];
  const gradient = { background: `linear-gradient(150deg, ${colors[0]}, ${colors[1]})` };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30" style={{ opacity: p, pointerEvents: p > 0.7 ? 'auto' : 'none' }}>
        <div
          className="bf-dark mx-auto flex max-w-[var(--app-w)] items-center gap-3 px-5 py-3"
          style={{
            background: 'color-mix(in srgb, var(--sky-2) 78%, transparent)',
          }}
        >
          <button type="button" className="icon-btn -ml-1" aria-label="Indietro" onClick={() => goBack(navigate)}>
            <ChevronLeft size={22} strokeWidth={1.25} />
          </button>
          <span className="crest h-[22px] w-[22px] text-[9px]" style={gradient}>
            {player.initials}
          </span>
          <span className="truncate text-[13.5px]" style={{ color: 'var(--ink)' }}>
            {player.name}
          </span>
          <span className="tnum ml-auto text-[12px]" style={{ color: 'var(--ink-3)' }}>
            {player.number}
          </span>
        </div>
      </header>

      <section
        className="px-5 pt-3"
        style={{ transform: `scale(${1 - p * 0.05})`, transformOrigin: 'top center', opacity: Math.max(0, 1 - p * 1.15) }}
      >
        <div className="flex items-center">
          <button type="button" className="icon-btn -ml-1" aria-label="Indietro" onClick={() => goBack(navigate)}>
            <ChevronLeft size={22} strokeWidth={1.25} />
          </button>
          <Link to={`/squadra/${player.teamId}`} className="mx-auto flex items-center gap-2 active:opacity-60">
            <Crest team={team} size={18} />
            <span className="label-sm">{team ? team.name : '—'}</span>
          </Link>
          <span className="w-[19px]" />
        </div>

        <div className="mt-4 flex items-start gap-5">
          <span className="crest h-[84px] w-[84px]" style={gradient}>
            <PlayerPhoto src={player.photo} alt={player.name} />
          </span>

          <div className="min-w-0 flex-1 pt-1">
            <h1 className="title-lg text-[21px] leading-tight" style={{ color: 'var(--ink)' }}>
              {player.name}
            </h1>
            <p className="mt-1 truncate text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
              {[POS[player.position] || player.position, player.number].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="tnum text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
                {comma(player.rating, 2)}
              </span>
              <span className="label-sm">voto stagione</span>
              {player.ratings5 && player.ratings5.length ? (
                <span className="tnum ml-auto text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
                  {comma(player.ratings5.reduce((a, b) => a + b, 0) / player.ratings5.length, 2)} ultime {player.ratings5.length}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
