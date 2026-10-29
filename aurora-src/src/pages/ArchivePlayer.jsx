import { useParams, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PLAYERS } from '@/data/players';
import { loadCarriere } from '@/data/carriere';
import { NAV } from '@/components/past/PastBits';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import Skeleton from '@/components/Skeleton';
import useAsync from '@/hooks/useAsync';
import { loadPlayerStatsFor } from '@/data/archive';
import { archiveId } from '@/data/archivePlayer';

// Scheda del giocatore in quella stagione: tutte le statistiche in cui compare, con la sua posizione in classifica
export default function ArchivePlayer() {
  const { fm, sk, pid } = useParams();
  const [car, setCar] = useState(undefined);
  useEffect(() => { let on = true; loadCarriere().then((d) => on && setCar(d || {})); return () => { on = false; }; }, []);
  const { data: stats, loading } = useAsync(() => loadPlayerStatsFor(fm, sk, pid), [fm, sk, pid]);
  // giocatore presente nell'app: si apre la sua scheda unica (Statistiche) con la stagione scelta
  if (car) {
    const appId = Object.keys(car).find((k) => String(car[k] && car[k].fm) === String(pid));
    if (appId && PLAYERS.some((p) => p.id === appId)) {
      NAV.fm = fm; NAV.sk = sk; NAV.tab = 2;
      try { sessionStorage.setItem('sl-ptab-' + appId, '2'); } catch (e) { /* ignore */ }
      return <Navigate replace to={`/giocatore/${appId}`} />;
    }
  }
  if (car === undefined || loading) return <PageShell bar={false}><TopBar title="Giocatore" /><div className="px-5 pt-8"><Skeleton className="h-[52px] w-full" /></div></PageShell>;
  const lists = (stats && stats.players) || {};
  const found = Object.keys(lists).some((k) => !k.startsWith('_') && lists[k].some((r) => String(r[0]) === pid));
  if (!found) return <PageShell bar={false}><TopBar title="Giocatore" /><p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Giocatore non trovato</p></PageShell>;
  // stessa scheda (Profilo / Partite / Statistiche / Carriera) per tutti, costruita dall'archivio
  NAV.fm = fm; NAV.sk = sk; NAV.tab = 2;
  const aid = archiveId(fm, sk, pid);
  try { sessionStorage.setItem('sl-ptab-' + aid, '2'); } catch (e) { /* ignore */ }
  return <Navigate replace to={`/giocatore/${aid}`} />;
}
