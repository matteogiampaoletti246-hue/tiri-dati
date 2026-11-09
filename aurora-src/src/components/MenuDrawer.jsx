import { useModalLock } from '@/lib/modal';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Calculator, Home, Swords, Trophy, Users, X } from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeSelector from '@/components/ThemeSelector';
import { perfEnabled, setPerf } from '@/lib/perfMon';

// icone uguali a quelle del dock (stessa famiglia, stessa misura e tratto): Home, Calcolatore, Giocatori, Matchup
const ITEMS = [
  { label: 'Home', to: '/', Icon: Home },
  { label: 'Competizioni', to: '/competizioni', Icon: Trophy },
  { label: 'Calcolatore di Affidabilità', to: '/calcolatore', Icon: Calculator },
  { label: 'Migliori Giocatori', to: '/migliori-giocatori', Icon: Users },
  { label: 'Migliori Matchup', to: '/migliori-matchup', Icon: Swords },
  { label: 'Linee guida', to: '/linee-guida', Icon: BookOpen },
];
const ROW = 50;
const activeIdx = (p) => { const i = ITEMS.findIndex((it, k) => k > 0 && p.startsWith(it.to)); return i >= 0 ? i : p === '/' ? 0 : -1; };

export const openMenu = () => { try { window.dispatchEvent(new CustomEvent('sl-menu')); } catch (e) { /* ignore */ } };

const EASE = 'cubic-bezier(.22,1,.36,1)';

// Menu a tendina da destra (21st "Sheet" di Wensity + "Sidebar" concept A): pannello da destra con lo sfondo scurito,
// voci con le icone del dock e un evidenziatore che scivola sotto la voce attiva (anche al tocco, prima di aprire la pagina).
// Si chiude con X, toccando lo sfondo, con ESC, scegliendo una voce o con uno swipe verso destra; la pagina sotto non si muove.
export default function MenuDrawer() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [perf, setPerfState] = useState(perfEnabled);
  const loc = useLocation();
  const nav = useNavigate();
  const [hi, setHi] = useState(-1);
  const [drag, setDrag] = useState(0);
  const touch = useRef(null);
  useModalLock(open);
  useEffect(() => { if (open) setHi(activeIdx(loc.pathname)); }, [open, loc.pathname]);
  const pick = (i, to) => { setHi(i); setTimeout(() => { setOpen(false); nav(to); }, 170); };
  const tStart = (e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY, t: Date.now(), on: null }; };
  const tMove = (e) => {
    const s0 = touch.current; if (!s0) return;
    const t = e.touches[0]; const dx = t.clientX - s0.x; const dy = t.clientY - s0.y;
    if (s0.on === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) s0.on = Math.abs(dx) > Math.abs(dy) && dx > 0;
    if (s0.on) setDrag(Math.max(0, dx));
  };
  const tEnd = () => { const s0 = touch.current; touch.current = null; if (!s0 || !s0.on) return; const fast = drag / Math.max(1, Date.now() - s0.t) > 0.5; if (drag > 90 || fast) setOpen(false); setDrag(0); };
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('sl-menu', on);
    return () => window.removeEventListener('sl-menu', on);
  }, []);
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => {
    if (open) { const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true))); return () => cancelAnimationFrame(id); }
    setShown(false);
    return undefined;
  }, [open]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (open) { setMounted(true); return undefined; }
    const t = setTimeout(() => setMounted(false), 420);
    return () => clearTimeout(t);
  }, [open]);
  if (!mounted) return null;
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ms = (d) => (reduce ? '1ms' : `${d}ms`);
  // ogni voce entra da destra poco dopo il pannello (in chiusura escono tutte insieme)
  const stag = (i) => ({ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translate3d(16px,0,0)', transition: `opacity ${ms(260)} ${EASE} ${shown ? ms(150 + i * 35) : '0ms'}, transform ${ms(260)} ${EASE} ${shown ? ms(150 + i * 35) : '0ms'}` });
  return (
    <div className="fixed inset-0 z-[230]" style={{ pointerEvents: open ? 'auto' : 'none' }} role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0" onClick={() => setOpen(false)} style={{ background: 'var(--scrim)', touchAction: 'none', opacity: shown ? 1 : 0, transition: `opacity ${ms(380)} ease` }} />
      <aside
        className="hide-sb absolute bottom-0 right-0 top-0 flex flex-col overflow-y-auto px-5"
        onTouchStart={tStart} onTouchMove={tMove} onTouchEnd={tEnd} onTouchCancel={tEnd}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', width: 'min(78vw, 300px)', minWidth: 236, overscrollBehavior: 'contain', background: 'var(--sky-2)', borderLeft: '1px solid var(--hair)', boxShadow: '-18px 0 48px var(--scrim)', transform: shown ? `translate3d(${drag}px,0,0)` : 'translate3d(100%,0,0)', transition: drag ? 'none' : `transform ${ms(420)} ${EASE}`, willChange: 'transform' }}
      >
        <div className="flex items-center gap-2.5 pb-2">
          <Logo size={26} />
          <span className="title-lg text-[17px] tracking-[-.04em]" style={{ color: 'var(--ink)' }}>ScalperLab</span>
          <button type="button" aria-label="Chiudi" onClick={() => setOpen(false)} className="glass lglass press ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full"><X size={16} strokeWidth={2} /></button>
        </div>
        <div className="relative mt-2 rounded-[18px] p-1.5" style={{ background: 'var(--wash, rgba(255,255,255,.03))', border: '1px solid var(--hair-2)' }}>
          <span aria-hidden="true" className="absolute left-1.5 right-1.5 top-1.5 rounded-[13px]" style={{ height: ROW, background: 'var(--accent-soft)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent)', opacity: hi >= 0 && shown ? 1 : 0, transform: `translate3d(0,${Math.max(0, hi) * ROW}px,0)`, transition: `transform ${ms(320)} ${EASE}, opacity ${ms(200)} ease` }} />
          {ITEMS.map(({ label, to, Icon }, i) => (
            <button type="button" key={to} onClick={() => pick(i, to)} className="relative flex w-full items-center gap-3 px-3 text-left active:opacity-70" style={{ height: ROW, ...stag(i) }}>
              <Icon size={21} strokeWidth={2} className="shrink-0" style={{ color: hi === i ? 'var(--accent)' : 'var(--ink-2)', transition: 'color .25s ease' }} />
              <span className="truncate text-[14.5px] font-bold leading-tight tracking-[-.01em]" style={{ color: hi === i ? 'var(--accent)' : 'var(--ink)', transition: 'color .25s ease' }}>{label}</span>
            </button>
          ))}
        </div>
        <div className="pt-7" style={stag(ITEMS.length)}>
          <p className="label-sm">Tema</p>
          <div className="mt-3"><ThemeSelector /></div>
        </div>
        <div className="pb-24 pt-7" style={stag(ITEMS.length + 1)}>
          <p className="label-sm">Diagnostica</p>
          <button type="button" onClick={() => { setPerf(!perf); setPerfState(!perf); }} className="press mt-2 flex w-full items-center justify-between gap-3 py-3 text-left" style={{ borderBottom: '1px solid var(--hair-2)' }}>
            <span className="text-[14px] font-light" style={{ color: 'var(--ink)' }}>Pannello diagnosi</span>
            <span className="shrink-0 text-[12.5px] font-bold" style={{ color: perf ? 'var(--accent)' : 'var(--ink-3)' }}>{perf ? 'Attivo' : 'Spento'}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
