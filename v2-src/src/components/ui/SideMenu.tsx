import React, { useState } from 'react';
import {
  Calendar,
  Calculator,
  Target,
  Users,
  Layers,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Smartphone,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeMode } from '../../types';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string, subCategory?: string) => void;
  activeRoute: string;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  activeRoute
}) => {
  const { theme, setTheme } = useTheme();
  const [matchupsExpanded, setMatchupsExpanded] = useState(false);

  if (!isOpen) return null;

  const handleLinkClick = (route: string, subCategory?: string) => {
    onNavigate(route, subCategory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Drawer */}
      <div className="relative w-72 max-w-[85vw] h-full bg-slate-950 border-r border-slate-800 flex flex-col p-5 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-display font-extrabold text-slate-950 text-base shadow-lg shadow-emerald-500/20">
              S
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white tracking-tight">ScalperLab</span>
              <span className="block text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-semibold">
                Quant Analytics
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigation Links */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col gap-1.5">
          <button
            onClick={() => handleLinkClick('home')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
              activeRoute === 'home'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Partite</span>
          </button>

          <button
            onClick={() => handleLinkClick('calculator', 'player')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
              activeRoute === 'calculator'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Calcolatore di Affidabilità</span>
          </button>

          <button
            onClick={() => handleLinkClick('calculator', 'team')}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all text-left"
          >
            <Target className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Tiri Squadre</span>
          </button>

          <button
            onClick={() => handleLinkClick('best-players')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
              activeRoute === 'best-players'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Migliori Giocatori</span>
          </button>

          {/* Expandable Migliori Matchup */}
          <div className="flex flex-col">
            <button
              onClick={() => setMatchupsExpanded(!matchupsExpanded)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                activeRoute === 'matchups'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Migliori Matchup</span>
              </div>
              {matchupsExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {matchupsExpanded && (
              <div className="flex flex-col pl-9 pr-2 py-1 gap-1 border-l border-slate-800 ml-5 my-1">
                {(['Angoli', 'Cartellini', 'Tiri', 'Falli', 'Fuorigiochi'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleLinkClick('matchups', cat)}
                    className="py-1.5 px-2 text-xs font-medium text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-lg text-left transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleLinkClick('guidelines')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
              activeRoute === 'guidelines'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Linee guida</span>
          </button>
        </div>

        {/* Theme Selector: Chiaro / Scuro / Auto */}
        <div className="pt-4 border-t border-slate-800/80">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Tema applicazione
          </span>
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTheme('chiaro')}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                theme === 'chiaro'
                  ? 'bg-slate-800 text-amber-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Chiaro</span>
            </button>

            <button
              onClick={() => setTheme('scuro')}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                theme === 'scuro'
                  ? 'bg-slate-800 text-emerald-400 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Scuro</span>
            </button>

            <button
              onClick={() => setTheme('auto')}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                theme === 'auto'
                  ? 'bg-slate-800 text-teal-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Auto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
