// Posizione e punti del banner squadra/nazionale: sempre quelli della tabella Classifica della competizione (e stagione) scelta nella tendina.
// Stessa fonte e stessi calcoli della tabella: classifica dell'app per i campionati dell'app, archivio della stagione per quelli aggiunti,
// FotMob fresca e partite live sopra. Competizioni a gironi: posizione dentro il girone. Senza riga (coppa a eliminazione) niente numeri.
import { useEffect, useState } from 'react';
import useAsync from '@/hooks/useAsync';
import { loadSeason, teamIdByName, FM_ID, curSeasonSync, isCurrent } from '@/data/archive';
import { teamFmId } from '@/data/teamIndex';
import { leagueById } from '@/data/leagues';
import { RAW } from '@/data/load';
import { useLiveTable } from '@/data/liveTable';
import { useStandingRows } from '@/components/StandingsTable';
import { seasonTeamRow } from '@/components/archive/parts';
import { isPureCup } from '@/data/bracket';

// competizione e stagione scelte nelle tendine dei pannelli della squadra (`announceComp`); all'apertura: campionato della squadra, Attuale
export function useBannerSel(team) {
  const [sel, setSel] = useState(null);
  const id = team && team.id;
  useEffect(() => {
    setSel(null);
    const h = (e) => { if (e.detail && e.detail.teamId === id) setSel({ comp: e.detail.comp, sk: e.detail.sk || 'cur' }); };
    window.addEventListener('sl-comp', h);
    return () => window.removeEventListener('sl-comp', h);
  }, [id]);
  return sel;
}

export function bannerEff(comp, sk) {
  const lg = leagueById(comp);
  const fm = FM_ID[comp];
  const arch = lg && lg.extra ? ((RAW.extra && RAW.extra.sk && RAW.extra.sk[String(lg.fm)]) || (lg.arch ? curSeasonSync(lg.fm) : null)) : null;
  return { fm, eff: sk === 'cur' && arch ? arch : sk };
}

export default function useBannerRow(team, comp, sk = 'cur') {
  const c = comp && comp !== 'all' ? comp : (team ? team.leagueId : null);
  const { fm, eff } = c ? bannerEff(c, sk) : { fm: null, eff: 'cur' };
  const app = eff === 'cur';
  const appRows = useStandingRows(app ? c : null);
  const { data: season } = useAsync(() => (!app && fm ? loadSeason(fm, eff).catch(() => null) : Promise.resolve(null)), [app, fm, eff]);
  const lt = useLiveTable(app ? null : fm, !app && !!fm && !!season && isCurrent(fm, eff));
  if (!team) return null;
  if (app) {
    const r = appRows.find((x) => x.teamId === team.id);
    return r ? { rank: r.rank, points: r.points } : null;
  }
  if (!season || (fm && isPureCup(fm))) return null; // coppa a eliminazione: la scheda mostra il Tabellone, nessuna posizione
  const fid = teamFmId(team);
  const tid = fid && season.teams && season.teams[fid] ? String(fid) : teamIdByName(season.teams, team.name);
  return seasonTeamRow(season, tid, lt);
}
