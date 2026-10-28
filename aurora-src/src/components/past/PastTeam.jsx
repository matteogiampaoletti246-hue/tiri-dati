import { useState } from 'react';
import useAsync from '@/hooks/useAsync';
import TextFilter from '@/components/TextFilter';
import StatLists from '@/components/stats/StatLists';
import { noStats, loadSeason, loadSeasonStats, teamIdByName, seasonLabel } from '@/data/archive';
import { StandingsPanel, useTeamColors } from '@/components/archive/parts';
import { statSections } from '@/components/archive/ArchiveLeague';
import PastStats from './PastStats';

const Msg = ({ children }) => <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>{children}</p>;

function useTeamSeason(fm, sk, team) {
  const { data: season, loading } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const tid = season ? teamIdByName(season.teams, team.name) : null;
  return { season, tid, loading };
}

export function PastTeamStats({ fm, sk, team }) {
  const [part, setPart] = useState('tot');
  const [cat, setCat] = useState('all');
  const { tid, loading, season } = useTeamSeason(fm, sk, team);
  if (loading) return <Msg>Carico la stagione {seasonLabel(sk)}…</Msg>;
  if (!season || !tid) return <Msg>{team.name} non ha giocato questo campionato nel {seasonLabel(sk)}</Msg>;
  return (
    <div>
      <div className="flex flex-col gap-2 px-4 pt-3">
        <TextFilter options={[{ value: 'tot', label: 'Totale' }, { value: 'home', label: 'Casa' }, { value: 'away', label: 'Trasferta' }]} value={part} onChange={setPart} />
        <TextFilter options={[{ value: 'all', label: 'Tutte' }, { value: 'Attacco', label: 'Attacco' }, { value: 'Difesa', label: 'Difesa' }, { value: 'Disciplina', label: 'Disciplina' }, { value: 'Gioco', label: 'Gioco' }]} value={cat} onChange={setCat} />
      </div>
      <div><PastStats kind="teams" id={tid} fm={fm} sk={sk} part={part} cat={cat} /></div>
    </div>
  );
}

export function PastTeamStandings({ fm, sk, team }) {
  const { tid, loading, season } = useTeamSeason(fm, sk, team);
  if (loading) return <Msg>Carico la stagione {seasonLabel(sk)}…</Msg>;
  if (!season) return <Msg>Classifica non disponibile per questa stagione</Msg>;
  return <StandingsPanel season={season} fm={fm} sk={sk} highlight={tid} />;
}

export function PastTeamPlayers({ fm, sk, team }) {
  const [mode, setMode] = useState('tot');
  const col = useTeamColors();
  const { tid, loading, season } = useTeamSeason(fm, sk, team);
  const { data: stats, loading: l2 } = useAsync(() => loadSeasonStats(fm, sk), [fm, sk]);
  if (loading || l2) return <Msg>Carico la stagione {seasonLabel(sk)}…</Msg>;
  if (!season || !tid) return <Msg>{team.name} non ha giocato questo campionato nel {seasonLabel(sk)}</Msg>;
  const sections = statSections(stats, 'players', season.teams || {}, col, fm, sk, mode, tid);
  if (!sections.length) return <Msg>{noStats(fm, sk) ? `Statistiche dei giocatori non disponibili per il ${seasonLabel(sk)}` : `Statistiche dei giocatori del ${seasonLabel(sk)} in arrivo`}</Msg>;
  return <StatLists key={mode} sections={sections} controls={<TextFilter options={[{ value: 'tot', label: 'Totale' }, { value: 'p90', label: "Ogni 90'" }]} value={mode} onChange={setMode} />} />;
}
