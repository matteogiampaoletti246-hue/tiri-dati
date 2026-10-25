import React, { useState } from 'react';
import { Match } from '../types';
import { LEAGUE_DATA, computeRanks } from '../data/leagues';
import { TEAMS_DATA } from '../data/teams';
import { PLAYERS_DATA } from '../data/players';
import { REFEREES_DATA } from '../data/referees';
import { MATCHES_DATA } from '../data/matches';
import { SwipeableTabs } from '../components/ui/SwipeableTabs';
import { AvatarWithFallback } from '../components/ui/AvatarWithFallback';
import { ChevronRight, ChevronDown, Trophy, ShieldAlert, Zap, Compass } from 'lucide-react';

interface LeagueScreenProps {
  leagueId: string;
  onSelectTeam: (teamId: string) => void;
  onSelectPlayer: (playerId: string) => void;
  onSelectReferee: (refereeName: string) => void;
  onSelectMatch: (match: Match) => void;
}

export const LeagueScreen: React.FC<LeagueScreenProps> = ({
  leagueId,
  onSelectTeam,
  onSelectPlayer,
  onSelectReferee,
  onSelectMatch
}) => {
  const league = LEAGUE_DATA[leagueId] || LEAGUE_DATA['serie-a'];
  const [activeTab, setActiveTab] = useState('classifica');

  const tabs = [
    { id: 'partite', label: 'Partite' },
    { id: 'classifica', label: 'Classifica' },
    { id: 'squadre', label: 'Squadre' },
    { id: 'giocatori', label: 'Giocatori' },
    { id: 'arbitri', label: 'Arbitri' }
  ];

  // Classifica filter: Totale / Casa / Trasferta / Forma
  const [tableFilter, setTableFilter] = useState<'totale' | 'casa' | 'trasferta' | 'forma'>('totale');

  // Squadre: Jump-to dropdown
  const [jumpSection, setJumpSection] = useState('attacco');
  const [attackMetric, setAttackMetric] = useState('Gol');
  const [defenseMetric, setDefenseMetric] = useState('Gol subiti');
  const [disciplineMetric, setDisciplineMetric] = useState('Cartellini gialli');
  const [playMetric, setPlayMetric] = useState('Possesso palla %');

  // Arbitri chip filter: Gialli / Rossi / Falli / Rigori / Partite
  const [refereeMetric, setRefereeMetric] = useState<'gialli' | 'rossi' | 'falli' | 'rigori' | 'partite'>('gialli');

  // Teams in this league
  const leagueTeams = Object.values(TEAMS_DATA).filter(t => t.leagueId === leagueId || (leagueId === 'serie-a' && t.leagueId === 'serie-a'));

  // League matches
  const leagueMatches = MATCHES_DATA.filter(m => m.leagueId === leagueId || (leagueId === 'serie-a' && m.leagueId === 'serie-a'));

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 p-5 flex flex-col items-center text-center">
        <AvatarWithFallback
          src="https://images.fotmob.com/image_resources/logo/leaguelogo/55.png"
          name={league.label}
          size="lg"
          className="mb-2"
        />
        <h1 className="font-display font-bold text-2xl text-white tracking-tight">
          {league.label}
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>Italia</span>
          <span>·</span>
          <span>Stagione 2026/27</span>
          <span>·</span>
          <span className="text-[10px] text-emerald-400 font-mono">Aggiornato {league.updated}</span>
        </div>
      </div>

      {/* Tabs */}
      <SwipeableTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
        {/* Tab 1: Partite */}
        {activeTab === 'partite' && (
          <div className="p-4 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Giornata 6 & Risultati
            </h3>
            {leagueMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono font-bold text-slate-400 w-12 shrink-0">
                    {m.status === 'live' ? <span className="text-red-500">{m.liveMinute}'</span> : m.status === 'finished' ? 'Finita' : m.time}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-100">
                      {m.homeTeam.name} vs {m.awayTeam.name}
                    </span>
                    <span className="text-[10px] text-slate-400">{m.stadium}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.homeScore !== undefined && (
                    <span className="font-mono text-sm font-bold text-slate-200">
                      {m.homeScore} - {m.awayScore}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Classifica */}
        {activeTab === 'classifica' && (
          <div className="p-4 flex flex-col gap-3">
            {/* Filter chips: Totale / Casa / Trasferta / Forma */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['totale', 'casa', 'trasferta', 'forma'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTableFilter(filter)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border capitalize transition-all ${
                    tableFilter === filter
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Table with Colored Left Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2 pl-3 pr-1 w-8">#</th>
                    <th className="py-2 px-2">Squadra</th>
                    <th className="py-2 px-1 text-center">G</th>
                    <th className="py-2 px-1 text-center">DR</th>
                    <th className="py-2 pr-2 text-right">Pt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {leagueTeams
                    .sort((a, b) => a.position - b.position)
                    .map((team) => {
                      // Color bar: 1-4 Champions (blue), 5 Europa (orange), 6 Conference (green), 18-20 Retrocessione (red)
                      const pos = team.position;
                      const barColor =
                        pos <= 4 ? 'bg-blue-500' :
                        pos === 5 ? 'bg-amber-500' :
                        pos === 6 ? 'bg-emerald-500' :
                        pos >= 18 ? 'bg-red-500' : 'bg-transparent';

                      return (
                        <tr
                          key={team.id}
                          onClick={() => onSelectTeam(team.id)}
                          className="hover:bg-slate-850 cursor-pointer transition-colors relative"
                        >
                          <td className="py-2.5 pl-3 pr-1 font-bold text-slate-300 relative">
                            {/* Colored left bar indicator */}
                            <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-r-full ${barColor}`} />
                            {pos}
                          </td>
                          <td className="py-2.5 px-2 font-sans font-semibold flex items-center gap-2">
                            <AvatarWithFallback src={team.crest} name={team.name} size="xs" />
                            <span className="truncate text-slate-100">{team.name}</span>
                          </td>
                          <td className="py-2.5 px-1 text-center text-slate-400">{team.played}</td>
                          <td className="py-2.5 px-1 text-center text-slate-400">+{team.goalDiff}</td>
                          <td className="py-2.5 pr-2 text-right font-bold text-slate-100">{team.points}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {/* Table Legend */}
              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Champions League (1-4)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Europa League (5)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Conference League (6)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Retrocessione (18-20)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Squadre (Category cards: Attacco, Difesa, Disciplina, Gioco + Vai a dropdown) */}
        {activeTab === 'squadre' && (
          <div className="p-4 flex flex-col gap-4">
            {/* "Vai a" dropdown */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vai alla categoria:</span>
              </span>
              <select
                value={jumpSection}
                onChange={(e) => {
                  setJumpSection(e.target.value);
                  const el = document.getElementById(`section-${e.target.value}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-2 py-1 outline-none"
              >
                <option value="attacco">Attacco</option>
                <option value="difesa">Difesa</option>
                <option value="disciplina">Disciplina</option>
                <option value="gioco">Gioco</option>
              </select>
            </div>

            {/* Category Card 1: Attacco */}
            <div id="section-attacco" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Statistiche Attacco
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">18 metriche</span>
              </div>

              {/* Metric chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {[
                  'Gol',
                  'xG',
                  'xG senza rigori',
                  'xGOT',
                  'xG da azione',
                  'xG da palla inattiva',
                  'Tiri fuori',
                  'Tiri da fuori area'
                ].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setAttackMetric(metric)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap border transition-all ${
                      attackMetric === metric
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-850 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {metric}
                  </button>
                ))}
              </div>

              {/* Top-3 mini ranking: rank/crest/name/value */}
              <div className="bg-slate-850 rounded-xl p-3 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Top 3 per {attackMetric}
                </span>
                {[
                  { rank: 1, name: 'Inter', crest: TEAMS_DATA.inter.crest, val: '22.5' },
                  { rank: 2, name: 'Roma', crest: TEAMS_DATA.roma.crest, val: '18.7' },
                  { rank: 3, name: 'Juventus', crest: TEAMS_DATA.juventus.crest, val: '18.3' }
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-slate-400 text-[11px] w-4">{row.rank}°</span>
                      <AvatarWithFallback src={row.crest} name={row.name} size="xs" />
                      <span className="font-semibold text-slate-200">{row.name}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">{row.val}</span>
                  </div>
                ))}
              </div>

              <button className="text-xs text-emerald-400 font-semibold py-1 hover:underline text-center">
                Mostra tutte le 20 squadre ▾
              </button>
            </div>

            {/* Category Card 2: Difesa */}
            <div id="section-difesa" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Statistiche Difesa
              </h3>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {['Gol subiti', 'xG concessi', 'Tiri concessi', 'Clean sheets'].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setDefenseMetric(metric)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap border transition-all ${
                      defenseMetric === metric
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                        : 'bg-slate-850 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {metric}
                  </button>
                ))}
              </div>
              <div className="bg-slate-850 rounded-xl p-3 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Migliori difese per {defenseMetric}
                </span>
                {[
                  { rank: 1, name: 'Juventus', crest: TEAMS_DATA.juventus.crest, val: '7.2 tiri' },
                  { rank: 2, name: 'AC Milan', crest: TEAMS_DATA.milan.crest, val: '9.2 tiri' },
                  { rank: 3, name: 'Inter', crest: TEAMS_DATA.inter.crest, val: '11.0 tiri' }
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-slate-400 text-[11px] w-4">{row.rank}°</span>
                      <AvatarWithFallback src={row.crest} name={row.name} size="xs" />
                      <span className="font-semibold text-slate-200">{row.name}</span>
                    </div>
                    <span className="font-mono font-bold text-blue-400">{row.val}</span>
                  </div>
                ))}
              </div>
              <button className="text-xs text-blue-400 font-semibold py-1 hover:underline text-center">
                Mostra tutte le 20 squadre ▾
              </button>
            </div>

            {/* Category Card 3: Disciplina */}
            <div id="section-disciplina" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Disciplina & Falli
              </h3>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {['Cartellini gialli', 'Cartellini rossi', 'Falli commessi', 'Falli subiti'].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setDisciplineMetric(metric)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap border transition-all ${
                      disciplineMetric === metric
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-slate-850 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {metric}
                  </button>
                ))}
              </div>
              <div className="bg-slate-850 rounded-xl p-3 flex flex-col gap-2">
                {[
                  { rank: 1, name: 'Atalanta', crest: TEAMS_DATA.atalanta.crest, val: '18 gialli' },
                  { rank: 2, name: 'Roma', crest: TEAMS_DATA.roma.crest, val: '15 gialli' },
                  { rank: 3, name: 'Juventus', crest: TEAMS_DATA.juventus.crest, val: '14 gialli' }
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-slate-400 text-[11px] w-4">{row.rank}°</span>
                      <AvatarWithFallback src={row.crest} name={row.name} size="xs" />
                      <span className="font-semibold text-slate-200">{row.name}</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400">{row.val}</span>
                  </div>
                ))}
              </div>
              <button className="text-xs text-amber-400 font-semibold py-1 hover:underline text-center">
                Mostra tutte le 20 squadre ▾
              </button>
            </div>

            {/* Category Card 4: Gioco */}
            <div id="section-gioco" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Possesso & Gioco
              </h3>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {['Possesso palla %', 'Passaggi riusciti %', 'Cross riusciti', 'Corner medi'].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setPlayMetric(metric)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap border transition-all ${
                      playMetric === metric
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                        : 'bg-slate-850 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {metric}
                  </button>
                ))}
              </div>
              <div className="bg-slate-850 rounded-xl p-3 flex flex-col gap-2">
                {[
                  { rank: 1, name: 'Inter', crest: TEAMS_DATA.inter.crest, val: '61.4%' },
                  { rank: 2, name: 'Juventus', crest: TEAMS_DATA.juventus.crest, val: '58.2%' },
                  { rank: 3, name: 'Roma', crest: TEAMS_DATA.roma.crest, val: '56.8%' }
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-slate-400 text-[11px] w-4">{row.rank}°</span>
                      <AvatarWithFallback src={row.crest} name={row.name} size="xs" />
                      <span className="font-semibold text-slate-200">{row.name}</span>
                    </div>
                    <span className="font-mono font-bold text-teal-400">{row.val}</span>
                  </div>
                ))}
              </div>
              <button className="text-xs text-teal-400 font-semibold py-1 hover:underline text-center">
                Mostra tutte le 20 squadre ▾
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Giocatori (Cards: Capocannonieri, Assist, Tiri totali ogni 90', Tiri in porta ogni 90', Più in forma, Falli commessi, Falli subiti) */}
        {activeTab === 'giocatori' && (
          <div className="p-4 flex flex-col gap-4">
            {[
              {
                title: 'Capocannonieri',
                top3: [
                  { id: 'thuram', name: 'Marcus Thuram', val: '7 gol', photo: PLAYERS_DATA.thuram.photo },
                  { id: 'vlahovic', name: 'Dušan Vlahović', val: '5 gol', photo: PLAYERS_DATA.vlahovic.photo },
                  { id: 'lautaro', name: 'Lautaro Martínez', val: '4 gol', photo: PLAYERS_DATA.lautaro.photo }
                ]
              },
              {
                title: 'Assist leader',
                top3: [
                  { id: 'barella', name: 'Nicolò Barella', val: '3 assist', photo: PLAYERS_DATA.barella.photo },
                  { id: 'dimarco', name: 'Federico Dimarco', val: '2 assist', photo: PLAYERS_DATA.dimarco.photo },
                  { id: 'lautaro', name: 'Lautaro Martínez', val: '2 assist', photo: PLAYERS_DATA.lautaro.photo }
                ]
              },
              {
                title: 'Tiri totali ogni 90\'',
                top3: [
                  { id: 'vlahovic', name: 'Dušan Vlahović', val: '3.86 tiri/90\'', photo: PLAYERS_DATA.vlahovic.photo },
                  { id: 'lautaro', name: 'Lautaro Martínez', val: '3.75 tiri/90\'', photo: PLAYERS_DATA.lautaro.photo },
                  { id: 'thuram', name: 'Marcus Thuram', val: '3.45 tiri/90\'', photo: PLAYERS_DATA.thuram.photo }
                ]
              },
              {
                title: 'Tiri in porta ogni 90\'',
                top3: [
                  { id: 'thuram', name: 'Marcus Thuram', val: '1.82 tiri/90\'', photo: PLAYERS_DATA.thuram.photo },
                  { id: 'vlahovic', name: 'Dušan Vlahović', val: '1.75 tiri/90\'', photo: PLAYERS_DATA.vlahovic.photo },
                  { id: 'lautaro', name: 'Lautaro Martínez', val: '1.68 tiri/90\'', photo: PLAYERS_DATA.lautaro.photo }
                ]
              },
              {
                title: 'Più in forma (tiri ultime 5)',
                top3: [
                  { id: 'lautaro', name: 'Lautaro Martínez', val: '4.2 tiri/m', photo: PLAYERS_DATA.lautaro.photo },
                  { id: 'vlahovic', name: 'Dušan Vlahović', val: '4.0 tiri/m', photo: PLAYERS_DATA.vlahovic.photo },
                  { id: 'thuram', name: 'Marcus Thuram', val: '3.6 tiri/m', photo: PLAYERS_DATA.thuram.photo }
                ]
              },
              {
                title: 'Falli commessi ogni 90\'',
                top3: [
                  { id: 'vlahovic', name: 'Dušan Vlahović', val: '1.40 falli/90\'', photo: PLAYERS_DATA.vlahovic.photo },
                  { id: 'barella', name: 'Nicolò Barella', val: '1.32 falli/90\'', photo: PLAYERS_DATA.barella.photo },
                  { id: 'lautaro', name: 'Lautaro Martínez', val: '1.12 falli/90\'', photo: PLAYERS_DATA.lautaro.photo }
                ]
              },
              {
                title: 'Falli subiti ogni 90\'',
                top3: [
                  { id: 'lautaro', name: 'Lautaro Martínez', val: '2.25 subiti/90\'', photo: PLAYERS_DATA.lautaro.photo },
                  { id: 'vlahovic', name: 'Dušan Vlahović', val: '2.10 subiti/90\'', photo: PLAYERS_DATA.vlahovic.photo },
                  { id: 'barella', name: 'Nicolò Barella', val: '1.76 subiti/90\'', photo: PLAYERS_DATA.barella.photo }
                ]
              }
            ].map((card) => (
              <div key={card.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {card.title}
                </h4>
                <div className="divide-y divide-slate-800/60">
                  {card.top3.map((p, rank) => (
                    <div
                      key={p.name}
                      onClick={() => onSelectPlayer(p.id)}
                      className="py-2 flex items-center justify-between hover:text-emerald-400 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-400 text-xs w-4">{rank + 1}</span>
                        <AvatarWithFallback src={p.photo} name={p.name} size="sm" />
                        <span className="text-xs font-semibold text-slate-100">{p.name}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400">{p.val}</span>
                    </div>
                  ))}
                </div>
                <button className="text-[11px] text-slate-400 hover:text-emerald-400 pt-1 text-center font-medium">
                  Espandi a classifica completa ▾
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Arbitri (Chips Gialli / Rossi / Falli / Rigori / Partite + ranked list) */}
        {activeTab === 'arbitri' && (
          <div className="p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Statistiche Arbitri Serie A
            </h3>

            {/* Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['gialli', 'rossi', 'falli', 'rigori', 'partite'] as const).map((chip) => (
                <button
                  key={chip}
                  onClick={() => setRefereeMetric(chip)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border capitalize transition-all ${
                    refereeMetric === chip
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {chip === 'gialli' ? 'Cartellini Gialli' : chip === 'rossi' ? 'Rossi' : chip === 'falli' ? 'Falli a partita' : chip === 'rigori' ? 'Rigori' : 'Partite dirette'}
                </button>
              ))}
            </div>

            {/* Ranked list with highlighted column */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-1">Arbitro</th>
                    <th className={`py-2 px-1 text-center ${refereeMetric === 'partite' ? 'text-amber-400 font-bold' : ''}`}>Part.</th>
                    <th className={`py-2 px-1 text-center ${refereeMetric === 'gialli' ? 'text-amber-400 font-bold' : ''}`}>Gialli/G</th>
                    <th className={`py-2 px-1 text-center ${refereeMetric === 'rossi' ? 'text-amber-400 font-bold' : ''}`}>Rossi</th>
                    <th className={`py-2 px-1 text-center ${refereeMetric === 'falli' ? 'text-amber-400 font-bold' : ''}`}>Falli/G</th>
                    <th className={`py-2 px-1 text-right ${refereeMetric === 'rigori' ? 'text-amber-400 font-bold' : ''}`}>Rigori</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {Object.values(REFEREES_DATA).map((ref) => (
                    <tr
                      key={ref.id}
                      onClick={() => onSelectReferee(ref.name)}
                      className="hover:bg-slate-850 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-1 font-sans font-semibold text-slate-100 flex items-center gap-2">
                        <AvatarWithFallback src={ref.photo} name={ref.name} size="xs" />
                        <span className="truncate">{ref.name}</span>
                      </td>
                      <td className={`py-2.5 px-1 text-center ${refereeMetric === 'partite' ? 'bg-amber-500/10 text-amber-300 font-bold' : 'text-slate-400'}`}>
                        {ref.matches}
                      </td>
                      <td className={`py-2.5 px-1 text-center ${refereeMetric === 'gialli' ? 'bg-amber-500/10 text-amber-300 font-bold' : 'text-slate-300'}`}>
                        {ref.yellowCardsAvg.toFixed(1)}
                      </td>
                      <td className={`py-2.5 px-1 text-center ${refereeMetric === 'rossi' ? 'bg-amber-500/10 text-amber-300 font-bold' : 'text-slate-400'}`}>
                        {ref.redCardsTotal}
                      </td>
                      <td className={`py-2.5 px-1 text-center ${refereeMetric === 'falli' ? 'bg-amber-500/10 text-amber-300 font-bold' : 'text-slate-300'}`}>
                        {ref.foulsAvg.toFixed(1)}
                      </td>
                      <td className={`py-2.5 px-1 text-right ${refereeMetric === 'rigori' ? 'bg-amber-500/10 text-amber-300 font-bold' : 'text-slate-400'}`}>
                        {ref.penaltiesTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SwipeableTabs>
    </div>
  );
};
