import { useNavigate } from 'react-router-dom';

// Link riutilizzabile a una squadra: funziona anche dentro una riga già cliccabile
// (l'evento non arriva al contenitore, così il tap sulla riga resta invariato).
export default function TeamLink({ team, children, className = '' }) {
  const navigate = useNavigate();

  if (!team) return <span className={className}>{children}</span>;

  const open = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/squadra/${team.id}`);
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
