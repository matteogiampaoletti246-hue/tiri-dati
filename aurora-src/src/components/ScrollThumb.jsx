import { useEffect, useRef } from 'react';

// Barra di scorrimento laterale (21st "Scroll Area" di Wensity, concept C): sottile, compare mentre la pagina scorre e
// sparisce dopo 1 s. Legge soltanto lo scorrimento (listener passivo + un fotogramma alla volta, solo transform/opacity):
// velocita', inerzia e regole dello scroll restano identiche. Nascosta se la pagina non scorre o c'e' una finestra aperta.
export default function ScrollThumb() {
  const el = useRef(null);
  useEffect(() => {
    const n = el.current;
    if (!n) return undefined;
    let raf = 0;
    let hide = 0;
    const paint = () => {
      raf = 0;
      const de = document.documentElement;
      const vh = window.innerHeight;
      const ch = Math.max(de.scrollHeight, document.body.scrollHeight);
      const ratio = vh / Math.max(ch, 1);
      if (ratio >= 0.98 || document.body.style.position === 'fixed') { n.style.opacity = '0'; return; }
      const track = vh - 150; // finisce sopra il dock
      const h = Math.max(36, track * ratio);
      const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, ch - vh)));
      n.style.height = `${h}px`;
      n.style.transform = `translate3d(0,${6 + p * (track - h)}px,0)`;
      n.style.opacity = '1';
      clearTimeout(hide);
      hide = setTimeout(() => { n.style.opacity = '0'; }, 1000);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(paint); };
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); clearTimeout(hide); };
  }, []);
  return <div ref={el} aria-hidden="true" className="scroll-thumb" />;
}
