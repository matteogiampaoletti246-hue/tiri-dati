import { useModalLock } from '@/lib/modal';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ChevronDown, ListTree, X } from 'lucide-react';

// Classifiche impilate (una per statistica) con il tasto "Vai a" per saltare a quella che serve.
// sections: [{ id, group, title, rows: [{ id, to, left, name, sub, value }] }]
export default function StatLists({ sections, controls = null, limit = 8 }) {
  const [sheet, setSheet] = useState(false);
  useModalLock(sheet);
  const [open, setOpen] = useState({});
  const [rev, setRev] = useState({});
  const concept = 'b';
  // "Vai a" e' fisso sullo schermo (non appiccicoso): non puo' quindi muoversi mentre si scorre. Si vede solo se questo elenco e' sullo schermo.
  const rootRef = useRef(null);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    let raf = 0;
    const check = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const ok = r.width > 0 && r.left > -40 && r.left < window.innerWidth - 40 && r.bottom > 140 && r.top < window.innerHeight && getComputedStyle(el).visibility !== 'hidden';
      setOnScreen((v) => (v === ok ? v : ok));
    };
    const sched = () => { if (!raf) raf = requestAnimationFrame(check); };
    // mentre il dito e' sullo schermo (swipe tra schede o pagine) si controlla a ogni fotogramma: il tasto compare e sparisce subito
    let loop = 0;
    let until = 0;
    const tick = () => {
      check();
      loop = Date.now() < until ? requestAnimationFrame(tick) : 0;
    };
    const run = (ms) => { until = Math.max(until, Date.now() + ms); if (!loop) loop = requestAnimationFrame(tick); };
    const onTouchStart = () => run(60000);
    const onTouchEnd = () => { until = Date.now() + 700; run(700); };
    const onShown = () => { check(); run(450); };
    check();
    window.addEventListener('scroll', sched, { passive: true });
    window.addEventListener('resize', sched);
    window.addEventListener('sl-tab-shown', onShown);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
    const iv = setInterval(sched, 1000);
    run(600);
    return () => {
      cancelAnimationFrame(raf); cancelAnimationFrame(loop); clearInterval(iv);
      window.removeEventListener('scroll', sched); window.removeEventListener('resize', sched); window.removeEventListener('sl-tab-shown', onShown);
      document.removeEventListener('touchstart', onTouchStart); document.removeEventListener('touchend', onTouchEnd); document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);
  // le classifiche si disegnano a blocchi: all'apertura (e durante lo swipe) ne servono poche, le altre arrivano a app ferma
  const [lim, setLim] = useState(4);
  useEffect(() => {
    if (lim >= sections.length) return undefined;
    const id = setTimeout(() => setLim((n) => n + 3), document.documentElement.dataset.tch ? 400 : 160);
    return () => clearTimeout(id);
  }, [lim, sections.length]);
  const groups = [];
  sections.forEach((s) => {
    let g = groups.find((x) => x.name === s.group);
    if (!g) groups.push((g = { name: s.group, items: [] }));
    g.items.push(s);
  });

  useEffect(() => {
    if (!sheet) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [sheet]);

  const go = (id) => {
    setSheet(false);
    setTimeout(() => {
      const el = document.getElementById(`st-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  return (
    <div ref={rootRef} className="pb-6 pt-2">
      <div className="flex items-center gap-3 px-4">
        <div className="min-w-0 flex-1">{controls}</div>
        <span aria-hidden="true" className="h-[38px] w-[78px] shrink-0" />
      </div>

      {sections.slice(0, lim).map((s) => {
        const all = !!open[s.id];
        const r0 = !!rev[s.id];
        const flip = () => setRev({ ...rev, [s.id]: !r0 });
        const ordered = r0 ? [...s.rows].reverse() : s.rows;
        const rows = all ? ordered : ordered.slice(0, limit);
        const arrow = r0 ? '↑' : '↓';
        return (
          <section key={s.id} id={`st-${s.id}`} className="glass mx-4 mt-4 overflow-hidden rounded-[24px]" style={{ scrollMarginTop: 150, contain: 'layout paint' }}>
            <div className="flex items-baseline justify-between px-4 pb-2 pt-3.5">
              {concept === 'a' ? (
                <button type="button" onClick={flip} className="press text-left text-[12.5px] font-extrabold uppercase tracking-wider"><h3 className="inline">{s.title}</h3> <span style={{ color: 'var(--accent)' }}>{arrow}</span></button>
              ) : <h3 className="text-[12.5px] font-extrabold uppercase tracking-wider">{s.title}</h3>}
              {concept === 'b' ? (
                <button type="button" onClick={flip} className="press text-[10.5px] font-bold" style={{ color: 'var(--accent)' }}>{r0 ? 'Dal peggiore' : 'Dal migliore'} {arrow}</button>
              ) : <span className="text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{s.group}</span>}
            </div>
            {rows.map((r, i) => {
              const inner = (
                <>
                  <span
                    className="tnum w-[22px] shrink-0 text-[11.5px]"
                    style={{ color: concept === 'c' ? 'var(--accent)' : 'var(--ink-3)' }}
                    onClick={concept === 'c' ? (e) => { e.preventDefault(); e.stopPropagation(); flip(); } : undefined}
                  >{r0 ? s.rows.length - i : i + 1}{concept === 'c' && i === 0 ? <span className="text-[8px]">{arrow}</span> : null}</span>
                  {r.left}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold">{r.name}</span>
                    {r.sub ? <span className="block truncate text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{r.sub}</span> : null}
                  </span>
                  {r.color ? (
                    <span className="flex flex-col items-end gap-[3px]">
                      <span className="tnum text-[14.5px] font-extrabold">{r.value}</span>
                      <span className="h-[3px] w-full min-w-[26px] rounded-full" style={{ background: r.color }} />
                    </span>
                  ) : <span className="tnum text-[14.5px] font-extrabold">{r.value}</span>}
                </>
              );
              const cls = 'press flex items-center gap-3 px-4 py-2.5';
              const st = r.bg ? { background: r.bg, borderRadius: 16, margin: '0 8px 6px' } : { borderTop: '1px solid var(--hair-2)' };
              return r.to ? (
                <Link key={r.id} to={r.to} className={cls} style={st}>{inner}</Link>
              ) : (
                <div key={r.id} className={cls} style={st}>{inner}</div>
              );
            })}
            {s.rows.length > limit ? (
              <button
                type="button"
                onClick={() => setOpen({ ...open, [s.id]: !all })}
                className="press flex w-full items-center justify-center gap-1 py-3 text-[12px] font-bold"
                style={{ borderTop: '1px solid var(--hair-2)', color: 'var(--accent)' }}
              >
                {all ? 'Mostra meno' : `Mostra tutti (${s.rows.length})`}
                <ChevronDown size={14} style={{ transform: all ? 'rotate(180deg)' : 'none' }} />
              </button>
            ) : null}
          </section>
        );
      })}

      {onScreen ? createPortal(
        <div data-pf="1" data-fast-ok="1" style={{ position: 'fixed', left: 0, right: 0, margin: '0 auto', maxWidth: 'var(--app-w)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)', height: 0, zIndex: 25, pointerEvents: 'none' }}>
          <button type="button" onClick={() => { setLim(sections.length); setSheet(true); }} className="glass-strong press absolute flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold" style={{ right: 16, bottom: 0, pointerEvents: 'auto', background: 'var(--sky-2)', boxShadow: '0 6px 16px -6px rgba(0,0,0,.55)' }}>
            <ListTree size={14} />
            Vai a
          </button>
        </div>,
        document.body,
      ) : null}

      {sheet ? createPortal(
        <div data-no-back="1" className="fixed inset-0 z-[90] flex items-end justify-center" onClick={() => setSheet(false)} onTouchMove={(e) => { if (e.target === e.currentTarget && e.cancelable) e.preventDefault(); }} style={{ background: 'rgba(0,0,0,.5)', touchAction: 'none' }}>
          <div className="max-h-[72vh] w-full max-w-[var(--sheet-w)] overflow-y-auto overscroll-contain rounded-t-[28px] p-5 pb-[max(20px,env(safe-area-inset-bottom))]" style={{ background: 'var(--sky-2)', border: '1px solid var(--glass-border)', touchAction: 'pan-y', animation: 'slup .3s cubic-bezier(.22,.8,.24,1)' }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[15px] font-extrabold">Vai a</span>
              <button type="button" onClick={() => setSheet(false)} className="press" aria-label="Chiudi"><X size={18} /></button>
            </div>
            {groups.map((g) => (
              <div key={g.name} className="mb-4">
                <div className="mb-2 text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{g.name}</div>
                <div className="flex flex-wrap gap-2">
                  {g.items.map((s) => (
                    <button key={s.id} type="button" onClick={() => go(s.id)} className="glass-flat press rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold">
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
