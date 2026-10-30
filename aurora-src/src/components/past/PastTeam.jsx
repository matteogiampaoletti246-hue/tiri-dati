import { useState } from 'react';
import useAsync from '@/hooks/useAsync';
import TextFilter from '@/components/TextFilter';
import StatLists from '@/components/stats/StatLists';
import { loadSeason, loadTeamPlayerStats, statsFromMatches, teamPartStats, teamIdByName, seasonLabel } from '@/data/archive';
import { teamFmId } from '@/data/teamIndex';
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
  // prima l'id FotMob (squadre fm-<id>, nomi diversi tra fonti), poi il nome
  const fid = teamFmId(team);
  const tid = season ? (fid && season.teams && season.teams[fid] ? String(fid) : teamIdByName(season.teams, team.name)) : null;
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
  if (!season || !tid) return null;
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
  if (!season) return null;
  return <StandingsPanel season={season} fm={fm} sk={sk} highlight={tid} />;
}

// Pillole del pannello Giocatori: Totale/Casa/Trasferta (Casa/Trasferta solo se la stagione ha le partite con i giocatori), Ogni 90', categorie.
const PARTS = [{ value: 'tot', label: 'Totale' }, { value: 'home', label: 'Casa' }, { value: 'away', label: 'Trasferta' }, { value: 'p90', label: "Ogni 90'" }];
const CATS = [{ value: 'all', label: 'Tutte' }, { value: 'Attacco', label: 'Attacco' }, { value: 'Difesa', label: 'Difesa' }, { value: 'Disciplina', label: 'Disciplina' }, { value: 'Gioco', label: 'Gioco' }];
export const playerCat = (g) => (['Attacco', 'Difesa', 'Disciplina'].includes(g) ? g : 'Gioco');
export function PlayerPills({ part, onPart, cat, onCat, split, has }) {
  const cats = CATS.filter((c) => c.value === 'all' || has.includes(c.value));
  return (
    <div className="flex flex-col gap-2" data-no-swipe="true">
      <TextFilter options={split ? PARTS : PARTS.filter((p) => p.value === 'tot' || p.value === 'p90')} value={part} onChange={onPart} />
      {cats.length > 2 ? <TextFilter options={cats} value={cats.some((c) => c.value === cat) ? cat : 'all'} onChange={onCat} /> : null}
    </div>
  );
}

export function PastTeamPlayers({ fm, sk, team, part, onPart, cat, onCat, split }) {
  const col = useTeamColors();
  const { tid, loading, season } = useTeamSeason(fm, sk, team);
  const byMatch = part === 'home' || part === 'away';
  const { data: stats, loading: l2 } = useAsync(() => (!tid ? Promise.resolve(null) : byMatch ? statsFromMatches(fm, sk, part) : loadTeamPlayerStats(fm, sk, tid)), [fm, sk, tid, part]);
  // cambiando pillola restano visibili i dati di prima finche' arrivano i nuovi: nessun salto
  if (loading || (l2 && !stats)) return <Msg>Carico la stagione {seasonLabel(sk)}…</Msg>;
  if (!season || !tid) return null;
  const secs = statSections(stats, 'players', season.teams || {}, col, fm, sk, part === 'p90' ? 'p90' : 'tot', tid);
  const has = [...new Set(secs.map((x) => playerCat(x.group)))];
  const sections = cat === 'all' || !has.includes(cat) ? secs : secs.filter((x) => playerCat(x.group) === cat);
  if (!sections.length && part === 'tot') return null;
  return <StatLists wide sections={sections} controls={<PlayerPills part={part} onPart={onPart} cat={cat} onCat={onCat} split={split} has={has} />} />;
}
