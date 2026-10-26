import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu as MenuIcon } from 'lucide-react';
import Logo from '@/components/Logo';

const launched = () => {
  try {
    return !!sessionStorage.getItem('sl-launched');
  } catch {
    return true;
  }
};

function IconButton({ onClick, label, to, children }) {
  const cls = 'glass press flex h-9 w-9 items-center justify-center rounded-full';
  return to ? (
    <Link to={to} aria-label={label} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={cls}>
      {children}
    </button>
  );
}

// Intestazione: il logo con la scritta arriva qui dall'animazione di avvio.
export default function HomeHeader({ onSearch }) {
  const [ready, setReady] = useState(launched);

  useEffect(() => {
    const onDone = () => setReady(true);
    window.addEventListener('sl-launch-done', onDone);
    return () => window.removeEventListener('sl-launch-done', onDone);
  }, []);

  return (
    <header>
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <Link
          to="/"
          id="sl-brand"
          className={`flex items-center transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
          style={{ gap: 11 * (28 / 64), color: 'var(--ink)' }}
          aria-label="ScalperLab"
        >
          <Logo size={28} />
          <span className="title-lg" style={{ fontSize: 34 * (28 / 64), letterSpacing: '-.04em' }}>
            Scalper<span style={{ color: 'var(--accent)' }}>Lab</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <IconButton onClick={onSearch} label="Cerca">
            <Search size={16} strokeWidth={2} />
          </IconButton>
          <IconButton to="/menu" label="Menu">
            <MenuIcon size={16} strokeWidth={2} />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
