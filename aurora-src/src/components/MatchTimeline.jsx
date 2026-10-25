import { ArrowLeftRight, RectangleVertical, Target, Tv } from 'lucide-react';
import Crest from './Crest';
import TeamLink from './TeamLink';

const ICONS = { goal: Target, yellow: RectangleVertical, red: RectangleVertical, sub: ArrowLeftRight, var: Tv };
const COLORS = {
  goal: 'var(--accent)',
  yellow: '#E2C03C',
  red: 'var(--live)',
  sub: 'var(--ink-3)',
  var: 'var(--ink-3)',
};

const LABELS = { goal: 'Gol', yellow: 'Ammonizione', red: 'Espulsione', sub: 'Sostituzione', var: 'VAR' };

export default function MatchTimeline({ events = [], home, away }) {
  if (!events.length) {
    return (
      <p className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
        Nessun evento
      </p>
    );
  }

  return (
    <div>
      {events.map((e, i) => {
        const Icon = ICONS[e.type] || Target;
        const team = e.team === 'home' ? home : away;
        return (
          <div
            key={`${e.minute}-${e.type}-${i}`}
            className="grid items-start gap-3 px-5 py-2.5"
            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hair-2)', gridTemplateColumns: '38px 18px 1fr' }}
          >
            <span className="tnum text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
              {e.minute}&apos;
            </span>
            <Icon size={15} strokeWidth={1.6} style={{ color: COLORS[e.type] }} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <TeamLink team={team} className="flex flex-none items-center transition-opacity active:opacity-60">
                  <Crest team={team} size={16} />
                </TeamLink>
                <p className="truncate text-[13.5px]" style={{ color: 'var(--ink)' }}>
                  {e.name}
                  {e.pen ? ' (rig.)' : ''}
                  {e.og ? ' (aut.)' : ''}
                </p>
                {e.type === 'goal' && e.score ? (
                  <span className="tnum ml-auto pl-2 text-[12.5px] font-medium" style={{ color: 'var(--ink-2)' }}>
                    {e.score[0]}–{e.score[1]}
                  </span>
                ) : null}
              </div>
              {e.type === 'goal' && e.assist ? (
                <p className="mt-0.5 pl-[24px] text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
                  Assist: {e.assist}
                </p>
              ) : null}
              {e.type === 'sub' && e.inName ? (
                <p className="mt-0.5 pl-[24px] text-[11.5px]" style={{ color: 'var(--good)' }}>
                  {e.inName}
                </p>
              ) : e.type === 'var' ? (
                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  {LABELS.var}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
