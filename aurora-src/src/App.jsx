import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { bootData } from '@/data';
import LaunchScreen from '@/components/LaunchScreen';
import ScrollToTop from '@/components/ScrollToTop';
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
      <ScrollToTop />
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
        <Route path="/squadra/:id" element={<Team />} />
        <Route path="/giocatore/:id" element={<Player />} />
        <Route path="/arbitro/:id" element={<Referee />} />
        <Route path="*" element={<Home />} />
      </Routes>
      ) : null}
    </HashRouter>
  );
}
