import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import { isNative } from '@/lib/carousel';

// Tasto rotondo fisso in basso a destra nella scheda giocatore: porta lo stesso giocatore nel Calcolatore.
// Portale a posizione fissa (non scorre con la pagina) come il tasto "Vai a"; `data-pf` lo fa muovere con la pagina durante lo swipe indietro.
export default function CalcFab({ playerId }) {
  const navigate = useNavigate();
  return createPortal(
    <div data-pf="1" data-fast-ok="1" style={{ position: 'fixed', left: 0, right: 0, margin: '0 auto', maxWidth: 'var(--app-w)', bottom: `calc(env(safe-area-inset-bottom, 0px) + ${isNative() ? 28 : 96}px)`, height: 0, zIndex: 25, pointerEvents: 'none' }}>
      <button
        type="button"
        aria-label="Apri nel Calcolatore"
        onClick={() => navigate('/calcolatore', { state: { calc: { playerId } } })}
        className="press absolute grid place-items-center rounded-full"
        style={{ right: 16, bottom: 0, width: 56, height: 56, pointerEvents: 'auto', background: 'var(--accent)', color: '#fff', boxShadow: '0 8px 22px -6px color-mix(in srgb, var(--accent) 70%, transparent), 0 2px 8px rgba(0,0,0,.35)' }}
      >
        <Calculator size={26} strokeWidth={1.75} />
      </button>
    </div>,
    document.body,
  );
}
