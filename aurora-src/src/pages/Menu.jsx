import { primeKeyboard } from '@/lib/keyboard';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isNative } from '@/lib/carousel';
import { ChevronRight, Search } from 'lucide-react';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import Logo from '@/components/Logo';
import ThemeSelector from '@/components/ThemeSelector';
import SearchOverlay from '@/components/SearchOverlay';
import { perfEnabled, setPerf } from '@/lib/perfMon';

const ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Competizioni', to: '/competizioni' },
  { label: 'Calcolatore di Affidabilità', to: '/calcolatore' },
  { label: 'Migliori Giocatori', to: '/migliori-giocatori' },
  { label: 'Migliori Matchup', to: '/migliori-matchup' },
  { label: 'Linee guida', to: '/linee-guida' },
];

// Vecchi link alla pagina menu: aprono la Home con il menu a tendina aperto (nell'app nativa la Home e il menu sono nativi).
export default function Menu() {
  const navigate = useNavigate();
  useEffect(() => {
    if (isNative()) { try { window.ReactNativeWebView.postMessage('home'); window.ReactNativeWebView.postMessage('ui:menu'); } catch (e) { /* ignora */ } return; }
    navigate('/', { replace: true, state: { open: 'menu' } });
  }, [navigate]);
  return null;
}

// vecchia pagina menu (tenuta, non piu' aperta dai link)
export function MenuPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [perf, setPerfState] = useState(perfEnabled());

  return (
    <PageShell>
      <TopBar
        title="Menu"
        back={false}
        right={
          <button type="button" className="icon-btn" aria-label="Cerca" onClick={() => { primeKeyboard(); setSearchOpen(true); }}>
            <Search size={19} strokeWidth={1.25} />
          </button>
        }
      />

      <div className="flex items-center gap-3 px-5 pt-2">
        <Logo size={30} />
        <span className="title-lg text-[19px] tracking-[-.04em]" style={{ color: 'var(--ink)' }}>
          ScalperLab
        </span>
      </div>

      <div className="px-5 pt-2">
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 py-4 transition-opacity active:opacity-50"
            style={{ borderBottom: '1px solid var(--hair-2)' }}
          >
            <span className="text-[16px] font-light tracking-[-.02em]" style={{ color: 'var(--ink)' }}>
              {item.label}
            </span>
            <ChevronRight size={16} strokeWidth={1.2} className="ml-auto" style={{ color: 'var(--ink-3)' }} />
          </Link>
        ))}
      </div>

      <div className="px-5 pt-8">
        <p className="label-sm">Tema</p>
        <div className="mt-3">
          <ThemeSelector />
        </div>
      </div>

      <div className="px-5 pt-8">
        <p className="label-sm">Diagnostica</p>
        <button type="button" onClick={() => { setPerf(!perf); setPerfState(!perf); }} className="press mt-3 flex w-full items-center justify-between py-3" style={{ borderBottom: '1px solid var(--hair-2)' }}>
          <span className="text-[15px] font-light" style={{ color: 'var(--ink)' }}>Pannello diagnosi (per le registrazioni schermo)</span>
          <span className="text-[12.5px] font-bold" style={{ color: perf ? 'var(--accent)' : 'var(--ink-3)' }}>{perf ? 'Attivo' : 'Spento'}</span>
        </button>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
