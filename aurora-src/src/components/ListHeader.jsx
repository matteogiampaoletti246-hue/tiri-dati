import { Search } from 'lucide-react';
import TopBar from './TopBar';

// Intestazione delle liste: titolo, conteggio e apertura della ricerca.
export default function ListHeader({ title, subtitle, onSearch }) {
  return (
    <TopBar
      title={title}
      subtitle={subtitle}
      back={false}
      right={
        <button type="button" className="icon-btn" aria-label="Cerca" onClick={onSearch}>
          <Search size={19} strokeWidth={1.25} />
        </button>
      }
    />
  );
}
