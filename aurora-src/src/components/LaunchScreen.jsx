import { useEffect, useRef, useState } from 'react';
import Logo from '@/components/Logo';

// Tempi dell'animazione di avvio (ms)
const LAND_MIN = 1250; // il marchio resta al centro almeno fin qui, poi sale in alto a sinistra
const FADE_AFTER = 1000; // dopo l'atterraggio si dissolve sopra al logo dell'intestazione
const GONE_AFTER = 550;

const START_SIZE = 104;
const END_SIZE = 23;
const END_LEFT = 20;
const END_TOP = 14;

const alreadyLaunched = () => {
  try {
    return !!sessionStorage.getItem('sl-launched');
  } catch {
    return true;
  }
};

export default function LaunchScreen({ ready = true }) {
  const [visible, setVisible] = useState(() => !alreadyLaunched());
  const [landed, setLanded] = useState(false);
  const [fading, setFading] = useState(false);
  const t0 = useRef(Date.now());
  const [box, setBox] = useState(() => ({
    w: typeof window === 'undefined' ? 390 : Math.min(window.innerWidth, 430),
    h: typeof window === 'undefined' ? 780 : window.innerHeight,
  }));

  useEffect(() => {
    const read = () => setBox({ w: Math.min(window.innerWidth, 430), h: window.innerHeight });
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  // parte solo quando i dati sono pronti (e dopo almeno LAND_MIN ms)
  useEffect(() => {
    if (!visible || !ready || landed) return undefined;
    const wait = Math.max(0, LAND_MIN - (Date.now() - t0.current));
    const t = setTimeout(() => setLanded(true), wait);
    return () => clearTimeout(t);
  }, [visible, ready, landed]);

  useEffect(() => {
    if (!landed) return undefined;
    const timers = [
      setTimeout(() => {
        setFading(true);
        window.dispatchEvent(new Event('sl-launch-done'));
      }, FADE_AFTER),
      setTimeout(() => {
        try {
          sessionStorage.setItem('sl-launched', '1');
        } catch {
          /* ignora */
        }
        setVisible(false);
      }, FADE_AFTER + GONE_AFTER),
    ];
    return () => timers.forEach(clearTimeout);
  }, [landed]);

  if (!visible) return null;

  const side = landed ? END_SIZE : START_SIZE;
  const left = landed ? END_LEFT : Math.round((box.w - START_SIZE) / 2);
  const top = landed ? END_TOP : Math.round((box.h - START_SIZE) / 2);
  const ease = 'cubic-bezier(.65,0,.2,1)';

  return (
    <div
      className="fixed inset-0 z-[70] overflow-hidden transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1, background: 'var(--sky-2)', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <div className="aurora-bg" />
      <div className="grain" />

      <div className="relative mx-auto h-full w-full max-w-[430px]">
        <div
          className="absolute flex items-center justify-center"
          style={{
            left,
            top,
            width: side,
            height: side,
            transition: landed ? `left .9s ${ease}, top .9s ${ease}, width .9s ${ease}, height .9s ${ease}` : 'none',
          }}
        >
          <Logo size="100%" animated />
        </div>

        <span
          className="launch-word title-lg absolute text-[24px] tracking-[-.045em]"
          style={{
            left: 0,
            right: 0,
            top: box.h / 2 + START_SIZE / 2 + 18,
            textAlign: 'center',
            color: 'var(--ink)',
            opacity: landed ? 0 : 1,
            transition: 'opacity .35s ease',
          }}
        >
          ScalperLab
        </span>
      </div>
    </div>
  );
}
