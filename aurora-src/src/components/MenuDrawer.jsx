import { useModalLock } from '@/lib/modal';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftRight, BookOpen, ChevronRight, Gauge, Home, Star, Trophy, X } from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeSelector from '@/components/ThemeSelector';
import { perfEnabled, setPerf } from '@/lib/perfMon';

const ITEMS = [
  { label: 'Home', to: '/', Icon: Home },
  { label: 'Competizioni', to: '/competizioni', Icon: Trophy },
  { label: 'Calcolatore di Affidabilità', to: '/calcolatore', Icon: Gauge },
  { label: 'Migliori Giocatori', to: '/migliori-giocatori', Icon: Star },
  { label: 'Migliori Matchup', to: '/migliori-matchup', Icon: ArrowLeftRight },
  { label: 'Linee guida', to: '/linee-guida', Icon: BookOpen },
];

export const openMenu = () => { try { window.dispatchEvent(new CustomEvent('sl-menu')); } catch (e) { /* ignore */ } };

const EASE = 'cubic-bezier(.22,1,.36,1)';

// Menu a tendina da destra: stesse voci della vecchia pagina menu, con icone; le voci entrano a cascata.
// Si chiude con X, toccando lo sfondo scurito, con ESC o scegliendo una voce; la pagina sotto non si muove.
export default function MenuDrawer() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [perf, setPerfState] = useState(perfEnabled);
  const loc = useLocation();
  useModalLock(open);
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
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', width: 'min(78vw, 300px)', minWidth: 236, overscrollBehavior: 'contain', background: 'var(--sky-2)', borderLeft: '1px solid var(--hair)', boxShadow: '-18px 0 48px var(--scrim)', transform: shown ? 'translate3d(0,0,0)' : 'translate3d(100%,0,0)', transition: `transform ${ms(420)} ${EASE}`, willChange: 'transform' }}
      >
        <div className="flex items-center gap-2.5 pb-2">
          <Logo size={26} />
          <span className="title-lg text-[17px] tracking-[-.04em]" style={{ color: 'var(--ink)' }}>ScalperLab</span>
          <button type="button" aria-label="Chiudi" onClick={() => setOpen(false)} className="glass press ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full"><X size={16} strokeWidth={2} /></button>
        </div>
        <div className="pt-1">
          {ITEMS.map(({ label, to, Icon }, i) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-3.5 py-3.5 active:opacity-50" style={{ borderBottom: '1px solid var(--hair-2)', ...stag(i) }}>
              <Icon size={19} strokeWidth={1.8} className="shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="text-[15px] font-light leading-tight tracking-[-.02em]" style={{ color: 'var(--ink)' }}>{label}</span>
              <ChevronRight size={15} strokeWidth={1.2} className="ml-auto shrink-0" style={{ color: 'var(--ink-3)' }} />
            </Link>
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
