import { useLayoutEffect, useRef } from 'react';
import { pendingSlide, slideIn } from '@/lib/tabSlide';
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
  // cambio scheda col dock: la pagina entra scorrendo di lato (lib/tabSlide.js) al posto della dissolvenza
  const tab = useRef(null);
  if (tab.current === null) tab.current = pendingSlide();
  useLayoutEffect(() => { if (tab.current) slideIn(); }, []);
  // Ingresso "a fuoco" (shell-in): la sfocatura lavora solo sulla parte di pagina che si vede. La pagina intera e' alta anche migliaia
  // di pixel e sfocarla tutta a ogni fotogramma era il lavoro piu' pesante di ogni apertura; per la durata dell'animazione (0,34 s)
  // il contenitore e' alto quanto lo schermo e ritagliato (.shell-clip), poi torna normale. Una pagina nuova parte sempre da in cima.
  const shell = useRef(null);
  useLayoutEffect(() => {
    const el = shell.current;
    if (!el || !el.classList.contains('shell-in')) return undefined;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    el.classList.add('shell-clip');
    const off = () => { el.classList.remove('shell-clip'); el.removeEventListener('animationend', onEnd); el.removeEventListener('animationcancel', onEnd); };
    const onEnd = (e) => { if (e.target === el) off(); };
    el.addEventListener('animationend', onEnd);
    el.addEventListener('animationcancel', onEnd);
    const t = setTimeout(off, 600);
    // se si scorre prima della fine, la pagina torna subito intera
    const onScroll = () => { if (window.scrollY > 0) off(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll); off(); };
  }, []);
  return (
    <>
      <div className="aurora-bg" aria-hidden="true" />
      <div
        ref={shell}
        id="sl-shell"
        data-lk={lk}
        className={`relative mx-auto min-h-screen w-full max-w-[var(--app-w)] ${quiet.current || tab.current ? '' : pop ? 'shell-pop' : 'shell-in'} ${bar ? 'pb-24' : ''} ${className}`}
      >
        {children}
      </div>
      {bar ? <BottomBar /> : null}
    </>
  );
}
