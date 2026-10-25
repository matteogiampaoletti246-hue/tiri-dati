import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import Logo from '@/components/Logo';
import ThemeSelector from '@/components/ThemeSelector';
import SearchOverlay from '@/components/SearchOverlay';

const ITEMS = [
  { label: 'Partite', to: '/partite' },
  { label: 'Calcolatore di Affidabilità', to: '/calcolatore' },
  { label: 'Tiri Squadre', to: '/tiri-squadre' },
  { label: 'Migliori Giocatori', to: '/migliori-giocatori' },
  { label: 'Migliori Matchup', to: '/migliori-matchup' },
  { label: 'Linee guida', to: '/linee-guida' },
];

export default function Menu() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <PageShell>
      <TopBar
        title="Menu"
        back={false}
        right={
          <button type="button" className="icon-btn" aria-label="Cerca" onClick={() => setSearchOpen(true)}>
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

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
