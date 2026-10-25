import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home as HomeIcon, Calculator, Users, Swords } from 'lucide-react';
import useHideOnScroll from '@/hooks/useHideOnScroll';

const ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon, exact: true },
  { to: '/calcolatore', label: 'Calcolatore', icon: Calculator },
  { to: '/migliori-giocatori', label: 'Giocatori', icon: Users },
  { to: '/migliori-matchup', label: 'Matchup', icon: Swords },
];

// Barra in basso: vetro, l'indicatore scivola da una voce all'altra.
export default function BottomBar() {
  const hidden = useHideOnScroll();
  const { pathname } = useLocation();
  const isActive = (item) => (item.exact ? pathname === item.to : pathname.startsWith(item.to));

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40"
      style={{
        transform: hidden ? 'translateY(150%)' : 'translateY(0)',
        transition: 'transform .45s cubic-bezier(.22,.8,.24,1)',
      }}
    >
      <div className="mx-auto w-full max-w-[430px] px-4 pt-2">
        <div className="glass-strong flex rounded-[26px] p-1.5">
          {ITEMS.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive({ to, exact });
            return (
              <Link key={to} to={to} aria-label={label} className="press relative flex flex-1 flex-col items-center gap-1 rounded-[20px] py-2">
                {active ? (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-[20px]"
                    style={{ background: 'var(--pill-active)' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <Icon size={19} strokeWidth={1.7} className="relative" style={{ color: active ? 'var(--accent)' : 'var(--ink-3)' }} />
                <span className="relative text-[10px] font-bold tracking-wide" style={{ color: active ? 'var(--ink)' : 'var(--ink-3)' }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
