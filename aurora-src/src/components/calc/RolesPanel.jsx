import { useEffect, useState } from 'react';
import TintSweep, { ringStyle } from './TintSweep';
import PanelTitle from '@/components/PanelTitle';

// Ruoli avversari (concept A): una riga per ruolo con barra che si carica a cascata, falli, % sui falli del giocatore (in evidenza)
// e % sui falli totali di quel ruolo. I ruoli principali (primo, e secondo se dista al massimo 5 punti) sono in oro.
const pct = (v) => `${Math.round(v)}%`;

function useCount(target, delay, key) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    let t0 = 0;
    const tm = setTimeout(() => {
      const step = (now) => {
        if (!t0) t0 = now;
        const k = Math.min(1, (now - t0) / 700);
        setV(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    setV(0);
    return () => { clearTimeout(tm); cancelAnimationFrame(raf); };
  }, [target, delay, key]);
  return v;
}

function Row({ row, i, max, gold, run }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    setGo(false);
    const id = setTimeout(() => setGo(true), 40 + i * 90);
    return () => clearTimeout(id);
  }, [run, i]);
  const n = useCount(row.n, i * 90, run);
  const p = useCount(row.pct, i * 90, run);
  const rp = useCount(row.rolePct, i * 90, run);
  const col = gold ? 'var(--gold)' : 'var(--accent)';
  return (
    <div className="grid items-center gap-2 px-4" style={{ gridTemplateColumns: '46px 1fr 28px 44px 46px', height: 38 }}>
      <span className="rounded-md py-1 text-center text-[12.5px] font-extrabold" style={{ background: gold ? 'color-mix(in srgb, var(--gold) 18%, transparent)' : 'color-mix(in srgb, var(--accent) 16%, transparent)', color: col }}>{row.role}</span>
      <span className="h-[9px] overflow-hidden rounded-[3px]" style={{ background: 'var(--hair-2)' }}>
        <span className="block h-full rounded-[3px]" style={{ width: go ? `${Math.max(3, (row.pct / max) * 100)}%` : '0%', background: col, transition: 'width .75s cubic-bezier(.2,.8,.2,1)' }} />
      </span>
      <span className="tnum text-right text-[14px] font-extrabold">{Math.round(n)}</span>
      <span className="tnum text-right text-[14px] font-extrabold" style={{ color: gold ? 'var(--gold)' : 'var(--ink)' }}>{pct(p)}</span>
      <span className="tnum text-right text-[12.5px]" style={{ color: 'var(--ink-3)' }}>{pct(rp)}</span>
    </div>
  );
}

export default function RolesPanel({ rb, title, tint, runKey }) {
  if (!rb || !rb.rows.length) return null;
  const max = rb.rows[0].pct;
  return (
    <section>
      <PanelTitle>{title}</PanelTitle>
      <div className="panel has-tint overflow-hidden pb-2" style={ringStyle(tint)}>
        <TintSweep tint={tint} />
        <div className="grid gap-2 px-4 pb-1.5 pt-3 text-[11px] font-bold" style={{ gridTemplateColumns: '46px 1fr 28px 44px 46px', color: 'var(--ink-3)' }}>
          <span>Ruolo</span><span />
          <span className="text-right">Falli</span><span className="text-right">% tot.</span><span className="text-right">% ruolo</span>
        </div>
        {rb.rows.map((r, i) => <Row key={r.role} row={r} i={i} max={max} gold={rb.main.includes(r.role)} run={runKey} />)}
      </div>
    </section>
  );
}
