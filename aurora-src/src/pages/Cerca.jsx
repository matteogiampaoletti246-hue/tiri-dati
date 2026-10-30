import { useNavigate } from 'react-router-dom';
import SearchOverlay from '@/components/SearchOverlay';
import { goBack } from '@/lib/carousel';

// Ricerca a pagina intera (aperta dalla lente della Home nativa): la Home del sito non compare mai sotto.
export default function Cerca() {
  const navigate = useNavigate();
  return <SearchOverlay open page onClose={() => goBack(navigate)} />;
}
