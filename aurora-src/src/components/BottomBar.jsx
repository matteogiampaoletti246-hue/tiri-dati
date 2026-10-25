import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Calculator, User, Swords } from 'lucide-react';
import useHideOnScroll from '@/hooks/useHideOnScroll';

const ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon, exact: true },
  { to: '/calcolatore', label: 'Calcolatore', icon: Calculator },
  { to: '/migliori-giocatori', label: 'Giocatori', icon: User },
  { to: '/migliori-matchup', label: 'Matchup', icon: Swords },
];

export default function BottomBar() {
  const hidden = useHideOnScroll();
  const { pathname } = useLocation();

  const isActive = (item) => (item.exact ? pathname === item.to : pathname.startsWith(item.to));

  return (
    <nav
      className="glass-bar fixed inset-x-0 bottom-0 z-40 transition-transform duration-500 ease-[cubic-bezier(.22,.8,.24,1)]"
      style={{ transform: hidden ? 'translateY(115%)' : 'translateY(0)' }}
    >
      <div className="mx-auto flex max-w-[430px] items-center justify-around px-6 pb-4 pt-3">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = isActive({ to, exact: to === '/' });
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className="icon-btn flex h-9 w-12 items-center justify-center"
              style={{ color: active ? 'var(--accent)' : 'var(--ink-3)' }}
            >
              <Icon size={21} strokeWidth={1.2} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
