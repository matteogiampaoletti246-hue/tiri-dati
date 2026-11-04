import { useEffect, useRef, useState } from 'react';
import usePageTabKey, { tabIndexOf } from '@/hooks/usePageTabKey';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import { findInMatch, openPlayer } from '@/data/playerSheet';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import MatchHero from '@/components/MatchHero';
import SwipeTabs from '@/components/SwipeTabs';
import { SkMatchHero, SkMatchBody } from '@/components/PageSkeletons';
import MatchOverviewPanel from '@/components/match/MatchOverviewPanel';
import MatchSummaryPanel from '@/components/match/MatchSummaryPanel';
import MatchStatsPanel from '@/components/match/MatchStatsPanel';
import MatchLineupsPanel from '@/components/match/MatchLineupsPanel';
import MatchReliabilityList from '@/components/match/MatchReliabilityList';
import MatchStandingsPanel from '@/components/match/MatchStandingsPanel';
import Bracket from '@/components/bracket/Bracket';
import { isPureCup, peekBracket } from '@/data/bracket';
import { hasMatchStats } from '@/components/match/MatchStatsPanel';
import { hasLineups } from '@/components/match/MatchLineupsPanel';
import { hasReliability } from '@/components/match/MatchReliabilityList';
import useTicker from '@/hooks/useTicker';
import { matchById, viewMatch } from '@/data/matches';
import { prepareMatch, isReady } from '@/data/prepare';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';
import { matchTint } from '@/data/matchTint';
import { CALC_KEYS } from '@/data/calcData';

const PRE_TABS = [
  { key: 'overview', label: 'Panoramica' },
  { key: 'stats', label: 'Statistiche' },
  { key: 'lineups', label: 'Formazioni' },
  { key: 'rel', label: 'Affidabilità' },
  { key: 'standings', label: 'Classifica' },
];

// partite dei campionati aggiunti non ancora giocate: solo cio' che esiste davvero per loro
const PRE_TABS_X = [
  { key: 'overview', label: 'Panoramica' },
  { key: 'stats', label: 'Statistiche' },
  { key: 'lineups', label: 'Formazioni' },
  { key: 'rel', label: 'Affidabilità' }, // solo nei campionati con Affidabilita' (EXTRA_KEYS), se c'e' almeno un giocatore
  { key: 'standings', label: 'Classifica' },
];

const PLAYED_TABS = [
  { key: 'summary', label: 'Riepilogo' },
  { key: 'stats', label: 'Statistiche' },
  { key: 'lineups', label: 'Formazioni' },
  { key: 'standings', label: 'Classifica' },
];

function StandingsOrBracket({ raw, cup }) {
  return cup ? <Bracket fm={raw.archive.fm} sk={raw.archive.sk} /> : <MatchStandingsPanel match={raw} />;
}

export default function Match() {
  const { id } = useParams();
  const [tabKey, setTabKey] = usePageTabKey('match', id);
  useTicker(30000);
  const [, bump] = useState(0);
  // la pagina compare solo quando tutto e' pronto (max 7 s): niente riepilogo, momentum o statistiche che arrivano dopo
  const [okId, setOkId] = useState(() => (isReady(id) ? id : null));
  const ready = okId === id || isReady(id);
  const loc = useLocation();
  const wantPlayer = loc.state && loc.state.openPlayer;
  const opened = useRef('');

  useEffect(() => {
    let on = true;
    const done = () => {
      if (!on) return;
      setOkId(id);
      bump((n) => n + 1);
      if (wantPlayer && opened.current !== id && matchById(id) && matchById(id).lineup) {
        opened.current = id;
        setTimeout(() => openPlayer({ matchId: id, name: wantPlayer.name, fmId: wantPlayer.fmId }), 250);
      }
    };
    const cap = setTimeout(() => { if (on) setOkId(id); }, 7000);
    prepareMatch(id).then(() => { clearTimeout(cap); done(); });
    // ogni 5 secondi: partita live o vicina; formazioni probabili piu' lontane ogni minuto
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      const m = matchById(id);
      if (!m) return;
      const to = m.ts - Date.now();
      if (m.status === 'live' || (m.status === 'scheduled' && to < 3 * 3600000) || (m.status === 'scheduled' && to < 96 * 3600000 && n % 12 === 0)) prepareMatch(id, true).then(() => on && bump((x) => x + 1));
    }, 5000);
    return () => {
      on = false;
      clearTimeout(cap);
      clearInterval(t);
    };
  }, [id]);

  // formazioni arrivate dopo il primo disegno (partite d'archivio o appena aggiornate): la tendina del giocatore si apre comunque
  useEffect(() => {
    const m = matchById(id);
    if (wantPlayer && ready && opened.current !== id && m && m.lineup && findInMatch(m, wantPlayer.name, wantPlayer.fmId)) {
      opened.current = id;
      setTimeout(() => openPlayer({ matchId: id, name: wantPlayer.name, fmId: wantPlayer.fmId }), 150);
    }
  });

  const raw = matchById(id);
  if (raw && raw.href) return <Navigate to={raw.href} state={loc.state} replace />;
  // in preparazione: intestazione vera se la partita e' gia' nota (stessa posizione della pagina pronta), scheletro sotto
  if (!ready) {
    return (
      <PageShell>
        <div style={raw ? { '--tint': matchTint(raw.leagueId, raw.leagueObj) } : undefined}>
          {raw ? <div data-back-banner="1"><MatchHero match={raw} view={viewMatch(raw)} league={leagueById(raw.leagueId) || raw.leagueObj || null} home={teamById(raw.homeId)} away={teamById(raw.awayId)} pending /></div> : <div className="sk-delay"><SkMatchHero /></div>}
          <SkMatchBody />
        </div>
      </PageShell>
    );
  }
  if (!raw) {
    return (
      <PageShell bar={false}>
        <TopBar title="Partita" />
        <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Partita non trovata
        </p>
      </PageShell>
    );
  }

  const view = viewMatch(raw);
  const home = teamById(raw.homeId);
  const away = teamById(raw.awayId);
  const league = leagueById(raw.leagueId) || raw.leagueObj || null;
  const pre = raw.status === 'scheduled';

  // coppe nazionali: al posto della classifica c'e' il tabellone
  const cup = !!(raw.archive && isPureCup(raw.archive.fm));
  const lastTab = cup ? { key: 'standings', label: 'Tabellone' } : { key: 'standings', label: 'Classifica' };
  const baseTabs = pre ? (raw.archive ? PRE_TABS_X : PRE_TABS) : PLAYED_TABS;
  // una scheda senza dati non si mostra (mai "non disponibile")
  const has = {
    stats: hasMatchStats(raw, view, home, away, pre),
    lineups: hasLineups(view),
    rel: (!raw.archive || CALC_KEYS.includes(raw.leagueId)) && hasReliability(raw),
    standings: cup ? !!((peekBracket(raw.archive.fm, raw.archive.sk) || {}).rounds || []).length : !raw.archive || !!(raw.season && (raw.season.table || (raw.season.groups && raw.season.groups.length))),
  };
  const PANEL = {
    overview: () => <MatchOverviewPanel key="overview" match={raw} home={home} away={away} />,
    summary: () => <MatchSummaryPanel key="summary" match={raw} view={view} home={home} away={away} />,
    stats: () => <MatchStatsPanel key="stats" match={raw} view={view} home={home} away={away} pre={pre} />,
    lineups: () => <MatchLineupsPanel key="lineups" match={raw} view={view} home={home} away={away} pre={pre} />,
    rel: () => <MatchReliabilityList key="rel" match={raw} home={home} away={away} />,
    standings: () => <StandingsOrBracket key="standings" raw={raw} cup={cup} />,
  };
  const tabs = baseTabs.map((t) => (t.key === 'standings' ? lastTab : t)).filter((t) => has[t.key] !== false);
  const panels = tabs.map((t) => PANEL[t.key]());

  return (
    <PageShell>
      <div style={{ '--tint': matchTint(raw.leagueId, raw.leagueObj) }}>
      <div data-back-banner="1"><MatchHero match={raw} view={view} league={league} home={home} away={away} /></div>

      <SwipeTabs tabs={tabs} panels={panels} index={tabIndexOf(tabs, tabKey)} onChange={(i) => setTabKey(tabs[i] ? tabs[i].key : '')} className="pt-2" stickyTop="0px" />

      </div>
    </PageShell>
  );
}
