import { useRef } from 'react';
import BottomBar from './BottomBar';
import { useLocation, useNavigationType } from 'react-router-dom';
import useSwipeBack from '@/hooks/useSwipeBack';
import { consumeQuiet } from '@/lib/carousel';

export default function PageShell({ children, bar = true, swipeBack = true, className = '' }) {
  useSwipeBack(swipeBack);
  const pop = useNavigationType() === 'POP';
  // chiave della voce di cronologia di questa pagina: lo swipe indietro distingue la pagina di destinazione da quella che esce
  const lk = useLocation().key;
  const quiet = useRef(null);
  if (quiet.current === null) quiet.current = consumeQuiet();
  return (
    <>
      <div className="aurora-bg" aria-hidden="true" />
      <div
        id="sl-shell"
        data-lk={lk}
        className={`relative mx-auto min-h-screen w-full max-w-[var(--app-w)] ${quiet.current ? '' : pop ? 'shell-pop' : 'shell-in'} ${bar ? 'pb-24' : ''} ${className}`}
      >
        {children}
      </div>
      {bar ? <BottomBar /> : null}
    </>
  );
}
