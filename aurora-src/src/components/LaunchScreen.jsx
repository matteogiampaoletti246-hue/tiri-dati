import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

// Avvio: il logo si disegna al centro, la scritta ScalperLab esce da dietro il logo,
// poi logo e scritta insieme volano in alto a sinistra, dove restano come intestazione.
const LOGO = 64;
const GAP = 11;
const TEXT = 34;

const alreadyLaunched = () => {
  try {
    return !!sessionStorage.getItem('sl-launched');
  } catch {
    return true;
  }
};

export default function LaunchScreen({ ready = true }) {
  const [visible, setVisible] = useState(() => !alreadyLaunched());
  const [reveal, setReveal] = useState(false);
  const [fly, setFly] = useState(false);
  const [fade, setFade] = useState(false);
  const [textW, setTextW] = useState(0);
  const [delta, setDelta] = useState({ x: 0, y: 0, s: 0.43 });
  const t0 = useRef(Date.now());
  const measure = useRef(null);
  const pair = useRef(null);

  useLayoutEffect(() => {
    const m = () => measure.current && setTextW(Math.ceil(measure.current.getBoundingClientRect().width) + 10);
    m();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(m);
  }, [visible]);

  // 1) il logo si disegna, 2) esce la scritta
  useEffect(() => {
    if (!visible) return undefined;
    const t = setTimeout(() => setReveal(true), 1150);
    return () => clearTimeout(t);
  }, [visible]);

  // 3) dopo la scritta (e a dati pronti) parte il volo verso l'intestazione
  useEffect(() => {
    if (!visible || !reveal || !ready || fly) return undefined;
    const wait = Math.max(0, 2250 - (Date.now() - t0.current));
    const t = setTimeout(() => {
      const from = pair.current && pair.current.getBoundingClientRect();
      const brand = document.getElementById('sl-brand');
      const to = brand ? brand.getBoundingClientRect() : { left: 20, top: 14, width: from ? from.width * 0.43 : 100 };
      if (from) {
        const s = to.width / from.width;
        setDelta({ x: to.left - from.left, y: to.top - from.top, s });
      }
      setFly(true);
    }, wait);
    return () => clearTimeout(t);
  }, [visible, reveal, ready, fly]);

  useEffect(() => {
    if (!fly) return undefined;
    const t1 = setTimeout(() => {
      window.dispatchEvent(new Event('sl-launch-done'));
      setFade(true);
    }, 760);
    const t2 = setTimeout(() => {
      try {
        sessionStorage.setItem('sl-launched', '1');
      } catch {
        /* ignora */
      }
      setVisible(false);
    }, 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [fly]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden"
      style={{ pointerEvents: 'none', opacity: fade ? 0 : 1, transition: 'opacity .4s ease' }}
      aria-hidden="true"
    >
      <div className="aurora-bg" style={{ opacity: fly ? 0 : 1, transition: 'opacity .55s ease .15s', zIndex: -1 }} />

      <span
        ref={measure}
        className="title-lg absolute whitespace-nowrap opacity-0"
        style={{ fontSize: TEXT, letterSpacing: '-.04em' }}
      >
        ScalperLab
      </span>

      <motion.div
        ref={pair}
        className="flex items-center"
        style={{ transformOrigin: 'left top', color: 'var(--ink)' }}
        animate={fly ? { x: delta.x, y: delta.y, scale: delta.s } : { x: 0, y: 0, scale: 1 }}
        transition={{ duration: 0.72, ease: [0.65, 0, 0.35, 1] }}
      >
        <div className="relative z-10 shrink-0" style={{ width: LOGO, height: LOGO }}>
          <Logo size={LOGO} draw />
        </div>
        <motion.div
          className="overflow-hidden"
          style={{ paddingBottom: 6, marginBottom: -6 }}
          initial={{ width: 0 }}
          animate={{ width: reveal ? textW + GAP : 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            className="title-lg block whitespace-nowrap"
            style={{ fontSize: TEXT, letterSpacing: '-.04em', paddingLeft: GAP }}
            initial={{ x: -(textW + GAP) }}
            animate={{ x: reveal ? 0 : -(textW + GAP) }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            ScalperLab
          </motion.span>
        </motion.div>
      </motion.div>
    </div>
  );
}
