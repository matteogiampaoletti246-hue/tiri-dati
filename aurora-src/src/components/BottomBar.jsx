import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home as HomeIcon, Calculator, Users, Swords } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon, exact: true },
  { to: '/calcolatore', label: 'Calcolatore', icon: Calculator },
  { to: '/migliori-giocatori', label: 'Giocatori', icon: Users },
  { to: '/migliori-matchup', label: 'Matchup', icon: Swords },
];

// Barra in basso: vetro, l'indicatore scivola da una voce all'altra.
function BottomBar() {
  const { pathname } = useLocation();
  const isActive = (item) => (item.exact ? pathname === item.to : pathname.startsWith(item.to));

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40"
      style={{
        background: 'linear-gradient(to top, hsl(var(--background)) 62%, transparent)',
      }}
    >
      <div className="mx-auto w-full max-w-[var(--app-w)] px-4 pt-2">
        <div className="flex rounded-[26px] p-1.5" style={{ background: 'var(--sky-2)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
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

// memo: non si ridisegna quando cambia il contenuto della pagina (evita misure di layout inutili)
export default memo(BottomBar);
