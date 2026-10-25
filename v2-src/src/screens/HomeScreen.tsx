import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronRight, Circle } from 'lucide-react';
import { Match } from '../types';
import { MATCHES_DATA } from '../data/matches';
import { AvatarWithFallback } from '../components/ui/AvatarWithFallback';

interface HomeScreenProps {
  onSelectMatch: (match: Match) => void;
  onSelectLeague: (leagueId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectMatch,
  onSelectLeague
}) => {
  // Available dates in strip
  const dateOptions = [
    { id: '2026-10-23', label: 'Ven 23' },
    { id: '2026-10-24', label: 'Ieri' },
    { id: '2026-10-25', label: 'Oggi', isToday: true },
    { id: '2026-10-26', label: 'Domani' },
    { id: '2026-10-27', label: 'Mar 27' },
    { id: '2026-10-28', label: 'Mer 28' },
    { id: '2026-10-29', label: 'Gio 29' }
  ];

  const [selectedDate, setSelectedDate] = useState('2026-10-25');
  const [filterMode, setFilterMode] = useState<'all' | 'live'>('all');

  // Filter matches by selected date or live
  const filteredMatches = MATCHES_DATA.filter((m) => {
    if (filterMode === 'live') {
      return m.status === 'live';
    }
    return m.date === selectedDate;
  });

  const liveCount = MATCHES_DATA.filter((m) => m.status === 'live').length;

  // Group matches by league
  const matchesByLeague = filteredMatches.reduce((acc, match) => {
    if (!acc[match.leagueId]) {
      acc[match.leagueId] = {
        id: match.leagueId,
        name: match.leagueName,
        logo: match.leagueLogo,
        matches: []
      };
    }
    acc[match.leagueId].matches.push(match);
    return acc;
  }, {} as Record<string, { id: string; name: string; logo: string; matches: Match[] }>);

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Date Strip */}
      <div className="sticky top-13 z-20 bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md px-3 py-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
          {dateOptions.map((item) => {
            const isSelected = selectedDate === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedDate(item.id);
                  setFilterMode('all');
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Calendar button */}
        <button
          onClick={() => setSelectedDate('2026-10-25')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 shrink-0"
          title="Seleziona data"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Chips: Tutte / Live */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
            filterMode === 'all'
              ? 'bg-slate-800 text-slate-100 border-slate-700 shadow-sm'
              : 'bg-transparent text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          Tutte ({filteredMatches.length})
        </button>

        <button
          onClick={() => setFilterMode('live')}
          className={`px-3.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all ${
            filterMode === 'live'
              ? 'bg-red-950/70 text-red-300 border-red-700/80 shadow-sm'
              : 'bg-transparent text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span>Live ({liveCount})</span>
        </button>
      </div>

      {/* League Grouped Matches */}
      <div className="flex flex-col gap-4 px-4">
        {Object.keys(matchesByLeague).length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-2xl">
            Nessuna partita programmata per questa selezione.
          </div>
        ) : (
          Object.values(matchesByLeague).map((leagueGroup) => (
            <div
              key={leagueGroup.id}
              className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* League Header banner (tap opens league page) */}
              <button
                onClick={() => onSelectLeague(leagueGroup.id)}
                className="w-full px-3.5 py-2.5 bg-slate-850/90 hover:bg-slate-800 border-b border-slate-800/80 flex items-center justify-between text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <AvatarWithFallback
                    src={leagueGroup.logo}
                    name={leagueGroup.name}
                    size="xs"
                    shape="circle"
                  />
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {leagueGroup.name}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
              </button>

              {/* Match Rows */}
              <div className="divide-y divide-slate-800/50">
                {leagueGroup.matches.map((match) => {
                  const isLive = match.status === 'live';
                  const isFinished = match.status === 'finished';

                  return (
                    <div
                      key={match.id}
                      onClick={() => onSelectMatch(match)}
                      className="flex items-center justify-between p-3.5 hover:bg-slate-800/50 cursor-pointer active:bg-slate-800 transition-colors"
                    >
                      {/* Left: Time or Live Minute */}
                      <div className="w-14 shrink-0 flex flex-col justify-center">
                        {isLive ? (
                          <div className="flex items-center gap-1 text-red-500 font-mono font-bold text-xs animate-pulse">
                            <Circle className="w-2 h-2 fill-red-500" />
                            <span>{match.liveMinute}'</span>
                          </div>
                        ) : isFinished ? (
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">
                            Finita
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-semibold text-slate-300">
                            {match.time}
                          </span>
                        )}
                      </div>

                      {/* Middle: Teams and Scores */}
                      <div className="flex-1 flex flex-col gap-1.5 px-2">
                        {/* Home team */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <AvatarWithFallback
                              src={match.homeTeam.crest}
                              name={match.homeTeam.name}
                              size="xs"
                            />
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {match.homeTeam.name}
                            </span>
                          </div>
                          {(isLive || isFinished) && (
                            <span className={`font-mono text-sm font-bold ml-2 ${isLive ? 'text-red-400' : 'text-slate-200'}`}>
                              {match.homeScore}
                            </span>
                          )}
                        </div>

                        {/* Away team */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <AvatarWithFallback
                              src={match.awayTeam.crest}
                              name={match.awayTeam.name}
                              size="xs"
                            />
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {match.awayTeam.name}
                            </span>
                          </div>
                          {(isLive || isFinished) && (
                            <span className={`font-mono text-sm font-bold ml-2 ${isLive ? 'text-red-400' : 'text-slate-200'}`}>
                              {match.awayScore}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Chevron */}
                      <div className="pl-2 shrink-0">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
