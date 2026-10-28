import { useState } from 'react';
import useAsync from '@/hooks/useAsync';
import TextFilter from '@/components/TextFilter';
import StatLists from '@/components/stats/StatLists';
import { noStats, loadSeason, loadSeasonStats, teamPartStats, teamIdByName, seasonLabel } from '@/data/archive';
import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import { comma } from '@/lib/format';
import { bandColor } from '@/components/player/playerCalc';
import { upcomingMatches } from '@/data/extras';
import { teamById } from '@/data/teams';
import { StandingsPanel, useTeamColors } from '@/components/archive/parts';
import { statSections } from '@/components/archive/ArchiveLeague';
import PastStats from './PastStats';

const Msg = ({ children }) => <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>{children}</p>;

function useTeamSeason(fm, sk, team) {
  const { data: season, loading } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const tid = season ? teamIdByName(season.teams, team.name) : null;
  return { season, tid, loading };
}


// Riquadri a pillola con le migliori statistiche della squadra (media a partita) e posizione nella competizione della stagione scelta.
const TILES = [['gol', 'Gol'], ['expected_goals', 'xG'], ['total_shots', 'Tiri'], ['ShotsOnTarget', 'Tiri in porta']];
function useTiles(fm, sk, tid) {
  return useAsync(async () => {
    const [ps, season] = await Promise.all([teamPartStats(fm, sk, 'tot').catch(() => null), loadSeason(fm, sk).catch(() => null)]);
    const goals = {};
    ((season && season.fix) || []).forEach((m) => {
      const sc = String(m[5] || '').match(/(\d+)\s*-\s*(\d+)/);
      if (!m[6] || !sc) return;
      [[m[2], +sc[1]], [m[3], +sc[2]]].forEach(([t, g]) => { const a = (goals[t] = goals[t] || { s: 0, n: 0 }); a.s += g; a.n += 1; });
    });
    const lists = {};
    const gl = Object.entries(goals).filter(([, a]) => a.n > 0).map(([t, a]) => [null, '', Number(t), a.s / a.n, 0, a.n]).sort((a, b) => b[3] - a[3]);
    if (gl.length >= 3) lists.gol = gl;
    TILES.slice(1).forEach(([k]) => { const l = ps && ps.teams && ps.teams[k]; if (l && l.length >= 3) lists[k] = l; });
    const out = [];
    TILES.forEach(([k, label]) => {
      const l = lists[k]; if (!l) return;
      const i = l.findIndex((r) => String(r[2]) === String(tid));
      if (i < 0) return;
      out.push({ k, label, v: Number(l[i][3]), rank: i + 1, total: l.length, frac: l.length > 1 ? 1 - i / (l.length - 1) : 1 });
    });
    return out;
  }, [fm, sk, tid]);
}

function NextRow({ team, comp }) {
  const next = upcomingMatches(team.id, 80).find((m) => m.leagueId === comp);
  if (!next) return null; // nessuna prossima partita in questa competizione: la riga non c'e'
  const opp = teamById(next.homeId === team.id ? next.awayId : next.homeId);
  if (!opp) return null;
  const isHome = next.homeId === team.id;
  return (
    <Link to={`/match/${next.id}`} className="glass press mx-4 mt-3 flex items-center gap-3 rounded-[20px] px-4 py-3">
      <Crest team={team} size={22} />
      <span className="text-[12.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Prossima</span>
      <span className="ml-auto flex items-center gap-2 text-[13.5px] font-extrabold">VS <Crest team={opp} size={22} />{opp.name}<span className="rounded-full px-2 py-[1px] text-[10.5px] font-bold" style={{ background: 'var(--hair-2)', color: 'var(--ink-2)' }}>{isHome ? 'Casa' : 'Trasferta'}</span></span>
    </Link>
  );
}

function TopTiles({ fm, sk, tid }) {
  const { data } = useTiles(fm, sk, tid);
  if (!data || !data.length) return null;
  return (
    <div className="grid grid-cols-4 gap-2 px-4 pt-3">
      {data.map((t) => (
        <div key={t.k} className="glass rounded-[18px] px-2 py-2.5 text-center">
          <p className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{t.label}</p>
          <p className="tnum mt-1 text-[17px] font-extrabold">{comma(t.v, 1)}</p>
          <span className="tnum mt-1 inline-block rounded-full px-2 py-[1px] text-[10px] font-extrabold text-white" style={{ background: bandColor(t.frac) }}>{t.rank}°</span>
        </div>
      ))}
    </div>
  );
}

export function PastTeamStats({ fm, sk, team, comp, cur }) {
  const [part, setPart] = useState('tot');
  const [cat, setCat] = useState('all');
  const { tid, loading, season } = useTeamSeason(fm, sk, team);
  if (loading) return <Msg>Carico la stagione {seasonLabel(sk)}…</Msg>;
  if (!season || !tid) return <Msg>{team.name} non ha giocato questo campionato nel {seasonLabel(sk)}</Msg>;
  return (
    <div>
      <TopTiles fm={fm} sk={sk} tid={tid} />
      {cur && comp ? <NextRow team={team} comp={comp} /> : null}
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
  return <StatLists sections={sections} controls={<TextFilter options={[{ value: 'tot', label: 'Totale' }, { value: 'p90', label: "Ogni 90'" }]} value={mode} onChange={setMode} />} />;
}
