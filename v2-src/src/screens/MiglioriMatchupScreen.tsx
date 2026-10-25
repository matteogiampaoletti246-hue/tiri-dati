import React, { useState } from 'react';
import { MATCHUPS_DATA } from '../data/matchups';
import { MatchupItem } from '../types';
import { Layers, ChevronRight } from 'lucide-react';
import { AvatarWithFallback } from '../components/ui/AvatarWithFallback';

interface MiglioriMatchupScreenProps {
  initialCategory?: string;
  onSelectMatchup?: (item: MatchupItem) => void;
}

export const MiglioriMatchupScreen: React.FC<MiglioriMatchupScreenProps> = ({
  initialCategory = 'Angoli',
  onSelectMatchup
}) => {
  const categories = ['Angoli', 'Cartellini', 'Tiri', 'Falli', 'Fuorigiochi'] as const;
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeDate, setActiveDate] = useState('oggi');

  const items = MATCHUPS_DATA[activeCategory] || MATCHUPS_DATA['Angoli'];

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <h1 className="font-display font-bold text-lg text-white">
            Migliori Matchup Statistiche
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Identifica le partite con il massimo divario statistico tra squadre per creare valore su mercati secondari.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 px-4 pt-3 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Date chips */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'ieri', label: 'Ieri' },
          { id: 'oggi', label: 'Oggi' },
          { id: 'domani', label: 'Domani' },
          { id: 'prossimi', label: 'Tutti i prossimi' }
        ].map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDate(d.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeDate === d.id
                ? 'bg-slate-800 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Matchup Cards */}
      <div className="px-4 flex flex-col gap-3">
        {items.map((m) => {
          const metricLabel =
            activeCategory === 'Angoli' ? 'Angoli attesi' :
            activeCategory === 'Cartellini' ? 'Cartellini attesi' :
            activeCategory === 'Tiri' ? 'Tiri previsti' :
            activeCategory === 'Falli' ? 'Falli attesi' : 'Fuorigioco previsti';

          return (
            <div
              key={m.id}
              onClick={() => onSelectMatchup?.(m)}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm hover:border-slate-700 cursor-pointer transition-colors"
            >
              {/* Card Header: Match & Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">{m.home}</span>
                  <span className="text-slate-500 text-xs font-light">vs</span>
                  <span className="font-bold text-sm text-slate-100">{m.away}</span>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-400">{m.time}</span>
              </div>

              {/* League & Category */}
              <span className="text-[11px] text-slate-400 -mt-1">{m.league}</span>

              {/* Pills: Divario, Attesi, Partite usate */}
              <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                <span className="bg-amber-950/70 border border-amber-600/80 text-amber-300 font-bold px-2.5 py-1 rounded-lg">
                  Divario {m.gap.toFixed(1).replace('.', ',')}
                </span>
                <span className="bg-slate-800 border border-slate-700 text-slate-200 font-semibold px-2.5 py-1 rounded-lg">
                  {metricLabel} {m.homeValue.toFixed(1).replace('.', ',')} – {m.awayValue.toFixed(1).replace('.', ',')}
                </span>
                <span className="bg-slate-850 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">
                  Partite usate: {m.gamesUsed[0]} / {m.gamesUsed[1]}
                </span>
              </div>

              {m.firstHalfValue && (
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
                  <span>Dato 1° Tempo medio:</span>
                  <b className="font-mono text-amber-300">{m.firstHalfValue.toFixed(1).replace('.', ',')}</b>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
