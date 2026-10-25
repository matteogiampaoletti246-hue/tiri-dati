import React, { useState, useMemo } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { TEAMS_DATA } from '../../data/teams';
import { PLAYERS_DATA } from '../../data/players';
import { LEAGUE_DATA } from '../../data/leagues';
import { AvatarWithFallback } from './AvatarWithFallback';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string, id?: string) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return { teams: [], players: [], leagues: [] };
    const q = query.toLowerCase().trim();

    const teams = Object.values(TEAMS_DATA).filter(t =>
      t.name.toLowerCase().includes(q)
    );

    const players = Object.values(PLAYERS_DATA).filter(p =>
      p.name.toLowerCase().includes(q)
    );

    const leagues = Object.entries(LEAGUE_DATA).filter(([key, l]) =>
      l.label.toLowerCase().includes(q) || key.includes(q)
    ).map(([key, l]) => ({ id: key, name: l.label }));

    return { teams, players, leagues };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-150">
      {/* Search Input Bar */}
      <div className="relative flex items-center bg-slate-900 border border-slate-700/80 rounded-2xl p-2.5 shadow-xl">
        <Search className="w-5 h-5 text-emerald-400 ml-2 mr-3 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca squadra, giocatore o campionato..."
          autoFocus
          className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-1 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onClose}
          className="ml-2 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg shrink-0"
        >
          Chiudi
        </button>
      </div>

      {/* Quick suggestions or Results */}
      <div className="flex-1 overflow-y-auto no-scrollbar mt-4 flex flex-col gap-4">
        {!query.trim() ? (
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ricerche frequenti
            </span>
            <div className="flex flex-wrap gap-2">
              {['Inter', 'Real Madrid', 'Lautaro Martínez', 'Haaland', 'Serie A', 'La Liga'].map((item) => (
                <button
                  key={item}
                  onClick={() => setQuery(item)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Teams results */}
            {results.teams.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Squadre ({results.teams.length})
                </span>
                {results.teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onNavigate('team', t.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800/80 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarWithFallback src={t.crest} name={t.name} size="sm" />
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{t.name}</div>
                        <div className="text-xs text-slate-400">{t.coach} · {t.position}° in classifica</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Players results */}
            {results.players.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Giocatori ({results.players.length})
                </span>
                {results.players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onNavigate('player', p.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800/80 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarWithFallback src={p.photo} name={p.name} size="sm" />
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.position} · {p.shotsPer90} tiri/90'</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Leagues results */}
            {results.leagues.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Campionati ({results.leagues.length})
                </span>
                {results.leagues.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      onNavigate('league', l.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800/80 text-left transition-colors"
                  >
                    <div className="text-sm font-semibold text-slate-100">{l.name}</div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {results.teams.length === 0 && results.players.length === 0 && results.leagues.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nessun risultato trovato per "{query}".
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
