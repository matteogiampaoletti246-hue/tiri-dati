export default function Crest({ team, size = 34, className = '' }) {
  if (!team) return null;
  const style = {
    width: size,
    height: size,
    background: `linear-gradient(150deg, ${team.colors[0]}, ${team.colors[1]})`,
  };
  return (
    <span className={`crest ${className}`} style={style}>
      {team.crest ? (
        <img
          src={team.crest}
          alt={team.name}
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="tnum" style={{ fontSize: Math.max(9, Math.round(size * 0.3)) }}>
          {team.initials}
        </span>
      )}
    </span>
  );
}
