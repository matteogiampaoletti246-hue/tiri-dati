import { Link } from 'react-router-dom';
import { Search, Menu as MenuIcon } from 'lucide-react';

const btn = 'glass press flex h-9 w-9 items-center justify-center rounded-full';

// Striscia fissa in alto: solo cerca e menu, senza logo.
export default function FixedBar({ onSearch }) {
  return (
    <div className="flex items-center justify-end gap-2 px-5 pb-1 pt-3">
      <button type="button" onClick={onSearch} aria-label="Cerca" className={btn}>
        <Search size={16} strokeWidth={2} />
      </button>
      <Link to="/menu" aria-label="Menu" className={btn}>
        <MenuIcon size={16} strokeWidth={2} />
      </Link>
    </div>
  );
}
