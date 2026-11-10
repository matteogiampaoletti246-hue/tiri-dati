import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

// Avvio (concept C "Dock", 10/11/2026): il diamante compare al centro con un rimbalzo, un alone e un riflesso di luce;
// poi sale in alto a sinistra, nel posto del logo dell'intestazione, e da dietro il diamante esce la scritta ScalperLab.
const LOGO = 116;
const TEXT = 22;
const MIN_POP = 1450; // tempo minimo del diamante al centro prima del volo
const FLY = 750;

const alreadyLaunched = () => {
  try {
    return !!sessionStorage.getItem('sl-launched');
  } catch {
    return true;
  }
};

export default function LaunchScreen({ ready = true }) {
  const [visible, setVisible] = useState(() => !alreadyLaunched());
  const [phase, setPhase] = useState(0); // 0 diamante al centro, 1 volo, 2 scritta, 3 dissolvenza
  const [textW, setTextW] = useState(0);
  const [dock, setDock] = useState(null);
  const t0 = useRef(Date.now());
  const measure = useRef(null);
  const logoBox = useRef(null);

  useLayoutEffect(() => {
    const m = () => measure.current && setTextW(Math.ceil(measure.current.getBoundingClientRect().width) + 4);
    m();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(m);
  }, [visible]);

  // 1) dopo il tempo minimo e a dati pronti (home già disegnata sotto) il diamante vola nel posto del logo
  useEffect(() => {
    if (!visible || phase !== 0 || !ready) return undefined;
    const wait = Math.max(0, MIN_POP - (Date.now() - t0.current));
    const t = setTimeout(() => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const from = logoBox.current && logoBox.current.getBoundingClientRect();
          const brand = document.getElementById('sl-brand');
          const to = brand && brand.getBoundingClientRect();
          if (from && to) setDock({ x: to.left - from.left, y: to.top - from.top, s: to.width / from.width, left: to.left, top: to.top, w: to.width, h: to.height });
          setPhase(1);
        })
      );
    }, wait);
    return () => clearTimeout(t);
  }, [visible, phase, ready]);

  // 2) a volo quasi finito esce la scritta, poi tutto si dissolve sul logo vero dell'intestazione
  useEffect(() => {
    if (!visible || phase < 1) return undefined;
    const ts = [];
    if (phase === 1) ts.push(setTimeout(() => setPhase(2), FLY - 150));
    if (phase === 2) {
      // volo finito: il logo vero dell'intestazione compare sotto il diamante; la scritta resta un attimo, poi si dissolve
      ts.push(
        setTimeout(() => {
          window.__slDone = true; // l'intestazione può nascere dopo l'evento: legge anche questo
          window.dispatchEvent(new Event('sl-launch-done'));
        }, 150)
      );
      ts.push(setTimeout(() => setPhase(3), 1250));
    }
    if (phase === 3) {
      window.__slEnd = true;
      window.dispatchEvent(new Event('sl-launch-end'));
      ts.push(
        setTimeout(() => {
          try {
            sessionStorage.setItem('sl-launched', '1');
          } catch {
            /* ignora */
          }
          setVisible(false);
        }, 450)
      );
    }
    return () => ts.forEach(clearTimeout);
  }, [visible, phase]);

  if (!visible) return null;

  const fly = phase >= 1 && dock;
  const textIn = phase >= 2;
  // la scritta e il diamante restano finché dura la fase 3, poi spariscono insieme (il logo vero è già sotto)
  const fade = phase >= 3;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden"
      style={{ pointerEvents: 'none', opacity: fade ? 0 : 1, transition: 'opacity .4s ease' }}
      aria-hidden="true"
    >
      <div className="aurora-bg" style={{ opacity: fly ? 0 : 1, transition: 'opacity .55s ease .1s', zIndex: -1 }} />

      {/* alone azzurro dietro il diamante */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(37,99,235,.42), rgba(34,211,238,.12) 45%, transparent 70%)', filter: 'blur(10px)' }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={fly ? { opacity: 0, scale: 0.5 } : { opacity: [0, 1, 0.8], scale: [0.6, 1, 1.05] }}
        transition={fly ? { duration: 0.5 } : { duration: 1.4, times: [0, 0.3, 1], ease: 'easeInOut' }}
      />

      <span
        ref={measure}
        className="title-lg absolute whitespace-nowrap opacity-0"
        style={{ fontSize: TEXT, letterSpacing: '-.04em' }}
      >
        ScalperLab
      </span>

      <div
        ref={logoBox}
        className="relative z-10 shrink-0"
        style={{
          width: LOGO,
          height: LOGO,
          transformOrigin: 'left top',
          willChange: 'transform',
          transform: fly ? `translate3d(${dock.x}px, ${dock.y}px, 0) scale(${dock.s})` : 'translate3d(0, 0, 0) scale(1)',
          transition: fly ? `transform ${FLY}ms cubic-bezier(.7,0,.2,1)` : 'none',
        }}
      >
        <motion.div
          style={{ width: LOGO, height: LOGO }}
          initial={{ scale: 0.3, opacity: 0, filter: 'blur(12px)' }}
          animate={{ scale: [0.3, 1.1, 1], opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.85, times: [0, 0.6, 1], ease: [0.34, 1.2, 0.64, 1], opacity: { duration: 0.3 }, filter: { duration: 0.5 } }}
        >
          <Logo size={LOGO} shine={0.8} spark={0.9} />
        </motion.div>
      </div>

      {/* la scritta esce da dietro il diamante, accanto al suo posto nell'intestazione */}
      {dock ? (
        <div
          className="absolute overflow-hidden"
          style={{ left: dock.left + dock.w + 4, top: dock.top, height: dock.h, width: textW + 8, display: 'flex', alignItems: 'center' }}
        >
          <motion.span
            className="title-lg block whitespace-nowrap"
            style={{ fontSize: TEXT, letterSpacing: '-.04em', color: 'var(--ink)', paddingLeft: 4 }}
            initial={{ x: '-105%', opacity: 0 }}
            animate={textIn ? { x: 0, opacity: 1 } : { x: '-105%', opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            Scalper<span style={{ color: 'var(--accent)' }}>Lab</span>
          </motion.span>
        </div>
      ) : null}
    </div>
  );
}
