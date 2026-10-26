import { motion } from 'framer-motion';
import BottomBar from './BottomBar';
import { useNavigationType } from 'react-router-dom';
import useSwipeBack from '@/hooks/useSwipeBack';

export default function PageShell({ children, bar = true, swipeBack = true, className = '' }) {
  useSwipeBack(swipeBack);
  const pop = useNavigationType() === 'POP';
  return (
    <>
      <div className="aurora-bg" aria-hidden="true" />
      <motion.div
        id="sl-shell"
        initial={pop ? false : { opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className={`relative mx-auto min-h-screen w-full max-w-[430px] ${bar ? 'pb-24' : ''} ${className}`}
      >
        {children}
      </motion.div>
      {bar ? <BottomBar /> : null}
    </>
  );
}
