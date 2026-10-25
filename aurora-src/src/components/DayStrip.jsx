import { useEffect, useRef } from 'react';
import { CalendarDays } from 'lucide-react';
import { dayLabel } from '@/lib/format';

export default function DayStrip({ dates, todayIndex, value, onChange }) {
  const box = useRef(null);
  useEffect(() => {
    const el = box.current && box.current.querySelector('[data-active="1"]');
    if (el && box.current) box.current.scrollTo({ left: Math.max(0, el.offsetLeft - 24), behavior: 'auto' });
  }, [value]);

  const pickDate = (e) => {
    const d = new Date(`${e.target.value}T00:00:00`);
    const idx = dates.findIndex((x) => x.toDateString() === d.toDateString());
    if (idx >= 0) onChange(idx);
  };

  return (
    <div ref={box} className="hide-sb flex items-center gap-6 overflow-x-auto px-5 py-2">
      {dates.map((d, i) => {
        const active = i === value;
        return (
          <button
            key={d.toISOString()}
            type="button"
            data-active={active ? '1' : '0'}
            onClick={() => onChange(i)}
            className="relative shrink-0 pb-1.5 text-[14px] transition-colors duration-300"
            style={{ color: active ? 'var(--ink)' : 'var(--ink-3)', fontWeight: active ? 600 : 400 }}
          >
            {dayLabel(d, todayIndex, i)}
            <span
              className="absolute inset-x-0 -bottom-0.5 mx-auto h-px rounded-full transition-all duration-300"
              style={{ background: active ? 'var(--accent)' : 'transparent', width: active ? '70%' : '0%' }}
            />
          </button>
        );
      })}
      <label className="icon-btn relative shrink-0 pb-1.5" aria-label="Calendario">
        <CalendarDays size={16} strokeWidth={1.3} />
        <input
          type="date"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={pickDate}
          aria-label="Scegli data"
        />
      </label>
    </div>
  );
}
