import { useNavigate } from 'react-router-dom';
import { openPlayer, ourPlayerId } from '@/data/playerSheet';

// Nome cliccabile: partita iniziata o finita → tendina del giocatore; altrimenti → scheda giocatore.
export default function PlayerLink({ match, name, fmId, className = '', style, children }) {
  const navigate = useNavigate();
  if (!name || /^\(?\s*(tbd|tba|n\/a|unknown)\s*\)?$/i.test(String(name).trim())) return <span className={className} style={style}>{children}</span>;
  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (match && match.status !== 'scheduled') openPlayer({ matchId: match.id, name, fmId });
    else {
      const id = ourPlayerId(match, name, fmId);
      if (id) navigate(`/giocatore/${id}`);
    }
  };
  return (
    <button type="button" onClick={onClick} className={`press min-w-0 ${className}`} style={{ textAlign: 'inherit', color: 'inherit', font: 'inherit', ...style }}>
      {children || name}
    </button>
  );
}
