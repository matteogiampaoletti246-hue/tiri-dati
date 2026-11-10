// Scelte di competizione e stagione di una scheda squadra (stessa logica di components/past/PastBits.jsx del sito, senza router).
// Il banner segue le scelte fatte nelle tendine dei pannelli (`announceComp`), come `sl-comp` sul sito.
import { useEffect, useRef, useState } from 'react';
import useAsync from '@/hooks/useAsync';
import { pastSeasons, teamSeasons, loadSeason, teamIdByName, sortSeasons, FM_ID, archIndex, curSeasonSync, isCurrent } from '@/data/archive';
import { teamHistory, teamPlayerHistory, teamFmId } from '@/data/teamIndex';
import { leagueById } from '@/data/leagues';
import { RAW } from '@/data/load';
import { isPureCup } from '@/data/bracket';
import { useLiveTable } from '@/data/liveTable';
import { useSel } from './hooks';
import { useStandingRows, seasonTeamRow } from './Standings';

export const NAV = { fm: null, sk: null, tab: null };
export const initSeason = (fm) => {
  if (NAV.sk && String(NAV.fm) === String(fm)) { const v = NAV.sk; NAV.sk = null; NAV.fm = null; return v; }
  return 'cur';
};

const CUP_IDS = ['champions-league', 'europa-league', 'conference-league'];

// competizioni (id app) giocate dalla squadra in quella stagione
export function useSeasonComps(team, season, base) {
  const { data } = useAsync(async () => {
    if (season === 'cur') return null;
    const cands = [...new Set([team.leagueId, ...CUP_IDS])].filter((id) => FM_ID[id]);
    const hits = await Promise.all(cands.map(async (id) => {
      const s = await loadSeason(FM_ID[id], season).catch(() => null);
      return s && s.teams && teamIdByName(s.teams, team.name) ? id : null;
    }));
    return hits.filter(Boolean).map(leagueById).filter(Boolean);
  }, [team.name, season]);
  return season === 'cur' ? base : (data && data.length ? data : base);
}

export const curSkOf = (lid) => {
  const fm = FM_ID[lid];
  if (!fm) return null;
  return (RAW.extra && RAW.extra.sk && RAW.extra.sk[String(fm)]) || curSeasonSync(fm);
};

// competizione + stagione collegate. allowAll: "Tutte le competizioni". players: solo competizioni/stagioni con statistiche giocatori.
export function useTeamView(team, slot, baseComps, defComp, allowAll = false, players = null) {
  const [comp, setComp0] = useSel(team.id, `${slot}-c`, defComp);
  const [season, setSeason] = useSel(team.id, `${slot}-s`, () => initSeason(FM_ID[defComp === 'all' ? team.leagueId : defComp]));
  const { data: hist0 } = useAsync(async () => {
    await archIndex();
    if (!players) return teamHistory(team);
    const h = await teamPlayerHistory(team);
    return h || { seasons: {}, no: {}, noSplit: {} };
  }, [team.id, !!players]);
  const hist = players && hist0 ? hist0.seasons : hist0;
  const comps0 = useSeasonComps(team, season, baseComps);
  const base = new Set(baseComps.map((c) => c.id));
  let comps = comps0;
  if (hist) {
    const ever = Object.keys(hist).sort((a, b) => String(hist[b][0]).localeCompare(String(hist[a][0])));
    const b = players ? baseComps.filter((c) => hist[c.id] || (players.hasApp && c.id === team.leagueId)) : baseComps;
    comps = [...b, ...ever.filter((id) => !base.has(id)).map(leagueById).filter(Boolean)];
  }
  const okComp = comp === 'all' ? allowAll : comps.some((c) => c.id === comp);
  const compEff = okComp ? comp : (allowAll ? 'all' : (comps[0] ? comps[0].id : comp));
  const fms = compEff === 'all' ? [...new Set([FM_ID[team.leagueId], ...CUP_IDS.map((c) => FM_ID[c])].filter(Boolean))] : [FM_ID[compEff]].filter(Boolean);
  const { data } = useAsync(async () => {
    const lists = await Promise.all(fms.map((fm) => teamSeasons(fm, team.name)));
    return sortSeasons([...new Set(lists.flat())]);
  }, [team.name, compEff]);
  const fromHist = hist && (compEff === 'all'
    ? sortSeasons([...new Set(Object.entries(hist).flatMap(([id, sks]) => sks.filter((s) => !(base.has(id) && s === curSkOf(id)))))])
    : hist[compEff] ? hist[compEff].filter((s) => !(base.has(compEff) && s === curSkOf(compEff))) : null);
  const seasons = fromHist || data || [];
  const curEmpty = !!players && !!hist0 && compEff !== 'all' && !(players.hasApp && compEff === team.leagueId) && (hist0.no[compEff] || []).includes(curSkOf(compEff));
  const noCur = compEff !== 'all' && (!base.has(compEff) || curEmpty) && seasons.length > 0;
  const known = !!fromHist || !!data;
  let sk = season === 'cur' || !known || seasons.includes(season) ? season : 'cur';
  if (noCur && sk === 'cur') sk = seasons[0];
  const lg = compEff !== 'all' ? leagueById(compEff) : null;
  const arch = lg && lg.extra ? ((RAW.extra && RAW.extra.sk && RAW.extra.sk[String(lg.fm)]) || (lg.arch ? curSeasonSync(lg.fm) : null)) : null;
  const eff = sk === 'cur' && arch ? arch : sk;
  const setComp = (c) => {
    setComp0(c);
    if (c !== 'all' && season !== 'cur' && hist && hist[c] && !hist[c].includes(season)) setSeason('cur');
    else if (c !== 'all' && season !== 'cur' && !hist) setSeason('cur');
  };
  return { comp: compEff, setComp, season: sk, eff, setSeason, comps, seasons, fm: FM_ID[compEff], noCur, noSplit: players && hist0 ? (hist0.noSplit[compEff] || []) : [] };
}

// ---- il banner segue le tendine dei pannelli
const LISTEN = new Set();
export const announceComp = (teamId, comp, sk) => LISTEN.forEach((f) => f({ teamId, comp, sk }));
export function useAnnounceComp(teamId, comp, season) {
  const touched = useRef(false);
  useEffect(() => { if (touched.current) announceComp(teamId, comp, season); }, [teamId, comp, season]);
  return (fn) => (v) => { touched.current = true; fn(v); };
}
export function useBannerSel(team) {
  const [sel, setSel] = useState(null);
  const id = team && team.id;
  useEffect(() => {
    setSel(null);
    const h = (e) => { if (e.teamId === id) setSel({ comp: e.comp, sk: e.sk || 'cur' }); };
    LISTEN.add(h);
    return () => { LISTEN.delete(h); };
  }, [id]);
  return sel;
}

export function bannerEff(comp, sk) {
  const lg = leagueById(comp);
  const fm = FM_ID[comp];
  const arch = lg && lg.extra ? ((RAW.extra && RAW.extra.sk && RAW.extra.sk[String(lg.fm)]) || (lg.arch ? curSeasonSync(lg.fm) : null)) : null;
  return { fm, eff: sk === 'cur' && arch ? arch : sk };
}

// posizione e punti del banner: sempre quelli della tabella Classifica della competizione/stagione scelta
export function useBannerRow(team, comp, sk = 'cur') {
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
  if (!season || (fm && isPureCup(fm))) return null;
  const fid = teamFmId(team);
  const tid = fid && season.teams && season.teams[fid] ? String(fid) : teamIdByName(season.teams, team.name);
  return seasonTeamRow(season, tid, lt);
}

export { pastSeasons };
