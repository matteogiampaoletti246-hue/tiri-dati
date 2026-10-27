import { teamColor } from '@/lib/tint';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';
import Crest from './Crest';
import FormDots from './FormDots';
import LeagueBadge from './LeagueBadge';
import TeamLink from './TeamLink';
import LeagueLink from './LeagueLink';
import { teamForm } from '@/data/matches';
import { longDate } from '@/lib/format';

// "Robin Fellhauer" → "R. Fellhauer"
const short = (n) => {
  const p = String(n || '').trim().split(/\s+/);
  return p.length < 2 ? p[0] || '' : `${p[0][0]}. ${p.slice(1).join(' ')}`;
};

function Scorers({ events, side, align }) {
  const goals = (events || []).filter((e) => e.type === 'goal' && e.team === side);
  if (!goals.length) return null;
  return (
    <div className={`mt-2 flex w-full flex-col gap-[3px] ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
      {goals.map((g, i) => (
        <span key={i} className="max-w-full truncate text-[11.5px] leading-tight" style={{ color: 'var(--ink-2)' }}>
          <span className="tnum" style={{ color: 'var(--ink-3)' }}>{g.minute}&apos;</span> {short(g.name)}
          {g.pen ? ' (rig.)' : ''}
          {g.og ? ' (aut.)' : ''}
        </span>
      ))}
    </div>
  );
}

export default function MatchHero({ match, view, league, home, away }) {
  const navigate = useNavigate();
  const live = match.status === 'live';
  const finished = match.status === 'finished';
  const date = new Date(match.ts);
  const score = view.score ? `${view.score[0]} – ${view.score[1]}` : '0 – 0';
  const statusText = finished ? 'Finita' : longDate(date);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${home ? home.name : ''} – ${away ? away.name : ''}`, url });
      } catch (e) {
        /* annullata */
      }
    } else if (navigator.clipboard) navigator.clipboard.writeText(url);
  };

  return (
    <section className="safe-top px-4 pb-3">
      <div className="flex items-center gap-2">
        <button type="button" className="glass press flex h-9 w-9 items-center justify-center rounded-full" aria-label="Indietro" onClick={() => navigate(-1)}>
          <ChevronLeft size={19} />
        </button>
        <LeagueLink league={league} className="mx-auto flex items-center gap-2 transition-opacity active:opacity-60">
          <LeagueBadge league={league} size={20} />
          <span className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-2)' }}>{league ? league.name : '—'}</span>
        </LeagueLink>
        <button type="button" className="glass press flex h-9 w-9 items-center justify-center rounded-full" aria-label="Condividi" onClick={share}>
          <Share2 size={16} />
        </button>
      </div>

      <div className="glass mt-3 rounded-[28px] px-4 pb-4 pt-5" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${teamColor(home)} 55%, transparent) 0%, transparent 38%, transparent 62%, color-mix(in srgb, ${teamColor(away)} 50%, transparent) 100%), var(--glass-bg)` }}>
        <div className="flex items-start">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <TeamLink team={home} className="flex flex-col items-center gap-2 transition-opacity active:opacity-60">
              <Crest team={home} size={54} />
              <span className="text-center text-[13px] font-semibold leading-tight">{home ? home.name : '—'}</span>
            </TeamLink>
            {!live && !finished ? <FormDots form={teamForm(match.homeId)} size={13} /> : null}
          </div>

          <div className="flex w-[104px] flex-none flex-col items-center pt-3">
            {live || finished ? (
              <span className="title-xl tnum text-[32px]" style={{ color: live ? 'var(--live)' : 'var(--ink)' }}>{score}</span>
            ) : (
              <span className="title-xl tnum text-[30px]">{match.kickoff}</span>
            )}
            {live ? (
              <span className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-bold" style={{ color: 'var(--live)' }}>
                <span className="live-dot" />
                {view.liveHalf ? 'Intervallo' : <>{view.minute}&apos;</>}
              </span>
            ) : (
              <span className="mt-1.5 text-center text-[11px]" style={{ color: 'var(--ink-3)' }}>{statusText}</span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <TeamLink team={away} className="flex flex-col items-center gap-2 transition-opacity active:opacity-60">
              <Crest team={away} size={54} />
              <span className="text-center text-[13px] font-semibold leading-tight">{away ? away.name : '—'}</span>
            </TeamLink>
            {!live && !finished ? <FormDots form={teamForm(match.awayId)} size={13} /> : null}
          </div>
        </div>

        {(live || finished) && (view.events || []).some((e) => e.type === 'goal') ? (
          <div className="mt-1 flex gap-3">
            <div className="min-w-0 flex-1"><Scorers events={view.events} side="home" align="left" /></div>
            <div className="min-w-0 flex-1"><Scorers events={view.events} side="away" align="right" /></div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
