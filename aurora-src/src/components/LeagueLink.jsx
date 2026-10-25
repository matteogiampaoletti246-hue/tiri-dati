import { useNavigate } from 'react-router-dom';

// Link riutilizzabile a un campionato (stessa logica di TeamLink).
export default function LeagueLink({ league, children, className = '' }) {
  const navigate = useNavigate();

  if (!league) return <span className={className}>{children}</span>;

  const open = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/campionato/${league.id}`);
  };

  return (
    <span
      className={className}
      role="link"
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') open(e);
      }}
    >
      {children}
    </span>
  );
}
