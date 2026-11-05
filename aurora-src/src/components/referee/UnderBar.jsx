import { useState } from 'react';
import MiniSelect from '@/components/calc/MiniSelect';

// Colore per fascia: oltre 90% verde scuro, 75% verde chiaro, 60% giallo, 40% rosso chiaro, sotto 40% rosso.
const colorOf = (p) => (p >= 90 ? 'var(--u-g1)' : p >= 75 ? 'var(--u-g2)' : p >= 60 ? 'var(--u-y)' : p >= 40 ? 'var(--u-r2)' : 'var(--u-r1)');
const TIMES = [{ value: 't', label: 'Totale' }, { value: '1', label: '1T' }];
const LINES = { t: [2.5, 3.5, 4.5, 5.5, 6.5], 1: [0.5, 1.5, 2.5, 3.5] };
const fmt = (n) => String(n).replace('.', ',');

// Under cartellini: % delle gare arbitrate nelle ultime 2 stagioni con meno cartellini della linea, per 1T o totale.
export default function UnderBar({ games }) {
  // si parte sempre da Under 2,5 sul 1T; poi si cambia a mano con le tendine
  const [time, setTime] = useState('1');
  const [line, setLine] = useState(2.5);
  const idx = time === 't' ? 8 : 9;
  const rows = (games || []).filter((x) => typeof x[idx] === 'number');
  if (rows.length < 5) return null;
  const lines = LINES[time];
  const ln = lines.includes(line) ? line : lines[Math.min(1, lines.length - 1)];
  const under = rows.filter((x) => x[idx] < ln).length;
  const pct = Math.round((under / rows.length) * 100);
  const col = colorOf(pct);
  return (
    <div className="px-4 py-3.5" style={{ borderTop: '1px solid var(--hair-2)' }} data-no-swipe="true">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Under cartellini</p>
        <div className="flex items-center gap-2">
          <MiniSelect width={96} ariaLabel="Tempo" value={time} options={TIMES} onChange={(v) => { setTime(v); setLine(v === 't' ? 3.5 : 2.5); }} />
          <MiniSelect width={88} ariaLabel="Linea" value={ln} options={lines.map((l) => ({ value: l, label: fmt(l) }))} onChange={(v) => setLine(Number(v))} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="tnum text-[28px] font-extrabold leading-none" style={{ color: col, transition: 'color .6s' }}>{pct}%</span>
        <span className="tnum text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{under} su {rows.length} gare</span>
      </div>
      <div className="mt-2.5 h-[12px] overflow-hidden rounded-full" style={{ background: 'var(--hair-2)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: col, transition: 'width .9s cubic-bezier(.22,.8,.24,1), background-color .6s' }} />
      </div>
      <div className="tnum mt-1 flex justify-between text-[9.5px]" style={{ color: 'var(--ink-3)' }}><span>0%</span><span>50%</span><span>100%</span></div>
    </div>
  );
}
