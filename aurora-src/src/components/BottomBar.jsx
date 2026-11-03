import { memo, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isNative } from '@/lib/carousel';
import { Home as HomeIcon, Calculator, Users, Swords } from 'lucide-react';
import './dock.css';

const ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon, exact: true },
  { to: '/calcolatore', label: 'Calcolatore', icon: Calculator },
  { to: '/migliori-giocatori', label: 'Giocatori', icon: Users },
  { to: '/migliori-matchup', label: 'Matchup', icon: Swords },
];
const T = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

// Dock in basso (concept C "isola compatta", uguale alla barra nativa): vetro sfocato, tasselli 46 px, la voce attiva si allarga
// in pillola con il nome. Toccata di nuovo, la voce attiva riporta la pagina in cima.
function BottomBar() {
  const { pathname } = useLocation();
  // voce toccata: si evidenzia nell'istante del tocco, senza aspettare che la pagina nuova sia disegnata (poi segue la rotta vera)
  const [want, setWant] = useState(null);
  useEffect(() => { setWant(null); }, [pathname]);
  const cur = want || pathname;
  const isActive = (item) => (item.exact ? cur === item.to : cur.startsWith(item.to));

  return (
    // layoutRoot: le animazioni non tengono conto dello scorrimento della pagina (il dock e' fisso). Livello proprio per evitare artefatti di Safari.
    <motion.nav
      layoutRoot
      className="dock-nav safe-bottom fixed inset-x-0 bottom-0 z-40 flex justify-center px-3.5 pt-2 pb-2"
      style={{
        transform: 'translate3d(0,0,0)',
        WebkitTransform: 'translate3d(0,0,0)',
        willChange: 'transform',
        contain: 'layout',
        // app nativa: il dock e' quello nativo (sempre sopra la pagina), questo resta invisibile
        ...(isNative() ? { visibility: 'hidden', pointerEvents: 'none' } : null),
      }}
    >
      <div className="dock flex items-center gap-2 rounded-[26px] p-2">
        {ITEMS.map(({ to, label, icon: Icon, exact }, j) => {
          const active = isActive({ to, exact });
          const onClick = (e) => {
            if (to === '/' && isNative()) { e.preventDefault(); try { window.ReactNativeWebView.postMessage('home'); } catch (err) { /* ignora */ } return; }
            if (exact ? pathname === to : pathname.startsWith(to)) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
            setWant(to);
          };
          return (
            <span key={to} className="contents">
              {j === 1 ? <span className="dock-sep" aria-hidden="true" /> : null}
              <motion.span layout transition={T} className="block">
                <Link
                  to={to}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  onClick={onClick}
                  className={`dock-tile ${active ? 'dock-on' : ''}`}
                >
                  <Icon size={21} strokeWidth={2} />
                  {active ? <span className="dock-lab">{label}</span> : null}
                </Link>
              </motion.span>
            </span>
          );
        })}
      </div>
    </motion.nav>
  );
}

// memo: non si ridisegna quando cambia il contenuto della pagina (evita misure di layout inutili)
export default memo(BottomBar);
