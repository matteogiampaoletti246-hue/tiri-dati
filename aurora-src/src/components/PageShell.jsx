import { motion } from 'framer-motion';
import BottomBar from './BottomBar';
import useSwipeBack from '@/hooks/useSwipeBack';

export default function PageShell({ children, bar = true, swipeBack = true, className = '' }) {
  useSwipeBack(swipeBack);
  return (
    <>
      <div className="aurora-bg" aria-hidden="true" />
      <motion.div
        id="sl-shell"
        initial={{ opacity: 0, x: 14 }}
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
