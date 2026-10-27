import BottomBar from './BottomBar';
import { useNavigationType } from 'react-router-dom';
import useSwipeBack from '@/hooks/useSwipeBack';

export default function PageShell({ children, bar = true, swipeBack = true, className = '' }) {
  useSwipeBack(swipeBack);
  const pop = useNavigationType() === 'POP';
  return (
    <>
      <div className="aurora-bg" aria-hidden="true" />
      <div
        id="sl-shell"
        className={`relative mx-auto min-h-screen w-full max-w-[var(--app-w)] ${pop ? '' : 'shell-in'} ${bar ? 'pb-24' : ''} ${className}`}
      >
        {children}
      </div>
      {bar ? <BottomBar /> : null}
    </>
  );
}
