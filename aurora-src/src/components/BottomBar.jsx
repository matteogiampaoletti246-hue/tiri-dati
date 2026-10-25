import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Calculator, User, Swords } from 'lucide-react';
import useHideOnScroll from '@/hooks/useHideOnScroll';

const ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon, exact: true },
  { to: '/calcolatore', label: 'Calcolatore', icon: Calculator },
  { to: '/migliori-giocatori', label: 'Giocatori', icon: User },
  { to: '/migliori-matchup', label: 'Matchup', icon: Swords },
];

// Barra in basso: pillola di vetro flottante, icone con etichetta.
export default function BottomBar() {
  const hidden = useHideOnScroll();
  const { pathname } = useLocation();

  const isActive = (item) => (item.exact ? pathname === item.to : pathname.startsWith(item.to));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{
        transform: hidden ? 'translateY(150%)' : 'translateY(0)',
        transition: 'transform .45s cubic-bezier(.22,.8,.24,1)',
      }}
    >
      <div className="mx-auto w-full max-w-[430px] px-5 pb-3">
        <div className="glass-pill flex items-center justify-between gap-1 px-1.5 py-1.5">
          {ITEMS.map(({ to, label, icon: Icon }) => {
            const active = isActive({ to, exact: to === '/' });
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className="flex flex-1 flex-col items-center gap-1 rounded-full py-2 transition-colors duration-300"
                style={{
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--ink-3)',
                }}
              >
                <Icon size={19} strokeWidth={active ? 1.7 : 1.3} />
                <span className="text-[10px] font-medium tracking-[-.005em]">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
