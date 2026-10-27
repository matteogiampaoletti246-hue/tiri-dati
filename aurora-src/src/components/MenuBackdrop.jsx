import { createPortal } from 'react-dom';

// Velo trasparente dietro a una tendina aperta: un tocco fuori la chiude e non attiva nulla sotto.
export default function MenuBackdrop({ onClose }) {
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  return createPortal(
    <div
      aria-hidden="true"
      className="fixed inset-0"
      style={{ zIndex: 95, touchAction: 'none', background: 'transparent' }}
      onPointerDown={stop}
      onTouchStart={stop}
      onTouchMove={stop}
      onClick={(e) => { stop(e); onClose(); }}
    />,
    document.body,
  );
}
