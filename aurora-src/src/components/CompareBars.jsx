import { useEffect, useRef, useState } from 'react';

// Movimento delle barre quando cambiano i valori (Totale / 1° tempo / 2° tempo):
// a = scivola morbida, b = elastica con leggero rimbalzo e partenza a cascata, c = lenta con numeri che scorrono.
const MOVE = {
  a: { dur: 620, ease: 'cubic-bezier(.22,1,.36,1)', step: 0, count: false },
  b: { dur: 820, ease: 'cubic-bezier(.34,1.56,.64,1)', step: 45, count: false },
  c: { dur: 950, ease: 'cubic-bezier(.65,0,.35,1)', step: 30, count: true },
};

// numero che scorre dal valore precedente a quello nuovo (solo concept c)
function Num({ value, fmt, tween }) {
  const [v, setV] = useState(value);
  const cur = useRef(value);
  useEffect(() => {
    const from = cur.current;
    const to = value;
    if (!tween || typeof to !== 'number' || typeof from !== 'number' || from === to) { cur.current = to; setV(to); return undefined; }
    const whole = Number.isInteger(from) && Number.isInteger(to);
    let raf = 0;
    let t0 = 0;
    const step = (t) => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / 800);
      const e = 1 - (1 - k) ** 3;
      const x = from + (to - from) * e;
      cur.current = x;
      setV(whole ? Math.round(x) : x);
      if (k < 1) raf = requestAnimationFrame(step); else { cur.current = to; setV(to); }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, tween]);
  return <>{fmt(v)}</>;
}

// Confronto squadra / squadra. Chi ha il valore più alto è in colore pieno, l'altra sbiadita.
// variant: a = barre dal centro, b = barra unica divisa, c = numeri con linee sottili.
export default function CompareBars({ rows, homeColor = 'var(--accent)', awayColor = 'var(--live)', format = (v) => v, variant = 'a', motion = 'a' }) {
  // d = stile delle statistiche partita: numeri neri, nome al centro, barra divisa azzurra / grigia (chi ha di piu' e' in evidenza)
  if (variant === 'd') {
    const mv = MOVE[motion] || MOVE.a;
    return (
      <div className="flex flex-col">
        {rows.map((row, idx) => {
          const na = Math.abs(row.home || 0);
          const nb = Math.abs(row.away || 0);
          const tot = na + nb;
          const pa = tot > 0 ? (na / tot) * 100 : 50;
          const fmt = row.format || format;
          const delay = idx * mv.step;
          const tr = `width ${mv.dur}ms ${mv.ease} ${delay}ms, opacity .45s ease ${delay}ms`;
          return (
            <div key={row.label} className="py-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="tnum font-bold">{row.homeText ?? <Num value={row.home} fmt={fmt} tween={mv.count} />}</span>
                <span className="px-2 text-center text-[12px]" style={{ color: 'var(--ink-2)' }}>{row.label}</span>
                <span className="tnum font-bold">{row.awayText ?? <Num value={row.away} fmt={fmt} tween={mv.count} />}</span>
              </div>
              <div className="mt-1 flex h-[4px] gap-[3px] overflow-hidden rounded-full">
                <span style={{ width: `${pa}%`, minWidth: 0, background: 'var(--accent)', opacity: na >= nb ? 1 : 0.45, borderRadius: 4, transition: tr }} />
                <span style={{ flex: '1 1 0%', minWidth: 0, background: 'var(--ink-2)', opacity: nb >= na ? 0.9 : 0.35, borderRadius: 4, transition: `opacity .45s ease ${delay}ms` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {rows.map((row) => {
        const h = Math.abs(row.home || 0);
        const a = Math.abs(row.away || 0);
        const max = Math.max(h, a) || 1;
        const tot = h + a || 1;
        const fmt = row.format || format;
        const hw = h > a ? 1 : h === a ? 1 : 0.38;
        const aw = a > h ? 1 : h === a ? 1 : 0.38;
        const ht = row.homeText ?? fmt(row.home);
        const at = row.awayText ?? fmt(row.away);
        const head = (
          <div className="flex items-baseline gap-2">
            <span className="tnum text-[14.5px] font-extrabold" style={{ color: homeColor, opacity: hw }}>{ht}</span>
            <span className="mx-auto truncate text-center text-[12px]" style={{ color: 'var(--ink-3)' }}>{row.label}</span>
            <span className="tnum text-[14.5px] font-extrabold" style={{ color: awayColor, opacity: aw }}>{at}</span>
          </div>
        );
        if (variant === 'b') {
          return (
            <div key={row.label}>
              {head}
              <div className="mt-2 flex h-[8px] w-full gap-[3px]">
                <span className="h-full rounded-l-full rounded-r-[3px] transition-[width] duration-700" style={{ width: `${(h / tot) * 100}%`, background: homeColor, opacity: hw }} />
                <span className="h-full flex-1 rounded-l-[3px] rounded-r-full" style={{ background: awayColor, opacity: aw }} />
              </div>
            </div>
          );
        }
        if (variant === 'c') {
          return (
            <div key={row.label}>
              <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
                <span className="tnum text-[17px] font-extrabold" style={{ color: homeColor, opacity: hw }}>{ht}</span>
                <span className="text-center text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{row.label}</span>
                <span className="tnum text-right text-[17px] font-extrabold" style={{ color: awayColor, opacity: aw }}>{at}</span>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <span className="h-[2px] justify-self-end rounded-full" style={{ width: `${(h / max) * 100}%`, background: homeColor, opacity: hw }} />
                <span className="h-[2px] rounded-full" style={{ width: `${(a / max) * 100}%`, background: awayColor, opacity: aw }} />
              </div>
            </div>
          );
        }
        const lw = (h / max) * 50;
        const rw = (a / max) * 50;
        return (
          <div key={row.label}>
            {head}
            <div className="mt-2 flex h-[5px] w-full overflow-hidden rounded-full" style={{ background: 'var(--hair-2)' }}>
              <span className="h-full rounded-full transition-[width,margin] duration-700 ease-out" style={{ width: `${lw}%`, marginLeft: `${50 - lw}%`, background: homeColor, opacity: hw }} />
              <span className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${rw}%`, background: awayColor, opacity: aw }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
