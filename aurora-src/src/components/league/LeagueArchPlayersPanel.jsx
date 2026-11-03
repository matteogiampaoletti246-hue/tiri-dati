import useAsync from '@/hooks/useAsync';
import useArchFresh from '@/hooks/useArchFresh';
import { loadSeason, loadLeaguePlayerStats } from '@/data/archive';
import { ArchStatPanel } from '@/components/archive/ArchiveLeague';
import { useTeamColors } from '@/components/archive/parts';

// Coppe europee e campionati senza classifiche giocatori in stats.json: statistiche UFFICIALI FotMob della competizione stessa
// (mai quelle del campionato nazionale dei giocatori), le stesse delle stagioni passate.
export default function LeagueArchPlayersPanel({ fm, sk }) {
  useArchFresh(fm, sk);
  const { data: season } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const { data: pstats } = useAsync(() => loadLeaguePlayerStats(fm, sk), [fm, sk]); // con chi manca nelle classifiche ufficiali (es. Jota Silva)
  const col = useTeamColors();
  if (!pstats) return null;
  return <ArchStatPanel stats={pstats} kind="players" names={(season && season.teams) || {}} col={col} fm={fm} sk={sk} />;
}
