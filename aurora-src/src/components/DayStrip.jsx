import { useEffect, useRef } from 'react';
import { CalendarDays } from 'lucide-react';
import { dayLabel, MONTHS } from '@/lib/format';

// Giorni come semplice testo da premere: nessun riquadro. Il giorno attivo è più chiaro e in grassetto.
export default function DayStrip({ dates, todayIndex, value, onChange }) {
  const box = useRef(null);
  useEffect(() => {
    const el = box.current && box.current.querySelector('[data-active="1"]');
    if (el && box.current) box.current.scrollTo({ left: Math.max(0, el.offsetLeft - 24), behavior: 'smooth' });
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
      <label className="icon-btn relative shrink-0" aria-label="Calendario">
        <CalendarDays size={16} strokeWidth={1.6} />
        <input type="date" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={pickDate} aria-label="Scegli data" />
      </label>
    </div>
  );
}
