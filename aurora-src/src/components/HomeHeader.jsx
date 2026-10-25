import { Link } from 'react-router-dom';
import { Search, Menu as MenuIcon } from 'lucide-react';
import Logo from '@/components/Logo';

export default function HomeHeader({ onSearch }) {
  return (
    <header className="sticky top-0 z-30">
      <div
        className="flex items-center gap-3 px-5 py-3.5"
        style={{
          background: 'color-mix(in srgb, var(--sky-2) 72%, transparent)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={23} />
          <span className="title-lg text-[19px] tracking-[-.04em]" style={{ color: 'var(--ink)' }}>
            ScalperLab
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-5">
          <button type="button" className="icon-btn" aria-label="Cerca" onClick={onSearch}>
            <Search size={19} strokeWidth={1.25} />
          </button>
          <Link to="/menu" className="icon-btn" aria-label="Menu">
            <MenuIcon size={19} strokeWidth={1.25} />
          </Link>
        </div>
      </div>
    </header>
  );
}
