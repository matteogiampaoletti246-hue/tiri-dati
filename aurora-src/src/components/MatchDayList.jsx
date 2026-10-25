import { useEffect, useRef } from 'react';
import MatchRow from './MatchRow';
import { DATES, TODAY_INDEX, isoDate } from '@/data/matches';
import { dayLabel, longDate } from '@/lib/format';

export default function MatchDayList({ matches, focusToday = true }) {
  const ref = useRef(null);
  const todayIso = isoDate(DATES[TODAY_INDEX]);
  const firstId = (matches.find((m) => m.date >= todayIso) || {}).id;
  useEffect(() => {
    if (!focusToday || !ref.current) return;
    const el = ref.current.querySelector('[data-focus="1"]');
    if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 120), behavior: 'auto' });
  }, [matches.length, focusToday]);

  const groups = [];
  matches.forEach((m) => {
    const last = groups[groups.length - 1];
    if (last && last.date === m.date) last.matches.push(m);
    else groups.push({ date: m.date, matches: [m] });
  });

  return (
    <div ref={ref}>
      {groups.map((g) => {
        const idx = DATES.findIndex((d) => isoDate(d) === g.date);
        const date = idx >= 0 ? DATES[idx] : null;
        return (
          <section key={g.date} data-focus={g.matches.some((x) => x.id === firstId) ? '1' : '0'}>
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
