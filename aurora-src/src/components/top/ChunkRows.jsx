import { memo, useEffect, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { savedScroll } from '@/components/ScrollToTop';

const FIRST = 10; // righe del giorno mostrato al primo disegno
const NEAR = 5; // righe dei giorni vicini (fuori schermo): bastano per lo swipe
const STEP = 15;
const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 60));
const cancelIdle = (id) => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));

// Lista lunga a pezzi: si monta l'inizio, il resto a riposo. Le righe fuori schermo non si disegnano (content-visibility).
// Tornando a una pagina che era stata scorsa la lista nasce intera: deve riavere subito la sua altezza. Le righe mostrate alla fine sono sempre tutte.
export default memo(function ChunkRows({ rows, active, rowH, keyOf, renderRow }) {
  const loc = useLocation();
  const pop = useNavigationType() === 'POP' && savedScroll(loc) > 0;
  const [n, setN] = useState(() => (pop ? rows.length : active ? FIRST : NEAR));
  useEffect(() => {
    if (!active || n >= rows.length) return undefined;
    const id = idle(() => setN((x) => x + STEP));
    return () => cancelIdle(id);
  }, [active, n, rows.length]);
  return (
    <div>
      {rows.slice(0, n).map((row, k) => (
        <div key={keyOf(row)} style={{ contentVisibility: 'auto', containIntrinsicSize: `auto ${rowH}px` }}>{renderRow(row, k)}</div>
      ))}
    </div>
  );
});
