import React, { useState } from 'react';
import { Team, Match, Player } from '../types';
import { TEAMS_DATA } from '../data/teams';
import { PLAYERS_DATA } from '../data/players';
import { MATCHES_DATA } from '../data/matches';
import { SwipeableTabs } from '../components/ui/SwipeableTabs';
import { AvatarWithFallback } from '../components/ui/AvatarWithFallback';
import { ChevronRight, Award, Shield, User } from 'lucide-react';

interface TeamScreenProps {
  teamId: string;
  onSelectPlayer: (playerId: string) => void;
  onSelectMatch: (match: Match) => void;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({
  teamId,
  onSelectPlayer,
  onSelectMatch
}) => {
  const team = TEAMS_DATA[teamId] || TEAMS_DATA.inter;
  const [activeTab, setActiveTab] = useState('partite');
  const [playerMetricChip, setPlayerMetricChip] = useState<'gol' | 'assist' | 'tiri' | 'voto'>('gol');

  const tabs = [
    { id: 'partite', label: 'Partite' },
    { id: 'classifica', label: 'Classifica' },
    { id: 'squadra', label: 'Squadra' },
    { id: 'giocatori', label: 'Giocatori' },
    { id: 'statistiche', label: 'Statistiche' }
  ];

  // Team players
  const teamPlayers = Object.values(PLAYERS_DATA).filter(p => p.teamId === team.id);

  // Group by role
  const goalkeepers = teamPlayers.filter(p => p.position === 'Portiere');
  const defenders = teamPlayers.filter(p => p.position === 'Difensore');
  const midfielders = teamPlayers.filter(p => p.position === 'Centrocampista');
  const forwards = teamPlayers.filter(p => p.position === 'Attaccante');

  // Sorted leaderboards
  const sortedPlayers = [...teamPlayers].sort((a, b) => {
    if (playerMetricChip === 'gol') return b.goals - a.goals;
    if (playerMetricChip === 'assist') return b.assists - a.assists;
    if (playerMetricChip === 'tiri') return b.shotsPer90 - a.shotsPer90;
    return b.rating - a.rating;
  });

  // Team matches
  const teamMatches = MATCHES_DATA.filter(
    m => m.homeTeam.id === team.id || m.awayTeam.id === team.id
  );

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Hero Banner with team color gradient */}
      <div className={`relative bg-gradient-to-br ${team.color || 'from-slate-900 to-slate-950'} border-b border-slate-800 p-5 flex flex-col items-center text-center shadow-lg`}>
        <AvatarWithFallback
          src={team.crest}
          name={team.name}
          size="xl"
          className="mb-2 shadow-2xl"
        />
        <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">
          {team.name}
        </h1>

        <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
          <span className="font-semibold uppercase tracking-wider">{team.leagueId.replace('-', ' ')}</span>
          <span>·</span>
          <span><b>{team.position}°</b> in classifica</span>
          <span>·</span>
          <span><b>{team.points}</b> punti</span>
        </div>

        {/* Form dots */}
        <div className="flex items-center gap-1.5 mt-3 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
          <span className="text-[10px] text-slate-300 font-medium mr-1">Forma:</span>
          {team.form.map((res, i) => (
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
      </div>

      {/* Tabs */}
      <SwipeableTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
        {/* Tab 1: Partite */}
        {activeTab === 'partite' && (
          <div className="p-4 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Prossimi impegni e Risultati
            </h3>
            {teamMatches.map((m) => {
              const isLive = m.status === 'live';
              const isFinished = m.status === 'finished';

              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMatch(m)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono font-bold text-slate-400 w-12 shrink-0">
                      {isLive ? (
                        <span className="text-red-500 animate-pulse">{m.liveMinute}'</span>
                      ) : isFinished ? (
                        'Finita'
                      ) : (
                        m.time
                      )}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-100">
                        {m.homeTeam.name} vs {m.awayTeam.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{m.leagueName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(isLive || isFinished) && (
                      <span className={`font-mono text-sm font-bold ${isLive ? 'text-red-400' : 'text-slate-200'}`}>
                        {m.homeScore} - {m.awayScore}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Classifica */}
        {activeTab === 'classifica' && (
          <div className="p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                Classifica Serie A
              </h3>
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
                    .filter(t => t.leagueId === team.leagueId)
                    .sort((a, b) => a.position - b.position)
                    .map((t) => (
                      <tr
                        key={t.id}
                        className={`${t.id === team.id ? 'bg-emerald-950/40 text-emerald-300 font-bold' : 'text-slate-300'}`}
                      >
                        <td className="py-2 px-1">{t.position}</td>
                        <td className="py-2 px-2 font-sans font-semibold flex items-center gap-2">
                          <AvatarWithFallback src={t.crest} name={t.name} size="xs" />
                          <span>{t.name}</span>
                        </td>
                        <td className="py-2 px-1 text-center text-slate-400">{t.played}</td>
                        <td className="py-2 px-1 text-center text-slate-400">+{t.goalDiff}</td>
                        <td className="py-2 px-2 text-right font-bold text-slate-100">{t.points}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Squadra (Portieri, Difensori, Centrocampisti, Attaccanti, Allenatore) */}
        {activeTab === 'squadra' && (
          <div className="p-4 flex flex-col gap-4">
            {/* Coach card */}
            <div className="flex items-center gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                <User className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Allenatore</span>
                <span className="text-sm font-bold text-white">{team.coach}</span>
              </div>
            </div>

            {/* Role groups */}
            {[
              { title: 'Portieri', list: goalkeepers },
              { title: 'Difensori', list: defenders },
              { title: 'Centrocampisti', list: midfielders },
              { title: 'Attaccanti', list: forwards }
            ].map((group) => (
              <div key={group.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  {group.title} ({group.list.length})
                </h4>
                <div className="divide-y divide-slate-800/50">
                  {group.list.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => onSelectPlayer(player.id)}
                      className="py-2.5 flex items-center justify-between hover:text-emerald-400 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <AvatarWithFallback src={player.photo} name={player.name} size="sm" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-100">{player.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            #{player.number} · {player.appearances} presenze · {player.minutes}'
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          {player.rating.toFixed(2)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Giocatori (Leaderboards with Chips Gol/Assist/Tiri/Voto) */}
        {activeTab === 'giocatori' && (
          <div className="p-4 flex flex-col gap-3">
            {/* Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['gol', 'assist', 'tiri', 'voto'] as const).map((chip) => (
                <button
                  key={chip}
                  onClick={() => setPlayerMetricChip(chip)}
                  className={`px-3.5 py-1 text-xs font-semibold rounded-lg border capitalize transition-all ${
                    playerMetricChip === chip
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {chip === 'gol' ? 'Gol' : chip === 'assist' ? 'Assist' : chip === 'tiri' ? 'Tiri /90\'' : 'Voto medio'}
                </button>
              ))}
            </div>

            {/* Leaderboard list */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800/50">
              {sortedPlayers.map((player, rank) => (
                <div
                  key={player.id}
                  onClick={() => onSelectPlayer(player.id)}
                  className="py-2.5 flex items-center justify-between hover:text-emerald-400 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-400 w-4">{rank + 1}</span>
                    <AvatarWithFallback src={player.photo} name={player.name} size="sm" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-100">{player.name}</span>
                      <span className="text-[10px] text-slate-400">{player.position}</span>
                    </div>
                  </div>

                  <div className="font-mono text-sm font-bold text-emerald-400">
                    {playerMetricChip === 'gol'
                      ? `${player.goals} gol`
                      : playerMetricChip === 'assist'
                      ? `${player.assists} assist`
                      : playerMetricChip === 'tiri'
                      ? `${player.shotsPer90} tiri/90'`
                      : player.rating.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Statistiche (Stat tiles each with a league-rank badge like "3a su 20") */}
        {activeTab === 'statistiche' && (
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Tiri totali fatti / partita', val: team.totalFor, rank: '1ª su 20' },
              { label: 'Tiri concessi / partita', val: team.totalAgainst, rank: '2ª su 20' },
              { label: 'Tiri in porta fatti / partita', val: team.sotFor, rank: '1ª su 20' },
              { label: 'Tiri in porta concessi', val: team.sotAgainst, rank: '3ª su 20' },
              { label: 'Differenza reti totale', val: `+${team.goalDiff}`, rank: '1ª su 20' },
              { label: 'Gol segnati a partita', val: '2.6', rank: '1ª su 20' },
              { label: 'Possesso palla medio', val: '61.4%', rank: '2ª su 20' },
              { label: 'Expected Goals (xG) /90', val: '2.34', rank: '1ª su 20' }
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 font-medium leading-tight mb-2">
                  {stat.label}
                </span>
                <div className="flex items-baseline justify-between mt-auto">
                  <span className="font-mono text-xl font-bold text-white">
                    {stat.val}
                  </span>
                  <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.5 rounded-full">
                    {stat.rank}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SwipeableTabs>
    </div>
  );
};
