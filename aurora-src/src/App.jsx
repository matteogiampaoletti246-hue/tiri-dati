import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HashRouter, Route, Routes, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { BACK } from '@/lib/carousel';
import ArchiveMatch from '@/pages/ArchiveMatch';
import ArchiveTeam from '@/pages/ArchiveTeam';
import ArchivePlayer from '@/pages/ArchivePlayer';
import { bootData } from '@/data';
import LaunchScreen from '@/components/LaunchScreen';
import ScrollToTop from '@/components/ScrollToTop';
import PlayerSheetHost from '@/components/match/PlayerSheet';
import { applyTheme, getTheme } from '@/lib/theme';
import Guidelines from '@/pages/Guidelines';
import Home from '@/pages/Home';
import League from '@/pages/League';
import Match from '@/pages/Match';
import Menu from '@/pages/Menu';
import Partite from '@/pages/Partite';
import Player from '@/pages/Player';
import Referee from '@/pages/Referee';
import ReliabilityCalculator from '@/pages/ReliabilityCalculator';
import Team from '@/pages/Team';
import TeamShots from '@/pages/TeamShots';
import TopMatchups from '@/pages/TopMatchups';
import TopPlayers from '@/pages/TopPlayers';

// Dalle schede principali non si torna "indietro" con lo swipe del sistema: si cambia scheda dalla barra in basso.
const ROOTS = new Set(['/', '/calcolatore', '/migliori-giocatori', '/migliori-matchup']);
function NavGuard() {
  const loc = useLocation();
  const type = useNavigationType();
  const navigate = useNavigate();
  const prev = useRef(null);
  useLayoutEffect(() => {
    const p = prev.current;
    if (type === 'POP' && p && ROOTS.has(p) && Date.now() - BACK.t > 1500) {
      navigate(p, { replace: true });
      return;
    }
    prev.current = loc.pathname;
  }, [loc.key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Tema applicato subito, prima del primo disegno.
applyTheme(getTheme());

// HashRouter: l'app vive in una sottocartella di GitHub Pages (/tiri-dati/aurora/)
// e così i link diretti funzionano senza configurare il server.
export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    bootData().finally(() => setReady(true));
  }, []);

  return (
    <HashRouter>
      <LaunchScreen ready={ready} />
      <NavGuard />
      <ScrollToTop />
      <PlayerSheetHost />
      {ready ? (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/calcolatore" element={<ReliabilityCalculator />} />
        <Route path="/partite" element={<Partite />} />
        <Route path="/tiri-squadre" element={<TeamShots />} />
        <Route path="/migliori-giocatori" element={<TopPlayers />} />
        <Route path="/migliori-matchup" element={<TopMatchups />} />
        <Route path="/linee-guida" element={<Guidelines />} />
        <Route path="/match/:id" element={<Match />} />
        <Route path="/campionato/:id" element={<League />} />
        <Route path="/storico/:fm/:sk/squadra/:tid" element={<ArchiveTeam />} />
        <Route path="/storico/:fm/:sk/giocatore/:pid" element={<ArchivePlayer />} />
        <Route path="/storico/:fm/:sk/:mid" element={<ArchiveMatch />} />
        <Route path="/squadra/:id" element={<Team />} />
        <Route path="/giocatore/:id" element={<Player />} />
        <Route path="/arbitro/:id" element={<Referee />} />
        <Route path="*" element={<Home />} />
      </Routes>
      ) : null}
    </HashRouter>
  );
}
