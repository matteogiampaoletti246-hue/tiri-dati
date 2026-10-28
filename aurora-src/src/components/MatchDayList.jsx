import { useEffect, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import MatchRow from './MatchRow';
import { tintGrad } from '@/lib/tint';
import { DATES, TODAY_INDEX, isoDate } from '@/data/matches';
import { dayLabel, longDate } from '@/lib/format';

const cptOf = () => { try { return 'c'; } catch { return 'a'; } };
const dayHead = (iso) => {
  const idx = DATES.findIndex((d) => isoDate(d) === iso);
  return idx >= 0 ? dayLabel(DATES[idx], TODAY_INDEX, idx) : longDate(new Date(`${iso}T12:00:00`));
};
const shortDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
// numero di giornata: n-esima partita di campionato della squadra (la piu' alta tra le due)
const giornateOf = (all) => {
  const cnt = {};
  const out = {};
  [...all].sort((a, b) => a.ts - b.ts).forEach((m) => {
    cnt[m.homeId] = (cnt[m.homeId] || 0) + 1;
    cnt[m.awayId] = (cnt[m.awayId] || 0) + 1;
    out[m.id] = Math.max(cnt[m.homeId], cnt[m.awayId]);
  });
  return out;
};

// Elenco per giornate di campionato: parte dalla giornata in corso, con il tasto per vedere le precedenti.
export function MatchdayList({ matches, all, tint = null, concept = cptOf() }) {
  const [extra, setExtra] = useState(0);
  const gmap = giornateOf(all);
  const first = [...all].sort((a, b) => a.ts - b.ts).find((m) => m.status !== 'finished');
  const nums = [...new Set(all.map((m) => gmap[m.id]))].sort((a, b) => a - b);
  const cur = first ? gmap[first.id] : nums[nums.length - 1];
  const from = cur - extra;
  const byG = {};
  matches.forEach((m) => { (byG[gmap[m.id]] = byG[gmap[m.id]] || []).push(m); });
  const shownG = Object.keys(byG).map(Number).filter((g) => g >= from).sort((a, b) => a - b);
  const hidden = Object.keys(byG).map(Number).filter((g) => g < from).sort((a, b) => b - a);
  const prev = hidden[0];
  const daysOf = (list) => {
    const out = [];
    [...list].sort((a, b) => a.ts - b.ts).forEach((m) => {
      const l = out[out.length - 1];
      if (l && l.date === m.date) l.matches.push(m); else out.push({ date: m.date, matches: [m] });
    });
    return out;
  };
  const prevBtn = prev ? (
    concept === 'a' ? (
      <button type="button" onClick={() => setExtra(cur - prev)} className="press mx-auto mt-4 flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-bold" style={{ color: 'var(--accent)' }}>
        <ChevronUp size={15} />Giornata {prev}
      </button>
    ) : concept === 'b' ? (
      <button type="button" onClick={() => setExtra(cur - prev)} className="press mx-4 mt-4 flex w-[calc(100%-32px)] items-center justify-center gap-2 rounded-[16px] py-2.5 text-[12.5px] font-bold" style={{ border: '1px dashed var(--hair)', color: 'var(--ink-2)' }}>
        <ChevronUp size={15} />Mostra giornata {prev}
      </button>
    ) : (
      <button type="button" onClick={() => setExtra(cur - prev)} className="glass press mx-auto mt-4 flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold">
        <ChevronUp size={15} />Giornate precedenti
      </button>
    )
  ) : null;

  return (
    <div>
      {prevBtn}
      {shownG.map((g) => {
        const list = byG[g];
        const days = daysOf(list);
        const done = list.filter((m) => m.status === 'finished').length;
        const live = list.some((m) => m.status === 'live');
        const tag = g === cur ? (live ? 'In corso' : done ? 'In corso' : 'Prossima') : g < cur ? 'Conclusa' : 'Prossima';
        const range = days.length > 1 ? `${shortDate(days[0].date)} – ${shortDate(days[days.length - 1].date)}` : shortDate(days[0].date);
        const rows = (d) => d.matches.map((m) => <MatchRow key={m.id} match={m} />);
        if (concept === 'b') {
          return (
            <section key={g}>
              <div className="flex items-center gap-3 px-5 pb-1 pt-7">
                <span className="rounded-full px-2.5 py-[3px] text-[11px] font-extrabold text-white" style={{ background: 'var(--accent)' }}>G{g}</span>
                <h3 className="text-[16px] font-extrabold">Giornata {g}</h3>
                <span className="h-px flex-1" style={{ background: 'var(--hair)' }} />
                <span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{done}/{list.length} giocate</span>
              </div>
              {days.map((d) => (
                <div key={d.date}>
                  <div className="flex items-center gap-2 px-5 pb-0.5 pt-3 text-[11px] font-semibold" style={{ color: 'var(--ink-3)' }}>
                    <i className="h-[6px] w-[6px] rounded-full" style={{ background: 'var(--accent)' }} />{dayHead(d.date)}
                  </div>
                  {rows(d)}
                </div>
              ))}
            </section>
          );
        }
        if (concept === 'c') {
          return (
            <section key={g} className="glass mx-4 mt-5 overflow-hidden rounded-[24px] pb-1" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 420px', ...(tint ? { background: tintGrad(tint, 0x45) } : null) }}>
              <div className="flex items-center gap-2 px-4 pb-1 pt-3.5">
                <h3 className="text-[15px] font-extrabold">Giornata {g}</h3>
                <span className="rounded-full px-2 py-[2px] text-[9.5px] font-extrabold uppercase tracking-wider" style={{ background: tag === 'Conclusa' ? 'var(--hair-2)' : 'var(--accent-soft)', color: tag === 'Conclusa' ? 'var(--ink-3)' : 'var(--accent)' }}>{tag}</span>
                <span className="ml-auto text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{range}</span>
              </div>
              {days.map((d) => (
                <div key={d.date}>
                  <div className="px-4 pb-0.5 pt-2.5 text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)', borderTop: '1px solid var(--hair-2)' }}>{dayHead(d.date)}</div>
                  {rows(d)}
                </div>
              ))}
            </section>
          );
        }
        return (
          <section key={g}>
            <div className="flex items-end justify-between px-5 pb-0.5 pt-7">
              <h3 className="text-[23px] font-extrabold tracking-tight">Giornata {g}</h3>
              <span className="pb-1 text-[11px]" style={{ color: 'var(--ink-3)' }}>{range}</span>
            </div>
            {days.map((d) => (
              <div key={d.date}>
                <div className="px-5 pb-0.5 pt-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{dayHead(d.date)}</div>
                {rows(d)}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

// focusToday: di norma l'elenco parte dall'inizio; lo scorrimento automatico alla prima partita da giocare e' solo su richiesta
export default function MatchDayList({ matches, focusToday = false, teamId = null }) {
  const ref = useRef(null);
  const todayIso = isoDate(DATES[TODAY_INDEX]);
  const firstId = (matches.find((m) => m.date >= todayIso) || {}).id;
  // si porta alla prima partita da giocare solo quando l'elenco e' davvero sullo schermo (le schede vicine, gia' pronte e nascoste, non devono muovere la pagina)
  useEffect(() => {
    if (!focusToday || !ref.current) return undefined;
    const root = ref.current;
    let done = false;
    const shown = () => {
      const r = root.getBoundingClientRect();
      return r.width > 0 && r.left > -5 && r.left < window.innerWidth - 5 && getComputedStyle(root).visibility !== 'hidden';
    };
    const go = () => {
      if (done || !shown()) return;
      done = true;
      const el = root.querySelector('[data-focus="1"]');
      if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 120), behavior: 'auto' });
    };
    go();
    window.addEventListener('sl-tab-shown', go);
    return () => window.removeEventListener('sl-tab-shown', go);
  }, [matches.length, focusToday]);

  const groups = [];
  [...matches].sort((a, b) => a.ts - b.ts).forEach((m) => {
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
                {date ? dayLabel(date, TODAY_INDEX, idx) : longDate(new Date(`${g.date}T12:00:00`))}
              </span>
              {date ? (
                <span className="text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
                  {longDate(date)}
                </span>
              ) : null}
            </div>
            {g.matches.map((m) => (
              <MatchRow key={m.id} match={m} teamId={teamId} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
