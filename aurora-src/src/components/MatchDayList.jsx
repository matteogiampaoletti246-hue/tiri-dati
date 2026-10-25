import MatchRow from './MatchRow';
import { DATES, TODAY_INDEX, isoDate } from '@/data/matches';
import { dayLabel, longDate } from '@/lib/format';

export default function MatchDayList({ matches }) {
  const groups = [];
  matches.forEach((m) => {
    const last = groups[groups.length - 1];
    if (last && last.date === m.date) last.matches.push(m);
    else groups.push({ date: m.date, matches: [m] });
  });

  return (
    <div>
      {groups.map((g) => {
        const idx = DATES.findIndex((d) => isoDate(d) === g.date);
        const date = idx >= 0 ? DATES[idx] : null;
        return (
          <section key={g.date}>
            <div className="flex items-baseline gap-3 px-5 pb-1 pt-5">
              <span className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
                {date ? dayLabel(date, TODAY_INDEX, idx) : g.date}
              </span>
              {date ? (
                <span className="text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
                  {longDate(date)}
                </span>
              ) : null}
              <span className="tnum ml-auto text-[11px]" style={{ color: 'var(--ink-3)' }}>
                {g.matches.length}
              </span>
            </div>
            {g.matches.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
