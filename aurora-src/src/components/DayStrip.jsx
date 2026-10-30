import { useEffect, useLayoutEffect, useRef } from 'react';
import { dayLabel, MONTHS } from '@/lib/format';

// Mentre si fa lo swipe laterale la striscia dei giorni segue il dito: scorre e sfuma da un giorno all'altro in modo continuo.
// Chi muove la pagina (Home, Migliori giocatori/matchup) chiama dragDays(frazione): da -1 (giorno prima) a +1 (giorno dopo).
export const dragDays = (frac, smooth = false) => {
  try { window.dispatchEvent(new CustomEvent('sl-daydrag', { detail: { frac, smooth } })); } catch (e) { /* ignore */ }
};

// Giorni come semplice testo da premere, con il giorno scelto sempre al centro.
export default function DayStrip({ dates, todayIndex, value, onChange }) {
  const box = useRef(null);
  const first = useRef(true);
  // posizioni dei giorni misurate una volta (non cambiano): niente misura forzata del layout a ogni swipe e a ogni fotogramma
  const geo = useRef(null);
  useEffect(() => {
    const drop = () => { geo.current = null; };
    window.addEventListener('resize', drop);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drop).catch(() => {});
    return () => window.removeEventListener('resize', drop);
  }, []);
  const centered = (b, el) => {
    let g = geo.current;
    if (!g || g.n !== b.childElementCount) {
      g = { n: b.childElementCount, w: b.clientWidth, m: new Map() };
      b.querySelectorAll('[data-i]').forEach((x) => g.m.set(x, [x.offsetLeft, x.offsetWidth]));
      geo.current = g;
    }
    const m = g.m.get(el) || [el.offsetLeft, el.offsetWidth];
    return Math.max(0, m[0] - (g.w - m[1]) / 2);
  };
  const reset = (b) => b.querySelectorAll('[data-i]').forEach((x) => {
    x.style.transition = '';
    x.style.setProperty('--m', x.dataset.active === '1' ? '100%' : '0%');
    x.style.setProperty('--w', x.dataset.active === '1' ? '800' : '500');
  });
  // prima del disegno: tornando sulla Home il giorno scelto e' gia' al centro (niente "Gio 22" che poi scorre a "Oggi")
  useLayoutEffect(() => {
    const b = box.current;
    const el = b && b.querySelector('[data-active="1"]');
    if (!el) return;
    reset(b);
    b.scrollTo({ left: centered(b, el), behavior: first.current ? 'auto' : 'smooth' });
    first.current = false;
  }, [value]);

  useEffect(() => {
    const b = box.current;
    if (!b) return undefined;
    const on = (e) => {
      const { frac, smooth } = e.detail || {};
      const a = b.querySelector('[data-active="1"]');
      if (!a) return;
      const items = [...b.querySelectorAll('[data-i]')];
      const ai = items.indexOf(a);
      const f = Math.max(-1, Math.min(1, frac || 0));
      const n = items[ai + (f > 0 ? 1 : -1)];
      const af = Math.abs(f);
      const base = centered(b, a);
      const left = n && af ? base + (centered(b, n) - base) * af : base;
      b.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
      const tr = smooth ? 'none' : '';
      items.forEach((x) => { x.style.transition = tr; });
      a.style.setProperty('--m', `${Math.round((1 - af) * 100)}%`);
      a.style.setProperty('--w', String(Math.round(800 - 300 * af)));
      if (n && af) { n.style.setProperty('--m', `${Math.round(af * 100)}%`); n.style.setProperty('--w', String(Math.round(500 + 300 * af))); }
    };
    window.addEventListener('sl-daydrag', on);
    return () => window.removeEventListener('sl-daydrag', on);
  }, []);

  return (
    <div ref={box} data-no-swipe className="hide-sb flex items-center gap-6 overflow-x-auto px-5 py-2">
      {dates.map((d, i) => {
        const active = i === value;
        return (
          <button key={d.toISOString()} type="button" data-i={i} data-active={active ? '1' : '0'} onClick={() => onChange(i)} className="press shrink-0 text-left" style={{ '--m': active ? '100%' : '0%', '--w': active ? 800 : 500 }}>
            <span className="block whitespace-nowrap text-[15px]" style={{ color: 'color-mix(in srgb, var(--ink) var(--m), var(--ink-3))', fontWeight: 'var(--w)' }}>
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
