import Crest from '@/components/Crest';
import FormDots from '@/components/FormDots';
import InfoBand from '@/components/InfoBand';
import ResultRow from '@/components/ResultRow';
import PanelTitle from '@/components/PanelTitle';
import TeamLink from '@/components/TeamLink';
import MatchKeyNumbers from '@/components/match/MatchKeyNumbers';
import { headToHead, h2hSummary, recentMatches } from '@/data/extras';
import { teamForm } from '@/data/matches';

export default function MatchOverviewPanel({ match, home, away }) {
  const h2h = headToHead(match.homeId, match.awayId, 5);
  const sum = h2hSummary(match.homeId, match.awayId);

  return (
    <div className="flex flex-col gap-7 pt-2">
      <section className="px-5">
        <PanelTitle>Forma recente</PanelTitle>
        <div className="panel-solid px-4 py-4">
          {[
            { team: home, form: teamForm(match.homeId) },
            { team: away, form: teamForm(match.awayId) },
          ].map(({ team, form }, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <TeamLink team={team} className="flex min-w-0 items-center gap-3 transition-opacity active:opacity-60">
                <Crest team={team} size={24} />
                <span className="truncate text-[13px]" style={{ color: 'var(--ink)' }}>
                  {team ? team.name : '—'}
                </span>
              </TeamLink>
              <span className="ml-auto">
                <FormDots form={form} size={15} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5">
        <PanelTitle>Precedenti</PanelTitle>
        <div className="tnum mb-3 flex items-center gap-4 text-[12px]" style={{ color: 'var(--ink-2)' }}>
          <span>
            {sum.a} {home ? home.short : ''}
          </span>
          <span style={{ color: 'var(--ink-3)' }}>{sum.d} pareggi</span>
          <span>
            {sum.b} {away ? away.short : ''}
          </span>
        </div>
        <div className="panel-solid px-4 py-1">
          {h2h.length ? (
            h2h.map((m, i) => <ResultRow key={m.id} match={m} teamId={match.homeId} divider={i > 0} />)
          ) : (
            <p className="py-4 text-center text-[12px]" style={{ color: 'var(--ink-3)' }}>
              Nessun precedente disponibile in questa stagione
            </p>
          )}
        </div>
      </section>

      <section className="px-5">
        <PanelTitle>Ultime gare</PanelTitle>
        <div className="panel-solid px-4 py-1">
          {recentMatches(match.homeId, 3).map((m, i) => (
            <ResultRow key={m.id} match={m} teamId={match.homeId} divider={i > 0} />
          ))}
          {recentMatches(match.awayId, 3).map((m, i) => (
            <ResultRow key={m.id} match={m} teamId={match.awayId} divider />
          ))}
        </div>
      </section>

      <section className="px-5">
        <PanelTitle>Numeri da tenere d&apos;occhio</PanelTitle>
      </section>
      <MatchKeyNumbers match={match} />

      <InfoBand match={match} />
    </div>
  );
}
