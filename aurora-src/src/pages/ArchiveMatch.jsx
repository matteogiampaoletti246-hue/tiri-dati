import { Navigate, useParams } from 'react-router-dom';

// Vecchio indirizzo delle partite dei campionati aggiunti: ora si usa la stessa pagina partita dei top campionati.
export default function ArchiveMatch() {
  const { fm, sk, mid } = useParams();
  return <Navigate to={`/match/a-${fm}-${sk}-${mid}`} replace />;
}
