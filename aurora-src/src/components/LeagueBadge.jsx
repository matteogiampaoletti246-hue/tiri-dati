import useDark from '@/hooks/useDark';

export default function LeagueBadge({ league, size = 26, className = '' }) {
  const dark = useDark();
  if (!league) return null;
  const logo = dark && league.logoDark ? league.logoDark : league.logo;
  const style = {
    width: size,
    height: size,
    background: `linear-gradient(150deg, ${league.colors[0]}, ${league.colors[1]})`,
  };
  return (
    <span className={`crest ${className}`} style={style}>
      {logo ? (
        <img src={logo} alt={league.name} width={size} height={size} loading="lazy" className="h-full w-full object-contain" />
      ) : (
        <span className="tnum" style={{ fontSize: Math.max(9, Math.round(size * 0.3)) }}>
          {league.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
      )}
    </span>
  );
}
