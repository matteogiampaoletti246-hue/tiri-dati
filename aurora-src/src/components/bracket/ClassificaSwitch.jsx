import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { useSel } from '@/components/past/PastBits';
import Bracket from '@/components/bracket/Bracket';
import { hasCup, peekBracket, loadBracket } from '@/data/bracket';

// Classifica | Tabellone: scorrimento con profondita' (la vista che esce si rimpicciolisce e sfuma verso sinistra,
// quella che entra arriva da destra). Tutto e' guidato da un solo valore 0..1 calcolato a ogni fotogramma.
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - ((-2 * x + 2) ** 3) / 2);
const OPTS = ['Classifica', 'Tabellone'];

export default function ClassificaSwitch({ fm, sk, children }) {
  const A = useRef(null); const Bv = useRef(null);
  const box = useRef(null); const ind = useRef(null); const btn = useRef([]);
  const [view0, setView] = useSel(`lg-${fm}`, `vw-${sk}`, 0);
  // il Tabellone c'e' solo se la stagione ha turni a eliminazione (mai "nessun dato"): finche' non si sa, la riga resta com'e'
  const pk = sk ? peekBracket(fm, sk) : null;
  const [rounds, setRounds] = useState(() => (pk ? pk.rounds.length : null));
  useEffect(() => {
    if (!hasCup(fm) || !sk) return undefined;
    let on = true;
    loadBracket(fm, sk).then((d) => on && setRounds(d && d.rounds ? d.rounds.length : 0)).catch(() => on && setRounds(0));
    return () => { on = false; };
  }, [fm, sk]);
  const noB = rounds === 0 || !sk;
  const view = noB ? 0 : view0;
  const S = useRef(view); const raf = useRef(0);

  const paint = (s) => {
    const a = A.current; const b = Bv.current;
    if (a) {
      a.style.display = s >= 1 ? 'none' : '';
      a.style.transform = `translate3d(${(-s * 130).toFixed(2)}px,0,0) scale(${(1 - 0.06 * s).toFixed(4)})`;
      a.style.opacity = String(clamp(1 - s * 1.3));
    }
    if (b) {
      const w = (box.current && box.current.clientWidth) || 390;
      b.style.display = s <= 0 ? 'none' : '';
      b.style.transform = `translate3d(${((1 - s) * w).toFixed(2)}px,0,0) scale(${(0.95 + 0.05 * s).toFixed(4)})`;
      b.style.opacity = String(clamp(s * 1.6));
    }
    const i = ind.current; const x0 = btn.current[0]; const x1 = btn.current[1];
    if (i && x0 && x1) {
      i.style.width = `${x0.offsetWidth + (x1.offsetWidth - x0.offsetWidth) * s}px`;
      i.style.transform = `translate3d(${x0.offsetLeft + (x1.offsetLeft - x0.offsetLeft) * s}px,0,0)`;
      i.style.opacity = '1';
    }
  };
  useLayoutEffect(() => { paint(S.current); });
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  if (!hasCup(fm) || noB) return children;
  const go = (to) => {
    if (to === view) return;
    setView(to);
    cancelAnimationFrame(raf.current);
    const from = S.current; const t0 = performance.now(); const dur = 800;
    const step = (now) => {
      const k = clamp((now - t0) / dur);
      S.current = from + (to - from) * eIO(k);
      paint(S.current);
      if (k < 1) raf.current = requestAnimationFrame(step); else { S.current = to; paint(to); }
    };
    raf.current = requestAnimationFrame(step);
  };

  return (
    <div>
      <div className="px-4 pt-3">
        <div className="glass-flat relative flex w-fit items-center gap-0.5 rounded-full p-1">
          <span ref={ind} aria-hidden="true" className="absolute left-0 rounded-full" style={{ top: 4, bottom: 4, width: 0, opacity: 0, background: 'var(--pill-active)', boxShadow: 'var(--shadow-2)', willChange: 'transform' }} />
          {OPTS.map((o, i) => (
            <button key={o} ref={(el) => { btn.current[i] = el; }} type="button" onClick={() => go(i)} className="press relative shrink-0 rounded-full px-[14px] py-[6px] text-[12.5px] font-bold">
              <span className="whitespace-nowrap" style={{ color: view === i ? 'var(--ink)' : 'var(--ink-3)', transition: 'color .25s ease' }}>{o}</span>
            </button>
          ))}
        </div>
      </div>
      <div ref={box} className="grid overflow-x-clip" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        <div ref={A} style={{ gridArea: '1 / 1', transformOrigin: 'top center', willChange: 'transform, opacity' }}>{children}</div>
        <div ref={Bv} style={{ gridArea: '1 / 1', transformOrigin: 'top center', display: 'none', willChange: 'transform, opacity' }}>
          <Bracket fm={fm} sk={sk} />
        </div>
      </div>
    </div>
  );
}
