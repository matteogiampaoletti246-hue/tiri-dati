import { openPlayer, ourPlayerId } from '@/data/playerSheet';
import { matchStarted, openPanel } from '@/data/playerPanel';

// Nome cliccabile: partita iniziata o finita → tendina del giocatore dal basso; non ancora iniziata → pannello giocatore da destra.
export default function PlayerLink({ match, name, fmId, className = '', style, children }) {
  if (!name || /^\(?\s*(tbd|tba|n\/a|unknown)\s*\)?$/i.test(String(name).trim())) return <span className={className} style={style}>{children}</span>;
  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (matchStarted(match)) openPlayer({ matchId: match.id, name, fmId });
    else {
      const id = ourPlayerId(match, name, fmId);
      if (id) openPanel(id);
    }
  };
  return (
    <button type="button" onClick={onClick} className={`press min-w-0 ${className}`} style={{ textAlign: 'inherit', color: 'inherit', font: 'inherit', ...style }}>
      {children || name}
    </button>
  );
}
