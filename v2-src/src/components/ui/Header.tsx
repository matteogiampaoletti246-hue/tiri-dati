import React from 'react';
import { Search, Menu } from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenMenu: () => void;
  onLogoClick?: () => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenMenu,
  onLogoClick,
  title,
  showBack,
  onBack
}) => {
  return (
    <header className="sticky top-0 z-30 w-full h-13 bg-slate-950/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between">
      {/* Left Slot: Menu trigger or Back button */}
      <div className="flex items-center gap-2.5">
        {showBack ? (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-lg active:scale-95 transition-transform flex items-center gap-1 text-xs font-semibold"
          >
            <span className="text-base leading-none">‹</span>
            <span>Indietro</span>
          </button>
        ) : (
          <button
            onClick={onOpenMenu}
            className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-lg active:scale-95 transition-transform"
            aria-label="Apri menu"
          >
            <Menu className="w-5 h-5 text-slate-200" />
          </button>
        )}

        {/* Center / Brand Wordmark */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 group text-left"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-display font-extrabold text-slate-950 text-xs shadow-sm">
            S
          </div>
          <span className="font-display font-bold text-base text-slate-100 tracking-tight group-hover:text-emerald-400 transition-colors">
            Scalper<span className="text-emerald-400">Lab</span>
          </span>
        </button>
      </div>

      {/* Center title if any in sub-screens */}
      {title && (
        <span className="absolute left-1/2 -translate-x-1/2 text-xs font-bold text-slate-300 truncate max-w-[150px]">
          {title}
        </span>
      )}

      {/* Right Slot: Search button */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSearch}
          className="p-2 text-slate-300 hover:text-emerald-400 rounded-lg active:scale-95 transition-transform"
          aria-label="Cerca"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
