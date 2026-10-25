import React, { useState } from 'react';
import { LineupPlayer } from '../../types';
import { AvatarWithFallback } from './AvatarWithFallback';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface PitchFormationProps {
  homeFormation: string;
  awayFormation: string;
  homeCoach: string;
  awayCoach: string;
  homeStarters: LineupPlayer[];
  awayStarters: LineupPlayer[];
  homeBench: { id: string; name: string; number: number; position: string }[];
  awayBench: { id: string; name: string; number: number; position: string }[];
  onPlayerClick?: (player: LineupPlayer) => void;
}

export const PitchFormation: React.FC<PitchFormationProps> = ({
  homeFormation,
  awayFormation,
  homeCoach,
  awayCoach,
  homeStarters,
  awayStarters,
  homeBench,
  awayBench,
  onPlayerClick
}) => {
  const [activeSide, setActiveSide] = useState<'home' | 'away'>('home');

  const activeStarters = activeSide === 'home' ? homeStarters : awayStarters;
  const activeFormation = activeSide === 'home' ? homeFormation : awayFormation;
  const activeCoach = activeSide === 'home' ? homeCoach : awayCoach;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Side selector segmented control */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
        <button
          onClick={() => setActiveSide('home')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeSide === 'home'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Casa ({homeFormation})
        </button>
        <button
          onClick={() => setActiveSide('away')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeSide === 'away'
              ? 'bg-slate-800 text-blue-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Trasferta ({awayFormation})
        </button>
      </div>

      {/* Realistic Green Pitch */}
      <div className="relative w-full aspect-[3/4] max-w-[420px] mx-auto rounded-2xl overflow-hidden border-2 border-emerald-950/80 shadow-2xl bg-gradient-to-b from-emerald-800 via-emerald-900 to-emerald-950 p-3 select-none">
        {/* Tactical grass stripes */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_28px,rgba(0,0,0,0.3)_28px,rgba(0,0,0,0.3)_56px)]" />

        {/* Pitch lines */}
        <div className="absolute inset-3 border border-white/30 rounded-xl pointer-events-none">
          {/* Halfway line & center circle */}
          <div className="absolute top-0 left-0 right-0 border-b border-white/20" />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full border border-white/20" />

          {/* Penalty box (bottom) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-28 border-t border-l border-r border-white/30" />
          {/* 6-yard box */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-12 border-t border-l border-r border-white/30" />
          {/* Penalty spot */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/40 rounded-full" />
          {/* Penalty arc */}
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-20 h-10 border-t border-white/30 rounded-t-full" />
        </div>

        {/* Formation label overlay */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-emerald-300 backdrop-blur-sm border border-emerald-500/30">
            {activeFormation}
          </span>
          <span className="text-[10px] text-emerald-100/80 font-medium drop-shadow">
            All. {activeCoach}
          </span>
        </div>

        {/* Player Nodes */}
        {activeStarters.map((player) => {
          // Coords: x (horizontal %), y (vertical %)
          return (
            <div
              key={player.id}
              onClick={() => onPlayerClick?.(player)}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
              style={{
                left: `${player.positionCoords.x}%`,
                top: `${player.positionCoords.y}%`
              }}
            >
              {/* Player Circle */}
              <div className="relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-lg backdrop-blur-sm ${
                  activeSide === 'home'
                    ? 'bg-slate-950 text-slate-100 border-emerald-400'
                    : 'bg-slate-900 text-slate-100 border-blue-400'
                }`}>
                  <span className="font-mono text-xs font-bold">{player.number}</span>
                </div>

                {/* Rating badge */}
                {player.rating > 0 && (
                  <div className={`absolute -top-1.5 -right-2 text-[9px] font-bold px-1 py-0.2 rounded-full border shadow-sm font-mono ${
                    player.rating >= 8.0
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                      : player.rating >= 7.0
                      ? 'bg-emerald-700 text-white border-emerald-600'
                      : 'bg-amber-600 text-white border-amber-500'
                  }`}>
                    {player.rating.toFixed(1)}
                  </div>
                )}

                {/* Captain Badge */}
                {player.isCaptain && (
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center border border-amber-200 shadow">
                    C
                  </div>
                )}

                {/* Yellow / Red Card Icon */}
                {player.yellowCard && (
                  <div className="absolute -top-1.5 -left-1.5 w-2.5 h-3.5 bg-yellow-400 rounded-sm shadow-sm border border-yellow-200" title="Ammonito" />
                )}
                {player.redCard && (
                  <div className="absolute -top-1.5 -left-1.5 w-2.5 h-3.5 bg-red-600 rounded-sm shadow-sm border border-red-300" title="Espulso" />
                )}

                {/* Substitution Arrow */}
                {player.substitutedMinute && (
                  <div className="absolute -bottom-1 -right-1 flex items-center bg-red-950 text-red-300 text-[8px] font-bold px-1 rounded-full border border-red-800">
                    <ArrowDownLeft className="w-2.5 h-2.5" />
                    <span>{player.substitutedMinute}'</span>
                  </div>
                )}
              </div>

              {/* Name label */}
              <span className="mt-1 text-[10px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] text-center whitespace-nowrap bg-black/40 px-1.5 py-0.2 rounded-md">
                {player.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bench Section: 2-column grid */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Panchina ({homeBench.length + awayBench.length} convocati)
          </h4>
          <span className="text-[11px] text-slate-400">Casa / Trasferta</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Home bench */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
              Panchina Casa
            </span>
            {homeBench.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-200">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-5 text-center font-mono font-bold text-slate-400 text-[11px]">{p.number}</span>
                  <span className="truncate text-xs font-medium">{p.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 px-1 bg-slate-700/60 rounded">{p.position}</span>
              </div>
            ))}
          </div>

          {/* Away bench */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">
              Panchina Trasferta
            </span>
            {awayBench.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-200">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-5 text-center font-mono font-bold text-slate-400 text-[11px]">{p.number}</span>
                  <span className="truncate text-xs font-medium">{p.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 px-1 bg-slate-700/60 rounded">{p.position}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
