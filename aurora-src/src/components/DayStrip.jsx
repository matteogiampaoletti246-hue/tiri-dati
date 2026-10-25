import { useEffect, useRef } from 'react';
import { dayLabel, MONTHS } from '@/lib/format';

// Giorni come semplice testo da premere, con il giorno scelto sempre al centro.
export default function DayStrip({ dates, todayIndex, value, onChange }) {
  const box = useRef(null);
  const first = useRef(true);
  useEffect(() => {
    const b = box.current;
    const el = b && b.querySelector('[data-active="1"]');
    if (!el) return;
    b.scrollTo({ left: Math.max(0, el.offsetLeft - (b.clientWidth - el.offsetWidth) / 2), behavior: first.current ? 'auto' : 'smooth' });
    first.current = false;
  }, [value]);

  return (
    <div ref={box} className="hide-sb flex items-center gap-6 overflow-x-auto px-5 py-2">
      {dates.map((d, i) => {
        const active = i === value;
        return (
          <button key={d.toISOString()} type="button" data-active={active ? '1' : '0'} onClick={() => onChange(i)} className="press shrink-0 text-left">
            <span
              className="block whitespace-nowrap text-[15px] transition-colors duration-200"
              style={{ color: active ? 'var(--ink)' : 'var(--ink-3)', fontWeight: active ? 800 : 500 }}
            >
              {dayLabel(d, todayIndex, i)}
            </span>
            <span className="block text-[10.5px]" style={{ color: 'var(--ink-3)', opacity: active ? 0.9 : 0.6 }}>
              {d.getDate()} {MONTHS[d.getMonth()]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
