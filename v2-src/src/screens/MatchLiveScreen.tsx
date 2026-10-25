import React, { useState } from 'react';
import { Match, LineupPlayer } from '../types';
import { SwipeableTabs } from '../components/ui/SwipeableTabs';
import { AvatarWithFallback } from '../components/ui/AvatarWithFallback';
import { ComparisonBar } from '../components/ui/ComparisonBar';
import { PitchFormation } from '../components/ui/PitchFormation';
import { ShotMap } from '../components/ui/ShotMap';
import { TEAMS_DATA } from '../data/teams';
import { Activity, ShieldAlert, UserPlus, Video } from 'lucide-react';

interface MatchLiveScreenProps {
  match: Match;
  onSelectTeam: (teamId: string) => void;
  onSelectPlayer: (playerId: string) => void;
}

export const MatchLiveScreen: React.FC<MatchLiveScreenProps> = ({
  match,
  onSelectTeam,
  onSelectPlayer
}) => {
  const [activeTab, setActiveTab] = useState('riepilogo');

  const tabs = [
    { id: 'riepilogo', label: 'Riepilogo' },
    { id: 'statistiche', label: 'Statistiche' },
    { id: 'formazioni', label: 'Formazioni' },
    { id: 'mappa_tiri', label: 'Mappa tiri' },
    { id: 'classifica', label: 'Classifica' }
  ];

  const isLive = match.status === 'live';

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Live / Finished Hero Header */}
      <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 p-4 pt-3 flex flex-col items-center">
        {/* League and Status Header */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <AvatarWithFallback src={match.leagueLogo} name={match.leagueName} size="xs" />
          <span className="font-semibold text-slate-300">{match.leagueName}</span>
          <span>·</span>
          {isLive ? (
            <div className="flex items-center gap-1.5 text-red-500 font-mono font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>LIVE {match.liveMinute}'</span>
            </div>
          ) : (
            <span className="font-mono text-slate-400 font-semibold uppercase">Risultato Finale</span>
          )}
        </div>

        {/* Score & Crests */}
        <div className="w-full flex items-center justify-between px-2 max-w-sm mt-1">
          {/* Home team */}
          <button
            onClick={() => onSelectTeam(match.homeTeam.id)}
            className="flex flex-col items-center gap-1.5 group flex-1"
          >
            <AvatarWithFallback
              src={match.homeTeam.crest}
              name={match.homeTeam.name}
              size="lg"
            />
            <span className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors text-center line-clamp-1">
              {match.homeTeam.name}
            </span>
          </button>

          {/* Big Score */}
          <div className="flex items-center gap-3 px-3">
            <span className={`font-mono text-3xl md:text-4xl font-extrabold ${isLive ? 'text-red-400' : 'text-slate-100'}`}>
              {match.homeScore ?? 0}
            </span>
            <span className="text-slate-600 font-mono text-2xl font-light">–</span>
            <span className={`font-mono text-3xl md:text-4xl font-extrabold ${isLive ? 'text-red-400' : 'text-slate-100'}`}>
              {match.awayScore ?? 0}
            </span>
          </div>

          {/* Away team */}
          <button
            onClick={() => onSelectTeam(match.awayTeam.id)}
            className="flex flex-col items-center gap-1.5 group flex-1"
          >
            <AvatarWithFallback
              src={match.awayTeam.crest}
              name={match.awayTeam.name}
              size="lg"
            />
            <span className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors text-center line-clamp-1">
              {match.awayTeam.name}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <SwipeableTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
        {/* Tab 1: Riepilogo */}
        {activeTab === 'riepilogo' && (
          <div className="p-4 flex flex-col gap-4">
            {/* Momentum Graph (Pressure over time) */}
            {match.momentum && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Grafico Momentum (Pressione d'attacco)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">0' - {match.liveMinute || 90}'</span>
                </div>

                <div className="relative h-24 w-full flex items-center justify-between gap-1 pt-2">
                  {/* Zero centerline */}
                  <div className="absolute top-1/2 left-0 right-0 border-t border-slate-800/80 z-0" />

                  {match.momentum.map((m, idx) => {
                    const isHome = m.value >= 0;
                    const heightPct = Math.min(100, Math.abs(m.value));
                    return (
                      <div key={idx} className="relative flex-1 h-full flex flex-col justify-center items-center z-10 group">
                        <div
                          className={`w-full rounded-sm transition-all ${
                            isHome ? 'bg-emerald-500 mb-auto mt-0' : 'bg-blue-500 mt-auto mb-0'
                          }`}
                          style={{
                            height: `${heightPct * 0.45}%`
                          }}
                          title={`Minuto ${m.minute}': ${isHome ? match.homeTeam.name : match.awayTeam.name} +${Math.abs(m.value)}%`}
                        />
                        <span className="text-[9px] font-mono text-slate-400 mt-1">{m.minute}'</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[10px] font-semibold text-slate-400 pt-2 border-t border-slate-800 mt-1">
                  <span className="text-emerald-400">▲ Pressione {match.homeTeam.name}</span>
                  <span className="text-blue-400">▼ Pressione {match.awayTeam.name}</span>
                </div>
              </div>
            )}

            {/* Timeline with goals, cards, subs, VAR & dividers */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
                Cronologia Incontro
              </h3>

              <div className="relative pl-6 border-l border-slate-800 flex flex-col gap-4 text-xs">
                {match.timeline?.map((evt, idx) => {
                  const isHome = evt.team === 'home';

                  return (
                    <div key={idx} className="relative flex items-start gap-3">
                      {/* Event icon dot on the line */}
                      <span className={`absolute -left-[31px] w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        evt.type === 'goal'
                          ? 'bg-emerald-500 text-slate-950'
                          : evt.type === 'yellow_card'
                          ? 'bg-yellow-400 text-slate-950'
                          : evt.type === 'var'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}>
                        {evt.type === 'goal' ? '⚽' : evt.type === 'yellow_card' ? '■' : evt.type === 'var' ? 'V' : '⇄'}
                      </span>

                      <div className="flex items-baseline gap-2">
                        <span className="font-mono font-bold text-slate-400 w-6 shrink-0">
                          {evt.minute}'
                        </span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                            <span>{evt.player}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              isHome ? 'bg-emerald-950 text-emerald-400' : 'bg-blue-950 text-blue-400'
                            }`}>
                              {isHome ? match.homeTeam.name : match.awayTeam.name}
                            </span>
                          </div>
                          {evt.detail && (
                            <span className="text-[11px] text-slate-400 mt-0.5">{evt.detail}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Intervallo Divider */}
                <div className="relative -ml-6 my-1 py-1.5 bg-slate-850/80 border-y border-slate-800 text-center text-[11px] font-bold text-slate-400 tracking-wider">
                  INTERVALLO (1 - 1)
                </div>

                {/* Fine partita divider if finished */}
                {!isLive && (
                  <div className="relative -ml-6 my-1 py-1.5 bg-slate-850/80 border-y border-slate-800 text-center text-[11px] font-bold text-slate-400 tracking-wider">
                    FINE PARTITA
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Statistiche */}
        {activeTab === 'statistiche' && (
          <div className="p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Statistiche dal vivo
              </h3>
              <div className="flex flex-col">
                {match.comparisonStats?.map((stat, i) => (
                  <ComparisonBar
                    key={i}
                    label={stat.metric}
                    homeVal={stat.home}
                    awayVal={stat.away}
                    type={stat.type || 'int'}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Formazioni con Live Ratings */}
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

        {/* Tab 4: Mappa tiri */}
        {activeTab === 'mappa_tiri' && match.shots && (
          <div className="p-4">
            <ShotMap
              shots={match.shots}
              homeTeamName={match.homeTeam.name}
              awayTeamName={match.awayTeam.name}
            />
          </div>
        )}

        {/* Tab 5: Classifica Live */}
        {activeTab === 'classifica' && (
          <div className="p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                Classifica in tempo reale
              </h3>
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
      </SwipeableTabs>
    </div>
  );
};
