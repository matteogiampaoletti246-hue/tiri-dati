import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import Skeleton from '@/components/Skeleton';
import LeagueBadge from '@/components/LeagueBadge';
import useAsync from '@/hooks/useAsync';
import { archIndex } from '@/data/archive';
import { LEAGUES } from '@/data/leagues';

// Tutte le competizioni (app + archivio, 371) raggruppate per paese: internazionali, paesi principali, poi gli altri in ordine alfabetico.
// Raggiungibile dal Menu e dalla ricerca; ogni riga apre la stessa scheda campionato.
const INTL = new Set(['Europa', 'Internazionale', 'Mondo', '']);
const PRIO = ['Italia', 'Inghilterra', 'Spagna', 'Germania', 'Francia', 'Portogallo', 'Paesi Bassi', 'Turchia', 'Belgio', 'Scozia', 'Brasile', 'Argentina', 'Stati Uniti', 'Messico'];
function groups() {
  const by = new Map();
  LEAGUES.forEach((l) => {
    const c = INTL.has(l.country || '') ? 'Internazionali' : l.country;
    if (!by.has(c)) by.set(c, []);
    by.get(c).push(l);
  });
  const rank = (c) => (c === 'Internazionali' ? -1 : PRIO.includes(c) ? PRIO.indexOf(c) : PRIO.length);
  return [...by.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0], 'it'))
    .map(([c, list]) => ({ c, list: [...list].sort((a, b) => (a.arch ? 1 : 0) - (b.arch ? 1 : 0)) }));
}

export default function Competitions() {
  const { data } = useAsync(() => archIndex(), []);
  return (
    <PageShell>
      <TopBar title="Competizioni" />
      {!data ? (
        <div className="space-y-4 px-5 pt-6">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[44px] w-full" />)}</div>
      ) : groups().map((g) => (
        <section key={g.c} className="px-5 pt-5" style={{ contentVisibility: 'auto', containIntrinsicSize: `auto ${40 + g.list.length * 52}px` }}>
          <p className="label-sm pb-1">{g.c}</p>
          {g.list.map((l) => (
            <Link key={l.id} to={`/campionato/${l.id}`} className="press flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid var(--hair-2)' }}>
              <LeagueBadge league={l} size={26} />
              <span className="min-w-0 flex-1 truncate text-[14.5px]" style={{ color: 'var(--ink)' }}>{l.name}</span>
              <ChevronRight size={15} strokeWidth={1.2} style={{ color: 'var(--ink-3)' }} />
            </Link>
          ))}
        </section>
      ))}
      <div className="h-24" />
    </PageShell>
  );
}
