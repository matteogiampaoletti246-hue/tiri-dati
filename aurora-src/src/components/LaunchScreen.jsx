import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';

const CLOSE_AT = 1800;
const GONE_AT = 2500;

export default function LaunchScreen({ ready = true }) {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem('sl-launched');
    } catch (e) {
      return true;
    }
  });
  const [minDone, setMinDone] = useState(false);
  const [closing, setClosing] = useState(false);

  // la schermata resta almeno CLOSE_AT ms e finché i dati non sono pronti
  useEffect(() => {
    if (!visible) return undefined;
    const t = setTimeout(() => setMinDone(true), CLOSE_AT);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!visible || !minDone || !ready) return undefined;
    setClosing(true);
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem('sl-launched', '1');
      } catch (e) {
        /* ignora */
      }
      setVisible(false);
    }, GONE_AT - CLOSE_AT);
    return () => clearTimeout(t);
  }, [visible, minDone, ready]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700"
      style={{ opacity: closing ? 0 : 1, transform: closing ? 'scale(1.035)' : 'none', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <div className="aurora-bg" />
      <div className="grain" />

      <div className="launch-mark relative flex items-center justify-center">
        <span className="launch-ring absolute" />
        <Logo size={104} animated />
      </div>

      <span className="launch-word title-lg mt-6 text-[22px] tracking-[-.045em]" style={{ color: 'var(--ink)' }}>
        ScalperLab
      </span>
    </div>
  );
}
