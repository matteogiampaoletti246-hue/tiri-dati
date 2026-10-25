import React from 'react';

interface ComparisonBarProps {
  label: string;
  homeVal: number;
  awayVal: number;
  type?: 'int' | 'pct' | 'float';
  homeLabel?: string;
  awayLabel?: string;
  highlightLeader?: boolean;
}

export const ComparisonBar: React.FC<ComparisonBarProps> = ({
  label,
  homeVal,
  awayVal,
  type = 'int',
  highlightLeader = true
}) => {
  const sum = (homeVal + awayVal) || 1;
  const homePct = (homeVal / sum) * 100;
  const awayPct = (awayVal / sum) * 100;

  const isHomeLeader = highlightLeader && homeVal > awayVal;
  const isAwayLeader = highlightLeader && awayVal > homeVal;

  const formatVal = (v: number) => {
    if (type === 'pct') return `${v}%`;
    if (type === 'float') return v.toFixed(2);
    return v.toString();
  };

  return (
    <div className="py-2.5 border-b border-slate-800/60 last:border-none">
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span className={`font-mono font-semibold tabular-nums text-sm ${isHomeLeader ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
          {formatVal(homeVal)}
        </span>
        <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider text-center px-2">
          {label}
        </span>
        <span className={`font-mono font-semibold tabular-nums text-sm ${isAwayLeader ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
          {formatVal(awayVal)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 h-1.5 w-full">
        {/* Home side bar fills right to left */}
        <div className="w-full bg-slate-800/80 rounded-full h-full overflow-hidden flex justify-end">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isHomeLeader ? 'bg-emerald-400' : 'bg-slate-500'
            }`}
            style={{ width: `${Math.max(4, homePct)}%` }}
          />
        </div>
        {/* Away side bar fills left to right */}
        <div className="w-full bg-slate-800/80 rounded-full h-full overflow-hidden flex justify-start">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isAwayLeader ? 'bg-blue-400' : 'bg-slate-500'
            }`}
            style={{ width: `${Math.max(4, awayPct)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
