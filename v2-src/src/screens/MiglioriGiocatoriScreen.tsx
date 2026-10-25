import React, { useState } from 'react';
import { BEST_PLAYERS_DATA } from '../data/matchups';
import { AvatarWithFallback } from '../components/ui/AvatarWithFallback';
import { ChevronRight, Calculator, Flame } from 'lucide-react';

interface MiglioriGiocatoriScreenProps {
  onSelectPlayer: (playerId: string) => void;
  onOpenCalculator: (playerName: string) => void;
}

export const MiglioriGiocatoriScreen: React.FC<MiglioriGiocatoriScreenProps> = ({
  onSelectPlayer,
  onOpenCalculator
}) => {
  const [selectedDate, setSelectedDate] = useState('oggi');
  const [selectedLine, setSelectedLine] = useState<'Over 0.5' | 'Over 1.5' | 'Over 2.5'>('Over 1.5');

  const filteredPlayers = BEST_PLAYERS_DATA.filter(p => p.line === selectedLine);

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Header title */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-emerald-400" />
          <h1 className="font-display font-bold text-lg text-white">
            Migliori Giocatori Linee Tiri
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Classifica quantitativa basata sul tasso di tiri normalizzato a 90' combinato col fattore difensivo avversario.
        </p>
      </div>

      {/* Date chips */}
      <div className="flex items-center gap-1.5 px-4 pt-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'oggi', label: 'Oggi' },
          { id: 'domani', label: 'Domani' },
          { id: 'weekend', label: 'Questo weekend' }
        ].map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDate(d.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDate === d.id
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Line selection chips: Over 0,5 / Over 1,5 / Over 2,5 */}
      <div className="flex items-center gap-2 px-4 py-3">
        {(['Over 0.5', 'Over 1.5', 'Over 2.5'] as const).map((line) => (
          <button
            key={line}
            onClick={() => setSelectedLine(line)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
              selectedLine === line
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {line}
          </button>
        ))}
      </div>

      {/* Ranked Cards */}
      <div className="px-4 flex flex-col gap-3">
        {filteredPlayers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-2xl">
            Nessun giocatore registrato per questa linea nella data selezionata.
          </div>
        ) : (
          filteredPlayers.map((player) => (
            <div
              key={player.rank + player.name}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm hover:border-slate-700 transition-colors"
            >
              {/* Card Top: Rank, Player Name & Match */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-emerald-400 border border-slate-700">
                    #{player.rank}
                  </div>
                  <div>
                    <button
                      onClick={() => onSelectPlayer(player.playerId)}
                      className="text-sm font-bold text-white hover:text-emerald-400 transition-colors text-left"
                    >
                      {player.name}
                    </button>
                    <span className="block text-xs text-slate-400">{player.match} · {player.league}</span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenCalculator(player.name)}
                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Calcola affidabilità"
                >
                  <Calculator className="w-4 h-4" />
                </button>
              </div>

              {/* Badges / Pills: Voto 9,96, Media attesa 7,66, 90' medi */}
              <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                <span className="bg-emerald-950/70 border border-emerald-700/80 text-emerald-300 font-bold px-2.5 py-1 rounded-lg">
                  Voto {player.score.toFixed(2).replace('.', ',')}
                </span>
                <span className="bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg font-semibold">
                  Media attesa {player.expectedRate.toFixed(2).replace('.', ',')}
                </span>
                <span className="bg-slate-850 border border-slate-800 text-slate-400 px-2 py-1 rounded-lg">
                  {player.avgMinutes}' medi
                </span>
              </div>

              {/* Line info */}
              <div className="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-800/80 flex items-center justify-between">
                <span>
                  Ultime 5: <b>{player.last5Rate.toFixed(1).replace('.', ',')}</b> – stagione <b>{player.seasonRate90.toFixed(1).replace('.', ',')}</b> /90'
                </span>
                <span className="text-emerald-400 font-semibold">{player.line}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
