import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeSelector from '@/components/ThemeSelector';

const ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Calcolatore di Affidabilità', to: '/calcolatore' },
  { label: 'Migliori Giocatori', to: '/migliori-giocatori' },
  { label: 'Migliori Matchup', to: '/migliori-matchup' },
  { label: 'Linee guida', to: '/linee-guida' },
];

export const openMenu = () => { try { window.dispatchEvent(new CustomEvent('sl-menu')); } catch (e) { /* ignore */ } };

// Menu a tendina laterale: arriva da destra e occupa circa meta' schermo (la pagina sotto resta visibile e si chiude toccandola).
export default function MenuDrawer() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('sl-menu', on);
    return () => window.removeEventListener('sl-menu', on);
  }, []);
  useEffect(() => { setOpen(false); }, [loc.key]);
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
  return (
    <div className="fixed inset-0 z-[200]" style={{ pointerEvents: open ? 'auto' : 'none' }}>
      <div className="absolute inset-0" onClick={() => setOpen(false)} style={{ background: 'rgba(0,0,0,.5)', opacity: shown ? 1 : 0, transition: 'opacity .38s ease' }} />
      <aside
        className="absolute bottom-0 right-0 top-0 flex flex-col overflow-y-auto px-5 pt-14"
        style={{ width: 'min(58vw, 300px)', minWidth: 236, background: 'var(--sky-2, #0f1626)', borderLeft: '1px solid var(--hair)', boxShadow: '-18px 0 48px rgba(0,0,0,.4)', transform: shown ? 'translate3d(0,0,0)' : 'translate3d(100%,0,0)', transition: 'transform .42s cubic-bezier(.22,.8,.24,1)', willChange: 'transform' }}
      >
        <button type="button" aria-label="Chiudi" onClick={() => setOpen(false)} className="glass press absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full"><X size={16} strokeWidth={2} /></button>
        <div className="flex items-center gap-2.5 pb-2">
          <Logo size={26} />
          <span className="title-lg text-[17px] tracking-[-.04em]" style={{ color: 'var(--ink)' }}>ScalperLab</span>
        </div>
        <div className="pt-2">
          {ITEMS.map((item) => (
            <Link key={item.to} to={item.to} className="flex items-center gap-2 py-3.5 active:opacity-50" style={{ borderBottom: '1px solid var(--hair-2)' }}>
              <span className="text-[15px] font-light leading-tight tracking-[-.02em]" style={{ color: 'var(--ink)' }}>{item.label}</span>
              <ChevronRight size={15} strokeWidth={1.2} className="ml-auto shrink-0" style={{ color: 'var(--ink-3)' }} />
            </Link>
          ))}
        </div>
        <div className="pb-24 pt-7">
          <p className="label-sm">Tema</p>
          <div className="mt-3"><ThemeSelector /></div>
        </div>
      </aside>
    </div>
  );
}
