import BottomBar from './BottomBar';
import useSwipeBack from '@/hooks/useSwipeBack';

export default function PageShell({ children, bar = true, swipeBack = true, className = '' }) {
  useSwipeBack(swipeBack);
  return (
    <>
      <div className="aurora-bg" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div
        id="sl-shell"
        className={`relative mx-auto min-h-screen w-full max-w-[430px] ${bar ? 'pb-24' : ''} ${className}`}
        style={{ willChange: 'transform' }}
      >
        {children}
      </div>
      {bar ? <BottomBar /> : null}
    </>
  );
}
