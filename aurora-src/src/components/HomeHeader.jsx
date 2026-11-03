import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu as MenuIcon } from 'lucide-react';
import Logo from '@/components/Logo';
import { openMenu } from '@/components/MenuDrawer';

const launched = () => {
  try {
    return !!sessionStorage.getItem('sl-launched');
  } catch {
    return true;
  }
};

// Intestazione della Home in una riga sola: logo, barra di ricerca (tutto lo spazio che resta), Calendario, menu.
// Il logo arriva qui dall'animazione di avvio.
export default function HomeHeader({ onSearch, calendar }) {
  const [ready, setReady] = useState(launched);

  useEffect(() => {
    const onDone = () => setReady(true);
    window.addEventListener('sl-launch-done', onDone);
    return () => window.removeEventListener('sl-launch-done', onDone);
  }, []);

  return (
    <header>
      <div className="flex items-center gap-2 px-4 py-2.5">
        <Link
          to="/"
          id="sl-brand"
          className={`flex shrink-0 items-center transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
          style={{ color: 'var(--ink)' }}
          aria-label="ScalperLab"
        >
          <Logo size={30} />
        </Link>
        <button
          type="button"
          onClick={onSearch}
          aria-label="Cerca"
          className="glass press flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full px-3 text-left"
        >
          <Search size={16} strokeWidth={2} className="shrink-0" style={{ color: 'var(--ink-3)' }} />
          <span className="truncate text-[14.5px]" style={{ color: 'var(--ink-3)' }}>Cerca giocatori, squadre…</span>
        </button>
        {calendar}
        <button type="button" onClick={openMenu} aria-label="Menu" className="glass press flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <MenuIcon size={16} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
