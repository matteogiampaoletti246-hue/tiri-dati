import React from 'react';
import { REFEREES_DATA, Referee } from '../data/referees';
import { AvatarWithFallback } from '../components/ui/AvatarWithFallback';
import { ShieldAlert, Award, Calendar, AlertTriangle } from 'lucide-react';

interface RefereeScreenProps {
  refereeName?: string;
}

export const RefereeScreen: React.FC<RefereeScreenProps> = ({ refereeName }) => {
  const referee: Referee =
    Object.values(REFEREES_DATA).find(r => r.name.toLowerCase() === refereeName?.toLowerCase()) ||
    REFEREES_DATA.massa;

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 p-5 flex flex-col items-center text-center">
        <AvatarWithFallback
          src={referee.photo}
          name={referee.name}
          size="xl"
          shape="circle"
          className="mb-2 ring-2 ring-amber-500/30"
        />
        <h1 className="font-display font-bold text-2xl text-white tracking-tight">
          {referee.name}
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>{referee.country}</span>
          <span>·</span>
          <span>Arbitro Internazionale FIFA</span>
          <span>·</span>
          <span><b>{referee.matches}</b> direzioni stagionali</span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Season metrics grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            Medie Disciplinari 2026/27
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Ammonizioni / gara</span>
                <span className="font-mono text-xl font-bold text-yellow-400">
                  {referee.yellowCardsAvg.toFixed(2)}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Tot: {referee.yellowCardsTotal}</span>
            </div>

            <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Espulsioni / gara</span>
                <span className="font-mono text-xl font-bold text-red-500">
                  {referee.redCardsAvg.toFixed(2)}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Tot: {referee.redCardsTotal}</span>
            </div>

            <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Falli fischiati / gara</span>
                <span className="font-mono text-xl font-bold text-emerald-400">
                  {referee.foulsAvg.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Tot: {referee.foulsTotal}</span>
            </div>

            <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Rigori assegnati</span>
                <span className="font-mono text-xl font-bold text-sky-400">
                  {referee.penaltiesAvg.toFixed(2)}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Tot: {referee.penaltiesTotal}</span>
            </div>
          </div>
        </div>

        {/* Matches directed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            Ultime Gare Dirette
          </h3>
          <div className="divide-y divide-slate-800/60 font-mono text-xs">
            {referee.recentMatches.map((m) => (
              <div key={m.id} className="py-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-slate-100 text-sm">{m.match}</span>
                  <span className="text-[11px] text-slate-400 font-sans">{m.date}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-sans text-slate-400">{m.league}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">🟨 {m.yellows}</span>
                    <span className="text-red-500">🟥 {m.reds}</span>
                    <span className="text-emerald-400">Falli: {m.fouls}</span>
                    <span className="text-sky-400">Rigori: {m.penalties}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
