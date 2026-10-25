import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/ui/Header';
import { SideMenu } from './components/ui/SideMenu';
import { SearchOverlay } from './components/ui/SearchOverlay';
import { HomeScreen } from './screens/HomeScreen';
import { MatchPreMatchScreen } from './screens/MatchPreMatchScreen';
import { MatchLiveScreen } from './screens/MatchLiveScreen';
import { TeamScreen } from './screens/TeamScreen';
import { LeagueScreen } from './screens/LeagueScreen';
import { PlayerScreen } from './screens/PlayerScreen';
import { RefereeScreen } from './screens/RefereeScreen';
import { CalcolatoreScreen } from './screens/CalcolatoreScreen';
import { MiglioriGiocatoriScreen } from './screens/MiglioriGiocatoriScreen';
import { MiglioriMatchupScreen } from './screens/MiglioriMatchupScreen';
import { LineeGuidaScreen } from './screens/LineeGuidaScreen';
import { Match } from './types';
import { MATCHES_DATA } from './data/matches';
import {
  Calendar,
  Calculator,
  Layers,
  Users,
  Smartphone
} from 'lucide-react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [historyStack, setHistoryStack] = useState<string[]>(['home']);

  // Selected entities for detail screens
  const [selectedMatch, setSelectedMatch] = useState<Match>(MATCHES_DATA[0]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('inter');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('serie-a');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('lautaro');
  const [selectedRefereeName, setSelectedRefereeName] = useState<string>('Davide Massa');
  const [calcPlayerName, setCalcPlayerName] = useState<string>('Lautaro');
  const [calcInitialTab, setCalcInitialTab] = useState<'player' | 'team' | 'history'>('player');
  const [matchupInitialCat, setMatchupInitialCat] = useState<string>('Angoli');

  // Overlays
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // iPhone width constraint toggle for desktop users
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Navigation helper
  const navigateTo = (route: string, param?: string) => {
    if (route === 'team' && param) {
      setSelectedTeamId(param);
    } else if (route === 'league' && param) {
      setSelectedLeagueId(param);
    } else if (route === 'player' && param) {
      setSelectedPlayerId(param);
    } else if (route === 'referee' && param) {
      setSelectedRefereeName(param);
    } else if (route === 'calculator') {
      if (param === 'team') setCalcInitialTab('team');
      else if (param === 'history') setCalcInitialTab('history');
      else setCalcInitialTab('player');
    } else if (route === 'matchups' && param) {
      setMatchupInitialCat(param);
    }

    setHistoryStack((prev) => [...prev, route]);
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBack = () => {
    if (historyStack.length > 1) {
      const newStack = [...historyStack];
      newStack.pop();
      setHistoryStack(newStack);
      setCurrentRoute(newStack[newStack.length - 1]);
    } else {
      setCurrentRoute('home');
    }
  };

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    if (match.status === 'live' || match.status === 'finished') {
      navigateTo('match-live');
    } else {
      navigateTo('match-pre');
    }
  };

  const handleOpenCalculatorWithPlayer = (playerName: string) => {
    setCalcPlayerName(playerName);
    setCalcInitialTab('player');
    navigateTo('calculator');
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
        {/* Desktop Viewport Width Toggle Bar (Hidden on actual mobile screens) */}
        <div className="hidden md:flex items-center justify-between w-full max-w-4xl px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-400">ScalperLab</span>
            <span>· Anteprima Mobile-First (iPhone 390px)</span>
          </div>
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isPhoneFrame ? 'Allarga vista desktop' : 'Simulatore iPhone 390px'}</span>
          </button>
        </div>

        {/* Main App Container */}
        <div
          className={`w-full min-h-screen flex flex-col bg-slate-950 relative ${
            isPhoneFrame
              ? 'max-w-[420px] md:my-4 md:rounded-[40px] md:border-8 md:border-slate-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] md:overflow-hidden'
              : 'max-w-2xl'
          }`}
        >
          {/* Header */}
          <Header
            onOpenMenu={() => setIsMenuOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onLogoClick={() => navigateTo('home')}
            showBack={currentRoute !== 'home'}
            onBack={handleBack}
          />

          {/* Screen Content Router */}
          <main className="flex-1 w-full pb-18">
            {currentRoute === 'home' && (
              <HomeScreen
                onSelectMatch={handleSelectMatch}
                onSelectLeague={(id) => navigateTo('league', id)}
              />
            )}

            {currentRoute === 'match-pre' && (
              <MatchPreMatchScreen
                match={selectedMatch}
                onSelectTeam={(id) => navigateTo('team', id)}
                onSelectPlayer={(id) => navigateTo('player', id)}
                onSelectReferee={(name) => navigateTo('referee', name)}
                onOpenCalculator={handleOpenCalculatorWithPlayer}
              />
            )}

            {currentRoute === 'match-live' && (
              <MatchLiveScreen
                match={selectedMatch}
                onSelectTeam={(id) => navigateTo('team', id)}
                onSelectPlayer={(id) => navigateTo('player', id)}
              />
            )}

            {currentRoute === 'team' && (
              <TeamScreen
                teamId={selectedTeamId}
                onSelectPlayer={(id) => navigateTo('player', id)}
                onSelectMatch={handleSelectMatch}
              />
            )}

            {currentRoute === 'league' && (
              <LeagueScreen
                leagueId={selectedLeagueId}
                onSelectTeam={(id) => navigateTo('team', id)}
                onSelectPlayer={(id) => navigateTo('player', id)}
                onSelectReferee={(name) => navigateTo('referee', name)}
                onSelectMatch={handleSelectMatch}
              />
            )}

            {currentRoute === 'player' && (
              <PlayerScreen
                playerId={selectedPlayerId}
                onOpenCalculator={handleOpenCalculatorWithPlayer}
                onSelectTeam={(id) => navigateTo('team', id)}
              />
            )}

            {currentRoute === 'referee' && (
              <RefereeScreen refereeName={selectedRefereeName} />
            )}

            {currentRoute === 'calculator' && (
              <CalcolatoreScreen
                initialPlayerName={calcPlayerName}
                initialTab={calcInitialTab}
              />
            )}

            {currentRoute === 'best-players' && (
              <MiglioriGiocatoriScreen
                onSelectPlayer={(id) => navigateTo('player', id)}
                onOpenCalculator={handleOpenCalculatorWithPlayer}
              />
            )}

            {currentRoute === 'matchups' && (
              <MiglioriMatchupScreen
                initialCategory={matchupInitialCat}
                onSelectMatchup={() => navigateTo('calculator')}
              />
            )}

            {currentRoute === 'guidelines' && <LineeGuidaScreen />}
          </main>

          {/* Bottom Fixed Navigation Bar (Native Mobile Feel) */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1 max-w-[420px] mx-auto md:bottom-4 md:rounded-2xl md:border">
            <div className="grid grid-cols-4 items-center h-14">
              <button
                onClick={() => navigateTo('home')}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  currentRoute === 'home' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Partite</span>
              </button>

              <button
                onClick={() => navigateTo('calculator')}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  currentRoute === 'calculator' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calculator className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Calcolatore</span>
              </button>

              <button
                onClick={() => navigateTo('matchups')}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  currentRoute === 'matchups' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Matchup</span>
              </button>

              <button
                onClick={() => navigateTo('best-players')}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  currentRoute === 'best-players' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Giocatori</span>
              </button>
            </div>
          </nav>

          {/* Side Drawer Menu */}
          <SideMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            onNavigate={navigateTo}
            activeRoute={currentRoute}
          />

          {/* Search Modal */}
          <SearchOverlay
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onNavigate={navigateTo}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
