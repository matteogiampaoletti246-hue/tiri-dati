import { useEffect, useRef, useState } from 'react';
import MiniSelect from '@/components/calc/MiniSelect';

// Colore per fascia (90 verde scuro, 75 verde chiaro, 60 giallo, 40 rosso chiaro, sotto rosso), sfumato in modo continuo tra una fascia e l'altra
const STOPS = [[0, '--u-r1'], [40, '--u-r2'], [60, '--u-y'], [75, '--u-g2'], [90, '--u-g1']];
const colorOf = (p) => {
  if (p >= 90) return 'var(--u-g1)';
  let i = 0;
  while (i < STOPS.length - 2 && p >= STOPS[i + 1][0]) i += 1;
  const [a, an] = STOPS[i];
  const [b, bn] = STOPS[i + 1];
  const t = Math.max(0, Math.min(100, ((p - a) / (b - a)) * 100));
  return `color-mix(in srgb, var(${bn}) ${t.toFixed(1)}%, var(${an}))`;
};
const TIMES = [{ value: 't', label: 'Totale' }, { value: '1', label: '1T' }];
const LINES = { t: [2.5, 3.5, 4.5, 5.5, 6.5], 1: [0.5, 1.5, 2.5, 3.5] };
const fmt = (n) => String(n).replace('.', ',');

const SIDES = [{ value: 'o', label: 'Over' }, { value: 'u', label: 'Under' }];
// Over / Under a tasto: la pillola scorre da una parte all'altra
function Seg({ value, onChange, w = 132 }) {
  return (
    <div className="relative flex h-[38px] flex-none rounded-full p-[3px]" style={{ width: w, background: 'var(--hair-2)' }} role="group" aria-label="Over o Under">
      <span className="absolute top-[3px] h-[32px] rounded-full" style={{ width: (w - 6) / 2, left: 3, transform: `translateX(${value === 'o' ? 0 : 100}%)`, background: 'var(--accent)', transition: 'transform .3s cubic-bezier(.22,.8,.24,1)' }} />
      {SIDES.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className="relative z-10 flex-1 rounded-full text-[14px] font-bold" style={{ color: value === o.value ? '#fff' : 'var(--ink-2, var(--ink-3))', transition: 'color .25s' }}>{o.label}</button>
      ))}
    </div>
  );
}

// Over/Under cartellini: % delle gare arbitrate nelle ultime 2 stagioni con meno cartellini della linea, per 1T o totale.
// Percentuale che scorre dal valore mostrato a quello nuovo: numero, barra e colore camminano insieme
function useTween(target, dur = 800) {
  const [v, setV] = useState(0);
  const cur = useRef(0);
  useEffect(() => {
    const from = cur.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      cur.current = from + (target - from) * e;
      setV(cur.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

export default function UnderBar({ games }) {
  const [side, setSide] = useState('u');
  // si parte sempre da Under 2,5 sul 1T; poi si cambia a mano con le tendine
  const [time, setTime] = useState('1');
  const [line, setLine] = useState(2.5);
  const idx = time === 't' ? 8 : 9;
  const rows = (games || []).filter((x) => typeof x[idx] === 'number');
  const changeTime = (v) => { setTime(v); setLine(v === 't' ? 3.5 : 2.5); };
  const lines = LINES[time];
  const ln = lines.includes(line) ? line : lines[Math.min(1, lines.length - 1)];
  const under = rows.filter((x) => (side === 'u' ? x[idx] < ln : x[idx] > ln)).length;
  const pct = rows.length ? Math.round((under / rows.length) * 100) : 0;
  const shown = useTween(pct);
  if (rows.length < 5) return null;
  const col = colorOf(shown);
  return (
    <div className="px-4 py-3.5" style={{ borderTop: '1px solid var(--hair-2)' }} data-no-swipe="true">
      <div className="flex items-center justify-between gap-2">
        <Seg value={side} onChange={setSide} w={124} />
        <div className="flex items-center gap-2">
          <MiniSelect width={92} ariaLabel="Tempo" value={time} options={TIMES} onChange={changeTime} />
          <MiniSelect width={80} ariaLabel="Linea" value={ln} options={lines.map((l) => ({ value: l, label: fmt(l) }))} onChange={(v) => setLine(Number(v))} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="tnum text-[28px] font-extrabold leading-none" style={{ color: col }}>{Math.round(shown)}%</span>
        <span className="tnum text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{under} su {rows.length} gare</span>
      </div>
      <div className="mt-2.5 h-[12px] overflow-hidden rounded-full" style={{ background: 'var(--hair-2)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(shown, 2)}%`, background: col }} />
      </div>
      <div className="tnum mt-1 flex justify-between text-[9.5px]" style={{ color: 'var(--ink-3)' }}><span>0%</span><span>50%</span><span>100%</span></div>
    </div>
  );
}
