import React from 'react';
import { Player, ShotEvent } from '../types';
import { PLAYERS_DATA } from '../data/players';
import { TEAMS_DATA } from '../data/teams';
import { AvatarWithFallback } from '../components/ui/AvatarWithFallback';
import { ShotMap } from '../components/ui/ShotMap';
import { ChevronRight, Award, Flame, Calculator } from 'lucide-react';

interface PlayerScreenProps {
  playerId: string;
  onOpenCalculator: (playerName: string) => void;
  onSelectTeam: (teamId: string) => void;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({
  playerId,
  onOpenCalculator,
  onSelectTeam
}) => {
  const player: Player = PLAYERS_DATA[playerId] || PLAYERS_DATA.lautaro;
  const team = TEAMS_DATA[player.teamId] || TEAMS_DATA.inter;

  // Mock player shots for shot map
  const mockPlayerShots: ShotEvent[] = [
    { id: 'ps-1', playerId: player.id, playerName: player.name, team: 'home', minute: 18, xG: 0.38, bodyPart: 'Piede Destro', outcome: 'Gol', x: 88, y: 48 },
    { id: 'ps-2', playerId: player.id, playerName: player.name, team: 'home', minute: 34, xG: 0.12, bodyPart: 'Piede Destro', outcome: 'Parato', x: 82, y: 38 },
    { id: 'ps-3', playerId: player.id, playerName: player.name, team: 'home', minute: 58, xG: 0.44, bodyPart: 'Testa', outcome: 'Gol', x: 91, y: 51 },
    { id: 'ps-4', playerId: player.id, playerName: player.name, team: 'home', minute: 63, xG: 0.06, bodyPart: 'Piede Destro', outcome: 'Murato', x: 78, y: 62 },
    { id: 'ps-5', playerId: player.id, playerName: player.name, team: 'home', minute: 74, xG: 0.08, bodyPart: 'Piede Sinistro', outcome: 'Fuori', x: 74, y: 25 },
    { id: 'ps-6', playerId: player.id, playerName: player.name, team: 'home', minute: 81, xG: 0.22, bodyPart: 'Piede Destro', outcome: 'Parato', x: 85, y: 55 }
  ];

  // Last matches list
  const lastMatches = [
    { id: 'lm-1', opponent: 'Roma', date: '20 ott', res: '2-1 V', rating: 8.2, shots: 4, sot: 2, mins: 88 },
    { id: 'lm-2', opponent: 'Torino', date: '06 ott', res: '3-2 V', rating: 8.5, shots: 5, sot: 3, mins: 90 },
    { id: 'lm-3', opponent: 'Stella Rossa', date: '01 ott', res: '4-0 V', rating: 7.9, shots: 3, sot: 1, mins: 65 },
    { id: 'lm-4', opponent: 'Udinese', date: '28 set', res: '3-2 V', rating: 8.8, shots: 6, sot: 4, mins: 90 },
    { id: 'lm-5', opponent: 'Milan', date: '22 set', res: '1-2 S', rating: 6.8, shots: 2, sot: 1, mins: 80 }
  ];

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Hero with Photo, Team, Position */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 p-5 flex flex-col items-center text-center">
        <div className="relative mb-2">
          <AvatarWithFallback
            src={player.photo}
            name={player.name}
            size="xl"
            shape="circle"
            className="ring-4 ring-emerald-500/30"
          />
          <span className="absolute -bottom-1 -right-1 font-mono text-xs font-bold bg-slate-900 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full shadow">
            #{player.number}
          </span>
        </div>

        <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">
          {player.name}
        </h1>

        <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
          <button
            onClick={() => onSelectTeam(team.id)}
            className="font-semibold text-emerald-400 hover:underline"
          >
            {team.name}
          </button>
          <span>·</span>
          <span>{player.position}</span>
          <span>·</span>
          <span>Voto medio <b className="text-white font-mono">{player.rating.toFixed(2)}</b></span>
        </div>

        {/* Action: Open in Reliability Calculator */}
        <button
          onClick={() => onOpenCalculator(player.name)}
          className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Calcola Affidabilità Linee Tiri</span>
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Season stats grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            Statistiche Stagionali 2026/27
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Presenze', val: player.appearances },
              { label: 'Minuti giocati', val: `${player.minutes}'` },
              { label: 'Gol segnati', val: player.goals },
              { label: 'Assist', val: player.assists },
              { label: 'Tiri totali /90', val: player.shotsPer90 },
              { label: 'Tiri in porta /90', val: player.sotPer90 }
            ].map((s, i) => (
              <div key={i} className="bg-slate-850 p-2.5 rounded-xl border border-slate-800/80 flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium leading-tight mb-1">{s.label}</span>
                <span className="font-mono text-base font-bold text-white">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-90 stats table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            Metriche normalizzate a 90 minuti
          </h3>
          <div className="divide-y divide-slate-800 text-xs">
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400">Tiri totali a partita</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{player.shotsPer90}</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400">Tiri nello specchio a partita</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{player.sotPer90}</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400">Falli commessi ogni 90'</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{player.foulsCommittedPer90}</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400">Falli subiti ogni 90'</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{player.foulsDrawnPer90}</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400">Percentuale tiri in porta</span>
              <span className="font-mono font-bold text-slate-200 text-sm">
                {((player.sotPer90 / (player.shotsPer90 || 1)) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Last matches */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            Ultime 5 partite (Tiri & Voti)
          </h3>
          <div className="divide-y divide-slate-800/60 font-mono text-xs">
            {lastMatches.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-sans font-bold text-slate-200 text-xs">vs {m.opponent}</span>
                  <span className="text-[10px] text-slate-400 font-sans">{m.date} · {m.res} ({m.mins}')</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-right">
                    <span className="text-emerald-400 font-bold">{m.shots} tiri ({m.sot} porta)</span>
                    <span className="text-[10px] text-slate-400">Voto {m.rating.toFixed(1)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shot map */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            Mappa tiri stagionale ({mockPlayerShots.length} conclusioni)
          </h3>
          <ShotMap
            shots={mockPlayerShots}
            homeTeamName={team.name}
            awayTeamName="Avversari"
          />
        </div>
      </div>
    </div>
  );
};
