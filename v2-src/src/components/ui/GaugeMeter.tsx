import React from 'react';

interface GaugeMeterProps {
  score: number;
  label?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  max?: number;
}

export const GaugeMeter: React.FC<GaugeMeterProps> = ({
  score,
  label,
  color,
  size = 'md',
  max = 10
}) => {
  const percent = Math.min(100, Math.max(0, (score / max) * 100));

  const resolvedColor = color || (
    score >= 8 ? '#10B981' :
    score >= 6.5 ? '#34D399' :
    score >= 5 ? '#F59E0B' :
    score >= 3 ? '#F59E0B' : '#EF4444'
  );

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl font-extrabold tracking-tight tabular-nums text-slate-100">
            {score > 0 ? score.toFixed(2).replace('.', ',') : '–'}
          </span>
          <span className="text-xs text-slate-400 font-medium">/ {max}</span>
        </div>
        {label && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color: resolvedColor, backgroundColor: `${resolvedColor}1A` }}
          >
            {label}
          </span>
        )}
      </div>

      {/* Progress track */}
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percent}%`,
            backgroundColor: resolvedColor,
            boxShadow: `0 0 10px ${resolvedColor}66`
          }}
        />
      </div>
    </div>
  );
};
