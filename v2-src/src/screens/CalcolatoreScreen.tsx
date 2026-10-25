import React, { useState, useEffect, useRef } from 'react';
import {
  LEAGUE_DATA,
  leagueSize,
  leagueStrength,
  leagueAverage,
  computeRanks,
  isCup,
  blendInfo
} from '../data/leagues';
import {
  PlayerCalcInputs,
  TeamCalcInputs,
  computePlayerReliability,
  computeTeamForecast,
  PlayerCalcOutputs,
  TeamCalcOutputs
} from '../utils/calculators';
import { SavedPlay } from '../types';
import { ChevronDown, Copy, Download, Trash2, CheckCircle2 } from 'lucide-react';

interface CalcolatoreScreenProps {
  initialPlayerName?: string;
  initialTab?: 'player' | 'team' | 'history';
}

export const CalcolatoreScreen: React.FC<CalcolatoreScreenProps> = ({
  initialPlayerName = '',
  initialTab = 'player'
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'player' | 'team' | 'history'>(initialTab);

  // Sync if initial props change
  useEffect(() => {
    if (initialTab) setActiveMainTab(initialTab);
  }, [initialTab]);

  // -------------------------------------------------------------
  // 12a. PLAYER RELIABILITY STATE
  // -------------------------------------------------------------
  const [pName, setPName] = useState(initialPlayerName || 'Lautaro');
  const [pShotType, setPShotType] = useState<'total' | 'sot'>('total');
  const [pLineType, setPLineType] = useState<'over' | 'under'>('over');
  const [pLineValue, setPLineValue] = useState<number>(1.5);
  const [pOdds, setPOdds] = useState<number>(1.85);
  const [pSede, setPSede] = useState<'home' | 'neutral' | 'away'>('home');
  const [pCompetition, setPCompetition] = useState<'league' | 'cup'>('league');
  const [pHitRate5, setPHitRate5] = useState<string>('0.8');
  const [pL5Shots, setPL5Shots] = useState<string>('3-4-2-3-2');
  const [pL5Mins, setPL5Mins] = useState<string>('87-90-81-90-90');

  // Competitions
  const [shotsLeague, setShotsLeague] = useState<number>(3.8);
  const [minutesLeague, setMinutesLeague] = useState<number>(90);
  const [shotsCup, setShotsCup] = useState<number>(0);
  const [minutesCup, setMinutesCup] = useState<number>(0);
  const [shotsNL, setShotsNL] = useState<number>(0);
  const [minutesNL, setMinutesNL] = useState<number>(0);
  const [shotsWCQ, setShotsWCQ] = useState<number>(0);
  const [minutesWCQ, setMinutesWCQ] = useState<number>(0);

  // Player team
  const [playerLeague, setPlayerLeague] = useState<string>('serie-a');
  const [playerTeam, setPlayerTeam] = useState<string>('Inter');
  const [playerTeamShots, setPlayerTeamShots] = useState<number>(22.5);
  const [playerLeagueAvgFor, setPlayerLeagueAvgFor] = useState<number>(14.0);
  const [playerStrength, setPlayerStrength] = useState<number>(1);

  // Opponent team
  const [oppLeague, setOppLeague] = useState<string>('serie-a');
  const [oppTeam, setOppTeam] = useState<string>('Juventus');
  const [oppConceded, setOppConceded] = useState<number>(7.2);
  const [oppConcededSOT, setOppConcededSOT] = useState<number>(2.7);
  const [leagueAvg, setLeagueAvg] = useState<number>(13.5);
  const [leagueAvgSOT, setLeagueAvgSOT] = useState<number>(4.5);
  const [oppStrength, setOppStrength] = useState<number>(1);

  // Breakdowns
  const [playerBreakdownVisible, setPlayerBreakdownVisible] = useState(false);
  const [oppBreakdownVisible, setOppBreakdownVisible] = useState(false);

  // -------------------------------------------------------------
  // 12b. TEAM SHOOTING STATE
  // -------------------------------------------------------------
  const [tShotType, setTShotType] = useState<'total' | 'sot'>('total');
  const [tSede, setTSede] = useState<'home' | 'neutral' | 'away'>('home');
  const [tLineType, setTLineType] = useState<'over' | 'under'>('over');
  const [tLineValue, setTLineValue] = useState<number>(14.5);
  const [tOdds, setTOdds] = useState<number>(1.85);

  const [teamForLeague, setTeamForLeague] = useState<string>('serie-a');
  const [teamForTeam, setTeamForTeam] = useState<string>('Inter');
  const [teamForShots, setTeamForShots] = useState<number>(22.5);
  const [teamForStrength, setTeamForStrength] = useState<number>(1);
  const [teamForAvg, setTeamForAvg] = useState<number>(14.0);

  const [teamOppLeague, setTeamOppLeague] = useState<string>('serie-a');
  const [teamOppTeam, setTeamOppTeam] = useState<string>('Juventus');
  const [teamOppShots, setTeamOppShots] = useState<number>(7.2);
  const [teamOppStrength, setTeamOppStrength] = useState<number>(1);
  const [teamOppAvg, setTeamOppAvg] = useState<number>(14.0);

  // -------------------------------------------------------------
  // 12c. STORICO STATE
  // -------------------------------------------------------------
  const STORE_KEY = 'tiri_storico_v1';
  const [savedPlays, setSavedPlays] = useState<SavedPlay[]>(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Plausible initial plays so user immediately sees rich calibration stats
    return [
      {
        id: 'play-1',
        ts: Date.now() - 86400000 * 2,
        upd: Date.now() - 86400000 * 2,
        outcome: 'win',
        kind: 'giocatore',
        label: 'Lautaro Martínez',
        market: 'Over 1.5 tiri',
        opp: 'Roma',
        score: 8.84,
        odds: 1.85,
        stake: 1.21,
        prob: 0.88
      },
      {
        id: 'play-2',
        ts: Date.now() - 86400000 * 4,
        upd: Date.now() - 86400000 * 4,
        outcome: 'win',
        kind: 'giocatore',
        label: 'Dušan Vlahović',
        market: 'Over 1.5 tiri',
        opp: 'Torino',
        score: 9.12,
        odds: 1.90,
        stake: 1.35,
        prob: 0.91
      },
      {
        id: 'play-3',
        ts: Date.now() - 86400000 * 7,
        upd: Date.now() - 86400000 * 7,
        outcome: 'lose',
        kind: 'squadra',
        label: 'Milan',
        market: 'Over 12.5 tiri squadra',
        opp: 'Napoli',
        score: 8.10,
        odds: 1.72,
        stake: 1.02,
        prob: 0.81
      }
    ];
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [bkText, setBkText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [bkStatusMsg, setBkStatusMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(savedPlays));
    } catch (e) {}
  }, [savedPlays]);

  // Compute Player Outputs
  const playerInputs: PlayerCalcInputs = {
    playerName: pName,
    shotType: pShotType,
    lineType: pLineType,
    lineValue: pLineValue,
    odds: pOdds,
    sede: pSede,
    competition: pCompetition,
    hitRate5: pHitRate5,
    l5Shots: pL5Shots,
    l5Mins: pL5Mins,
    shotsLeague,
    minutesLeague,
    shotsCup,
    minutesCup,
    shotsNL,
    minutesNL,
    shotsWCQ,
    minutesWCQ,
    playerLeague,
    playerTeam,
    playerTeamShots,
    playerLeagueAvgFor,
    playerStrength,
    oppLeague,
    oppTeam,
    oppConceded,
    oppConcededSOT,
    leagueAvg,
    leagueAvgSOT,
    oppStrength
  };

  const pRes: PlayerCalcOutputs = computePlayerReliability(playerInputs);

  // Compute Team Outputs
  const teamInputs: TeamCalcInputs = {
    shotType: tShotType,
    sede: tSede,
    lineType: tLineType,
    lineValue: tLineValue,
    odds: tOdds,
    teamForShots,
    teamForStrength,
    teamForAvg,
    teamOppShots,
    teamOppStrength,
    teamOppAvg
  };

  const tRes: TeamCalcOutputs = computeTeamForecast(teamInputs);

  // Line Difficulty hint
  const getLineDifficultyHint = (line: number, mode: 'total' | 'sot') => {
    if (mode === 'sot') {
      if (line <= 0.5) return 'Normale';
      if (line <= 1.5) return 'Alta';
      if (line <= 2.5) return 'Molto alta';
      return 'Fuori scala per i tiri in porta';
    } else {
      if (line <= 1.5) return 'Bassa';
      if (line <= 2.5) return 'Media';
      if (line <= 3.5) return 'Alta';
      return 'Molto alta';
    }
  };

  // Dash insertion handler for mobile keyboard ease
  const insertDash = (field: 'l5Shots' | 'l5Mins') => {
    if (field === 'l5Shots') {
      if (!pL5Shots.endsWith('-') && pL5Shots.length > 0) {
        setPL5Shots(pL5Shots + '-');
      }
    } else {
      if (!pL5Mins.endsWith('-') && pL5Mins.length > 0) {
        setPL5Mins(pL5Mins + '-');
      }
    }
  };

  // Team select changes in Player View
  const handlePlayerLeagueChange = (leagueKey: string) => {
    setPlayerLeague(leagueKey);
    const leagueObj = LEAGUE_DATA[leagueKey];
    if (leagueObj && Object.keys(leagueObj.teams).length > 0) {
      const firstTeam = Object.keys(leagueObj.teams)[0];
      setPlayerTeam(firstTeam);
      const teamStat = leagueObj.teams[firstTeam];
      setPlayerTeamShots(pShotType === 'sot' ? teamStat.sotFor : teamStat.totalFor);
      setPlayerLeagueAvgFor(leagueAverage(leagueKey, pShotType === 'sot' ? 'sotFor' : 'totalFor'));
      setPlayerStrength(leagueStrength(leagueKey));
    }
  };

  const handlePlayerTeamChange = (teamName: string) => {
    setPlayerTeam(teamName);
    const leagueObj = LEAGUE_DATA[playerLeague];
    if (leagueObj && leagueObj.teams[teamName]) {
      const teamStat = leagueObj.teams[teamName];
      setPlayerTeamShots(pShotType === 'sot' ? teamStat.sotFor : teamStat.totalFor);
    }
  };

  const handleOppLeagueChange = (leagueKey: string) => {
    setOppLeague(leagueKey);
    const leagueObj = LEAGUE_DATA[leagueKey];
    if (leagueObj && Object.keys(leagueObj.teams).length > 0) {
      const firstTeam = Object.keys(leagueObj.teams)[0];
      setOppTeam(firstTeam);
      const teamStat = leagueObj.teams[firstTeam];
      setOppConceded(teamStat.totalAgainst);
      setOppConcededSOT(teamStat.sotAgainst);
      setLeagueAvg(leagueAverage(leagueKey, 'totalAgainst'));
      setLeagueAvgSOT(leagueAverage(leagueKey, 'sotAgainst'));
      setOppStrength(leagueStrength(leagueKey));
    }
  };

  const handleOppTeamChange = (teamName: string) => {
    setOppTeam(teamName);
    const leagueObj = LEAGUE_DATA[oppLeague];
    if (leagueObj && leagueObj.teams[teamName]) {
      const teamStat = leagueObj.teams[teamName];
      setOppConceded(teamStat.totalAgainst);
      setOppConcededSOT(teamStat.sotAgainst);
    }
  };

  // Team view selectors
  const handleTeamForLeagueChange = (leagueKey: string) => {
    setTeamForLeague(leagueKey);
    const leagueObj = LEAGUE_DATA[leagueKey];
    if (leagueObj && Object.keys(leagueObj.teams).length > 0) {
      const firstTeam = Object.keys(leagueObj.teams)[0];
      setTeamForTeam(firstTeam);
      const teamStat = leagueObj.teams[firstTeam];
      setTeamForShots(tShotType === 'sot' ? teamStat.sotFor : teamStat.totalFor);
      setTeamForAvg(leagueAverage(leagueKey, tShotType === 'sot' ? 'sotFor' : 'totalFor'));
      setTeamForStrength(leagueStrength(leagueKey));
    }
  };

  const handleTeamOppLeagueChange = (leagueKey: string) => {
    setTeamOppLeague(leagueKey);
    const leagueObj = LEAGUE_DATA[leagueKey];
    if (leagueObj && Object.keys(leagueObj.teams).length > 0) {
      const firstTeam = Object.keys(leagueObj.teams)[0];
      setTeamOppTeam(firstTeam);
      const teamStat = leagueObj.teams[firstTeam];
      setTeamOppShots(tShotType === 'sot' ? teamStat.sotAgainst : teamStat.totalAgainst);
      setTeamOppAvg(leagueAverage(leagueKey, tShotType === 'sot' ? 'sotAgainst' : 'totalAgainst'));
      setTeamOppStrength(leagueStrength(leagueKey));
    }
  };

  // Save Play
  const handleSavePlay = (kind: 'giocatore' | 'squadra') => {
    const isPlayer = kind === 'giocatore';
    const res = isPlayer ? pRes : tRes;

    const newPlay: SavedPlay = {
      id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ts: Date.now(),
      upd: Date.now(),
      outcome: 'pending',
      kind,
      label: isPlayer ? (pName.trim() || 'Giocatore') : (teamForTeam || 'Squadra'),
      market: isPlayer ? pRes.lineFormatted + (pShotType === 'sot' ? ' tiri in porta' : ' tiri') : tRes.lineFormatted + (tShotType === 'sot' ? ' tiri in porta' : ' tiri'),
      opp: isPlayer ? oppTeam : teamOppTeam,
      score: res.score,
      odds: isPlayer ? pOdds : tOdds,
      stake: res.stakeResult.stake || 1.0,
      prob: isPlayer ? pRes.probFinal : tRes.prob
    };

    setSavedPlays([newPlay, ...savedPlays]);
    showToast('Giocata salvata nello storico!');
  };

  // Storico stats
  const closedPlays = savedPlays.filter(p => p.outcome === 'win' || p.outcome === 'lose');
  const wins = closedPlays.filter(p => p.outcome === 'win').length;
  const losses = closedPlays.length - wins;
  const profit = closedPlays.reduce((acc, p) => {
    if (p.outcome === 'win') return acc + p.stake * (p.odds - 1);
    if (p.outcome === 'lose') return acc - p.stake;
    return acc;
  }, 0);
  const staked = closedPlays.reduce((acc, p) => acc + p.stake, 0);
  const winRate = closedPlays.length ? (wins / closedPlays.length) * 100 : 0;
  const roi = staked > 0 ? (profit / staked) * 100 : 0;
  const avgPredProb = closedPlays.length ? (closedPlays.reduce((a, p) => a + p.prob, 0) / closedPlays.length) * 100 : 0;

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Toast popup */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Intro */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">
          Bozza v8 — modello Poisson + stake
        </span>
        <h1 className="font-display font-bold text-lg text-white">
          Calcolatore di affidabilità linee tiri
        </h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Solo statistiche stagionali. Il tasso di tiri del giocatore è sempre normalizzato a 90 minuti, l'affidabilità è una probabilità reale calcolata con un modello di Poisson — non una media di pesi decisi a occhio.
        </p>
      </div>

      {/* Top 3 Segments: Affidabilita giocatore / Media tiri squadra / Storico */}
      <div className="p-3 bg-slate-950 sticky top-13 z-20 border-b border-slate-800/80">
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1" id="viewSeg">
          <button
            type="button"
            data-val="player"
            onClick={() => setActiveMainTab('player')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeMainTab === 'player'
                ? 'bg-slate-800 text-emerald-400 shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Affidabilità giocatore
          </button>
          <button
            type="button"
            data-val="team"
            onClick={() => setActiveMainTab('team')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeMainTab === 'team'
                ? 'bg-slate-800 text-emerald-400 shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Media tiri squadra
          </button>
          <button
            type="button"
            data-val="history"
            id="histTab"
            onClick={() => setActiveMainTab('history')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeMainTab === 'history'
                ? 'bg-slate-800 text-emerald-400 shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Storico ({savedPlays.length})
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 12a. PLAYER VIEW */}
      {/* ------------------------------------------------------------------ */}
      {activeMainTab === 'player' && (
        <div id="playerView" className="p-4 flex flex-col gap-4">
          {/* Panel: La giocata */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-display font-bold text-sm text-slate-100">La giocata</h2>
            <p className="text-xs text-slate-400 -mt-1 leading-snug">
              Il giocatore, la linea, la quota e il tipo di partita.
            </p>

            <div className="flex flex-col gap-3">
              {/* Giocatore */}
              <div className="flex flex-col gap-1">
                <label htmlFor="playerName" className="text-xs text-slate-400">Giocatore</label>
                <input
                  type="text"
                  id="playerName"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="es. Messi"
                  className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-emerald-500"
                />
              </div>

              {/* Tipo tiri (Totali / In porta) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Tipo tiri</label>
                <div className="flex bg-slate-850 border border-slate-800 rounded-xl p-1" id="shotTypeSeg">
                  <button
                    type="button"
                    data-val="total"
                    onClick={() => setPShotType('total')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      pShotType === 'total' ? 'bg-slate-800 text-emerald-400 font-bold shadow' : 'text-slate-400'
                    }`}
                  >
                    Totali
                  </button>
                  <button
                    type="button"
                    data-val="sot"
                    onClick={() => setPShotType('sot')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      pShotType === 'sot' ? 'bg-slate-800 text-emerald-400 font-bold shadow' : 'text-slate-400'
                    }`}
                  >
                    In porta
                  </button>
                </div>
              </div>

              {/* Tipo linea (Over / Under) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Tipo linea</label>
                <div className="flex bg-slate-850 border border-slate-800 rounded-xl p-1" id="lineTypeSeg">
                  <button
                    type="button"
                    data-val="over"
                    onClick={() => setPLineType('over')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      pLineType === 'over' ? 'bg-slate-800 text-emerald-400 font-bold shadow' : 'text-slate-400'
                    }`}
                  >
                    Over
                  </button>
                  <button
                    type="button"
                    data-val="under"
                    onClick={() => setPLineType('under')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      pLineType === 'under' ? 'bg-slate-800 text-emerald-400 font-bold shadow' : 'text-slate-400'
                    }`}
                  >
                    Under
                  </button>
                </div>
              </div>

              {/* Valore linea & Quota */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="lineValue" className="text-xs text-slate-400">Valore linea (tiri)</label>
                  <input
                    type="number"
                    id="lineValue"
                    step={0.5}
                    value={pLineValue}
                    onChange={(e) => setPLineValue(parseFloat(e.target.value) || 0)}
                    className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 font-medium" id="lineDifficultyHint">
                    Difficoltà linea: {getLineDifficultyHint(pLineValue, pShotType)}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="odds" className="text-xs text-slate-400">Quota</label>
                  <input
                    type="number"
                    id="odds"
                    step={0.01}
                    value={pOdds}
                    onChange={(e) => setPOdds(parseFloat(e.target.value) || 0)}
                    className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-emerald-500"
                  />
                </div>
              </div>

              {/* Sede (Casa / Nessun effetto / Trasferta) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Sede</label>
                <div className="flex bg-slate-850 border border-slate-800 rounded-xl p-1" id="homeAwaySeg">
                  {(['home', 'neutral', 'away'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      data-val={s}
                      onClick={() => setPSede(s)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        pSede === s ? 'bg-slate-800 text-emerald-400 font-bold shadow' : 'text-slate-400'
                      }`}
                    >
                      {s === 'home' ? 'Casa' : s === 'neutral' ? 'Nessun effetto' : 'Trasferta'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Competizione (Campionato / Coppa europea) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Competizione</label>
                <div className="flex bg-slate-850 border border-slate-800 rounded-xl p-1" id="compSeg">
                  <button
                    type="button"
                    data-val="league"
                    onClick={() => setPCompetition('league')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      pCompetition === 'league' ? 'bg-slate-800 text-emerald-400 font-bold shadow' : 'text-slate-400'
                    }`}
                  >
                    Campionato
                  </button>
                  <button
                    type="button"
                    data-val="cup"
                    onClick={() => setPCompetition('cup')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      pCompetition === 'cup' ? 'bg-slate-800 text-emerald-400 font-bold shadow' : 'text-slate-400'
                    }`}
                  >
                    Coppa europea
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5" id="compHint">
                  {pCompetition === 'league'
                    ? "Inserisci sotto le statistiche di campionato del giocatore e dell'avversario."
                    : "Partita di coppa: scegli Champions League o Europa League nei menu campionato delle squadre."}
                </span>
              </div>

              {/* Hit rate ultime 5 partite */}
              <div className="flex flex-col gap-1">
                <label htmlFor="hitRate5" className="text-xs text-slate-400">Hit rate ultime 5 partite</label>
                <select
                  id="hitRate5"
                  value={pHitRate5}
                  onChange={(e) => setPHitRate5(e.target.value)}
                  className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-emerald-500"
                >
                  <option value="">— non inserito —</option>
                  <option value="0">0/5 (0%)</option>
                  <option value="0.2">1/5 (20%)</option>
                  <option value="0.4">2/5 (40%)</option>
                  <option value="0.6">3/5 (60%)</option>
                  <option value="0.8">4/5 (80%)</option>
                  <option value="0.9">4/5+ (90%) – una partita mancata per 1 solo tiro</option>
                  <option value="1">5/5 (100%)</option>
                </select>
                <span className="text-[11px] text-slate-400 leading-snug">
                  Quante delle ultime 5 partite il giocatore ha rispettato questa stessa linea. Scegli 4/5+ quando la partita mancata è fallita per un solo tiro.
                </span>
              </div>

              {/* Tiri nelle ultime 5 partite */}
              <div className="flex flex-col gap-1">
                <label htmlFor="l5Shots" id="l5ShotsLabel" className="text-xs text-slate-400">
                  {pShotType === 'sot' ? 'Tiri in porta nelle ultime 5 partite' : 'Tiri nelle ultime 5 partite'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="l5Shots"
                    value={pL5Shots}
                    onChange={(e) => setPL5Shots(e.target.value)}
                    placeholder="es. 3-4-6-2-1"
                    className="flex-1 bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => insertDash('l5Shots')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 active:scale-95"
                  >
                    Inserisci trattino ( - )
                  </button>
                </div>
              </div>

              {/* Minuti nelle ultime 5 partite */}
              <div className="flex flex-col gap-1">
                <label htmlFor="l5Mins" className="text-xs text-slate-400">Minuti nelle ultime 5 partite</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="l5Mins"
                    value={pL5Mins}
                    onChange={(e) => setPL5Mins(e.target.value)}
                    placeholder="es. 87-67-81-90-90"
                    className="flex-1 bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => insertDash('l5Mins')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 active:scale-95"
                  >
                    Inserisci trattino ( - )
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 leading-snug" id="l5Info">
                  {pRes.l5Info}
                </span>
              </div>
            </div>
          </div>

          {/* Panel: Giocatore — medie per competizione */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-display font-bold text-sm text-slate-100">
              Giocatore — medie per competizione
            </h2>
            <p className="text-xs text-slate-400 -mt-1 leading-snug">
              Inserisci media tiri e media minuti a partita per ogni competizione in cui hai dati. Anche una sola competizione va bene — le altre restano vuote e il calcolatore combina solo quelle compilate.
            </p>

            <div className="flex flex-col gap-3">
              {/* Campionato */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="shotsLeague" id="shotsLeagueLabel" className="text-xs text-slate-400">
                    Campionato — media {pShotType === 'sot' ? 'tiri in porta' : 'tiri'}
                  </label>
                  <input
                    type="number"
                    id="shotsLeague"
                    step={0.1}
                    value={shotsLeague}
                    onChange={(e) => setShotsLeague(parseFloat(e.target.value) || 0)}
                    className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="minutesLeague" className="text-xs text-slate-400">Campionato — minuti/p</label>
                  <input
                    type="number"
                    id="minutesLeague"
                    step={1}
                    value={minutesLeague}
                    onChange={(e) => setMinutesLeague(parseFloat(e.target.value) || 0)}
                    className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Coppa europea */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="shotsCup" id="shotsCupLabel" className="text-xs text-slate-400">
                    Coppa europea — media {pShotType === 'sot' ? 'tiri in porta' : 'tiri'}
                  </label>
                  <input
                    type="number"
                    id="shotsCup"
                    step={0.1}
                    placeholder="opzionale"
                    value={shotsCup || ''}
                    onChange={(e) => setShotsCup(parseFloat(e.target.value) || 0)}
                    className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="minutesCup" className="text-xs text-slate-400">Coppa europea — minuti/p</label>
                  <input
                    type="number"
                    id="minutesCup"
                    step={1}
                    placeholder="opzionale"
                    value={minutesCup || ''}
                    onChange={(e) => setMinutesCup(parseFloat(e.target.value) || 0)}
                    className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Nations League */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="shotsNL" id="shotsNLLabel" className="text-xs text-slate-400">
                    Nations League — media {pShotType === 'sot' ? 'tiri in porta' : 'tiri'}
                  </label>
                  <input
                    type="number"
                    id="shotsNL"
                    step={0.1}
                    placeholder="opzionale"
                    value={shotsNL || ''}
                    onChange={(e) => setShotsNL(parseFloat(e.target.value) || 0)}
                    className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="minutesNL" className="text-xs text-slate-400">Nations League — minuti/p</label>
                  <input
                    type="number"
                    id="minutesNL"
                    step={1}
                    placeholder="opzionale"
                    value={minutesNL || ''}
                    onChange={(e) => setMinutesNL(parseFloat(e.target.value) || 0)}
                    className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Qualificazioni Mondiali */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="shotsWCQ" id="shotsWCQLabel" className="text-xs text-slate-400">
                    Qualificazioni Mondiali — tiri
                  </label>
                  <input
                    type="number"
                    id="shotsWCQ"
                    step={0.1}
                    placeholder="opzionale"
                    value={shotsWCQ || ''}
                    onChange={(e) => setShotsWCQ(parseFloat(e.target.value) || 0)}
                    className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="minutesWCQ" className="text-xs text-slate-400">Qualificazioni Mondiali — minuti</label>
                  <input
                    type="number"
                    id="minutesWCQ"
                    step={1}
                    placeholder="opzionale"
                    value={minutesWCQ || ''}
                    onChange={(e) => setMinutesWCQ(parseFloat(e.target.value) || 0)}
                    className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Derived normalized rate 90' */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400" id="rate90Label">
                  {pRes.rate90Label}
                </span>
                <b className="font-mono text-emerald-400 text-sm font-bold" id="rate90">
                  {pRes.rate90Formatted}
                </b>
              </div>
            </div>
          </div>

          {/* Panel: Squadra del giocatore */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-display font-bold text-sm text-slate-100">Squadra del giocatore</h2>
            <p className="text-xs text-slate-400 -mt-1 leading-snug" id="playerTeamSub">
              Seleziona campionato e squadra del giocatore: la media tiri fatti arriva dal database. È il fattore più leggero (esponente 0,35).
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="playerLeague" className="text-xs text-slate-400">Campionato</label>
                <select
                  id="playerLeague"
                  value={playerLeague}
                  onChange={(e) => handlePlayerLeagueChange(e.target.value)}
                  className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">— seleziona —</option>
                  <option value="serie-a">Serie A</option>
                  <option value="premier-league">Premier League</option>
                  <option value="bundesliga">Bundesliga</option>
                  <option value="la-liga">La Liga</option>
                  <option value="ligue-1">Ligue 1</option>
                  <option value="eredivisie">Eredivisie (Olanda)</option>
                  <option value="super-lig">Süper Lig (Turchia)</option>
                  <option value="liga-portugal">Liga Portugal</option>
                  <option value="champions-league">Champions League</option>
                  <option value="europa-league">Europa League</option>
                  <option value="nazionali">Nazionali</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="playerTeam" className="text-xs text-slate-400">Squadra del giocatore</label>
                <select
                  id="playerTeam"
                  value={playerTeam}
                  onChange={(e) => handlePlayerTeamChange(e.target.value)}
                  className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {LEAGUE_DATA[playerLeague]?.teams &&
                    Object.keys(LEAGUE_DATA[playerLeague].teams).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="playerTeamShots" id="playerTeamShotsLabel" className="text-xs text-slate-400">
                {pShotType === 'sot' ? 'Tiri in porta fatti a partita dalla squadra' : 'Tiri fatti a partita dalla squadra'}
              </label>
              <input
                type="number"
                id="playerTeamShots"
                step={0.1}
                value={playerTeamShots}
                onChange={(e) => setPlayerTeamShots(parseFloat(e.target.value) || 0)}
                className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
              <span className="text-[11px] font-semibold text-emerald-400 font-mono" id="playerTeamRankInfo">
                {computeRanks(playerLeague, pShotType === 'sot' ? 'sotFor' : 'totalFor')[playerTeam]
                  ? `${computeRanks(playerLeague, pShotType === 'sot' ? 'sotFor' : 'totalFor')[playerTeam]}° su ${leagueSize(playerLeague)} per ${pShotType === 'sot' ? 'tiri in porta' : 'tiri'} fatti in ${LEAGUE_DATA[playerLeague]?.label}`
                  : ''}
              </span>
            </div>

            <input type="hidden" id="playerStrength" value={playerStrength} />
            <input type="hidden" id="playerLeagueAvgFor" value={playerLeagueAvgFor} />
            <span className="text-[11px] text-slate-400 font-medium" id="playerTeamDatasetInfo">
              Dati aggiornati per {LEAGUE_DATA[playerLeague]?.label} ({LEAGUE_DATA[playerLeague]?.updated}).
            </span>
          </div>

          {/* Panel: Squadra avversaria */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-display font-bold text-sm text-slate-100">Squadra avversaria</h2>
            <p className="text-xs text-slate-400 -mt-1 leading-snug" id="oppSub">
              Seleziona campionato e squadra: tiri totali e tiri in porta concessi arrivano dal database salvato in questo tool. Pesa con esponente 0,85.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="oppLeague" className="text-xs text-slate-400">Campionato</label>
                <select
                  id="oppLeague"
                  value={oppLeague}
                  onChange={(e) => handleOppLeagueChange(e.target.value)}
                  className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">— seleziona —</option>
                  <option value="serie-a">Serie A</option>
                  <option value="premier-league">Premier League</option>
                  <option value="bundesliga">Bundesliga</option>
                  <option value="la-liga">La Liga</option>
                  <option value="ligue-1">Ligue 1</option>
                  <option value="eredivisie">Eredivisie (Olanda)</option>
                  <option value="super-lig">Süper Lig (Turchia)</option>
                  <option value="liga-portugal">Liga Portugal</option>
                  <option value="champions-league">Champions League</option>
                  <option value="europa-league">Europa League</option>
                  <option value="nazionali">Nazionali</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="oppTeam" className="text-xs text-slate-400">Squadra avversaria</label>
                <select
                  id="oppTeam"
                  value={oppTeam}
                  onChange={(e) => handleOppTeamChange(e.target.value)}
                  className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {LEAGUE_DATA[oppLeague]?.teams &&
                    Object.keys(LEAGUE_DATA[oppLeague].teams).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="oppConceded" id="oppConcededLabel" className="text-xs text-slate-400">
                  Tiri totali concessi /p
                </label>
                <input
                  type="number"
                  id="oppConceded"
                  step={0.1}
                  value={oppConceded}
                  onChange={(e) => setOppConceded(parseFloat(e.target.value) || 0)}
                  className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
                <span className="text-[10px] text-emerald-400 font-mono" id="oppRankInfo">
                  {computeRanks(oppLeague, 'totalAgainst')[oppTeam]
                    ? `${computeRanks(oppLeague, 'totalAgainst')[oppTeam]}° su ${leagueSize(oppLeague)} concessi`
                    : ''}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold" id="oppConcededActiveTag">
                  {pShotType === 'total' ? 'Usata nel calcolo' : ''}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="oppConcededSOT" id="oppConcededSOTLabel" className="text-xs text-slate-400">
                  Tiri in porta concessi /p
                </label>
                <input
                  type="number"
                  id="oppConcededSOT"
                  step={0.1}
                  value={oppConcededSOT}
                  onChange={(e) => setOppConcededSOT(parseFloat(e.target.value) || 0)}
                  className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
                <span className="text-[10px] text-emerald-400 font-mono" id="oppRankInfoSOT">
                  {computeRanks(oppLeague, 'sotAgainst')[oppTeam]
                    ? `${computeRanks(oppLeague, 'sotAgainst')[oppTeam]}° su ${leagueSize(oppLeague)} concessi`
                    : ''}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold" id="oppConcededSOTActiveTag">
                  {pShotType === 'sot' ? 'Usata nel calcolo' : ''}
                </span>
              </div>
            </div>

            <input type="hidden" id="oppStrength" value={oppStrength} />
            <input type="hidden" id="leagueAvg" value={leagueAvg} />
            <input type="hidden" id="leagueAvgSOT" value={leagueAvgSOT} />
            <span className="text-[11px] text-slate-400" id="datasetInfo">
              Dati Total Shots e Shots on Target di {LEAGUE_DATA[oppLeague]?.label} ({LEAGUE_DATA[oppLeague]?.updated}).
            </span>
          </div>

          {/* Collapsible "Come viene calcolato" */}
          <details className="bg-slate-900 border border-slate-800 rounded-2xl p-4 group" id="howPanel">
            <summary className="flex items-center justify-between cursor-pointer list-none font-display font-bold text-sm text-slate-100">
              <span>Come viene calcolato</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-3 flex flex-col gap-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800 mt-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400">
                λ = tasso_90' × fattore_avversario<sup>0,85</sup> × fattore_squadra<sup>0,35</sup> × fattore_sede
              </div>
              <p className="text-slate-400">
                λ è il numero atteso di tiri in questa partita. Il tasso individuale è normalizzato a 90' sommando tutte le competizioni. Il fattore avversario pesa 0,85 e la squadra 0,35. Il fattore sede vale ±6%.
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300">
                Stake base: 1% a voto 8,00, 1,25% a voto 9,00, 2% a voto 10
              </div>
              <p className="text-slate-400">
                Non di valore sotto 8,00. Quota sotto 1,60 scala proporzionalmente (richiede voto minimo 8,20).
              </p>
            </div>
          </details>

          {/* ---------------- RESULT CARD ---------------- */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-3">
            <h2 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wider">
              Affidabilità stimata
            </h2>

            <div>
              <span className="font-display text-5xl font-extrabold tracking-tight tabular-nums text-white" id="scoreBig">
                {pRes.scoreFormatted}
              </span>
              <span className="text-sm font-semibold text-slate-400 ml-1.5">/ 10</span>
            </div>

            <div className="text-sm font-bold -mt-1" id="scoreLabel" style={{ color: pRes.scoreColor }}>
              {pRes.scoreLabel}
            </div>

            {/* Gauge bar */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                id="gaugeFill"
                style={{
                  width: `${pRes.gaugePercent}%`,
                  backgroundColor: pRes.scoreColor,
                  boxShadow: `0 0 10px ${pRes.scoreColor}66`
                }}
              />
            </div>

            {/* Stake consigliato box */}
            <div className="border border-amber-500/70 bg-amber-500/10 rounded-2xl p-4 flex flex-col gap-1.5 my-1" id="pStakeBox">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Stake consigliato</span>
                <span className="font-mono text-2xl font-extrabold text-amber-400" id="pStakeVal">
                  {pRes.stakeResult.stakeFormatted}
                </span>
              </div>
              <div className="text-xs text-slate-300" id="pStakeWhy">
                {pRes.stakeResult.why || `Voto ${pRes.scoreFormatted} · quota ${pOdds.toFixed(2).replace('.', ',')}`}
              </div>

              {pRes.stakeResult.ok && pRes.stakeResult.detailLines && (
                <details className="mt-1 text-xs text-slate-400" id="pStakeDetBox">
                  <summary className="cursor-pointer text-amber-400 hover:underline">Come è calcolato</summary>
                  <div className="mt-1.5 flex flex-col gap-1 font-mono text-[11px] text-slate-300" id="pStakeDet">
                    {pRes.stakeResult.detailLines.map((line, idx) => (
                      <span key={idx}>{line}</span>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Result statistics rows */}
            <div className="divide-y divide-slate-800 text-xs font-medium">
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Tiri attesi (λ)</span>
                <span className="font-mono font-bold text-white" id="lambdaVal">{pRes.lambdaFormatted}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Linea richiesta</span>
                <span className="font-mono font-bold text-white" id="lineVal">{pRes.lineFormatted}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Probabilità modello (Poisson)</span>
                <span className="font-mono font-bold text-white" id="probModelVal">{pRes.probModelFormatted}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Hit rate ultime 5</span>
                <span className="font-mono font-bold text-white" id="hitRateVal">{pRes.hitRateLabel}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Probabilità finale</span>
                <span className="font-mono font-bold text-emerald-400" id="probVal">{pRes.probFinalFormatted}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Probabilità implicita quota</span>
                <span className="font-mono font-bold text-white" id="impliedVal">{pRes.impliedProbFormatted}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Fascia quota</span>
                <span className="font-mono font-bold text-white" id="quotaTierVal">{pRes.quotaTierLabel}</span>
              </div>
            </div>

            {/* Block: Valore complessivo (affidabilita + quota) */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 flex items-center justify-between" id="comboBox">
              <span className="text-xs text-slate-300 font-semibold">Valore complessivo (affidabilità + quota)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-bold text-white" id="comboScoreBig">{pRes.comboScoreFormatted}</span>
                <span className="text-[11px] text-slate-400">/ 10</span>
                <span className="text-xs font-bold ml-1" id="comboLabel" style={{ color: pRes.comboColor }}>
                  {pRes.comboLabel}
                </span>
              </div>
            </div>

            {/* Value Note */}
            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
              pRes.valueNoteClass === 'pos' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' :
              pRes.valueNoteClass === 'neg' ? 'bg-red-950/40 border-red-800 text-red-300' :
              'bg-slate-850 border-slate-800 text-slate-300'
            }`} id="valueNote">
              <div className="font-bold mb-0.5" id="valueTitle">{pRes.valueNoteTitle}</div>
              <div className="text-[11px] text-slate-400" id="valueSub">{pRes.valueNoteSub}</div>
            </div>

            {/* Button Gioca! */}
            <button
              type="button"
              id="pPlayBtn"
              disabled={!pRes.stakeResult.ok}
              onClick={() => handleSavePlay('giocatore')}
              className={`w-full py-3.5 rounded-xl font-display font-bold text-base transition-all ${
                pRes.stakeResult.ok
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 active:scale-98 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
              }`}
            >
              Gioca!
            </button>
            <div className="text-[11px] text-slate-400 text-center min-h-[16px]" id="pPlayHint">
              {pRes.stakeResult.ok ? '' : 'Disponibile per le giocate di valore.'}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 12b. TEAM VIEW */}
      {/* ------------------------------------------------------------------ */}
      {activeMainTab === 'team' && (
        <div id="teamView" className="p-4 flex flex-col gap-4">
          {/* Panel: La giocata (squadra) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-display font-bold text-sm text-slate-100">La giocata (squadra)</h2>
            <p className="text-xs text-slate-400 -mt-1 leading-snug">
              Affidabilità = P(esito della linea | media tiri prevista), usando la media prevista della squadra al posto del tasso individuale.
            </p>

            <div className="flex flex-col gap-3">
              {/* Tipo tiri */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Tipo tiri</label>
                <div className="flex bg-slate-850 border border-slate-800 rounded-xl p-1" id="teamShotTypeSeg">
                  <button
                    type="button"
                    data-val="total"
                    onClick={() => setTShotType('total')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      tShotType === 'total' ? 'bg-slate-800 text-emerald-400 font-bold shadow' : 'text-slate-400'
                    }`}
                  >
                    Totali
                  </button>
                  <button
                    type="button"
                    data-val="sot"
                    onClick={() => setTShotType('sot')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      tShotType === 'sot' ? 'bg-slate-800 text-emerald-400 font-bold shadow' : 'text-slate-400'
                    }`}
                  >
                    In porta
                  </button>
                </div>
              </div>

              {/* Sede della squadra da valutare */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Sede della squadra da valutare</label>
                <div className="flex bg-slate-850 border border-slate-800 rounded-xl p-1" id="teamSedeSeg">
                  {(['home', 'neutral', 'away'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      data-val={s}
                      onClick={() => setTSede(s)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        tSede === s ? 'bg-slate-800 text-emerald-400 font-bold shadow' : 'text-slate-400'
                      }`}
                    >
                      {s === 'home' ? 'Casa' : s === 'neutral' ? 'Nessun effetto' : 'Trasferta'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo linea */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Tipo linea</label>
                <div className="flex bg-slate-850 border border-slate-800 rounded-xl p-1" id="teamLineTypeSeg">
                  <button
                    type="button"
                    data-val="over"
                    onClick={() => setTLineType('over')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      tLineType === 'over' ? 'bg-slate-800 text-emerald-400 font-bold shadow' : 'text-slate-400'
                    }`}
                  >
                    Over
                  </button>
                  <button
                    type="button"
                    data-val="under"
                    onClick={() => setTLineType('under')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      tLineType === 'under' ? 'bg-slate-800 text-emerald-400 font-bold shadow' : 'text-slate-400'
                    }`}
                  >
                    Under
                  </button>
                </div>
              </div>

              {/* Valore linea & Quota */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="teamLineValue" className="text-xs text-slate-400">Valore linea (tiri)</label>
                  <input
                    type="number"
                    id="teamLineValue"
                    step={0.5}
                    value={tLineValue}
                    onChange={(e) => setTLineValue(parseFloat(e.target.value) || 0)}
                    className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="teamOdds" className="text-xs text-slate-400">Quota</label>
                  <input
                    type="number"
                    id="teamOdds"
                    step={0.01}
                    value={tOdds}
                    onChange={(e) => setTOdds(parseFloat(e.target.value) || 0)}
                    className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel: Squadra da valutare */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-display font-bold text-sm text-slate-100">Squadra da valutare</h2>
            <p className="text-xs text-slate-400 -mt-1 leading-snug" id="teamForSub">
              Seleziona campionato e squadra: la media tiri fatti arriva dal database.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="teamForLeague" className="text-xs text-slate-400">Campionato</label>
                <select
                  id="teamForLeague"
                  value={teamForLeague}
                  onChange={(e) => handleTeamForLeagueChange(e.target.value)}
                  className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">— seleziona —</option>
                  <option value="serie-a">Serie A</option>
                  <option value="premier-league">Premier League</option>
                  <option value="bundesliga">Bundesliga</option>
                  <option value="la-liga">La Liga</option>
                  <option value="ligue-1">Ligue 1</option>
                  <option value="eredivisie">Eredivisie (Olanda)</option>
                  <option value="super-lig">Süper Lig (Turchia)</option>
                  <option value="liga-portugal">Liga Portugal</option>
                  <option value="champions-league">Champions League</option>
                  <option value="europa-league">Europa League</option>
                  <option value="nazionali">Nazionali</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="teamForTeam" className="text-xs text-slate-400">Squadra</label>
                <select
                  id="teamForTeam"
                  value={teamForTeam}
                  onChange={(e) => {
                    setTeamForTeam(e.target.value);
                    const teamObj = LEAGUE_DATA[teamForLeague]?.teams[e.target.value];
                    if (teamObj) {
                      setTeamForShots(tShotType === 'sot' ? teamObj.sotFor : teamObj.totalFor);
                    }
                  }}
                  className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {LEAGUE_DATA[teamForLeague]?.teams &&
                    Object.keys(LEAGUE_DATA[teamForLeague].teams).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="teamForShots" id="teamForShotsLabel" className="text-xs text-slate-400">
                {tShotType === 'sot' ? 'Tiri in porta fatti a partita — campionato' : 'Tiri fatti a partita — campionato'}
              </label>
              <input
                type="number"
                id="teamForShots"
                step={0.1}
                value={teamForShots}
                onChange={(e) => setTeamForShots(parseFloat(e.target.value) || 0)}
                className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
              <span className="text-[10px] text-emerald-400 font-mono" id="teamForRankInfo">
                {computeRanks(teamForLeague, tShotType === 'sot' ? 'sotFor' : 'totalFor')[teamForTeam]
                  ? `${computeRanks(teamForLeague, tShotType === 'sot' ? 'sotFor' : 'totalFor')[teamForTeam]}° su ${leagueSize(teamForLeague)} per ${tShotType === 'sot' ? 'tiri in porta' : 'tiri'} fatti`
                  : ''}
              </span>
            </div>
            <div id="teamForBreakdown" style={{ display: 'none' }} />
            <span className="text-[11px] text-slate-400" id="teamForDatasetInfo">
              Dati di {LEAGUE_DATA[teamForLeague]?.label} ({LEAGUE_DATA[teamForLeague]?.updated}).
            </span>
          </div>

          {/* Panel: Squadra avversaria (ospite) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-display font-bold text-sm text-slate-100">Squadra avversaria (ospite)</h2>
            <p className="text-xs text-slate-400 -mt-1 leading-snug" id="teamOppSub">
              Seleziona campionato e squadra: la media tiri subiti arriva dallo stesso database.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="teamOppLeague" className="text-xs text-slate-400">Campionato</label>
                <select
                  id="teamOppLeague"
                  value={teamOppLeague}
                  onChange={(e) => handleTeamOppLeagueChange(e.target.value)}
                  className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">— seleziona —</option>
                  <option value="serie-a">Serie A</option>
                  <option value="premier-league">Premier League</option>
                  <option value="bundesliga">Bundesliga</option>
                  <option value="la-liga">La Liga</option>
                  <option value="ligue-1">Ligue 1</option>
                  <option value="eredivisie">Eredivisie (Olanda)</option>
                  <option value="super-lig">Süper Lig (Turchia)</option>
                  <option value="liga-portugal">Liga Portugal</option>
                  <option value="champions-league">Champions League</option>
                  <option value="europa-league">Europa League</option>
                  <option value="nazionali">Nazionali</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="teamOppTeam" className="text-xs text-slate-400">Squadra</label>
                <select
                  id="teamOppTeam"
                  value={teamOppTeam}
                  onChange={(e) => {
                    setTeamOppTeam(e.target.value);
                    const teamObj = LEAGUE_DATA[teamOppLeague]?.teams[e.target.value];
                    if (teamObj) {
                      setTeamOppShots(tShotType === 'sot' ? teamObj.sotAgainst : teamObj.totalAgainst);
                    }
                  }}
                  className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {LEAGUE_DATA[teamOppLeague]?.teams &&
                    Object.keys(LEAGUE_DATA[teamOppLeague].teams).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="teamOppShots" id="teamOppShotsLabel" className="text-xs text-slate-400">
                {tShotType === 'sot' ? 'Tiri in porta subiti a partita — campionato' : 'Tiri subiti a partita — campionato'}
              </label>
              <input
                type="number"
                id="teamOppShots"
                step={0.1}
                value={teamOppShots}
                onChange={(e) => setTeamOppShots(parseFloat(e.target.value) || 0)}
                className="bg-slate-850 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
              <span className="text-[10px] text-emerald-400 font-mono" id="teamOppRankInfo">
                {computeRanks(teamOppLeague, tShotType === 'sot' ? 'sotAgainst' : 'totalAgainst')[teamOppTeam]
                  ? `${computeRanks(teamOppLeague, tShotType === 'sot' ? 'sotAgainst' : 'totalAgainst')[teamOppTeam]}° su ${leagueSize(teamOppLeague)} per ${tShotType === 'sot' ? 'tiri in porta' : 'tiri'} subiti`
                  : ''}
              </span>
            </div>
            <div id="teamOppBreakdown" style={{ display: 'none' }} />
            <span className="text-[11px] text-slate-400" id="teamOppDatasetInfo">
              Dati di {LEAGUE_DATA[teamOppLeague]?.label} ({LEAGUE_DATA[teamOppLeague]?.updated}).
            </span>
          </div>

          {/* Collapsible "Come viene calcolato" */}
          <details className="bg-slate-900 border border-slate-800 rounded-2xl p-4 group">
            <summary className="flex items-center justify-between cursor-pointer list-none font-display font-bold text-sm text-slate-100">
              <span>Come viene calcolato</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-3 flex flex-col gap-2.5 text-xs text-slate-300 leading-relaxed border-t border-slate-800 mt-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400">
                media_grezza = (tiri fatti dalla squadra + tiri subiti dall'ospite) ÷ 2<br />
                media prevista = media_grezza × fattore_sede
              </div>
              <p className="text-slate-400">
                Il fattore sede qui pesa ±12% (Casa ×1,12, Trasferta ×0,88) — di più rispetto al ±6% del calcolatore giocatore, perché rappresenta l'intero effetto ambientale sulla squadra.
              </p>
            </div>
          </details>

          {/* ---------------- RESULT CARD TEAM ---------------- */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-3">
            <h2 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wider">
              Affidabilità stimata (tiri squadra)
            </h2>

            <div>
              <span className="font-display text-5xl font-extrabold tracking-tight tabular-nums text-white" id="teamScoreBig">
                {tRes.scoreFormatted}
              </span>
              <span className="text-sm font-semibold text-slate-400 ml-1.5">/ 10</span>
            </div>

            <div className="text-sm font-bold -mt-1" id="teamScoreLabel" style={{ color: tRes.scoreColor }}>
              {tRes.scoreLabel}
            </div>

            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                id="teamGaugeFill"
                style={{
                  width: `${tRes.gaugePercent}%`,
                  backgroundColor: tRes.scoreColor,
                  boxShadow: `0 0 10px ${tRes.scoreColor}66`
                }}
              />
            </div>

            {/* Stake consigliato box */}
            <div className="border border-amber-500/70 bg-amber-500/10 rounded-2xl p-4 flex flex-col gap-1.5 my-1" id="tStakeBox">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Stake consigliato</span>
                <span className="font-mono text-2xl font-extrabold text-amber-400" id="tStakeVal">
                  {tRes.stakeResult.stakeFormatted}
                </span>
              </div>
              <div className="text-xs text-slate-300" id="tStakeWhy">
                {tRes.stakeResult.why || `Voto ${tRes.scoreFormatted} · quota ${tOdds.toFixed(2).replace('.', ',')}`}
              </div>

              {tRes.stakeResult.ok && tRes.stakeResult.detailLines && (
                <details className="mt-1 text-xs text-slate-400" id="tStakeDetBox">
                  <summary className="cursor-pointer text-amber-400 hover:underline">Come è calcolato</summary>
                  <div className="mt-1.5 flex flex-col gap-1 font-mono text-[11px] text-slate-300" id="tStakeDet">
                    {tRes.stakeResult.detailLines.map((line, idx) => (
                      <span key={idx}>{line}</span>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Result statistics rows */}
            <div className="divide-y divide-slate-800 text-xs font-medium">
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Media tiri prevista (λ)</span>
                <span className="font-mono font-bold text-white" id="teamForecastBig">{tRes.lambdaFormatted}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Linea richiesta</span>
                <span className="font-mono font-bold text-white" id="teamLineVal">{tRes.lineFormatted}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Probabilità stimata</span>
                <span className="font-mono font-bold text-emerald-400" id="teamProbVal">{tRes.probFormatted}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Probabilità implicita quota</span>
                <span className="font-mono font-bold text-white" id="teamImpliedVal">{tRes.impliedProbFormatted}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Fascia quota</span>
                <span className="font-mono font-bold text-white" id="teamQuotaTierVal">{tRes.quotaTierLabel}</span>
              </div>
            </div>

            {/* Block: Valore complessivo */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 flex items-center justify-between" id="teamComboBox">
              <span className="text-xs text-slate-300 font-semibold">Valore complessivo (affidabilità + quota)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-bold text-white" id="teamComboScoreBig">{tRes.comboScoreFormatted}</span>
                <span className="text-[11px] text-slate-400">/ 10</span>
                <span className="text-xs font-bold ml-1" id="teamComboLabel" style={{ color: tRes.comboColor }}>
                  {tRes.comboLabel}
                </span>
              </div>
            </div>

            {/* Value Note */}
            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
              tRes.valueNoteClass === 'pos' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' :
              tRes.valueNoteClass === 'neg' ? 'bg-red-950/40 border-red-800 text-red-300' :
              'bg-slate-850 border-slate-800 text-slate-300'
            }`} id="teamValueNote">
              <div className="font-bold mb-0.5" id="teamValueTitle">{tRes.valueNoteTitle}</div>
              <div className="text-[11px] text-slate-400" id="teamValueSub">{tRes.valueNoteSub}</div>
            </div>

            {/* Block: Come è nata la media tiri prevista */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-1 text-xs">
              <span className="font-bold text-[11px] text-slate-300 mb-1">Come è nata la media tiri prevista</span>
              <div className="flex justify-between py-1 border-b border-slate-850 text-slate-400">
                <span>Tiri fatti dalla squadra</span>
                <b className="font-mono text-white" id="teamForVal">{tRes.teamForVal}</b>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850 text-slate-400">
                <span>Tiri subiti dall'ospite</span>
                <b className="font-mono text-white" id="teamOppVal">{tRes.teamOppVal}</b>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850 text-slate-400">
                <span>Media grezza</span>
                <b className="font-mono text-white" id="teamRawVal">{tRes.teamRawVal}</b>
              </div>
              <div className="flex justify-between py-1 text-slate-400">
                <span>Fattore sede</span>
                <b className="font-mono text-emerald-400" id="teamSedeVal">{tRes.teamSedeVal}</b>
              </div>
            </div>

            {/* Button Gioca! */}
            <button
              type="button"
              id="tPlayBtn"
              disabled={!tRes.stakeResult.ok}
              onClick={() => handleSavePlay('squadra')}
              className={`w-full py-3.5 rounded-xl font-display font-bold text-base transition-all ${
                tRes.stakeResult.ok
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 active:scale-98 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
              }`}
            >
              Gioca!
            </button>
            <div className="text-[11px] text-slate-400 text-center min-h-[16px]" id="tPlayHint">
              {tRes.stakeResult.ok ? '' : 'Disponibile per le giocate di valore.'}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 12c. STORICO VIEW */}
      {/* ------------------------------------------------------------------ */}
      {activeMainTab === 'history' && (
        <div id="historyView" className="p-4 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-display font-bold text-sm text-slate-100">Storico giocate</h2>
            <p className="text-xs text-slate-400 -mt-1 leading-snug">
              Le giocate che salvi con il tasto Gioca!. Segna tu se sono vinte o perse: qui vedi se il sistema funziona.
            </p>

            {/* Statistics Strip: Chiuse, % vinte, Profitto, Rendimento */}
            <div className="grid grid-cols-2 gap-2.5 mt-1" id="histStats">
              <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Chiuse (vinte / perse)</span>
                <span className="font-mono text-lg font-bold text-white">
                  {closedPlays.length ? `${wins} / ${losses}` : '–'}
                </span>
              </div>
              <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Percentuale vinte</span>
                <span className="font-mono text-lg font-bold text-emerald-400">
                  {closedPlays.length ? `${winRate.toFixed(0)}%` : '–'}
                </span>
              </div>
              <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Profitto (% capitale)</span>
                <span className={`font-mono text-lg font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {closedPlays.length ? `${profit >= 0 ? '+' : ''}${profit.toFixed(2).replace('.', ',')}%` : '–'}
                </span>
              </div>
              <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Rendimento puntate</span>
                <span className={`font-mono text-lg font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {closedPlays.length && staked > 0 ? `${roi >= 0 ? '+' : ''}${roi.toFixed(1).replace('.', ',')}%` : '–'}
                </span>
              </div>
            </div>

            {/* Calibration note */}
            <div className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800" id="histCalib">
              {closedPlays.length > 0 ? (
                <span>
                  Probabilità media prevista dal modello: <b className="text-white font-mono">{avgPredProb.toFixed(1)}%</b> · vinte davvero: <b className="text-white font-mono">{winRate.toFixed(1)}%</b>.
                </span>
              ) : (
                <span>Segna l'esito delle giocate per vedere le statistiche di calibrazione.</span>
              )}
            </div>

            {/* Bands table: sotto 8.00, 8.00-8.99, 9.00-9.49, 9.50 e oltre */}
            {closedPlays.length > 0 && (
              <div className="overflow-x-auto mt-2" id="histBands">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                      <th className="py-1.5 px-1">Voto</th>
                      <th className="py-1.5 px-1">Vinte</th>
                      <th className="py-1.5 px-1">%</th>
                      <th className="py-1.5 px-1 text-right">Profitto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {[
                      { name: 'sotto 8,00', lo: 0, hi: 8 },
                      { name: '8,00 – 8,99', lo: 8, hi: 9 },
                      { name: '9,00 – 9,49', lo: 9, hi: 9.5 },
                      { name: '9,50 e oltre', lo: 9.5, hi: 11 }
                    ].map((band) => {
                      const grp = closedPlays.filter(p => p.score >= band.lo && p.score < band.hi);
                      if (!grp.length) return null;
                      const w = grp.filter(p => p.outcome === 'win').length;
                      const pr = grp.reduce((a, p) => {
                        if (p.outcome === 'win') return a + p.stake * (p.odds - 1);
                        if (p.outcome === 'lose') return a - p.stake;
                        return a;
                      }, 0);

                      return (
                        <tr key={band.name}>
                          <td className="py-1.5 px-1 font-sans">{band.name}</td>
                          <td className="py-1.5 px-1">{w}/{grp.length}</td>
                          <td className="py-1.5 px-1">{((w / grp.length) * 100).toFixed(0)}%</td>
                          <td className={`py-1.5 px-1 text-right ${pr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pr >= 0 ? '+' : ''}{pr.toFixed(2).replace('.', ',')}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* List of Saved Plays */}
          <div className="flex flex-col gap-3" id="histList">
            {savedPlays.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-2xl">
                Nessuna giocata salvata. Quando una giocata è di valore tocca Gioca! per salvarla qui.
              </div>
            ) : (
              savedPlays.map((p) => {
                const pl = p.outcome === 'win' ? p.stake * (p.odds - 1) : p.outcome === 'lose' ? -p.stake : null;

                return (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{p.label}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(p.ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 -mt-1">
                      {p.market} {p.opp ? `· vs ${p.opp}` : ''}
                    </div>

                    {/* Pills: Voto, Quota, Stake */}
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <span className="bg-slate-850 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                        Voto {p.score.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="bg-slate-850 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                        Quota {p.odds.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="bg-amber-950/70 text-amber-300 px-2 py-0.5 rounded border border-amber-700 font-bold">
                        Stake {p.stake.toFixed(2).replace('.', ',')}%
                      </span>
                    </div>

                    {/* Outcome Seg: pending / win / lose */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                      <div className="flex bg-slate-850 border border-slate-800 rounded-xl p-1 flex-1">
                        {(['pending', 'win', 'lose'] as const).map((out) => (
                          <button
                            key={out}
                            type="button"
                            onClick={() => {
                              const updated = savedPlays.map(x => x.id === p.id ? { ...x, outcome: out, upd: Date.now() } : x);
                              setSavedPlays(updated);
                            }}
                            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all ${
                              p.outcome === out
                                ? out === 'win'
                                  ? 'bg-emerald-950 text-emerald-400 font-bold'
                                  : out === 'lose'
                                  ? 'bg-red-950 text-red-400 font-bold'
                                  : 'bg-slate-800 text-slate-200 font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            {out === 'pending' ? 'In attesa' : out === 'win' ? 'Vinta' : 'Persa'}
                          </button>
                        ))}
                      </div>

                      {pl !== null && (
                        <span className={`font-mono text-xs font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pl >= 0 ? '+' : ''}{pl.toFixed(2).replace('.', ',')}%
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSavedPlays(savedPlays.filter(x => x.id !== p.id));
                          showToast('Giocata eliminata');
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Backup Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-display font-bold text-sm text-slate-100">Backup</h2>
            <p className="text-xs text-slate-400 -mt-1 leading-snug">
              Lo storico è salvato su questo telefono. Con "Copia backup" ottieni un testo da conservare (per esempio nelle Note) e puoi rimetterlo qui con "Importa".
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                id="bkCopy"
                onClick={() => {
                  const txt = JSON.stringify({ v: 1, plays: savedPlays });
                  navigator.clipboard.writeText(txt);
                  showToast('Backup copiato negli appunti!');
                  setBkStatusMsg('Backup copiato negli appunti. Incollalo in un posto sicuro.');
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copia backup</span>
              </button>

              <button
                type="button"
                id="bkShowImport"
                onClick={() => setShowImportBox(!showImportBox)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Importa</span>
              </button>
            </div>

            {showImportBox && (
              <div className="flex flex-col gap-2 pt-2" id="bkImportBox">
                <textarea
                  id="bkText"
                  rows={4}
                  value={bkText}
                  onChange={(e) => setBkText(e.target.value)}
                  placeholder="Incolla qui la stringa JSON di backup..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-xs text-slate-200 outline-none"
                />
                <button
                  type="button"
                  id="bkImportGo"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(bkText);
                      const arr = Array.isArray(parsed) ? parsed : parsed.plays;
                      if (!Array.isArray(arr)) throw new Error();
                      setSavedPlays(arr);
                      setShowImportBox(false);
                      setBkText('');
                      showToast(`Importate ${arr.length} giocate con successo!`);
                      setBkStatusMsg(`Importate ${arr.length} giocate con successo.`);
                    } catch (e) {
                      setBkStatusMsg('Formato backup non valido.');
                    }
                  }}
                  className="py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl"
                >
                  Aggiungi allo storico
                </button>
              </div>
            )}

            {bkStatusMsg && (
              <span className="text-[11px] text-slate-400 font-medium" id="bkMsg">
                {bkStatusMsg}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
