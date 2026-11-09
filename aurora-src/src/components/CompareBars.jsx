import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import SlidingNumber from './SlidingNumber';
import { statGet, statSet } from '@/lib/statMemory';
import { shown, inkOn } from '@/lib/tint';

// barra/numero di chi perde: piu' tenue, ma un colore chiaro (bianco) resta bianco e non diventa grigio
const dim = (c) => (inkOn(c) === '#0F172A' ? 0.8 : 0.5);

// Movimento delle barre quando cambiano i valori (Totale / 1° tempo / 2° tempo): scivolano in modo morbido.
// binario della barra: su iPhone (WebKit) una barra che si ridimensiona con transform esce dai bordi arrotondati di overflow-hidden;
// clip-path + isolation la tengono dentro, e la barra e' posizionata nel binario (mai spostata in basso: "due linee")
const TRACK = { clipPath: 'inset(0 round 999px)', isolation: 'isolate' };
const MOVE = { dur: 620, ease: 'cubic-bezier(.22,1,.36,1)' };

// Confronto squadra / squadra. Chi ha il valore più alto è in colore pieno, l'altra sbiadita.
// variant: a = barre dal centro, b = barra unica divisa, c = numeri con linee sottili.
export default function CompareBars({ rows, homeColor = 'var(--accent)', awayColor = 'var(--live)', format = (v) => v, variant = 'a', memKey }) {
  // numeri vecchi per mezzo secondo, poi scorrono verso quelli aggiornati (memoria per partita, `statMemory`)
  const sig = rows.map((r) => `${r.label}:${r.home}:${r.away}`).join('|');
  const [old, setOld] = useState(null);
  const checked = useRef(false);
  // prima del primo disegno con i dati: se la memoria ha numeri diversi, si parte da quelli (nessun fotogramma coi nuovi)
  useLayoutEffect(() => {
    if (checked.current || !memKey || !rows.length) return;
    checked.current = true;
    const m = statGet(memKey);
    if (m && rows.some((r) => m[r.label] && (m[r.label][0] !== r.home || m[r.label][1] !== r.away))) setOld(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memKey, sig]);
  const box = useRef(null);
  useEffect(() => {
    if (!memKey) return undefined;
    const v = {};
    rows.forEach((r) => { v[r.label] = [r.home, r.away]; });
    statSet(memKey, v);
    if (!old) return undefined;
    // le schede sono gia' montate prima di essere viste: il mezzo secondo parte quando il riquadro e' davvero sullo schermo
    const el = box.current;
    let t = 0;
    const go = () => { if (!t) t = setTimeout(() => setOld(null), 500); };
    if (!el || typeof IntersectionObserver === 'undefined') { go(); return () => clearTimeout(t); }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting && e.intersectionRatio > 0.2)) { go(); io.disconnect(); } }, { threshold: [0.2] });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memKey, sig, old]);

  // d = stile delle statistiche partita: numeri neri, nome al centro, barra divisa azzurra / grigia (chi ha di piu' e' in evidenza)
  if (variant === 'd') {
    return (
      <div className="flex flex-col">
        {rows.map((row) => {
          const na = Math.abs(row.home || 0);
          const nb = Math.abs(row.away || 0);
          const tot = na + nb;
          const pa = tot > 0 ? (na / tot) * 100 : 50;
          const fmt = row.format || format;
          const tr = `width ${MOVE.dur}ms ${MOVE.ease}, opacity .45s ease`;
          return (
            <div key={row.label} className="py-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="tnum font-bold">{row.homeText ?? fmt(row.home)}</span>
                <span className="px-2 text-center text-[12px]" style={{ color: 'var(--ink-2)' }}>{row.label}</span>
                <span className="tnum font-bold">{row.awayText ?? fmt(row.away)}</span>
              </div>
              <div className="mt-1 flex h-[4px] gap-[3px] overflow-hidden rounded-full">
                <span style={{ width: `${pa}%`, minWidth: 0, background: 'var(--accent)', opacity: na >= nb ? 1 : 0.45, borderRadius: 4, transition: tr }} />
                <span style={{ flex: '1 1 0%', minWidth: 0, background: 'var(--ink-2)', opacity: nb >= na ? 0.9 : 0.35, borderRadius: 4, transition: 'opacity .45s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div ref={box} className={`flex flex-col ${variant === 'a' ? 'gap-3.5' : 'gap-5'}`}>
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
        // A "Paired Bars": barre a specchio dal centro nei colori sociali; chi prevale ha il colore pieno e il numero colorato
        const o = old && old[row.label];
        const vh = o ? Math.abs(o[0] || 0) : h;
        const va = o ? Math.abs(o[1] || 0) : a;
        const mx = Math.max(vh, va) || 1;
        const hc = shown(homeColor);
        const ac = shown(awayColor);
        const hWin = vh >= va;
        const aWin = va >= vh;
        const tx = (v, t) => (o ? fmt(v) : t);
        const bar = `transform ${MOVE.dur}ms ${MOVE.ease}, opacity .45s ease`;
        return (
          <div key={row.label}>
            <div className="flex items-baseline gap-2 text-[13.5px]">
              <SlidingNumber text={tx(o && o[0], ht)} className="font-extrabold" style={{ color: hc, opacity: hWin ? 1 : dim(hc) + 0.2, transition: 'opacity .45s ease' }} />
              <span className="mx-auto truncate text-center text-[12px]" style={{ color: 'var(--ink-3)' }}>{row.label}</span>
              <SlidingNumber text={tx(o && o[1], at)} className="font-extrabold" style={{ color: ac, opacity: aWin ? 1 : dim(ac) + 0.2, transition: 'opacity .45s ease' }} />
            </div>
            <div className="mt-1.5 flex h-[6px] gap-[4px]">
              <div className="relative h-full flex-1 overflow-hidden rounded-full" style={{ background: 'var(--hair-2)', ...TRACK }}>
                <span className="absolute inset-0 rounded-full" style={{ transformOrigin: 'right', transform: `scaleX(${vh / mx})`, background: hc, opacity: hWin ? 1 : dim(hc), transition: bar }} />
              </div>
              <div className="relative h-full flex-1 overflow-hidden rounded-full" style={{ background: 'var(--hair-2)', ...TRACK }}>
                <span className="absolute inset-0 rounded-full" style={{ transformOrigin: 'left', transform: `scaleX(${va / mx})`, background: ac, opacity: aWin ? 1 : dim(ac), transition: bar }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
