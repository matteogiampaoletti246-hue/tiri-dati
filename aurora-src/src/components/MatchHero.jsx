import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';
import Crest from './Crest';
import FormDots from './FormDots';
import LeagueBadge from './LeagueBadge';
import TeamLink from './TeamLink';
import LeagueLink from './LeagueLink';
import useCollapse from '@/hooks/useCollapse';
import { teamForm } from '@/data/matches';
import { longDate } from '@/lib/format';

export default function MatchHero({ match, view, league, home, away }) {
  const navigate = useNavigate();
  const p = useCollapse(150);
  const live = match.status === 'live';
  const finished = match.status === 'finished';
  const date = new Date(match.ts);
  const score = `${view.score ? view.score[0] : 0} – ${view.score ? view.score[1] : 0}`;
  const statusText = finished ? 'Finita' : longDate(date);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${home ? home.name : ''} – ${away ? away.name : ''}`, url });
      } catch (e) {
        /* condivisione annullata */
      }
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  };

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
          <span className="truncate text-[13px]" style={{ color: 'var(--ink-2)' }}>
            {home ? home.name : '—'} – {away ? away.name : '—'}
          </span>
          <span className="tnum ml-auto text-[15px] font-medium" style={{ color: live ? 'var(--live)' : 'var(--ink)' }}>
            {live || finished ? score : match.kickoff}
          </span>
        </div>
      </header>

      <section
        className="relative px-5 pb-3 pt-3"
        style={{ transform: `scale(${1 - p * 0.05})`, transformOrigin: 'top center', opacity: Math.max(0, 1 - p * 1.15) }}
      >
        <div className="flex items-center gap-2">
          <button type="button" className="icon-btn -ml-1" aria-label="Indietro" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} strokeWidth={1.25} />
          </button>
          <LeagueLink league={league} className="mx-auto flex items-center gap-2 transition-opacity active:opacity-60">
            <LeagueBadge league={league} size={18} />
            <span className="label-sm">{league ? league.name : '—'}</span>
          </LeagueLink>
          <button type="button" className="icon-btn -mr-1" aria-label="Condividi" onClick={share}>
            <Share2 size={19} strokeWidth={1.2} />
          </button>
        </div>

        <div className="mt-4 flex items-start">
          <div className="flex flex-1 flex-col items-center gap-2">
            <TeamLink team={home} className="flex flex-col items-center gap-2 transition-opacity active:opacity-60">
              <Crest team={home} size={56} />
              <span className="text-center text-[13px] leading-tight" style={{ color: 'var(--ink)' }}>
                {home ? home.name : '—'}
              </span>
            </TeamLink>
            <FormDots form={teamForm(match.homeId)} size={13} />
          </div>

          <div className="flex w-[110px] flex-none flex-col items-center pt-3">
            {live || finished ? (
              <span className="title-xl tnum text-[34px]" style={{ color: live ? 'var(--live)' : 'var(--ink)' }}>
                {score}
              </span>
            ) : (
              <span className="title-xl tnum text-[32px]" style={{ color: 'var(--ink)' }}>
                {match.kickoff}
              </span>
            )}
            {live ? (
              <span className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: 'var(--live)' }}>
                <span className="live-dot" />
                {view.minute}&apos;
              </span>
            ) : (
              <span className="mt-1.5 text-center text-[11px]" style={{ color: 'var(--ink-3)' }}>
                {statusText}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            <TeamLink team={away} className="flex flex-col items-center gap-2 transition-opacity active:opacity-60">
              <Crest team={away} size={56} />
              <span className="text-center text-[13px] leading-tight" style={{ color: 'var(--ink)' }}>
                {away ? away.name : '—'}
              </span>
            </TeamLink>
            <FormDots form={teamForm(match.awayId)} size={13} />
          </div>
        </div>
      </section>
    </>
  );
}
