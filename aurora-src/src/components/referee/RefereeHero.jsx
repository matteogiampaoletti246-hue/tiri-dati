import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import LeagueBadge from '@/components/LeagueBadge';
import useCollapse from '@/hooks/useCollapse';

const initialsOf = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function RefereeHero({ referee, league, matchCount }) {
  const navigate = useNavigate();
  const p = useCollapse(140);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30" style={{ opacity: p, pointerEvents: p > 0.7 ? 'auto' : 'none' }}>
        <div
          className="mx-auto flex max-w-[430px] items-center gap-3 px-5 py-3"
          style={{
            background: 'color-mix(in srgb, var(--sky-2) 78%, transparent)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          }}
        >
          <button type="button" className="icon-btn -ml-1" aria-label="Indietro" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} strokeWidth={1.25} />
          </button>
          <span className="truncate text-[13.5px]" style={{ color: 'var(--ink)' }}>
            {referee.name}
          </span>
          <span className="label-sm ml-auto">{referee.country}</span>
        </div>
      </header>

      <section
        className="px-5 pt-3"
        style={{ transform: `scale(${1 - p * 0.05})`, transformOrigin: 'top center', opacity: Math.max(0, 1 - p * 1.15) }}
      >
        <div className="flex items-center">
          <button type="button" className="icon-btn -ml-1" aria-label="Indietro" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} strokeWidth={1.25} />
          </button>
          {league ? (
            <Link to={`/campionato/${league.id}`} className="mx-auto flex items-center gap-2 active:opacity-60">
              <LeagueBadge league={league} size={18} />
              <span className="label-sm">{league.name}</span>
            </Link>
          ) : (
            <span className="label-sm mx-auto">Arbitro</span>
          )}
          <span className="w-[19px]" />
        </div>

        <div className="mt-4 flex items-start gap-5">
          <span className="avatar h-[84px] w-[84px] text-[24px] font-light">{initialsOf(referee.name)}</span>

          <div className="min-w-0 flex-1 pt-1">
            <h1 className="title-lg text-[21px] leading-tight" style={{ color: 'var(--ink)' }}>
              {referee.name}
            </h1>
            <p className="mt-1 truncate text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
              {referee.country} · {referee.games} gare arbitrate
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
