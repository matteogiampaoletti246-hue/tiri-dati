import React, { useState } from 'react';
import { ShotEvent } from '../../types';

interface ShotMapProps {
  shots: ShotEvent[];
  homeTeamName: string;
  awayTeamName: string;
}

export const ShotMap: React.FC<ShotMapProps> = ({
  shots,
  homeTeamName,
  awayTeamName
}) => {
  const [filterTeam, setFilterTeam] = useState<'all' | 'home' | 'away'>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [selectedShot, setSelectedShot] = useState<ShotEvent | null>(null);

  // Available players who took shots
  const playerNames = Array.from(new Set(shots.map(s => s.playerName)));

  const filteredShots = shots.filter(s => {
    if (filterTeam !== 'all' && s.team !== filterTeam) return false;
    if (selectedPlayer !== 'all' && s.playerName !== selectedPlayer) return false;
    return true;
  });

  const getOutcomeColor = (outcome: ShotEvent['outcome']) => {
    switch (outcome) {
      case 'Gol': return '#10B981'; // Green
      case 'Parato': return '#3B82F6'; // Blue
      case 'Fuori': return '#94A3B8'; // Grey
      case 'Murato': return '#F59E0B'; // Orange
      default: return '#94A3B8';
    }
  };

  const getShotSize = (xG: number) => {
    // scale from 12px to 28px depending on xG (0.01 - 0.70)
    return Math.min(28, Math.max(12, Math.round(12 + xG * 25)));
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Filter Chips: Tutti / Casa / Ospite */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => { setFilterTeam('all'); setSelectedPlayer('all'); }}
          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
            filterTeam === 'all'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          Tutti ({shots.length})
        </button>
        <button
          onClick={() => { setFilterTeam('home'); setSelectedPlayer('all'); }}
          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
            filterTeam === 'home'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          {homeTeamName}
        </button>
        <button
          onClick={() => { setFilterTeam('away'); setSelectedPlayer('all'); }}
          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
            filterTeam === 'away'
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          {awayTeamName}
        </button>

        {/* Player select filter */}
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          className="ml-auto text-xs bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2 py-1 outline-none focus:border-emerald-500"
        >
          <option value="all">Tutti i tiratori</option>
          {playerNames.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Pitch Display */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 bg-emerald-950/70 p-3 shadow-inner">
        {/* Tactical pitch markings */}
        <div className="absolute inset-2 border border-emerald-500/20 rounded-xl pointer-events-none">
          {/* Halfway line */}
          <div className="absolute top-0 bottom-0 left-1/2 border-r border-emerald-500/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-emerald-500/20" />

          {/* Goal boxes Left and Right */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-14 h-28 border-t border-b border-r border-emerald-500/20" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-14 h-28 border-t border-b border-l border-emerald-500/20" />
          {/* 6-yard boxes */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-6 h-14 border-t border-b border-r border-emerald-500/20" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-6 h-14 border-t border-b border-l border-emerald-500/20" />
        </div>

        {/* Shots nodes */}
        {filteredShots.map((shot) => {
          const color = getOutcomeColor(shot.outcome);
          const size = getShotSize(shot.xG);
          const isSelected = selectedShot?.id === shot.id;

          return (
            <button
              key={shot.id}
              onClick={() => setSelectedShot(shot)}
              style={{
                left: `${shot.x}%`,
                top: `${shot.y}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                boxShadow: isSelected ? `0 0 12px 3px ${color}` : `0 0 6px ${color}80`
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 cursor-pointer active:scale-125 transition-all z-10 ${
                isSelected ? 'ring-4 ring-white/50 scale-125' : 'hover:scale-110'
              }`}
              title={`${shot.playerName} (${shot.minute}'): xG ${shot.xG} - ${shot.outcome}`}
            />
          );
        })}

        {/* Tooltip Card when shot tapped */}
        {selectedShot && (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 border border-slate-700/80 rounded-xl p-2.5 backdrop-blur-md shadow-2xl z-20 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-white">{selectedShot.playerName}</span>
                <span className="text-[10px] text-slate-400 font-mono">{selectedShot.minute}'</span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono uppercase"
                  style={{
                    color: getOutcomeColor(selectedShot.outcome),
                    backgroundColor: `${getOutcomeColor(selectedShot.outcome)}20`
                  }}
                >
                  {selectedShot.outcome}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                <span>xG: <b className="text-slate-200 font-mono">{selectedShot.xG.toFixed(2)}</b></span>
                <span>·</span>
                <span>{selectedShot.bodyPart}</span>
                <span>·</span>
                <span>{selectedShot.team === 'home' ? homeTeamName : awayTeamName}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedShot(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <span>Gol</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
          <span>Parato</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm" />
          <span>Fuori</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
          <span>Murato</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 ml-auto border-l border-slate-800 pl-2">
          <span>Dimensione: <b>xG</b></span>
        </div>
      </div>
    </div>
  );
};
