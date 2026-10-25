import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';

const CLOSE_AT = 1800;
const GONE_AT = 2500;

export default function LaunchScreen() {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem('sl-launched');
    } catch (e) {
      return true;
    }
  });
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;
    const t1 = setTimeout(() => setClosing(true), CLOSE_AT);
    const t2 = setTimeout(() => {
      try {
        sessionStorage.setItem('sl-launched', '1');
      } catch (e) {
        /* ignora */
      }
      setVisible(false);
    }, GONE_AT);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible]);

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
