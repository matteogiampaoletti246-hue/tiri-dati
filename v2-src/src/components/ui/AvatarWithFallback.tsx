import React, { useState } from 'react';

interface AvatarWithFallbackProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'rounded';
  className?: string;
}

export const AvatarWithFallback: React.FC<AvatarWithFallbackProps> = ({
  src,
  name,
  size = 'md',
  shape = 'circle',
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (str: string) => {
    if (!str) return '??';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base'
  };

  const shapeClasses = {
    circle: 'rounded-full',
    rounded: 'rounded-xl'
  };

  // Deterministic soft color from name
  const getColorFromName = (str: string) => {
    const colors = [
      'bg-slate-700 text-slate-200 border-slate-600',
      'bg-emerald-950 text-emerald-300 border-emerald-800',
      'bg-blue-950 text-blue-300 border-blue-800',
      'bg-amber-950 text-amber-300 border-amber-800',
      'bg-indigo-950 text-indigo-300 border-indigo-800',
      'bg-rose-950 text-rose-300 border-rose-800'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center font-semibold border select-none shrink-0 ${shapeClasses[shape]} ${sizeClasses[size]} ${getColorFromName(name)} ${className}`}
        title={name}
        aria-label={name}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 overflow-hidden ${shapeClasses[shape]} ${sizeClasses[size]} ${className}`}>
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain p-0.5"
      />
    </div>
  );
};
