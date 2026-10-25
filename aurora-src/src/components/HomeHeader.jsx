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

// Intestazione della Home: il marchio arriva qui dall'animazione di avvio.
export default function HomeHeader({ onSearch }) {
  const [ready, setReady] = useState(launched);

  useEffect(() => {
    const onDone = () => setReady(true);
    window.addEventListener('sl-launch-done', onDone);
    return () => window.removeEventListener('sl-launch-done', onDone);
  }, []);

  return (
    <header className="glass-head sticky top-0 z-30">
      <div className="flex items-center gap-2.5 px-5 py-3.5">
        <Link
          to="/"
          className={`flex items-center gap-2.5 transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
          aria-label="ScalperLab"
        >
          <Logo size={23} />
          <span className="title-lg text-[18px] tracking-[-.04em]" style={{ color: 'var(--ink)' }}>
            ScalperLab
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <button type="button" className="icon-btn" aria-label="Cerca" onClick={onSearch}>
            <Search size={19} strokeWidth={1.3} />
          </button>
          <Link to="/menu" className="icon-btn" aria-label="Menu">
            <MenuIcon size={19} strokeWidth={1.3} />
          </Link>
        </div>
      </div>
    </header>
  );
}
