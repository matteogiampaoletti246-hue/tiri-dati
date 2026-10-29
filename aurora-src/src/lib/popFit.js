import { useLayoutEffect, useState } from 'react';

// Altezza massima di una tendina aperta (come Sofascore): sta sempre sopra la barra in basso con un margine,
// scorre solo la lista e, se sotto il tasto c'e' poco spazio, si apre verso l'alto.
const MARGIN = 12;
const CAP = 420;
export function popRoom(btn, width = 0) {
  if (!btn) return { up: false, max: CAP, right: false };
  const r = btn.getBoundingClientRect();
  const nav = document.querySelector('nav.fixed');
  const bottom = nav ? nav.getBoundingClientRect().top : window.innerHeight;
  const below = Math.floor(bottom - r.bottom - 8 - MARGIN);
  const above = Math.floor(r.top - 8 - MARGIN - 56);
  const right = width > 0 && r.left + width > window.innerWidth - 8; // non esce dal bordo destro
  if (below < 220 && above > below) return { up: true, max: Math.min(CAP, above), right };
  return { up: false, max: Math.max(120, Math.min(CAP, below)), right };
}

export function usePopFit(ref, open, width = 0) {
  const [room, setRoom] = useState({ up: false, max: CAP, right: false });
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    setRoom(popRoom(ref.current.firstElementChild || ref.current, width));
  }, [open, ref, width]);
  return room;
}

// stile comune della lista: scorre solo lei, lo scorrimento non passa mai alla pagina dietro
export const popScroll = (room) => ({ maxHeight: room.max, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' });
