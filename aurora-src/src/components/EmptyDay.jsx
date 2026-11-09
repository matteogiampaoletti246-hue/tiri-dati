import { CalendarX, ChevronRight } from 'lucide-react';
import { dayLabel, MONTHS, WEEKDAYS_LONG } from '@/lib/format';

// Giorno senza risultati (Empty State B): riquadro tratteggiato, icona, e il prossimo giorno con risultati con la freccia che ci porta.
// next: { i, date, n } oppure null. noun: parola al singolare/plurale per il conteggio.
export default function EmptyDay({ date, index, todayIndex = 0, title, next, onGo, noun = ['risultato', 'risultati'] }) {
  const lab = dayLabel(date, todayIndex, index);
  const base = title || 'Niente';
  const tit = /^(Oggi|Ieri|Domani)$/.test(lab) ? `${base} ${lab.toLowerCase()}` : `${base} ${lab}`;
  const nl = next ? dayLabel(next.date, todayIndex, next.i) : '';
  return (
    <div className="empty-day mx-4 mt-3 flex flex-col items-center rounded-[24px] px-5 py-9 text-center">
      <span className="empty-well mb-3 grid h-14 w-14 place-items-center rounded-[18px]">
        <CalendarX size={26} strokeWidth={1.8} style={{ color: 'var(--ink-2)' }} />
      </span>
      <p className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>{tit}</p>
      {next ? (
        <>
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
            Prossimi risultati: {/^(Oggi|Domani)$/.test(nl) ? nl.toLowerCase() : WEEKDAYS_LONG[next.date.getDay()].toLowerCase()} {next.date.getDate()} {MONTHS[next.date.getMonth()]} · {next.n} {next.n === 1 ? noun[0] : noun[1]}
          </p>
          <button type="button" onClick={() => onGo(next.i)} className="empty-go mt-4 inline-flex items-center gap-1 rounded-full px-4 py-2 text-[13px] font-semibold active:opacity-80">
            {nl}
            <ChevronRight size={15} strokeWidth={2.4} />
          </button>
        </>
      ) : (
        <p className="mt-1 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>Nessun risultato nei prossimi giorni</p>
      )}
    </div>
  );
}

// primo giorno dopo `from` (entro `max` giorni) con almeno un risultato secondo count(i)
export function nextWith(from, total, dates, count, max = 21) {
  for (let i = from + 1; i < Math.min(total, from + 1 + max); i++) {
    const n = count(i);
    if (n) return { i, date: dates[i], n };
  }
  return null;
}
