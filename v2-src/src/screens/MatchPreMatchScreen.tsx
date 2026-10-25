import React, { useState } from 'react';
import { Match, LineupPlayer } from '../types';
import { SwipeableTabs } from '../components/ui/SwipeableTabs';
import { AvatarWithFallback } from '../components/ui/AvatarWithFallback';
import { ComparisonBar } from '../components/ui/ComparisonBar';
import { PitchFormation } from '../components/ui/PitchFormation';
import { GaugeMeter } from '../components/ui/GaugeMeter';
import { MapPin, CloudRain, Sun, Wind, UserCheck, ShieldAlert, Award } from 'lucide-react';
import { TEAMS_DATA } from '../data/teams';

interface MatchPreMatchScreenProps {
  match: Match;
  onSelectTeam: (teamId: string) => void;
  onSelectPlayer: (playerId: string) => void;
  onSelectReferee: (refereeName: string) => void;
  onOpenCalculator: (playerName: string) => void;
}

export const MatchPreMatchScreen: React.FC<MatchPreMatchScreenProps> = ({
  match,
  onSelectTeam,
  onSelectPlayer,
  onSelectReferee,
  onOpenCalculator
}) => {
  const [activeTab, setActiveTab] = useState('panoramica');

  const tabs = [
    { id: 'panoramica', label: 'Panoramica' },
    { id: 'statistiche', label: 'Statistiche' },
    { id: 'formazioni', label: 'Formazioni' },
    { id: 'classifica', label: 'Classifica' },
    { id: 'affidabilita', label: 'Affidabilità' }
  ];

  const renderFormDots = (form: ('V' | 'P' | 'S')[]) => {
    return (
      <div className="flex items-center gap-1">
        {form.map((res, i) => (
          <span
            key={i}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-white ${
              res === 'V' ? 'bg-emerald-500' : res === 'P' ? 'bg-slate-500' : 'bg-red-500'
            }`}
          >
            {res}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Hero Match Banner */}
      <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 p-4 pt-3 flex flex-col items-center">
        {/* League and date */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
          <AvatarWithFallback src={match.leagueLogo} name={match.leagueName} size="xs" />
          <span className="font-semibold text-slate-300">{match.leagueName}</span>
          <span>·</span>
          <span>Oggi, {match.time}</span>
        </div>

        {/* Crests and Match title */}
        <div className="w-full flex items-center justify-between px-2 max-w-sm">
          {/* Home team */}
          <button
            onClick={() => onSelectTeam(match.homeTeam.id)}
            className="flex flex-col items-center gap-2 group flex-1"
          >
            <AvatarWithFallback
              src={match.homeTeam.crest}
              name={match.homeTeam.name}
              size="lg"
            />
            <span className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors text-center line-clamp-1">
              {match.homeTeam.name}
            </span>
            {renderFormDots(match.homeTeam.form)}
          </button>

          {/* VS & Kickoff time */}
          <div className="flex flex-col items-center px-3 shrink-0">
            <span className="font-mono text-xl font-extrabold text-emerald-400 tracking-wider">
              {match.time}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
              Pre-partita
            </span>
          </div>

          {/* Away team */}
          <button
            onClick={() => onSelectTeam(match.awayTeam.id)}
            className="flex flex-col items-center gap-2 group flex-1"
          >
            <AvatarWithFallback
              src={match.awayTeam.crest}
              name={match.awayTeam.name}
              size="lg"
            />
            <span className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors text-center line-clamp-1">
              {match.awayTeam.name}
            </span>
            {renderFormDots(match.awayTeam.form)}
          </button>
        </div>
      </div>

      {/* Tabs with Horizontal Swipe */}
      <SwipeableTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
        {/* Tab 1: Panoramica */}
        {activeTab === 'panoramica' && (
          <div className="p-4 flex flex-col gap-4">
            {/* Numeri da tenere d'occhio */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Numeri da tenere d'occhio
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {match.keyStats?.map((stat, idx) => (
                  <div key={idx} className="bg-slate-850 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[11px] text-slate-400 font-medium leading-tight mb-2">
                      {stat.label}
                    </span>
                    <div className="flex items-baseline justify-between">
                      <div className="flex flex-col">
                        <span className="font-mono text-lg font-bold text-emerald-400">
                          {stat.homeVal}
                        </span>
                        {stat.homeRank && (
                          <span className="text-[10px] font-semibold text-emerald-500/90 font-mono">
                            {stat.homeRank}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-xs">vs</span>
                      <div className="flex flex-col text-right">
                        <span className="font-mono text-lg font-bold text-blue-400">
                          {stat.awayVal}
                        </span>
                        {stat.awayRank && (
                          <span className="text-[10px] font-semibold text-blue-400/90 font-mono">
                            {stat.awayRank}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Giocatori migliori: two-sided comparison rows */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                Giocatori migliori a confronto
              </h3>

              <div className="flex flex-col gap-3">
                {/* Attacco: Lautaro vs Vlahovic / Thuram */}
                <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                    Miglior marcatore & tiratore
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => onSelectPlayer('lautaro')}
                      className="flex items-center gap-2 hover:text-emerald-400"
                    >
                      <AvatarWithFallback name="Lautaro Martínez" size="xs" />
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-200">L. Martínez</span>
                        <span className="text-[10px] text-slate-400 font-mono">Voto 7.84 · 3.75 tiri/90'</span>
                      </div>
                    </button>
                    <button
                      onClick={() => onSelectPlayer('vlahovic')}
                      className="flex items-center gap-2 text-right hover:text-blue-400"
                    >
                      <div className="flex flex-col text-right">
                        <span className="font-bold text-slate-200">D. Vlahović</span>
                        <span className="text-[10px] text-slate-400 font-mono">Voto 7.65 · 3.86 tiri/90'</span>
                      </div>
                      <AvatarWithFallback name="Dušan Vlahović" size="xs" />
                    </button>
                  </div>
                  {/* Two sided bar */}
                  <div className="grid grid-cols-2 gap-1 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div className="bg-emerald-400 rounded-l-full" style={{ width: '51%' }} />
                    <div className="bg-blue-400 rounded-r-full" style={{ width: '49%' }} />
                  </div>
                </div>

                {/* Regista / Centrocampo: Barella vs Koopmeiners */}
                <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                    Centrocampo & creazione gioco
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => onSelectPlayer('barella')}
                      className="flex items-center gap-2 hover:text-emerald-400"
                    >
                      <AvatarWithFallback name="Nicolò Barella" size="xs" />
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-200">N. Barella</span>
                        <span className="text-[10px] text-slate-400 font-mono">Voto 7.55 · 3 assist</span>
                      </div>
                    </button>
                    <button
                      onClick={() => onSelectPlayer('koopmeiners')}
                      className="flex items-center gap-2 text-right hover:text-blue-400"
                    >
                      <div className="flex flex-col text-right">
                        <span className="font-bold text-slate-200">T. Koopmeiners</span>
                        <span className="text-[10px] text-slate-400 font-mono">Voto 7.32 · 2.08 tiri/90'</span>
                      </div>
                      <AvatarWithFallback name="Teun Koopmeiners" size="xs" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div className="bg-emerald-400 rounded-l-full" style={{ width: '55%' }} />
                    <div className="bg-blue-400 rounded-r-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Info band: Stadio, Meteo, Arbitro */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 text-xs">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                Informazioni incontro
              </h3>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[11px]">Stadio</span>
                  <span className="font-semibold text-slate-200">{match.stadium}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Sun className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[11px]">Condizioni meteo</span>
                  <span className="font-semibold text-slate-200">
                    {match.weather.condition} · {match.weather.temp} (Vento: {match.weather.wind})
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectReferee(match.referee.name)}
                className="flex items-start gap-3 text-left hover:text-emerald-400 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[11px]">Arbitro designato</span>
                  <span className="font-semibold text-slate-200">
                    {match.referee.name} (media falli {match.referee.foulsAvg}, {match.referee.yellowAvg} ammonizioni/partita)
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Statistiche */}
        {activeTab === 'statistiche' && (
          <div className="p-4 flex flex-col gap-4">
            {/* Attesi in partita */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Attesi in partita (modello predittivo)
              </h3>
              <div className="flex flex-col">
                <ComparisonBar label="Tiri totali attesi" homeVal={16.4} awayVal={14.8} type="float" />
                <ComparisonBar label="Tiri in porta attesi" homeVal={6.2} awayVal={5.1} type="float" />
                <ComparisonBar label="Corner attesi" homeVal={6.8} awayVal={4.2} type="float" />
                <ComparisonBar label="Falli previsti" homeVal={12.5} awayVal={13.2} type="float" />
                <ComparisonBar label="Fuorigioco previsti" homeVal={1.8} awayVal={2.4} type="float" />
              </div>
            </div>

            {/* Medie di stagione */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Medie di stagione
              </h3>
              <div className="flex flex-col">
                {match.seasonAverages?.map((stat, i) => (
                  <ComparisonBar
                    key={i}
                    label={stat.metric}
                    homeVal={stat.home}
                    awayVal={stat.away}
                    type="float"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Formazioni */}
        {activeTab === 'formazioni' && match.homeLineup && match.awayLineup && (
          <div className="p-4">
            <PitchFormation
              homeFormation={match.homeLineup.formation}
              awayFormation={match.awayLineup.formation}
              homeCoach={match.homeLineup.coach}
              awayCoach={match.awayLineup.coach}
              homeStarters={match.homeLineup.starters}
              awayStarters={match.awayLineup.starters}
              homeBench={match.homeLineup.bench}
              awayBench={match.awayLineup.bench}
              onPlayerClick={(p: LineupPlayer) => onSelectPlayer(p.id)}
            />
          </div>
        )}

        {/* Tab 4: Classifica */}
        {activeTab === 'classifica' && (
          <div className="p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Classifica Serie A
                </h3>
                <span className="text-[10px] text-slate-400">Giornata 6</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="py-2 px-1 w-6">#</th>
                      <th className="py-2 px-2">Squadra</th>
                      <th className="py-2 px-1 text-center">G</th>
                      <th className="py-2 px-1 text-center">DR</th>
                      <th className="py-2 px-2 text-right">Pt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {Object.values(TEAMS_DATA)
                      .filter(t => t.leagueId === 'serie-a')
                      .sort((a, b) => a.position - b.position)
                      .map((team) => {
                        const isHighlighted =
                          team.id === match.homeTeam.id || team.id === match.awayTeam.id;

                        return (
                          <tr
                            key={team.id}
                            onClick={() => onSelectTeam(team.id)}
                            className={`cursor-pointer transition-colors ${
                              isHighlighted
                                ? team.id === match.homeTeam.id
                                  ? 'bg-emerald-950/40 text-emerald-300 font-bold'
                                  : 'bg-blue-950/40 text-blue-300 font-bold'
                                : 'text-slate-300 hover:bg-slate-850'
                            }`}
                          >
                            <td className="py-2 px-1 text-[11px] font-bold text-slate-400">
                              {team.position}
                            </td>
                            <td className="py-2 px-2 flex items-center gap-2 font-sans font-semibold">
                              <AvatarWithFallback src={team.crest} name={team.name} size="xs" />
                              <span className="truncate">{team.name}</span>
                            </td>
                            <td className="py-2 px-1 text-center text-slate-400">{team.played}</td>
                            <td className="py-2 px-1 text-center text-slate-400">+{team.goalDiff}</td>
                            <td className="py-2 px-2 text-right font-bold text-slate-100">{team.points}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Affidabilita */}
        {activeTab === 'affidabilita' && (
          <div className="p-4 flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Analisi quantitativa match
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                La giocata top individuata dal modello di Poisson per questo match:
              </p>

              <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-white">Lautaro Martínez · Over 1.5 tiri</span>
                  <span className="font-mono text-emerald-400 font-bold">Quota 1.85</span>
                </div>
                <span className="text-[11px] text-slate-400 block mb-3">
                  Tasso normalizzato 3.75/90' vs Juventus (concessi 7.2 tiri/partita)
                </span>

                <GaugeMeter score={8.84} label="Affidabilità alta" max={10} />
              </div>

              {/* Stake Card */}
              <div className="border border-amber-500/60 bg-amber-500/10 rounded-xl p-3.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Stake consigliato
                  </span>
                  <span className="font-mono text-xl font-bold text-amber-400">
                    1.21%
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  Voto 8,84 · quota 1,85: valore pieno sul bookmaker senza riduzione quota.
                </p>
                <button
                  onClick={() => onOpenCalculator('Lautaro')}
                  className="mt-2 w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                >
                  Apri nel Calcolatore
                </button>
              </div>
            </div>
          </div>
        )}
      </SwipeableTabs>
    </div>
  );
};
